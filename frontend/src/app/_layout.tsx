import { Tabs, usePathname } from 'expo-router';
import DevNavigationButton from '../components/dev-navigation-button';
import BottomNavBar from '../components/bottom-nav-bar';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabLayout() {
  const pathname = usePathname();
  const hideNavBar = pathname === '/' || pathname === '/index';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <Tabs
          tabBar={() => (hideNavBar ? null : <BottomNavBar />)}
          screenOptions={{ headerShown: false }}
          backBehavior="none"
        >
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="customer-dashboard" />
          <Tabs.Screen name="live-queue-ticket" />
          <Tabs.Screen name="scan-qr" />
          <Tabs.Screen name="alerts" />
          <Tabs.Screen name="profile" />
        </Tabs>
        <DevNavigationButton />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
