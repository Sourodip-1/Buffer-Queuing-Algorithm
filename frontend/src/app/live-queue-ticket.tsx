import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LiveQueueTicket() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Queue Ticket</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileAvatar} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Action Sub-bar */}
        <View style={styles.topSubBar}>
          <View style={styles.liveConnectedBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveConnectedText}>Live · Connected to Queue Ledger</Text>
          </View>
          <View style={styles.subBarActions}>
            <TouchableOpacity style={styles.subBarBtn}>
              <MaterialIcons name="share" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.subBarBtn}>
              <MaterialIcons name="more-vert" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Live Updates Context Banner */}
          <View style={styles.contextBanner}>
            <MaterialIcons name="notifications-active" size={22} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contextBannerTitle}>Queue flowing smoothly</Text>
              <Text style={styles.contextBannerText}>
                We will buzz your phone and play a chime when Token <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>B-042</Text> is called.
              </Text>
            </View>
          </View>

          {/* Ticket Card */}
          <View style={styles.ticketCard}>
            <View style={styles.ticketCardHeader}>
              <View style={styles.ticketCardHeaderTop}>
                <Text style={styles.venueLabel}>Blue Bean Cafe</Text>
                <View style={styles.waitingBadge}>
                  <Text style={styles.waitingText}>Waiting</Text>
                </View>
              </View>
              <View style={styles.ticketCardHeaderBottom}>
                <Text style={styles.branchName}>City Centre Branch</Text>
                <Text style={styles.branchDetails}>
                  <MaterialIcons name="table-restaurant" size={16} color={theme.colors.primary} /> Table (2-4 Guests)
                </Text>
              </View>
            </View>
            
            {/* Notch Divider */}
            <View style={styles.notchContainer}>
              <View style={styles.notchLeft} />
              <View style={styles.notchLine} />
              <View style={styles.notchRight} />
            </View>

            <View style={styles.ticketCardBody}>
              <Text style={styles.yourQueueToken}>Your Queue Token</Text>
              <Text style={styles.tokenNumber}>B-042</Text>
              <View style={styles.estServiceContainer}>
                <MaterialIcons name="schedule" size={16} color={theme.colors.primary} />
                <Text style={styles.estServiceText}>Est. Service: 11:20 AM</Text>
              </View>
            </View>
          </View>

          {/* 3 Core Operational Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Now Calling</Text>
              <Text style={styles.metricValuePrimary}>B-036</Text>
              <Text style={styles.metricSub}>Desk 1 · Indoor</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Ahead of You</Text>
              <Text style={styles.metricValue}>6</Text>
              <Text style={styles.metricSub}>Parties</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Est. Wait</Text>
              <Text style={styles.metricValuePrimaryContainer}>25<Text style={styles.metricUnit}>m</Text></Text>
              <Text style={styles.metricSub}>~4 min / party</Text>
            </View>
          </View>

          {/* Queue Progress Stepper */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperHeader}>
              <Text style={styles.stepperTitle}>Queue Progress</Text>
              <View style={styles.stageBadge}>
                <Text style={styles.stageBadgeText}>Stage 3 of 6</Text>
              </View>
            </View>

            {/* Stage 1 */}
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

            {/* Stage 2 */}
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
                <Text style={styles.stepDesc}>Pass B-042 allocated for Main Dining</Text>
              </View>
            </View>

            {/* Stage 3 Active */}
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
                <Text style={styles.stepDesc}>6 parties ahead · Host pacing table clearing</Text>
              </View>
            </View>

            {/* Stage 4 */}
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

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.supportButton}>
              <MaterialIcons name="support-agent" size={20} color={theme.colors.onSecondaryContainer} />
              <Text style={styles.supportButtonText}>Contact Host / Business Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <MaterialIcons name="cancel" size={20} color={theme.colors.onErrorContainer} />
              <Text style={styles.cancelButtonText}>Cancel Queue Position</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.surface },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginLeft: 8 },
  profileButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.outlineVariant },
  
  container: { flex: 1 },
  contentContainer: { paddingBottom: 40 },
  
  topSubBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, backgroundColor: theme.colors.surface },
  liveConnectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginRight: 6 },
  liveConnectedText: { fontSize: 11, fontWeight: '500', color: theme.colors.onSecondaryContainer },
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
});
