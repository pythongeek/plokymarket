import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
    id: string;
    type: string;
    title: string;
    body?: string;
    market_id?: string;
    trade_id?: string;
    read: boolean;
    action_url?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;

    // Actions
    fetchNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
    clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,
            isLoading: false,

            fetchNotifications: async () => {
                set({ isLoading: true });
                try {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();

                    if (!user) {
                        set({ notifications: [], unreadCount: 0, isLoading: false });
                        return;
                    }

                    const { data, error } = await supabase
                        .from('notifications')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    if (error) {
                        console.error('Error fetching notifications:', error);
                        set({ isLoading: false });
                        return;
                    }

                    const notifications = (data || []) as Notification[];
                    const unreadCount = notifications.filter(n => !n.read).length;

                    set({ notifications, unreadCount, isLoading: false });
                } catch (error) {
                    console.error('Error in fetchNotifications:', error);
                    set({ isLoading: false });
                }
            },

            markAsRead: async (notificationId: string) => {
                const { notifications } = get();

                // Optimistic update
                const updatedNotifications = notifications.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                );
                const unreadCount = updatedNotifications.filter(n => !n.read).length;
                set({ notifications: updatedNotifications, unreadCount });

                try {
                    const supabase = createClient();
                    await supabase
                        .from('notifications')
                        .update({ read: true })
                        .eq('id', notificationId);
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                }
            },

            markAllAsRead: async () => {
                const { notifications } = get();

                // Optimistic update
                const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
                set({ notifications: updatedNotifications, unreadCount: 0 });

                try {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        await supabase
                            .from('notifications')
                            .update({ read: true })
                            .eq('user_id', user.id)
                            .eq('read', false);
                    }
                } catch (error) {
                    console.error('Error marking all notifications as read:', error);
                }
            },

            addNotification: (notification: Notification) => {
                const { notifications, unreadCount } = get();
                const newNotifications = [notification, ...notifications];
                const newUnreadCount = notification.read ? unreadCount : unreadCount + 1;

                // Keep only latest 50 notifications
                set({
                    notifications: newNotifications.slice(0, 50),
                    unreadCount: newUnreadCount
                });
            },

            clearNotifications: () => {
                set({ notifications: [], unreadCount: 0 });
            },
        }),
        {
            name: 'ploky-notifications',
            partialize: (state) => ({
                notifications: state.notifications.slice(0, 20),
                unreadCount: state.unreadCount
            }),
        }
    )
);
