import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
  Animated,
  Platform,
  useWindowDimensions,
  PanResponder
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function LiveQueueTicket() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const params = useLocalSearchParams<{
    tokenNumber?: string;
    venueName?: string;
    branchName?: string;
    serviceName?: string;
    partySize?: string;
    seatingPref?: string;
    estServiceTime?: string;
    aheadCount?: string;
    estWaitMins?: string;
  }>();

  const tokenNumber = params.tokenNumber || 'B-042';
  const venueName = params.venueName || 'Blue Bean Cafe';
  const branchName = params.branchName || 'City Centre Branch';
  const partySize = params.partySize || 'Table (2-4 Guests)';
  const seatingPref = params.seatingPref || 'Indoor';
  const estServiceTime = params.estServiceTime || '11:20 AM';
  const aheadCount = params.aheadCount ? parseInt(params.aheadCount, 10) : 6;
  const estWaitMins = params.estWaitMins ? parseInt(params.estWaitMins, 10) : 25;

  const [activeTab, setActiveTab] = useState<'queues' | 'workflows'>('queues');
  const [activeSection, setActiveSection] = useState<'active' | 'history' | 'public' | 'mine'>('active');

  // Clean Minimal Toggle state for top level
  const toggleWidth = 116;
  const togglePosition = useRef(new Animated.Value(0)).current;

  // Bottom drawer state
  const DRAWER_PEEK_HEIGHT = 160;
  const DRAWER_FULL_HEIGHT = height - 250;
  const drawerY = useRef(new Animated.Value(DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT)).current;
  const drawerOpen = useRef(false);

  const blurOpacity = drawerY.interpolate({
    inputRange: [0, DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const blurIntensity = drawerY.interpolate({
    inputRange: [0, DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT],
    outputRange: [60, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        let newY = drawerOpen.current 
          ? gestureState.dy 
          : (DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT) + gestureState.dy;
        if (newY < 0) newY = 0;
        if (newY > DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT) newY = DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT;
        drawerY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          drawerOpen.current = true;
          Animated.spring(drawerY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: false
          }).start();
        } else if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          drawerOpen.current = false;
          Animated.spring(drawerY, {
            toValue: DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT,
            friction: 8,
            tension: 40,
            useNativeDriver: false
          }).start();
        } else {
          Animated.spring(drawerY, {
            toValue: drawerOpen.current ? 0 : DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT,
            friction: 8,
            tension: 40,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const sectionTabWidth = width / 4;
  const sectionIndicatorPosition = useRef(new Animated.Value(0)).current;

  const handleTabChange = (tab: 'queues' | 'workflows') => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    Animated.spring(togglePosition, {
      toValue: tab === 'queues' ? 0 : toggleWidth,
      damping: 20,
      stiffness: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleSectionChange = (section: 'active' | 'history' | 'public' | 'mine', index: number) => {
    Haptics.selectionAsync();
    setActiveSection(section);
    Animated.spring(sectionIndicatorPosition, {
      toValue: index * sectionTabWidth,
      damping: 20,
      stiffness: 250,
      useNativeDriver: true,
    }).start();

    // Reset drawer if switching away from history
    if (section !== 'history') {
      drawerOpen.current = false;
      drawerY.setValue(DRAWER_FULL_HEIGHT - DRAWER_PEEK_HEIGHT);
    }
  };

  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleSyncRefresh = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Buffer Queue: I am holding Token ${tokenNumber} at ${venueName} (${branchName}).`,
      });
    } catch {}
  };

  const handleConfirmCancel = () => {
    setIsCancelling(true);
    setTimeout(() => {
      setIsCancelling(false);
      setIsCancelModalVisible(false);
      Alert.alert(
        'Queue Spot Released',
        `Your position (Token ${tokenNumber}) at ${venueName} has been cancelled.`,
        [{ text: 'OK', onPress: () => { router.replace('/customer-dashboard' as any); } }]
      );
    }, 350);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/customer-dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {router.canGoBack() && (
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
          <View style={{ marginLeft: router.canGoBack() ? 8 : 4 }}>
            <Text style={styles.workspaceSubtitle}>PERSONAL WORKSPACE</Text>
            <Text style={styles.headerTitle}>My Tickets</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile' as any)}>
          <View style={styles.profileAvatar} />
        </TouchableOpacity>
      </View>

      {/* CLEAN MINIMAL TOGGLE */}
      <View style={{ alignItems: 'center', backgroundColor: theme.colors.surface, paddingTop: 12, paddingBottom: 16 }}>
        <View style={styles.uniqueToggleContainer}>
          <Animated.View style={[styles.uniqueToggleSlidingBlock, { transform: [{ translateX: togglePosition }], width: toggleWidth }]} />
          
          <TouchableOpacity style={styles.uniqueToggleButton} onPress={() => handleTabChange('queues')} activeOpacity={1}>
            <Text style={[styles.uniqueToggleText, activeTab === 'queues' && styles.uniqueToggleTextActive]}>Queues</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uniqueToggleButton} onPress={() => handleTabChange('workflows')} activeOpacity={1}>
            <Text style={[styles.uniqueToggleText, activeTab === 'workflows' && styles.uniqueToggleTextActive]}>Workflows</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECONDARY TABS */}
      <View style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }}>
        <View style={{ flexDirection: 'row', position: 'relative' }}>
          <Animated.View style={[styles.activeSectionIndicator, { transform: [{ translateX: sectionIndicatorPosition }], width: sectionTabWidth }]} />
          
          <TouchableOpacity style={[styles.sectionTab]} onPress={() => handleSectionChange('active', 0)}>
            <MaterialIcons name="confirmation-number" size={20} color={activeSection === 'active' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={{ marginBottom: 4 }} />
            <Text style={[styles.sectionTabText, activeSection === 'active' && styles.activeSectionTabText]}>Active</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.sectionTab]} onPress={() => handleSectionChange('history', 1)}>
            <View style={{ position: 'relative', marginBottom: 4 }}>
              <MaterialIcons name="event" size={20} color={activeSection === 'history' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>2</Text>
              </View>
            </View>
            <Text style={[styles.sectionTabText, activeSection === 'history' && styles.activeSectionTabText]} numberOfLines={1}>Upcoming</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.sectionTab]} onPress={() => handleSectionChange('public', 2)}>
            <MaterialIcons name="public" size={20} color={activeSection === 'public' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={{ marginBottom: 4 }} />
            <Text style={[styles.sectionTabText, activeSection === 'public' && styles.activeSectionTabText]}>Public</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.sectionTab]} onPress={() => handleSectionChange('mine', 3)}>
            <MaterialIcons name="dashboard-customize" size={20} color={activeSection === 'mine' ? theme.colors.primary : theme.colors.onSurfaceVariant} style={{ marginBottom: 4 }} />
            <Text style={[styles.sectionTabText, activeSection === 'mine' && styles.activeSectionTabText]} numberOfLines={1}>
              {activeTab === 'queues' ? 'My Queues' : 'My Workflows'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom + 96, 120) },
        ]}
      >
        {activeSection === 'active' && (
          <View style={styles.mainContent}>
            {activeTab === 'queues' ? (
              <>
                <View style={[styles.topSubBar, { justifyContent: 'flex-end', paddingHorizontal: 0 }]}>
                  <View style={styles.subBarActions}>
                    <TouchableOpacity style={styles.subBarBtn} onPress={handleShare} activeOpacity={0.7}>
                      <MaterialIcons name="share" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.subBarBtn}
                      onPress={() => Alert.alert('Ticket Options', 'Live notifications and audio chimes are enabled.')}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="more-vert" size={20} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.contextBanner}>
                  <MaterialIcons name="notifications-active" size={22} color={theme.colors.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.contextBannerTitle}>Queue flowing smoothly</Text>
                    <Text style={styles.contextBannerText}>
                      We will buzz your phone and play a chime when Token{' '}
                      <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{tokenNumber}</Text> is called.
                    </Text>
                  </View>
                </View>

                <View style={styles.ticketCard}>
                  <View style={styles.ticketCardHeader}>
                    <View style={styles.ticketCardHeaderTop}>
                      <Text style={styles.venueLabel}>{venueName}</Text>
                      <View style={styles.waitingBadge}>
                        <Text style={styles.waitingText}>Waiting</Text>
                      </View>
                    </View>
                    <View style={styles.ticketCardHeaderBottom}>
                      <Text style={styles.branchName}>{branchName}</Text>
                      <Text style={styles.branchDetails}>
                        <MaterialIcons name="table-restaurant" size={16} color={theme.colors.primary} /> {partySize} · {seatingPref}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notchContainer}>
                    <View style={styles.notchLeft} />
                    <View style={styles.notchLine} />
                    <View style={styles.notchRight} />
                  </View>

                  <View style={styles.ticketCardBody}>
                    <Text style={styles.yourQueueToken}>Your Queue Token</Text>
                    <Text style={styles.tokenNumber}>{tokenNumber}</Text>
                    <View style={styles.estServiceContainer}>
                      <MaterialIcons name="schedule" size={16} color={theme.colors.primary} />
                      <Text style={styles.estServiceText}>Est. Service: {estServiceTime}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Now Calling</Text>
                    <Text style={styles.metricValuePrimary}>B-036</Text>
                    <Text style={styles.metricSub}>Desk 1 · Indoor</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Ahead of You</Text>
                    <Text style={styles.metricValue}>{aheadCount}</Text>
                    <Text style={styles.metricSub}>Parties</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Est. Wait</Text>
                    <Text style={styles.metricValuePrimaryContainer}>
                      {estWaitMins}<Text style={styles.metricUnit}>m</Text>
                    </Text>
                    <Text style={styles.metricSub}>~4 min / party</Text>
                  </View>
                </View>

                <View style={styles.stepperContainer}>
                  <View style={styles.stepperHeader}>
                    <Text style={styles.stepperTitle}>Queue Progress</Text>
                    <View style={styles.stageBadge}>
                      <Text style={styles.stageBadgeText}>Stage 3 of 6</Text>
                    </View>
                  </View>
                  <View style={styles.step}>
                    <View style={[styles.stepLine, { backgroundColor: theme.colors.primary }]} />
                    <View style={[styles.stepIcon, { backgroundColor: theme.colors.primary }]}>
                      <MaterialIcons name="check" size={16} color={theme.colors.onPrimary} />
                    </View>
                    <View style={styles.stepContent}>
                      <View style={styles.stepContentHeader}>
                        <Text style={styles.stepTitle}>Queue joined</Text>
                        <Text style={styles.stepTime}>10:40 AM</Text>
                      </View>
                      <Text style={styles.stepDesc}>Registered via Mobile Check-in</Text>
                    </View>
                  </View>
                  <View style={styles.step}>
                    <View style={[styles.stepLine, { backgroundColor: theme.colors.primary }]} />
                    <View style={[styles.stepIcon, { backgroundColor: theme.colors.primary }]}>
                      <MaterialIcons name="check" size={16} color={theme.colors.onPrimary} />
                    </View>
                    <View style={styles.stepContent}>
                      <View style={styles.stepContentHeader}>
                        <Text style={styles.stepTitle}>Token assigned</Text>
                        <Text style={styles.stepTime}>10:46 AM</Text>
                      </View>
                      <Text style={styles.stepDesc}>Pass {tokenNumber} allocated for {seatingPref}</Text>
                    </View>
                  </View>
                  <View style={styles.step}>
                    <View style={[styles.stepLine, { backgroundColor: theme.colors.surfaceContainerHighest }]} />
                    <View style={[styles.stepIconActive]}>
                      <MaterialIcons name="hourglass-top" size={16} color={theme.colors.onPrimary} />
                    </View>
                    <View style={styles.stepContentActive}>
                      <View style={styles.stepContentHeader}>
                        <Text style={[styles.stepTitle, { color: theme.colors.primary }]}>Waiting in queue</Text>
                        <Text style={styles.stepTimeActive}>ACTIVE NOW</Text>
                      </View>
                      <Text style={styles.stepDesc}>{aheadCount} parties ahead · Host pacing table clearing</Text>
                    </View>
                  </View>
                  <View style={styles.step}>
                    <View style={[styles.stepIconInactive]}>
                      <MaterialIcons name="campaign" size={16} color={theme.colors.outline} />
                    </View>
                    <View style={[styles.stepContent, { opacity: 0.75 }]}>
                      <Text style={styles.stepTitle}>Token called</Text>
                      <Text style={styles.stepDesc}>Audible chime, screen flash & SMS notification</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsContainer}>
                  <TouchableOpacity style={styles.supportButton} activeOpacity={0.8}>
                    <MaterialIcons name="support-agent" size={20} color={theme.colors.onSecondaryContainer} />
                    <Text style={styles.supportButtonText}>Contact Host / Business Support</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={() => setIsCancelModalVisible(true)}>
                    <MaterialIcons name="cancel" size={20} color={theme.colors.onErrorContainer} />
                    <Text style={styles.cancelButtonText}>Cancel Queue Position</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.syncRow} activeOpacity={0.7} onPress={handleSyncRefresh}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <MaterialIcons name="sync" size={16} color={theme.colors.secondary} />
                  </Animated.View>
                  <Text style={styles.syncText}>
                    Syncs automatically every 5 seconds · <Text style={styles.syncTextUnderline}>Tap to refresh</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="account-tree" size={32} color={theme.colors.outline} />
                <Text style={styles.emptyStateTitle}>No Active Workflows</Text>
                <Text style={styles.emptyStateDesc}>You are not currently in any multi-stage workflows.</Text>
              </View>
            )}
          </View>
        )}

        {/* --- SECTION: UPCOMING --- */}
        {activeSection === 'history' && (
          <View style={styles.mainContent}>
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 16 }}>Upcoming {activeTab === 'queues' ? 'Queues' : 'Workflows'}</Text>
              <View style={[styles.emptyState, { paddingVertical: 32 }]}>
                <MaterialIcons name="event" size={32} color={theme.colors.outline} />
                <Text style={styles.emptyStateTitle}>No Upcoming {activeTab === 'queues' ? 'Queues' : 'Workflows'}</Text>
                <Text style={styles.emptyStateDesc}>You have no scheduled {activeTab === 'queues' ? 'queues' : 'workflows'} at the moment.</Text>
              </View>
            </View>
          </View>
        )}

        {/* --- SECTION: PUBLIC --- */}
        {activeSection === 'public' && (
          <View style={styles.mainContent}>
            <View style={styles.emptyState}>
              <MaterialIcons name="search" size={32} color={theme.colors.outline} />
              <Text style={styles.emptyStateTitle}>Explore Public {activeTab === 'queues' ? 'Queues' : 'Workflows'}</Text>
              <Text style={styles.emptyStateDesc}>Search for venues near you to join their {activeTab === 'queues' ? 'queues' : 'workflows'} remotely.</Text>
            </View>
          </View>
        )}

        {/* --- SECTION: MINE --- */}
        {activeSection === 'mine' && (
          <View style={styles.mainContent}>
            <View style={styles.emptyState}>
              <MaterialIcons name="dashboard-customize" size={32} color={theme.colors.outline} />
              <Text style={styles.emptyStateTitle}>{activeTab === 'queues' ? 'My Queues' : 'My Workflows'}</Text>
              <Text style={styles.emptyStateDesc}>You haven't created any {activeTab === 'queues' ? 'queues' : 'workflows'} yet.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- BACKGROUND BLUR FOR DRAWER --- */}
      {activeSection === 'history' && (
        <AnimatedBlurView
          intensity={blurIntensity as any}
          tint="dark"
          style={[StyleSheet.absoluteFill, { opacity: blurOpacity, zIndex: 90 }]}
          pointerEvents="none"
        />
      )}

      {/* --- DRAGGABLE BOTTOM DRAWER (PAST QUEUES) --- */}
      {activeSection === 'history' && (
        <Animated.View 
          style={[
            styles.drawerContainer,
            { transform: [{ translateY: drawerY }], height: DRAWER_FULL_HEIGHT }
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.drawerHandleArea}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>Past {activeTab === 'queues' ? 'Queues' : 'Workflows'}</Text>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} bounces={false}>
             <View style={[styles.emptyState, { paddingVertical: 32, marginTop: 16 }]}>
               <MaterialIcons name="history" size={32} color={theme.colors.outline} />
               <Text style={styles.emptyStateTitle}>No Past {activeTab === 'queues' ? 'Queues' : 'Workflows'}</Text>
               <Text style={styles.emptyStateDesc}>Your history of completed {activeTab === 'queues' ? 'queues' : 'workflows'} will appear here.</Text>
             </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Cancel Confirmation Bottom Sheet Modal */}
      <Modal visible={isCancelModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsCancelModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <MaterialIcons name="warning" size={24} color={theme.colors.error} />
              </View>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Leave Queue?</Text>
                <Text style={styles.modalSubtitle}>You will forfeit Token {tokenNumber}.</Text>
              </View>
            </View>
            <Text style={styles.modalDescription}>You are currently {aheadCount}th in line. If you leave, you will have to re-register when you return.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={handleConfirmCancel}>
                {isCancelling ? <ActivityIndicator size="small" color={theme.colors.onError} /> : <Text style={styles.confirmCancelText}>Yes, Cancel My Spot</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.stayInLineBtn} onPress={() => setIsCancelModalVisible(false)}>
                <Text style={styles.stayInLineText}>Stay in Line</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  workspaceSubtitle: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.onSurface },
  profileButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.outlineVariant },

  uniqueToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 24,
    padding: 4,
    width: 240,
    position: 'relative',
  },
  uniqueToggleSlidingBlock: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 36,
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    zIndex: 1,
  },
  uniqueToggleButton: {
    width: 116,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  uniqueToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  uniqueToggleTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },

  sectionTab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTabText: { fontSize: 11, fontWeight: '600', color: theme.colors.onSurfaceVariant },
  activeSectionTabText: { color: theme.colors.primary },
  activeSectionIndicator: { position: 'absolute', bottom: -1, left: 0, height: 2, backgroundColor: theme.colors.primary, zIndex: 1 },

  badgeContainer: { position: 'absolute', top: -6, right: -10, backgroundColor: theme.colors.error, borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: theme.colors.surface },
  badgeText: { color: theme.colors.onError, fontSize: 9, fontWeight: 'bold' },

  drawerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 100,
  },
  drawerHandleArea: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.outlineVariant,
    borderRadius: 2,
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },

  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 48, 
    backgroundColor: theme.colors.surfaceContainerLowest, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.surfaceContainerHigh,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 12 },
  emptyStateDesc: { fontSize: 14, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4, paddingHorizontal: 24 },

  container: { flex: 1 },
  contentContainer: { paddingBottom: 40, paddingTop: 16 },

  topSubBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm },
  subBarActions: { flexDirection: 'row', gap: 4 },
  subBarBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },

  mainContent: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.md },

  contextBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: theme.spacing.md, backgroundColor: theme.colors.primaryFixed, borderRadius: 12 },
  contextBannerTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.onPrimaryFixed },
  contextBannerText: { fontSize: 12, color: theme.colors.onPrimaryFixedVariant, marginTop: 4 },

  ticketCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  ticketCardHeader: { padding: theme.spacing.md, backgroundColor: theme.colors.surfaceContainerLow },
  ticketCardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  venueLabel: { fontSize: 12, color: theme.colors.secondary, textTransform: 'uppercase', fontWeight: '500' },
  waitingBadge: { backgroundColor: theme.colors.secondaryContainer, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  waitingText: { fontSize: 11, fontWeight: '600', color: theme.colors.onSecondaryContainer },
  ticketCardHeaderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  branchName: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface },
  branchDetails: { fontSize: 12, color: theme.colors.onSurfaceVariant },

  notchContainer: { height: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: theme.colors.surfaceContainerLowest, overflow: 'hidden' },
  notchLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.surface, marginLeft: -16 },
  notchLine: { flex: 1, height: 1, backgroundColor: theme.colors.surfaceContainerHighest, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.colors.surfaceContainerHighest, marginHorizontal: 8 },
  notchRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.surface, marginRight: -16 },

  ticketCardBody: { padding: theme.spacing.md, backgroundColor: theme.colors.primaryFixed + '4D', alignItems: 'center' },
  yourQueueToken: { fontSize: 12, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  tokenNumber: { fontSize: 45, fontWeight: 'bold', color: theme.colors.primary, marginVertical: 4 },
  estServiceContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginTop: 4 },
  estServiceText: { fontSize: 14, color: theme.colors.onSurface, marginLeft: 6 },

  metricsRow: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1, backgroundColor: theme.colors.surfaceContainerLowest, padding: 12, borderRadius: 12, alignItems: 'center', elevation: 1 },
  metricLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant },
  metricValuePrimary: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginVertical: 2 },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, marginVertical: 2 },
  metricValuePrimaryContainer: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primaryContainer, marginVertical: 2 },
  metricUnit: { fontSize: 12, fontWeight: 'normal', color: theme.colors.onSurfaceVariant },
  metricSub: { fontSize: 11, color: theme.colors.secondary, textAlign: 'center' },

  stepperContainer: { backgroundColor: theme.colors.surfaceContainerLowest, padding: theme.spacing.md, borderRadius: 16, elevation: 1 },
  stepperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  stepperTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface },
  stageBadge: { backgroundColor: theme.colors.primaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  stageBadgeText: { fontSize: 11, fontWeight: '500', color: theme.colors.primary },

  step: { flexDirection: 'row', marginBottom: 24, position: 'relative' },
  stepLine: { position: 'absolute', left: 14, top: 28, bottom: -24, width: 2 },
  stepIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepIconActive: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primaryContainer, justifyContent: 'center', alignItems: 'center', zIndex: 2, borderWidth: 4, borderColor: theme.colors.primaryFixed },
  stepIconInactive: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.surfaceContainer, justifyContent: 'center', alignItems: 'center', zIndex: 2 },

  stepContent: { flex: 1, marginLeft: 16 },
  stepContentActive: { flex: 1, marginLeft: 16, backgroundColor: theme.colors.surfaceContainerLow, padding: 10, borderRadius: 8 },
  stepContentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.onSurface },
  stepTime: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  stepTimeActive: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  stepDesc: { fontSize: 12, color: theme.colors.secondary, marginTop: 2 },

  actionsContainer: { gap: 12, marginTop: 8 },
  supportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.secondaryContainer, padding: 16, borderRadius: 24 },
  supportButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.onSecondaryContainer, marginLeft: 8 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.errorContainer, padding: 16, borderRadius: 24 },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.onErrorContainer, marginLeft: 8 },

  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, marginTop: 4 },
  syncText: { fontSize: 12, color: theme.colors.secondary },
  syncTextUnderline: { textDecorationLine: 'underline', fontWeight: '600', color: theme.colors.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', justifyContent: 'flex-end', alignItems: 'center', padding: theme.spacing.md, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.colors.outlineVariant + '40', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.errorContainer, justifyContent: 'center', alignItems: 'center' },
  modalTitleWrap: { flex: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  modalSubtitle: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  modalDescription: { fontSize: 14, lineHeight: 20, color: theme.colors.onSurfaceVariant, marginTop: 14 },
  modalActions: { marginTop: 20, gap: 10 },
  confirmCancelBtn: { height: 48, borderRadius: 24, backgroundColor: theme.colors.error, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  confirmCancelText: { fontSize: 15, fontWeight: '700', color: theme.colors.onError },
  stayInLineBtn: { height: 48, borderRadius: 24, backgroundColor: theme.colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
  stayInLineText: { fontSize: 15, fontWeight: '600', color: theme.colors.onSurface },
});
