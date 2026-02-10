'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationService, type Notification, type NotificationPreferences } from '@/lib/notifications/service';
import { useUser } from '@/hooks/useUser';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  preferences: NotificationPreferences | null;
  loadMore: () => void;
  markAsRead: (ids?: string[]) => Promise<void>;
  dismiss: (ids: string[]) => Promise<void>;
  snooze: (ids: string[], minutes: number) => Promise<void>;
  refresh: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const LIMIT = 20;

  // Fetch notifications
  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const result = await notificationService.getNotifications({
        limit: LIMIT,
        offset: currentOffset
      });

      if (reset) {
        setNotifications(result.data || []);
      } else {
        setNotifications(prev => [...prev, ...(result.data || [])]);
      }
      
      setHasMore(result.data?.length === LIMIT);
      setUnreadCount(result.unreadCount || 0);
      
      if (!reset) {
        setOffset(currentOffset + LIMIT);
      } else {
        setOffset(LIMIT);
      }
    } finally {
      setLoading(false);
    }
  }, [user, offset]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      loadPreferences();
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Play sound for urgent notifications
        if (notification.priority === 'urgent') {
          notificationService.playNotificationSound('urgent');
        }
      }
    );

    return unsubscribe;
  }, [user]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  }, [loading, hasMore, fetchNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (ids?: string[]) => {
    await notificationService.markAsRead(ids);
    
    if (ids) {
      setNotifications(prev =>
        prev.map(n => (ids.includes(n.id) ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, []);

  // Dismiss
  const dismiss = useCallback(async (ids: string[]) => {
    await notificationService.dismiss(ids);
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
  }, []);

  // Snooze
  const snooze = useCallback(async (ids: string[], minutes: number) => {
    await notificationService.snooze(ids, minutes);
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // Update preferences
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    await notificationService.updatePreferences(prefs);
    setPreferences(prev => prev ? { ...prev, ...prefs } : null);
  }, []);

  // Request push permission
  const requestPushPermission = useCallback(async () => {
    return notificationService.requestPushPermission();
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    preferences,
    loadMore,
    markAsRead,
    dismiss,
    snooze,
    refresh,
    updatePreferences,
    requestPushPermission
  };
}
