import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

export default function Screen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Scan QR</Text>
        <Text style={styles.subtitle}>Camera placeholder.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.surface },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.onSurface },
  subtitle: { fontSize: 16, color: theme.colors.onSurfaceVariant, marginTop: 8 },
});
