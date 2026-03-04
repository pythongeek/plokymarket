'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface NotificationPreferences {
    // Price Alerts
    targetPrice: Record<string, { above: number; below: number }>;

    // Market Updates
    followedMarkets: boolean;
    newMarkets: boolean;
    marketResolution: boolean;

    // Trading
    orderFilled: boolean;
    orderCancelled: boolean;
    positionSettled: boolean;

    // Wallet
    depositReceived: boolean;
    withdrawalProcessed: boolean;

    // Push notifications
    pushEnabled: boolean;
    emailEnabled: boolean;
}

export interface AppNotification {
    id: string;
    type: 'price' | 'market' | 'trading' | 'wallet' | 'system';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
    data?: Record<string, any>;
}

const defaultPreferences: NotificationPreferences = {
    targetPrice: {},
    followedMarkets: true,
    newMarkets: true,
    marketResolution: true,
    orderFilled: true,
    orderCancelled: true,
    positionSettled: true,
    depositReceived: true,
    withdrawalProcessed: true,
    pushEnabled: false,
    emailEnabled: false,
};

export function useSmartNotifications(userId?: string) {
    const supabase = createClient();
    const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    // Check notification permission
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // Load preferences from database
    useEffect(() => {
        const loadPreferences = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('notification_preferences')
                    .eq('user_id', userId)
                    .single();

                if (data?.notification_preferences) {
                    setPreferences({ ...defaultPreferences, ...data.notification_preferences });
                }
            } catch (error) {
                console.error('Error loading notification preferences:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [userId]);

    // Load notifications from database
    useEffect(() => {
        const loadNotifications = async () => {
            if (!userId) return;

            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (data) {
                    setNotifications(data.map(n => ({
                        id: n.id,
                        type: n.type,
                        title: n.title,
                        message: n.message,
                        timestamp: n.created_at,
                        read: n.read || false,
                        actionUrl: n.action_url,
                        data: n.data,
                    })));
                }
            } catch (error) {
                console.error('Error loading notifications:', error);
            }
        };

        loadNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                const newNotif = payload.new as any;
                const notification: AppNotification = {
                    id: newNotif.id,
                    type: newNotif.type,
                    title: newNotif.title,
                    message: newNotif.message,
                    timestamp: newNotif.created_at,
                    read: false,
                    actionUrl: newNotif.action_url,
                    data: newNotif.data,
                };
                setNotifications(prev => [notification, ...prev]);

                // Show browser push notification if enabled
                if (preferences.pushEnabled && permission === 'granted') {
                    showBrowserNotification(notification);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, preferences.pushEnabled, permission]);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                setPreferences(prev => ({ ...prev, pushEnabled: true }));
            }

            return result;
        }
        return 'denied';
    }, []);

    // Show browser notification
    const showBrowserNotification = (notification: AppNotification) => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
            });
        }
    };

    // Save preferences
    const savePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
        const updated = { ...preferences, ...newPrefs };
        setPreferences(updated);

        if (!userId) return;

        try {
            await supabase
                .from('user_profiles')
                .update({ notification_preferences: updated })
                .eq('user_id', userId);
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }, [userId, preferences]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );

        if (!userId) return;

        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [userId]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        if (!userId) return;

        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [userId]);

    // Delete notification
    const deleteNotification = useCallback(async (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        if (!userId) return;

        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, [userId]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        setNotifications([]);

        if (!userId) return;

        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }, [userId]);

    // Add price alert
    const addPriceAlert = useCallback((marketId: string, above: number, below: number) => {
        const newTargetPrice = { ...preferences.targetPrice, [marketId]: { above, below } };
        savePreferences({ targetPrice: newTargetPrice });
    }, [preferences.targetPrice, savePreferences]);

    // Remove price alert
    const removePriceAlert = useCallback((marketId: string) => {
        const newTargetPrice = { ...preferences.targetPrice };
        delete newTargetPrice[marketId];
        savePreferences({ targetPrice: newTargetPrice });
    }, [preferences.targetPrice, savePreferences]);

    // Get unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        preferences,
        notifications,
        isLoading,
        permission,
        unreadCount,
        requestPermission,
        savePreferences,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        addPriceAlert,
        removePriceAlert,
    };
}

export default useSmartNotifications;
