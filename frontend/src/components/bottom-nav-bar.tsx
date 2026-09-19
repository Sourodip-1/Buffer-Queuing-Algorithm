import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const C = {
  surfaceContainer: '#ECEEF6', // Classic M3 nav bar background
  onSurfaceVariant: '#414752', // Inactive text and icon
  primaryContainer: '#D4E3FF', // Active pill background
  onPrimaryContainer: '#001C39', // Active text and icon
};

interface NavItemConfig {
  iconActive: keyof typeof MaterialIcons.glyphMap;
  iconInactive: keyof typeof MaterialIcons.glyphMap;
  label: string;
  route: string;
}

const ITEMS: NavItemConfig[] = [
  { iconActive: 'home', iconInactive: 'home', label: 'Home', route: '/customer-dashboard' },
  { iconActive: 'confirmation-number', iconInactive: 'confirmation-number', label: 'Queues', route: '/live-queue-ticket' },
  { iconActive: 'qr-code-scanner', iconInactive: 'qr-code-scanner', label: 'Scan', route: '/scan-qr' },
  { iconActive: 'notifications', iconInactive: 'notifications', label: 'Alerts', route: '/alerts' },
  { iconActive: 'person', iconInactive: 'person-outline', label: 'Profile', route: '/profile' },
];

function NavItem({
  item,
  isActive,
  onPress,
}: {
  item: NavItemConfig;
  isActive: boolean;
  onPress: () => void;
}) {
  // Google's M3 animation: pill smoothly scales and fades in behind the icon
  const animValue = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Animating color/width needs false
    }).start();
  }, [isActive]);

  const pillWidth = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 64],
  });

  const pillOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconColor = isActive ? C.onPrimaryContainer : C.onSurfaceVariant;
  const textColor = isActive ? C.onPrimaryContainer : C.onSurfaceVariant;
  const fontWeight = isActive ? '700' : '500';

  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {/* Animated Pill Background */}
        <Animated.View
          style={[
            styles.activePill,
            {
              width: pillWidth,
              opacity: pillOpacity,
              backgroundColor: C.primaryContainer,
            },
          ]}
        />
        <MaterialIcons
          name={isActive ? item.iconActive : item.iconInactive}
          size={24}
          color={iconColor}
          style={{ zIndex: 1 }}
        />
      </View>
      <Text style={[styles.label, { color: textColor, fontWeight }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const handlePress = (route: string) => {
    if (pathname === route) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.navigate(route as any);
  };

  return (
    <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {ITEMS.map((item) => (
        <NavItem
          key={item.route}
          item={item}
          isActive={pathname === item.route}
          onPress={() => handlePress(item.route)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surfaceContainer,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    // Optional standard elevation line/shadow
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activePill: {
    position: 'absolute',
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
  },
});
