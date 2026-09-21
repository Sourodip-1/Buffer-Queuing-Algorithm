import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, useWindowDimensions, FlatList, LayoutAnimation, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Image } from 'expo-image';
import { Searchbar, FAB, Portal, Menu } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeInUp, FadeOutUp, ZoomIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity);

const MOCK_QUEUES = [
  {
    id: '1',
    venue: 'Blue Bean Cafe',
    desc: 'Table Queue • Indoor Seating (2-4 Pax)',
    ticket: 'B-042',
    estTime: '~ 11:15 AM',
    nowServing: 'B-036',
    ahead: '6 patrons',
    wait: '25 min',
    status: 'Waiting',
    icon: 'local-cafe' as any
  },
  {
    id: '2',
    venue: 'City DMV',
    desc: 'License Renewal',
    ticket: 'D-89',
    estTime: '~ 1:30 PM',
    nowServing: 'D-50',
    ahead: '39 patrons',
    wait: '2 hrs',
    status: 'Waiting',
    icon: 'directions-car' as any
  },
  {
    id: '3',
    venue: 'Tech Support',
    desc: 'Walk-in Repair Center',
    ticket: 'T-04',
    estTime: '~ 11:45 AM',
    nowServing: 'T-02',
    ahead: '2 patrons',
    wait: '15 min',
    status: 'Next',
    icon: 'computer' as any
  }
];

export default function CustomerDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [fabOpen, setFabOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'queues' | 'workflows'>('queues');
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const [joinCodeVisible, setJoinCodeVisible] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState('');
  const [scanMenuVisible, setScanMenuVisible] = React.useState(false);

  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const carouselScrollX = React.useRef(new Animated.Value(0)).current;
  const chevronRotation = React.useRef(new Animated.Value(0)).current;

  const arrowButtonStyle = useAnimatedStyle(() => {
    return {
      borderTopLeftRadius: withSpring(scanMenuVisible ? 100 : 6, { damping: 24, stiffness: 300, overshootClamping: true }),
      borderBottomLeftRadius: withSpring(scanMenuVisible ? 100 : 6, { damping: 24, stiffness: 300, overshootClamping: true }),
    };
  }, [scanMenuVisible]);

  React.useEffect(() => {
    Animated.spring(chevronRotation, {
      toValue: scanMenuVisible ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50
    }).start();
  }, [scanMenuVisible]);

  const chevronSpin = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: Array<any> }) => {
    if (viewableItems.length > 0) {
      Haptics.selectionAsync();
    }
  }).current;

  const viewabilityConfig = React.useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Glow animation on focus
  React.useEffect(() => {
    if (isSearchFocused) {
      glowAnim.setValue(0);
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isSearchFocused]);

  const fabAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(fabAnimation, {
      toValue: fabOpen ? 1 : 0,
      damping: 14,
      stiffness: 200,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [fabOpen]);

  // Fix for interrupted animations causing faint stamps
  React.useEffect(() => {
    if (pathname === '/customer-dashboard' && !fabOpen) {
      fabAnimation.setValue(0);
    }
  }, [pathname, fabOpen]);

  const { width } = useWindowDimensions();
  const CARD_WIDTH = width * 0.85;
  const SNAP_INTERVAL = CARD_WIDTH + 16;
  // screen width minus the horizontal padding (24 * 2 = 48)
  const tabWidth = (width - 48) / 2;
  const indicatorPosition = React.useRef(new Animated.Value(0)).current;

  const handleTabChange = (tab: 'queues' | 'workflows') => {
    setActiveTab(tab);
    // Material Physics Engine (Spring)
    Animated.spring(indicatorPosition, {
      toValue: tab === 'queues' ? 0 : tabWidth,
      damping: 20,
      stiffness: 250,
      mass: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '👋' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
    return { text: 'Good evening', emoji: '🌙' };
  };
  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ width: '100%', justifyContent: 'center' }}>
            {/* Glow Behind */}
            <Animated.View style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: 100,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.4]
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.08]
                    })
                  }
                ]
              }
            ]} />

            <Searchbar
              placeholder="Search venues, services, or nearby queues..."
              onChangeText={handleSearch}
              value={searchQuery}
              onFocus={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsSearchFocused(true);
              }}
              onBlur={() => setIsSearchFocused(false)}
              style={styles.searchbar}
              inputStyle={styles.searchbarInput}
              placeholderTextColor={theme.colors.outline}
              iconColor={theme.colors.primary}
              elevation={1}
            />
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingHeader}>
            <View>
              <Text style={styles.greetingTitle}>{greeting.text}, Souro {greeting.emoji}</Text>
              <Text style={styles.greetingSubtitle}>Where are you going today?</Text>
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <View style={styles.actionGrid}>
              <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, backgroundColor: theme.colors.primary, borderTopLeftRadius: 100, borderBottomLeftRadius: 100, borderTopRightRadius: 6, borderBottomRightRadius: 6 }} onPress={() => router.push('/scan-qr' as any)}>
                  <MaterialIcons name="qr-code-scanner" size={20} color={theme.colors.onPrimary} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>Scan QR</Text>
                </TouchableOpacity>
                <AnimatedTouchableOpacity 
                  onPress={() => setScanMenuVisible(!scanMenuVisible)}
                  style={[
                    { width: 46, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primary, borderTopRightRadius: 100, borderBottomRightRadius: 100 },
                    arrowButtonStyle
                  ]}
                >
                  <Animated.View style={{ transform: [{ rotate: chevronSpin }] }}>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={theme.colors.onPrimary} />
                  </Animated.View>
                </AnimatedTouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}>
                <MaterialIcons name="explore" size={20} color={theme.colors.onSecondaryContainer} />
                <Text style={[styles.actionButtonText, { color: theme.colors.onSecondaryContainer }]}>Explore Queues</Text>
              </TouchableOpacity>
            </View>
            {scanMenuVisible && (
              <Reanimated.View
                entering={FadeInUp.duration(200)}
                exiting={FadeOutUp.duration(150)}
              >
                <TouchableOpacity 
                  onPress={() => { 
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScanMenuVisible(false); 
                    setJoinCodeVisible(true);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: theme.colors.primary, borderTopLeftRadius: 100, borderBottomLeftRadius: 100, borderTopRightRadius: 6, borderBottomRightRadius: 6, alignSelf: 'flex-start' }}
                >
                  <MaterialIcons name="dialpad" size={18} color={theme.colors.onPrimary} />
                  <Text style={{ color: theme.colors.onPrimary, fontSize: 14, fontWeight: '600' }}>Join using Code</Text>
                </TouchableOpacity>
              </Reanimated.View>
            )}
          </View>
        </View>

        {/* Active Queue Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="confirmation-number" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Active Holding Tokens</Text>
            </View>
            <View style={styles.liveSyncBadge}>
              <View style={styles.liveSyncDot} />
              <Text style={styles.liveSyncText}>Updated just now</Text>
            </View>
          </View>

          <Animated.FlatList
            data={MOCK_QUEUES}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: carouselScrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 16 }}
            style={{ marginHorizontal: -theme.spacing.lg }}
            renderItem={({ item, index }) => (
              <View style={[styles.activeCard, { width: CARD_WIDTH, marginRight: 16 }]}>
                <View style={styles.activeCardHeader}>
                  <View style={styles.activeCardHeaderLeft}>
                    <View style={styles.venueIcon}>
                      <MaterialIcons name={item.icon} size={24} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.venueName} numberOfLines={1}>{item.venue} <MaterialIcons name="verified" size={14} color={theme.colors.primary} /></Text>
                      <Text style={styles.venueDesc} numberOfLines={1}>{item.desc}</Text>
                    </View>
                  </View>
                  <View style={styles.waitingBadge}>
                    <View style={styles.waitingDot} />
                    <Text style={styles.waitingText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.ticketStrip}>
                  <View>
                    <Text style={styles.ticketLabel}>Your Ticket</Text>
                    <Text style={styles.ticketCode}>{item.ticket}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ticketLabel}>Est. Call Time</Text>
                    <Text style={styles.ticketTime}>{item.estTime}</Text>
                  </View>
                </View>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Now Serving</Text>
                    <Text style={styles.metricValue}>{item.nowServing}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Ahead of You</Text>
                    <Text style={[styles.metricValue, { color: theme.colors.primary }]}>{item.ahead}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Approx. Wait</Text>
                    <Text style={styles.metricValue}>{item.wait}</Text>
                  </View>
                </View>
              </View>
            )}
          />
          {/* Squiggly Pagination Indicator */}
          <View style={styles.paginationContainer}>
            {MOCK_QUEUES.map((_, i) => {
              const inputRange = [(i - 1) * SNAP_INTERVAL, i * SNAP_INTERVAL, (i + 1) * SNAP_INTERVAL];

              const dotWidth = carouselScrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });

              const opacity = carouselScrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              const backgroundColor = carouselScrollX.interpolate({
                inputRange,
                outputRange: [theme.colors.outlineVariant, theme.colors.primary, theme.colors.outlineVariant],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={i.toString()}
                  style={[
                    styles.paginationDot,
                    { width: dotWidth, opacity, backgroundColor }
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* User Created Resources */}
        <View style={styles.resourcesSection}>
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.activeTabIndicator, { transform: [{ translateX: indicatorPosition }] }]} />
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabChange('queues')}
            >
              <Text style={[styles.tabText, activeTab === 'queues' && styles.activeTabText]}>My Queues</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabChange('workflows')}
            >
              <Text style={[styles.tabText, activeTab === 'workflows' && styles.activeTabText]}>My Workflows</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'queues' ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="queue" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyStateTitle}>No Queues Yet</Text>
                <Text style={styles.emptyStateDesc}>Create your first queue using the + button below.</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="account-tree" size={48} color={theme.colors.outline} />
                <Text style={styles.emptyStateTitle}>No Workflows Yet</Text>
                <Text style={styles.emptyStateDesc}>Design a new workflow to automate your processes.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {pathname === '/customer-dashboard' && (
        <Portal>
          <Animated.View
            pointerEvents={fabOpen ? 'auto' : 'none'}
            style={[
              { position: 'absolute', bottom: 185, right: 16, alignItems: 'flex-end', gap: 16 },
              {
                opacity: fabAnimation,
                transform: [
                  {
                    translateY: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  },
                  {
                    scale: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }
                ]
              }
            ]}
          >
            <FAB
              icon="sitemap"
              label="Create Workflow"
              mode="flat"
              elevation={0}
              onPress={() => {
                setFabOpen(false);
                router.push('/create-workflow' as any);
              }}
              color={theme.colors.onSecondaryContainer}
              style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 16, shadowColor: 'transparent', elevation: 0 }}
            />
            <FAB
              icon="human-queue"
              label="Create Queue"
              mode="flat"
              elevation={0}
              onPress={() => {
                setFabOpen(false);
                router.push('/create-queue' as any);
              }}
              color={theme.colors.onSecondaryContainer}
              style={{ backgroundColor: theme.colors.secondaryContainer, borderRadius: 16, shadowColor: 'transparent', elevation: 0 }}
            />
          </Animated.View>
          <FAB
            icon={fabOpen ? 'close' : 'plus'}
            onPress={() => setFabOpen(!fabOpen)}
            color={theme.colors.onSecondary}
            style={{ position: 'absolute', bottom: 105, right: 16, backgroundColor: theme.colors.secondary, borderRadius: 28 }}
          />
        </Portal>
      )}

      <Modal visible={joinCodeVisible} transparent animationType="fade">
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setJoinCodeVisible(false)}>
            <Reanimated.View entering={FadeInUp.duration(250)} style={{ width: '85%' }}>
              <TouchableOpacity activeOpacity={1} style={{ width: '100%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, elevation: 4 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8 }}>Enter Queue Code</Text>
              <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>Enter the code provided by the venue to join their queue remotely.</Text>
              
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus={true}
                style={{ backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: theme.colors.onSurface, letterSpacing: 2, textAlign: 'center', fontWeight: '600', marginBottom: 24 }}
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity onPress={() => setJoinCodeVisible(false)} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setJoinCodeVisible(false);
                    setJoinCode('');
                    router.push('/live-queue-ticket' as any);
                  }} 
                  style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, opacity: joinCode.length > 3 ? 1 : 0.5 }}
                  disabled={joinCode.length <= 3}
                >
                  <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 15 }}>Join Queue</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            </Reanimated.View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  searchbar: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 100, // fully rounded pill
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3, // Android shadow
    height: 56,
  },
  searchbarInput: { fontSize: 14, color: theme.colors.onSurface },

  container: { flex: 1 },
  contentContainer: { paddingHorizontal: theme.spacing.lg, paddingBottom: 100, paddingTop: 4 },

  greetingSection: { marginTop: 16 },
  greetingHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  networkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryFixed, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginRight: 6 },
  networkBadgeText: { fontSize: 11, fontWeight: '600', color: theme.colors.onPrimaryFixedVariant },
  greetingTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.onSurface },
  greetingSubtitle: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  statusAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },

  actionGrid: { flexDirection: 'row', gap: 16, marginTop: 24 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 100 },
  actionButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },

  section: { marginTop: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface },
  liveSyncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveSyncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  liveSyncText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },

  activeCard: { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16, overflow: 'hidden', padding: 16 },
  activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeCardHeaderLeft: { flexDirection: 'row', gap: 12, flex: 1, paddingRight: 8 },
  venueIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  venueName: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface },
  venueDesc: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  waitingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondaryContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  waitingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.onSecondaryContainer, marginRight: 4 },
  waitingText: { fontSize: 11, color: theme.colors.onSecondaryContainer },

  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4, gap: 6 },
  paginationDot: { height: 8, borderRadius: 4 },

  ticketStrip: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.primaryFixedDim, padding: 16, borderRadius: 12, marginTop: 16 },
  ticketLabel: { fontSize: 11, color: theme.colors.onPrimaryFixedVariant, textTransform: 'uppercase' },
  ticketCode: { fontSize: 36, fontWeight: 'bold', color: theme.colors.primary },
  ticketTime: { fontSize: 22, fontWeight: 'bold', color: theme.colors.primary },

  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surfaceContainer, borderRadius: 12, padding: 12, marginTop: 16 },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface },

  resourcesSection: { marginTop: 40 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant, position: 'relative' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTabIndicator: { position: 'absolute', bottom: -1, left: 0, height: 2, width: '50%', backgroundColor: theme.colors.primary, zIndex: 1 },
  tabText: { fontSize: 14, fontWeight: '500', color: theme.colors.onSurfaceVariant },
  activeTabText: { color: theme.colors.primary, fontWeight: 'bold' },
  tabContent: { marginTop: 16, minHeight: 80, justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 16, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16 },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 12 },
  emptyStateDesc: { fontSize: 14, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
});
