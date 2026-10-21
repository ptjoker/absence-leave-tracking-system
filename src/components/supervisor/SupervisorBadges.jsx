import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { apiFetch, getSession } from '@/lib/api';

const seenRequestsStorageKey = async () => {
  const session = await getSession();
  return `supervisor_seen_requests:${session?.user?.id || 'anonymous'}`;
};

export function useSupervisorBadges({
  markNotificationsRead = false,
  readNotificationIds,
} = {}) {
  const [requests, setRequests] = useState(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const hasShownLoadError = useRef(false);

  const loadRequests = useCallback(async () => {
    try {
      const response = await apiFetch('/api/requests');
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || `Request badge update failed (${response.status}).`
        );
      }
      if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid requests response.');
      }

      hasShownLoadError.current = false;
      setRequests(data);
    } catch (error) {
      if (!hasShownLoadError.current) {
        hasShownLoadError.current = true;
        const message = error instanceof Error
          ? error.message
          : 'Could not load request notifications.';
        Alert.alert('Request counts unavailable', message);
      }
    }
  }, []);
  const readNotificationIdsKey = JSON.stringify(readNotificationIds);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
      const intervalId = setInterval(loadRequests, 30000);
      return () => clearInterval(intervalId);
    }, [loadRequests])
  );

  useEffect(() => {
    if (requests === null) return;

    const synchronizeUnreadNotifications = async () => {
      try {
        const key = await seenRequestsStorageKey();
        const requestIds = requests
          .map((request) => request.rawId ?? request.id)
          .filter((id) => id !== null && id !== undefined)
          .map(String);
        const storedSeenIds = await AsyncStorage.getItem(key);

        if (storedSeenIds === null) {
          await AsyncStorage.setItem(key, JSON.stringify(requestIds));
          setUnreadNotificationCount(0);
          return;
        }

        const seenIds = JSON.parse(storedSeenIds);
        if (!Array.isArray(seenIds)) {
          throw new Error('Stored notification read state is invalid.');
        }

        const seen = new Set(seenIds.map(String));
        const unreadCount = requestIds.filter((id) => !seen.has(id)).length;
        if (markNotificationsRead) {
          const visibleIds = readNotificationIds
            ? JSON.parse(readNotificationIdsKey).map(String)
            : requestIds;
          const updatedSeen = new Set([...seen, ...visibleIds]);
          await AsyncStorage.setItem(key, JSON.stringify([...updatedSeen]));
          setUnreadNotificationCount(
            requestIds.filter((id) => !updatedSeen.has(id)).length
          );
        } else {
          setUnreadNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error('Synchronize supervisor notifications error:', error);
        Alert.alert('Notification update failed', 'Could not update notification read status.');
      }
    };

    synchronizeUnreadNotifications();
  }, [requests, markNotificationsRead, readNotificationIdsKey]);

  const pendingRequestCount = requests
    ? requests.filter((request) => String(request.status || '').toLowerCase() === 'pending').length
    : 0;

  return { pendingRequestCount, unreadNotificationCount, refreshRequests: loadRequests };
}

export function CountBadge({ count, style }) {
  if (!count) return null;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -7,
    right: -9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
