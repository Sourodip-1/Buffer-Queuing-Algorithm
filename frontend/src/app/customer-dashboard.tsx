import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CustomerDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Buffer</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Universal Queue</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="search" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.onSurfaceVariant} />
            <View style={styles.notificationBadge}><Text style={styles.notificationText}>3</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileAvatar} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingHeader}>
            <View>
              <View style={styles.networkBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.networkBadgeText}>Universal Queue Network</Text>
              </View>
              <Text style={styles.greetingTitle}>Welcome to Buffer</Text>
              <Text style={styles.greetingSubtitle}>Where are you going today?</Text>
            </View>
            <View style={styles.statusAvatar}>
              <MaterialIcons name="hourglass-top" size={24} color={theme.colors.primary} />
            </View>
          </View>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/scan-qr' as any)}>
              <MaterialIcons name="qr-code-scanner" size={20} color={theme.colors.onPrimary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>Scan QR to Join</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}>
              <MaterialIcons name="explore" size={20} color={theme.colors.onSecondaryContainer} />
              <Text style={[styles.actionButtonText, { color: theme.colors.onSecondaryContainer }]}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Queue Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialIcons name="confirmation-number" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Active Holding Token</Text>
            </View>
            <View style={styles.liveSyncBadge}>
              <View style={styles.liveSyncDot} />
              <Text style={styles.liveSyncText}>Live Sync</Text>
            </View>
          </View>
          <View style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View style={styles.activeCardHeaderLeft}>
                <View style={styles.venueIcon}>
                  <MaterialIcons name="local-cafe" size={24} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.venueName}>Blue Bean Cafe <MaterialIcons name="verified" size={14} color={theme.colors.primary} /></Text>
                  <Text style={styles.venueDesc}>Table Queue • Indoor Seating (2-4 Pax)</Text>
                </View>
              </View>
              <View style={styles.waitingBadge}>
                <View style={styles.waitingDot} />
                <Text style={styles.waitingText}>Waiting</Text>
              </View>
            </View>
            <View style={styles.ticketStrip}>
              <View>
                <Text style={styles.ticketLabel}>Your Ticket</Text>
                <Text style={styles.ticketCode}>B-042</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ticketLabel}>Est. Call Time</Text>
                <Text style={styles.ticketTime}>~ 11:15 AM</Text>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Now Serving</Text>
                <Text style={styles.metricValue}>B-036</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Ahead of You</Text>
                <Text style={[styles.metricValue, { color: theme.colors.primary }]}>6 patrons</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Approx. Wait</Text>
                <Text style={styles.metricValue}>25 min</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={{height: 100}} />
      </ScrollView>
      
      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="home" size={24} color={theme.colors.primary} />
          <Text style={[styles.navText, { color: theme.colors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="confirmation-number" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navText}>Queues</Text>
        </TouchableOpacity>
        <View style={styles.navFabContainer}>
          <TouchableOpacity style={styles.navFab} onPress={() => router.push('/scan-qr' as any)}>
            <MaterialIcons name="qr-code-scanner" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="notifications" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="person" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  header: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.surface },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary },
  headerBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: theme.colors.secondaryContainer, borderRadius: 12 },
  headerBadgeText: { fontSize: 10, color: theme.colors.onSecondaryContainer },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  notificationBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: theme.colors.error, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  notificationText: { color: theme.colors.onError, fontSize: 10, fontWeight: 'bold' },
  profileButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.outlineVariant },
  
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: theme.spacing.md, paddingBottom: 100 },
  
  greetingSection: { marginTop: theme.spacing.md },
  greetingHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  networkBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryFixed, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary, marginRight: 6 },
  networkBadgeText: { fontSize: 11, fontWeight: '600', color: theme.colors.onPrimaryFixedVariant },
  greetingTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.onSurface },
  greetingSubtitle: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  statusAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  
  actionGrid: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionButtonText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  
  section: { marginTop: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface },
  liveSyncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveSyncDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  liveSyncText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  
  activeCard: { backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 16, overflow: 'hidden', padding: 16 },
  activeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeCardHeaderLeft: { flexDirection: 'row', gap: 12 },
  venueIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  venueName: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface },
  venueDesc: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  waitingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondaryContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  waitingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.onSecondaryContainer, marginRight: 4 },
  waitingText: { fontSize: 11, color: theme.colors.onSecondaryContainer },
  
  ticketStrip: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.primaryFixedDim, padding: 16, borderRadius: 12, marginTop: 16 },
  ticketLabel: { fontSize: 11, color: theme.colors.onPrimaryFixedVariant, textTransform: 'uppercase' },
  ticketCode: { fontSize: 36, fontWeight: 'bold', color: theme.colors.primary },
  ticketTime: { fontSize: 22, fontWeight: 'bold', color: theme.colors.primary },
  
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surfaceContainer, borderRadius: 12, padding: 12, marginTop: 16 },
  metricItem: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface },
  
  bottomNav: { flexDirection: 'row', position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: theme.colors.surfaceContainerLowest, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant, justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 10, marginTop: 4, color: theme.colors.onSurfaceVariant },
  navFabContainer: { paddingHorizontal: 8, marginTop: -30 },
  navFab: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 }
});
