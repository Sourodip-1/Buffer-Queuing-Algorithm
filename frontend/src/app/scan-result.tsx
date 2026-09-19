import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme/theme';
import {
  UniversalQueue,
  QueueLookupStatus,
  getUniversalQueueDetails,
  joinUniversalQueue,
  MOCK_USER,
} from '../services/mockQueueData';

function formatTimeString(isoString?: string, fallback: string = ''): string {
  if (!isoString) return fallback;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return fallback;
  }
}

function formatCountdown(totalSec: number): string {
  const mins = Math.floor(Math.max(0, totalSec) / 60);
  const secs = Math.floor(Math.max(0, totalSec) % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function QueueDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ queueCode?: string }>();

  const [lookupStatus, setLookupStatus] = useState<QueueLookupStatus | 'LOADING'>('LOADING');
  const [queue, setQueue] = useState<UniversalQueue | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Dynamic phase & buffer countdown state
  const [currentPhase, setCurrentPhase] = useState<'BUFFER' | 'FCFS' | 'CLOSED'>('BUFFER');
  const [remainingBufferSec, setRemainingBufferSec] = useState<number>(768); // 12m 48s default
  const [totalBufferSec, setTotalBufferSec] = useState<number>(1800); // 30m default

  // Temporary success snackbar state & animations
  const [showSnackbar, setShowSnackbar] = useState(true);
  const snackbarOpacity = useRef(new Animated.Value(0)).current;
  const snackbarSlide = useRef(new Animated.Value(-12)).current;

  // Capacity Ring & interactive animation values
  const ringAnim = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const bufferOffsetAnim = useRef(new Animated.Value(0)).current;

  // State values driven by animation for fluid real-time render
  const [animatedOffset, setAnimatedOffset] = useState<number | null>(null);
  const [animatedBufferOffset, setAnimatedBufferOffset] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  // SVG Progress Ring Geometry
  const ringSize = 132;
  const strokeWidth = 11;
  const center = ringSize / 2;
  const radius = center - strokeWidth / 2 - 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let isMounted = true;
    const fetchQueue = async () => {
      setLookupStatus('LOADING');
      // Default to university registration queue REG-2026
      const codeToFetch = params.queueCode || 'REG-2026';
      const result = await getUniversalQueueDetails(codeToFetch);

      if (!isMounted) return;

      setLookupStatus(result.status);
      if (result.queue) {
        setQueue(result.queue);

        if (result.queue.status === 'CLOSED') {
          setCurrentPhase('CLOSED');
        } else if (result.queue.currentPhase === 'BUFFER') {
          setCurrentPhase('BUFFER');
          let duration = 1800;
          if (result.queue.bufferStartedAt && result.queue.bufferClosesAt) {
            const start = new Date(result.queue.bufferStartedAt).getTime();
            const end = new Date(result.queue.bufferClosesAt).getTime();
            if (!isNaN(start) && !isNaN(end) && end > start) {
              duration = Math.floor((end - start) / 1000);
            }
          }
          setTotalBufferSec(duration);

          let remaining = 768; // 12m 48s default
          if (result.queue.bufferClosesAt) {
            const end = new Date(result.queue.bufferClosesAt).getTime();
            const now = Date.now();
            if (end > now) {
              remaining = Math.floor((end - now) / 1000);
            } else {
              remaining = 12 * 60 + 48; // 768s
            }
          }
          setRemainingBufferSec(remaining);
        } else {
          setCurrentPhase(result.queue.currentPhase || 'FCFS');
        }
      }
      if (result.message) {
        setStatusMessage(result.message);
      }
    };

    fetchQueue();
    return () => {
      isMounted = false;
    };
  }, [params.queueCode]);

  // Auto-dismiss temporary success snackbar after ~2.8 seconds
  useEffect(() => {
    Animated.parallel([
      Animated.timing(snackbarOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(snackbarSlide, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      dismissSnackbar();
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const dismissSnackbar = () => {
    Animated.parallel([
      Animated.timing(snackbarOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(snackbarSlide, {
        toValue: -8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSnackbar(false);
    });
  };

  // 1-second countdown timer during BUFFER phase
  useEffect(() => {
    if (currentPhase !== 'BUFFER') return;

    const timer = setInterval(() => {
      setRemainingBufferSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCurrentPhase('FCFS');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPhase]);

  // Buffer circular countdown ring progress animation (smooth glide without component recreation)
  useEffect(() => {
    if (currentPhase !== 'BUFFER') return;

    const circ = circumference;
    const ratio = Math.min(Math.max(remainingBufferSec / (totalBufferSec || 1800), 0), 1);
    const targetOffset = circ - ratio * circ;

    Animated.timing(bufferOffsetAnim, {
      toValue: targetOffset,
      duration: 950,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const listenerId = bufferOffsetAnim.addListener(({ value }) => {
      setAnimatedBufferOffset(value);
    });

    return () => {
      bufferOffsetAnim.removeListener(listenerId);
    };
  }, [remainingBufferSec, currentPhase, totalBufferSec, circumference]);

  // FCFS slots-filled capacity ring animation
  useEffect(() => {
    if (currentPhase !== 'FCFS' || !queue) return;

    const circ = circumference;
    const ratio = Math.min(Math.max(queue.filledCapacity / (queue.totalCapacity || 1), 0), 1);
    const targetOffset = circ - ratio * circ;
    const targetFilled = queue.filledCapacity;

    setAnimatedOffset(circ);
    setDisplayCount(0);
    ringAnim.setValue(0);
    ringScale.setValue(0.85);

    const listenerId = ringAnim.addListener(({ value }) => {
      const current = circ - value * (circ - targetOffset);
      setAnimatedOffset(current);
      setDisplayCount(Math.round(value * targetFilled));
    });

    Animated.parallel([
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      ringAnim.removeListener(listenerId);
    };
  }, [currentPhase, queue?.filledCapacity, queue?.totalCapacity, circumference]);

  // Live pulsing indicator loop
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.22,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/scan-qr' as any);
    }
  };

  const handleScanDifferent = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/scan-qr' as any);
    }
  };

  const handleJoinQueue = async () => {
    if (!queue || isSubmittingRef.current) return;

    if (queue.status === 'CLOSED' || queue.filledCapacity >= queue.totalCapacity) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setJoinError(null);

    try {
      const ticket = await joinUniversalQueue(queue);

      router.replace({
        pathname: '/live-queue-ticket',
        params: {
          tokenNumber: ticket.token,
          venueName: ticket.venueName,
          branchName: ticket.venueBranch,
          serviceName: ticket.service,
          partySize: ticket.partySize,
          seatingPref: ticket.seating,
          estServiceTime: ticket.estimatedServiceTime,
          aheadCount: String(ticket.peopleAhead),
          estWaitMins: String(ticket.estimatedWaitMinutes),
        },
      } as any);
    } catch {
      setJoinError('Unable to join queue. Please check your network and try again.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Safe bottom spacing to avoid bottom navigation bar overlap
  const dynamicBottomPadding = Math.max(insets.bottom + 96, 120);

  // 1. Loading state
  if (lookupStatus === 'LOADING') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Queue Details</Text>
          <View style={styles.headerRightAvatar}>
            <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
          </View>
        </View>

        <View style={styles.centeredStateContainer}>
          <ActivityIndicator size="large" color="#0056C6" />
          <Text style={styles.stateTitle}>Loading Queue Details</Text>
          <Text style={styles.stateDesc}>Connecting to university registration ledger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Invalid queue state
  if (lookupStatus === 'INVALID' || !queue) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Queue Not Found</Text>
          <View style={styles.headerRightAvatar}>
            <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
          </View>
        </View>

        <View style={styles.centeredStateContainer}>
          <View style={styles.stateIconCircleError}>
            <MaterialIcons name="error-outline" size={38} color={theme.colors.error} />
          </View>
          <Text style={styles.stateTitle}>Unrecognized Queue Code</Text>
          <Text style={styles.stateDesc}>
            {statusMessage || 'The scanned queue code is not active or has expired.'}
          </Text>
          <TouchableOpacity style={styles.primaryJoinButton} onPress={handleScanDifferent}>
            <Text style={styles.primaryJoinButtonText}>Scan Another QR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Unavailable / Closed State
  if (lookupStatus === 'UNAVAILABLE') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Queue Closed</Text>
          <View style={styles.headerRightAvatar}>
            <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
          </View>
        </View>

        <View style={styles.centeredStateContainer}>
          <View style={styles.stateIconCircleWarning}>
            <MaterialIcons name="schedule" size={38} color="#D97706" />
          </View>
          <Text style={styles.stateTitle}>{queue.organizationName} Closed</Text>
          <Text style={styles.stateDesc}>
            {statusMessage || `Operating hours: ${queue.operatingHours}. Queuing is paused.`}
          </Text>
          <TouchableOpacity style={styles.primaryJoinButton} onPress={handleScanDifferent}>
            <Text style={styles.primaryJoinButtonText}>Scan Another QR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fillRatio = Math.min(Math.max(queue.filledCapacity / (queue.totalCapacity || 1), 0), 1);
  const strokeDashoffset = circumference - fillRatio * circumference;

  const isQueueFull = currentPhase === 'FCFS' && queue.filledCapacity >= queue.totalCapacity;
  const isQueueClosed = currentPhase === 'CLOSED' || queue.status === 'CLOSED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="chevron-left" size={30} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Queue Details</Text>

        <View style={styles.headerRightAvatar}>
          <Text style={styles.avatarText}>{MOCK_USER.initials}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: dynamicBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Success Snackbar */}
        {showSnackbar && (
          <Animated.View
            style={[
              styles.snackbarContainer,
              {
                opacity: snackbarOpacity,
                transform: [{ translateY: snackbarSlide }],
              },
            ]}
          >
            <View style={styles.snackbarIconWrap}>
              <MaterialIcons name="check" size={15} color="#FFFFFF" />
            </View>
            <Text style={styles.snackbarText}>QR scanned successfully</Text>
            <TouchableOpacity
              onPress={dismissSnackbar}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Dismiss notice"
            >
              <MaterialIcons name="close" size={18} color="#6B7A90" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* 3. Organization Card */}
        <View style={styles.orgCard}>
          <Image
            source={{ uri: queue.imageUrl }}
            style={styles.orgImage}
          />

          <View style={styles.orgInfo}>
            <View style={styles.orgTitleRow}>
              <Text style={styles.orgName} numberOfLines={1}>
                {queue.organizationName}
              </Text>
              {queue.verified && (
                <MaterialIcons name="verified" size={18} color="#0062D2" style={styles.verifiedIcon} />
              )}
            </View>

            <Text style={styles.orgDepartment} numberOfLines={1}>
              {queue.departmentName}
            </Text>

            <View style={styles.locationRow}>
              <MaterialIcons name="place" size={15} color="#5A6270" />
              <Text style={styles.locationText} numberOfLines={1}>
                {queue.location}
              </Text>
            </View>

            <View style={styles.metaBadgeRow}>
              <View style={styles.statusPill}>
                <Animated.View
                  style={[
                    styles.statusDot,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <Text style={styles.statusPillText}>Open</Text>
              </View>

              <View style={styles.hoursRow}>
                <MaterialIcons name="access-time" size={14} color="#5A6270" />
                <Text style={styles.hoursText}>{queue.operatingHours}</Text>
              </View>
            </View>

            <View style={styles.breakRow}>
              <MaterialIcons name="free-breakfast" size={13} color="#5A6270" />
              <Text style={styles.breakText}>
                Break: {queue.breakTime || '1:00 PM – 2:00 PM'}
              </Text>
            </View>
          </View>
        </View>

        {/* 4 & 5. Queue Information & Summary (Main Visual Section) */}
        <View style={styles.summaryCard}>
          {/* Service Header */}
          <View style={styles.serviceHeader}>
            <View style={styles.serviceIconContainer}>
              <MaterialIcons name="description" size={22} color="#0056C6" />
            </View>
            <View style={styles.serviceTextContainer}>
              <Text style={styles.serviceSubLabel}>SERVICE</Text>
              <Text style={styles.serviceTitle} numberOfLines={1}>
                {queue.serviceName}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Two-Column Section */}
          <View style={styles.metricsTwoColumn}>
            {/* Left Metrics */}
            <View style={styles.metricsLeftCol}>
              {/* Wait Time */}
              <View style={styles.metricItemRow}>
                <MaterialIcons name="access-time" size={24} color="#0056C6" style={styles.metricIcon} />
                <View>
                  <Text style={styles.metricValue}>{queue.estimatedWaitMinutes} min</Text>
                  <Text style={styles.metricLabel}>Estimated wait</Text>
                </View>
              </View>

              {/* Processing Time */}
              <View style={styles.metricItemRow}>
                <MaterialIcons name="receipt-long" size={24} color="#0056C6" style={styles.metricIcon} />
                <View>
                  <Text style={styles.metricValue}>{queue.averageProcessingMinutes} min</Text>
                  <Text style={styles.metricLabel}>Avg. processing</Text>
                </View>
              </View>

              {/* Row 3: During BUFFER phase, display Queue Ending Time; otherwise display Queue Phase */}
              {currentPhase === 'BUFFER' ? (
                <View style={styles.metricItemRow}>
                  <MaterialIcons name="schedule" size={24} color="#0056C6" style={styles.metricIcon} />
                  <View>
                    <Text style={styles.metricValue}>
                      {formatTimeString(queue.queueClosesAt, '4:00 PM')}
                    </Text>
                    <Text style={styles.metricLabel}>Queue ending time</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.metricItemRow}>
                  <MaterialIcons name="groups" size={24} color="#0056C6" style={styles.metricIcon} />
                  <View>
                    <Text style={styles.metricValue}>{currentPhase}</Text>
                    <Text style={styles.metricLabel}>Queue phase</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Subtle Vertical Divider */}
            <View style={styles.verticalDivider} />

            {/* Right: Circular Countdown / Capacity Progress Ring */}
            <View style={styles.capacityRightCol}>
              {currentPhase === 'BUFFER' ? (
                <View style={styles.ringContainer}>
                  <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                    {/* Background Track (Elapsed portion) */}
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke="#E8EEF5"
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    {/* Decreasing Buffer Time Arc */}
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke="#0056C6"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={animatedBufferOffset}
                      strokeLinecap="round"
                      fill="none"
                      transform={`rotate(-90 ${center} ${center})`}
                    />
                  </Svg>

                  <View style={styles.ringInnerLabel}>
                    <Text style={styles.bufferPhaseTitle}>BUFFER</Text>
                    <Text style={styles.bufferCountdownDigits}>
                      {formatCountdown(remainingBufferSec)}
                    </Text>
                    <Text style={styles.bufferRemainingSub}>remaining</Text>
                  </View>
                </View>
              ) : currentPhase === 'CLOSED' ? (
                <>
                  <View style={styles.ringContainer}>
                    <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                      <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#FDE8E8"
                        strokeWidth={strokeWidth}
                        fill="none"
                      />
                    </Svg>
                    <View style={styles.ringInnerLabel}>
                      <Text style={styles.closedTitle}>CLOSED</Text>
                    </View>
                  </View>
                  <View style={styles.bufferTimesColumn}>
                    <Text style={styles.closedSubText}>Registration has ended</Text>
                  </View>
                </>
              ) : (
                /* FCFS Phase: Slots-filled Capacity Ring */
                <>
                  <View style={styles.ringContainer}>
                    <Svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
                      {/* Background Track */}
                      <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#E8EEF5"
                        strokeWidth={strokeWidth}
                        fill="none"
                      />
                      {/* Filled Progress Arc */}
                      <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="#0056C6"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={animatedOffset !== null ? animatedOffset : strokeDashoffset}
                        strokeLinecap="round"
                        fill="none"
                        transform={`rotate(-90 ${center} ${center})`}
                      />
                    </Svg>

                    <Animated.View
                      style={[
                        styles.ringInnerLabel,
                        { transform: [{ scale: ringScale }] },
                      ]}
                    >
                      <Text style={styles.ringCapacityNumbers}>
                        {displayCount} / {queue.totalCapacity}
                      </Text>
                      <Text style={styles.ringCapacitySub}>Slots filled</Text>
                    </Animated.View>
                  </View>

                  {/* Legend Below Ring */}
                  <View style={styles.ringLegendRow}>
                    <View style={styles.legendItem}>
                      <Animated.View
                        style={[
                          styles.legendDot,
                          { backgroundColor: '#0056C6', transform: [{ scale: pulseAnim }] },
                        ]}
                      />
                      <Text style={styles.legendText}>{displayCount} filled</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#D4E3FF' }]} />
                      <Text style={styles.legendText}>
                        {Math.max(queue.totalCapacity - displayCount, 0)} left
                      </Text>
                    </View>
                  </View>

                  {/* Continue displaying final queue-closing time */}
                  <Text style={[styles.queueTimeText, { marginTop: 6 }]}>
                    Queue closes at {formatTimeString(queue.queueClosesAt, '4:00 PM')}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 6. Registration Information Card */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderIconWrap}>
              <MaterialIcons name="info" size={17} color="#0056C6" />
            </View>
            <Text style={styles.sectionHeaderTitle}>Registration information</Text>
          </View>

          <View style={styles.infoCard}>
            {/* Program Row */}
            <View style={styles.infoRow}>
              <MaterialIcons name="school" size={20} color="#0056C6" style={styles.infoRowIcon} />
              <Text style={styles.infoRowLabel}>Program:</Text>
              <Text style={styles.infoRowValue}>{queue.program || 'B.Tech CSE'}</Text>
            </View>

            <View style={styles.infoDivider} />

            {/* Semester Row */}
            <View style={styles.infoRow}>
              <MaterialIcons name="layers" size={20} color="#0056C6" style={styles.infoRowIcon} />
              <Text style={styles.infoRowLabel}>Semester:</Text>
              <Text style={styles.infoRowValue}>{queue.semester || '3'}</Text>
            </View>

            <View style={styles.infoDivider} />

            {/* Required Doc Row */}
            <View style={styles.infoRow}>
              <MaterialIcons name="badge" size={20} color="#0056C6" style={styles.infoRowIcon} />
              <Text style={styles.infoRowLabel}>Required:</Text>
              <Text style={styles.infoRowValue}>{queue.requiredDoc || 'Student ID'}</Text>
            </View>

            {/* Optional Registration Note */}
            {queue.note ? (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.noteRow}>
                  <MaterialIcons name="assignment-turned-in" size={17} color="#0056C6" />
                  <Text style={styles.noteText}>{queue.note}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Error Banner if Join Failed */}
        {joinError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={18} color={theme.colors.error} />
            <Text style={styles.errorBannerText}>{joinError}</Text>
          </View>
        )}

        {/* 7. Primary Action Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.primaryJoinButton,
              (isSubmitting || isQueueClosed || isQueueFull) && styles.primaryButtonDisabled,
            ]}
            onPress={handleJoinQueue}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isSubmitting || isQueueClosed || isQueueFull}
            activeOpacity={0.9}
          >
            {isSubmitting ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryJoinButtonText}>Joining Queue…</Text>
              </View>
            ) : isQueueClosed ? (
              <Text style={styles.primaryJoinButtonText}>Registration Closed</Text>
            ) : isQueueFull ? (
              <Text style={styles.primaryJoinButtonText}>Queue Full — Check Back Later</Text>
            ) : (
              <Text style={styles.primaryJoinButtonText}>Join Registration Queue</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Secondary Action Link */}
        <TouchableOpacity
          style={styles.secondaryScanBtn}
          onPress={handleScanDifferent}
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        >
          <Text style={styles.secondaryScanText}>Scan a different QR</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  /* Header */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F7F9FC',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRightAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D6E4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#004DB3',
  },

  /* Scroll Content */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },

  /* 2. Success Snackbar */
  snackbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FE',
    borderWidth: 1,
    borderColor: '#CDE1FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#0062D2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  snackbarIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0062D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  snackbarText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0A2540',
  },

  /* 3. Organization Card */
  orgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#E8EEF5',
  },
  orgInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  orgTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  orgDepartment: {
    fontSize: 13,
    color: '#4E5969',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7A90',
    marginLeft: 3,
    flex: 1,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 7,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F8ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0E8A40',
    marginRight: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E8A40',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 12,
    color: '#5A6270',
    marginLeft: 4,
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  breakText: {
    fontSize: 12,
    color: '#5A6270',
    marginLeft: 4,
  },

  /* 4 & 5. Queue Information & Summary */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  serviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E7F0FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6E7787',
    letterSpacing: 0.8,
  },
  serviceTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F3F7',
    marginHorizontal: 16,
  },
  metricsTwoColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  metricsLeftCol: {
    flex: 1.05,
    gap: 16,
  },
  metricItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    marginRight: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6E7787',
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: '85%',
    backgroundColor: '#F0F3F7',
    marginHorizontal: 8,
  },
  capacityRightCol: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    width: 132,
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringInnerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCapacityNumbers: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  ringCapacitySub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6E7787',
    marginTop: 2,
  },
  ringLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5565',
    fontWeight: '500',
  },

  /* BUFFER Countdown & Timer Styles */
  bufferPhaseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  bufferCountdownDigits: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0056C6',
    fontVariant: ['tabular-nums'],
  },
  bufferRemainingSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6E7787',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  bufferTimesColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 3,
  },
  bufferTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5565',
    textAlign: 'center',
  },
  queueTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6E7787',
    textAlign: 'center',
  },
  closedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#BA1A1A',
    letterSpacing: 0.5,
  },
  closedSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6E7787',
    textAlign: 'center',
    marginTop: 8,
  },

  /* 6. Registration Details Section */
  detailsSection: {
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E7F0FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRowIcon: {
    marginRight: 12,
  },
  infoRowLabel: {
    fontSize: 14,
    color: '#4E5969',
    width: 84,
  },
  infoRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F0F3F7',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#4E5969',
    flex: 1,
    lineHeight: 16,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE8E8',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#9B1C1C',
  },

  /* 7. Primary Action Button */
  primaryJoinButton: {
    backgroundColor: '#0056C6',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0056C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: '#93BBEA',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryJoinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryScanBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryScanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0056C6',
  },

  /* State Pages (Loading, Error, Closed) */
  centeredStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  stateIconCircleError: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateIconCircleWarning: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 12,
  },
  stateDesc: {
    fontSize: 14,
    color: '#6B7A90',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    marginBottom: 20,
  },
});
