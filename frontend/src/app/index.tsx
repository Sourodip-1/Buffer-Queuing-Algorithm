import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buffer Smart Queue</Text>
      <Link href={"/customer-dashboard" as any} style={styles.link}>Customer Dashboard</Link>
      <Link href={"/customer-dashboard-enhanced" as any} style={styles.link}>Customer Dashboard (Enhanced)</Link>
      <Link href={"/live-queue-ticket" as any} style={styles.link}>Live Queue Ticket</Link>
      <Link href={"/live-queue-ticket-enhanced" as any} style={styles.link}>Live Queue Ticket (Enhanced)</Link>
      <Link href={"/scan-qr" as any} style={styles.link}>Scan QR</Link>
      <Link href={"/scan-result" as any} style={styles.link}>Scan Result</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  link: { fontSize: 18, color: 'blue', marginVertical: 10, textAlign: 'center' },
});
