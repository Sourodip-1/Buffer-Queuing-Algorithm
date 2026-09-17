import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="customer-dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="live-queue-ticket" options={{ headerShown: false }} />
    </Stack>
  );
}
