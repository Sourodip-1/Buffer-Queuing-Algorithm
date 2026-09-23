import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { useNotifications, Alert } from '../context/NotificationContext';

const getIconForType = (type: string) => {
  return 'confirmation-number';
};

const getIconColorForType = (type: string) => {
  return theme.colors.primary;
};

function AlertItem({ item, index, totalLength, onDelete }: { item: Alert; index: number; totalLength: number; onDelete: () => void }) {
  const { markAsRead } = useNotifications();
  const [expanded, setExpanded] = React.useState(false);
  const isFirst = index === 0;
  const isLast = index === totalLength - 1;

  const borderTopRadius = isFirst ? 28 : 4;
  const borderBottomRadius = isLast ? 28 : 4;

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        style={[
          styles.deleteAction, 
          {
            borderTopRightRadius: borderTopRadius,
            borderBottomRightRadius: borderBottomRadius,
          }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <MaterialIcons name="delete" size={24} color={theme.colors.onErrorContainer} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      containerStyle={{ marginBottom: isLast ? 0 : 2 }}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }}
    >
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => {
          Haptics.selectionAsync();
          setExpanded(!expanded);
          if (!item.isRead) {
            markAsRead(item.id);
          }
        }}
        style={[
          styles.card,
          {
            borderTopLeftRadius: borderTopRadius,
            borderTopRightRadius: borderTopRadius,
            borderBottomLeftRadius: borderBottomRadius,
            borderBottomRightRadius: borderBottomRadius,
            backgroundColor: item.isRead ? theme.colors.surfaceContainerLow : theme.colors.surfaceContainer,
            flexDirection: 'column',
            alignItems: 'stretch',
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconContainer, { backgroundColor: getIconColorForType(item.type) + '20' }]}>
            <MaterialIcons name={getIconForType(item.type) as any} size={24} color={getIconColorForType(item.type)} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: item.isRead ? theme.colors.onSurfaceVariant : theme.colors.onSurface }]}>
              {item.title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={expanded ? undefined : 2}>
              {item.subtitle}
            </Text>
          </View>

          <View style={styles.trailingContainer}>
            <Text style={styles.time}>{item.time}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </View>

        {expanded && item.details && (
          <Animated.View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
            <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
              {item.details}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function AlertsPage() {
  const { alerts, deleteAlert, markAllAsRead, markAsRead } = useNotifications();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <MaterialIcons name="done-all" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, index }) => (
          <AlertItem 
            item={item} 
            index={index} 
            totalLength={alerts.length} 
            onDelete={() => deleteAlert(item.id)} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color={theme.colors.outline} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You have no new notifications.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // Default radii, overwritten dynamically
    borderRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  trailingContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  time: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  deleteAction: {
    backgroundColor: theme.colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  }
});
