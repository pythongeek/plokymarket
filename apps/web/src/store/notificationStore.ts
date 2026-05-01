import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createClient } from '@/lib/supabase/client';

// ===================================
// TYPES
// ===================================

export type NotificationType = 
  | 'price_alert' 
  | 'market_update' 
  | 'order_filled' 
  | 'order_cancelled' 
  | 'position_settled'
  | 'deposit_received' 
  | 'withdrawal_processed'
  | 'market_resolution'
  | 'system'
  | 'recommendation';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  titleBn?: string;
  body: string;
  bodyBn?: string;
  market_id?: string;
  market_title?: string;
  trade_id?: string;
  order_id?: string;
  read: boolean;
  priority: NotificationPriority;
  action_url?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  // Price Alerts
  priceAlerts: Record<string, { above: number; below: number; enabled: boolean }>;
  
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
  pushPermissionAsked: boolean;
  emailEnabled: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly';
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
  
  // Display settings
  showNotifications: boolean;
  notificationSound: boolean;
}

export interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

// ===================================
// DEFAULT PREFERENCES
// ===================================

const defaultPreferences: NotificationPreferences = {
  priceAlerts: {},
  followedMarkets: true,
  newMarkets: true,
  marketResolution: true,
  orderFilled: true,
  orderCancelled: true,
  positionSettled: true,
  depositReceived: true,
  withdrawalProcessed: true,
  pushEnabled: false,
  pushPermissionAsked: false,
  emailEnabled: false,
  emailFrequency: 'instant',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  showNotifications: true,
  notificationSound: true,
};

// ===================================
// STORE STATE
// ===================================

interface NotificationState {
  // Data
  notifications: Notification[];
  preferences: NotificationPreferences;
  
  // UI State
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  
  // Real-time
  isSubscribed: boolean;
  unsubscribe: (() => void) | null;
  
  // Pagination
  page: number;
  hasMore: boolean;
  
  // Toast queue (for browser notifications when app is in foreground)
  toastQueue: Notification[];
}

// ===================================
// STORE ACTIONS
// ===================================

interface NotificationActions {
  // Fetch
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchMoreNotifications: () => Promise<void>;
  
  // Preferences
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  resetPreferences: () => void;
  
  // Price Alerts
  setPriceAlert: (marketId: string, above: number, below: number) => Promise<void>;
  removePriceAlert: (marketId: string) => Promise<void>;
  
  // Mark as read
  markAsRead: (notificationId: string) => Promise<void>;
  markAsReadByMarket: (marketId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // CRUD
  addNotification: (notification: Notification) => void;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // Real-time
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
  
  // Browser notifications
  requestPushPermission: () => Promise<NotificationPermission>;
  showBrowserNotification: (notification: Notification) => void;
  
  // Quiet hours
  isInQuietHours: () => boolean;
  
  // Grouping
  getGroupedNotifications: () => NotificationGroup[];
  
  // Utility
  clearError: () => void;
}

// ===================================
// STORE IMPLEMENTATION
// ===================================

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ──────────────────────────────────────
        // FETCH ACTIONS
        // ──────────────────────────────────────

        fetchNotifications: async (reset = false) => {
          const state = get();
          if (reset) {
            set((s) => { s.page = 1; s.notifications = []; });
          }

          set((s) => { s.isLoading = true; s.error = null; });

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
              set((s) => { s.notifications = []; s.unreadCount = 0; s.isLoading = false; });
              return;
            }

            const { data, error, count } = await supabase
              .from('notifications')
              .select('*', { count: 'exact' })
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .range(0, 19);

            if (error) throw error;

            const notifications = (data || []) as Notification[];
            const unreadCount = notifications.filter(n => !n.read).length;

            set((s) => {
              s.notifications = notifications;
              s.unreadCount = unreadCount;
              s.hasMore = (count || 0) > notifications.length;
              s.isLoading = false;
            });
          } catch (error) {
            console.error('Error fetching notifications:', error);
            set((s) => {
              s.error = error instanceof Error ? error.message : 'Failed to fetch notifications';
              s.isLoading = false;
            });
          }
        },

        fetchMoreNotifications: async () => {
          const state = get();
          if (state.isLoadingMore || !state.hasMore) return;

          set((s) => { s.isLoadingMore = true; });

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
              set((s) => { s.isLoadingMore = false; });
              return;
            }

            const nextPage = state.page + 1;
            const { data, error, count } = await supabase
              .from('notifications')
              .select('*', { count: 'exact' })
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .range(nextPage * 20, (nextPage + 1) * 20 - 1);

            if (error) throw error;

            const newNotifications = (data || []) as Notification[];

            set((s) => {
              s.notifications = [...s.notifications, ...newNotifications];
              s.page = nextPage;
              s.hasMore = newNotifications.length === 20 && (count || 0) > s.notifications.length;
              s.isLoadingMore = false;
            });
          } catch (error) {
            console.error('Error fetching more notifications:', error);
            set((s) => { s.isLoadingMore = false; });
          }
        },

        // ──────────────────────────────────────
        // PREFERENCES
        // ──────────────────────────────────────

        updatePreferences: async (newPrefs: Partial<NotificationPreferences>) => {
          const { preferences } = get();
          const updated = { ...preferences, ...newPrefs };
          
          // Optimistic update
          set((s) => { s.preferences = updated; });

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              await supabase
                .from('user_profiles')
                .update({ notification_preferences: updated })
                .eq('user_id', user.id);
            }
          } catch (error) {
            console.error('Error saving preferences:', error);
            // Rollback on error
            set((s) => { s.preferences = preferences; });
          }
        },

        resetPreferences: () => {
          set((s) => { s.preferences = defaultPreferences; });
        },

        // ──────────────────────────────────────
        // PRICE ALERTS
        // ──────────────────────────────────────

        setPriceAlert: async (marketId: string, above: number, below: number) => {
          const { preferences } = get();
          const newPriceAlerts = {
            ...preferences.priceAlerts,
            [marketId]: { above, below, enabled: true }
          };
          await get().updatePreferences({ priceAlerts: newPriceAlerts });
        },

        removePriceAlert: async (marketId: string) => {
          const { preferences } = get();
          const newPriceAlerts = { ...preferences.priceAlerts };
          delete newPriceAlerts[marketId];
          await get().updatePreferences({ priceAlerts: newPriceAlerts });
        },

        // ──────────────────────────────────────
        // MARK AS READ
        // ──────────────────────────────────────

        markAsRead: async (notificationId: string) => {
          // Optimistic update
          set((s) => {
            s.notifications = s.notifications.map(n =>
              n.id === notificationId ? { ...n, read: true } : n
            );
            s.unreadCount = s.notifications.filter(n => !n.read).length;
          });

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

        markAsReadByMarket: async (marketId: string) => {
          const { notifications } = get();
          const marketNotifications = notifications.filter(n => n.market_id === marketId && !n.read);
          
          if (marketNotifications.length === 0) return;

          // Optimistic update
          set((s) => {
            s.notifications = s.notifications.map(n =>
              n.market_id === marketId ? { ...n, read: true } : n
            );
            s.unreadCount = s.notifications.filter(n => !n.read).length;
          });

          try {
            const supabase = createClient();
            await supabase
              .from('notifications')
              .update({ read: true })
              .eq('market_id', marketId)
              .eq('read', false);
          } catch (error) {
            console.error('Error marking market notifications as read:', error);
          }
        },

        markAllAsRead: async () => {
          const { notifications } = get();

          // Optimistic update
          set((s) => {
            s.notifications = s.notifications.map(n => ({ ...n, read: true }));
            s.unreadCount = 0;
          });

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

        // ──────────────────────────────────────
        // CRUD
        // ──────────────────────────────────────

        addNotification: (notification: Notification) => {
          const { notifications, unreadCount } = get();
          
          // Check for duplicates
          if (notifications.some(n => n.id === notification.id)) return;
          
          // Check if in quiet hours and notification is not urgent
          const inQuietHours = get().isInQuietHours();
          const isUrgent = notification.priority === 'urgent';
          
          if (inQuietHours && !isUrgent) {
            // Queue for later
            set((s) => {
              s.toastQueue.push(notification);
            });
            return;
          }

          const newNotifications = [notification, ...notifications].slice(0, 100);
          const newUnreadCount = notification.read ? unreadCount : unreadCount + 1;

          set((s) => {
            s.notifications = newNotifications;
            s.unreadCount = newUnreadCount;
          });

          // Show browser notification if enabled
          if (notification.priority !== 'low') {
            get().showBrowserNotification(notification);
          }
        },

        deleteNotification: async (notificationId: string) => {
          const { notifications } = get();
          const notification = notifications.find(n => n.id === notificationId);

          // Optimistic update
          set((s) => {
            s.notifications = s.notifications.filter(n => n.id !== notificationId);
            if (notification && !notification.read) {
              s.unreadCount = Math.max(0, s.unreadCount - 1);
            }
          });

          try {
            const supabase = createClient();
            await supabase
              .from('notifications')
              .delete()
              .eq('id', notificationId);
          } catch (error) {
            console.error('Error deleting notification:', error);
          }
        },

        clearAll: async () => {
          const { notifications } = get();
          const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

          // Optimistic update
          set({ notifications: [], unreadCount: 0 });

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
              await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);
            }
          } catch (error) {
            console.error('Error clearing notifications:', error);
          }
        },

        // ──────────────────────────────────────
        // REAL-TIME
        // ──────────────────────────────────────

        subscribeToNotifications: (userId: string) => {
          const state = get();
          if (state.isSubscribed) return;

          const supabase = createClient();

          const channel = supabase
            .channel(`notifications:${userId}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            }, (payload) => {
              const newNotif = payload.new as Notification;
              get().addNotification({
                ...newNotif,
                read: false,
                priority: newNotif.priority || 'normal'
              });
            })
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            }, (payload) => {
              const updated = payload.new as Notification;
              set((s) => {
                s.notifications = s.notifications.map(n =>
                  n.id === updated.id ? { ...n, ...updated } : n
                );
              });
            })
            .on('postgres_changes', {
              event: 'DELETE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`
            }, (payload) => {
              const deleted = payload.old as { id: string };
              set((s) => {
                s.notifications = s.notifications.filter(n => n.id !== deleted.id);
              });
            })
            .subscribe();

          set({
            isSubscribed: true,
            unsubscribe: () => {
              supabase.removeChannel(channel);
              set({ isSubscribed: false, unsubscribe: null });
            }
          });
        },

        unsubscribeFromNotifications: () => {
          const { unsubscribe } = get();
          if (unsubscribe) {
            unsubscribe();
          }
        },

        // ──────────────────────────────────────
        // BROWSER NOTIFICATIONS
        // ──────────────────────────────────────

        requestPushPermission: async () => {
          if (typeof window === 'undefined' || !('Notification' in window)) {
            return 'denied';
          }

          const result = await Notification.requestPermission();
          const { preferences } = get();
          
          set((s) => {
            s.preferences = {
              ...preferences,
              pushEnabled: result === 'granted',
              pushPermissionAsked: true
            };
          });

          return result;
        },

        showBrowserNotification: (notification: Notification) => {
          const { preferences } = get();
          
          if (!preferences.pushEnabled || !preferences.showNotifications) return;
          if (typeof window === 'undefined' || !('Notification' in window)) return;
          if (Notification.permission !== 'granted') return;
          if (get().isInQuietHours() && notification.priority !== 'urgent') return;

          const title = notification.titleBn || notification.title;
          const body = notification.bodyBn || notification.body;

          const browserNotification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.priority === 'urgent',
          });

          if (notification.action_url) {
            browserNotification.onclick = () => {
              window.focus();
              window.location.href = notification.action_url!;
            };
          }

          if (preferences.notificationSound) {
            // Play a subtle notification sound
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.volume = 0.3;
              audio.play().catch(() => {});
            } catch {}
          }
        },

        // ──────────────────────────────────────
        // QUIET HOURS
        // ──────────────────────────────────────

        isInQuietHours: () => {
          const { preferences } = get();
          if (!preferences.quietHoursEnabled) return false;

          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
          const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
          
          const startTime = startHour * 60 + startMin;
          const endTime = endHour * 60 + endMin;

          if (startTime <= endTime) {
            // Same day range (e.g., 09:00 - 17:00)
            return currentTime >= startTime && currentTime <= endTime;
          } else {
            // Overnight range (e.g., 22:00 - 08:00)
            return currentTime >= startTime || currentTime <= endTime;
          }
        },

        // ──────────────────────────────────────
        // GROUPING
        // ──────────────────────────────────────

        getGroupedNotifications: () => {
          const { notifications } = get();
          const groups: Record<string, Notification[]> = {};

          notifications.forEach(notification => {
            const date = new Date(notification.created_at).toLocaleDateString('bn-BD', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            if (!groups[date]) {
              groups[date] = [];
            }
            groups[date].push(notification);
          });

          return Object.entries(groups).map(([date, notifications]) => ({
            date,
            notifications
          }));
        },

        // ──────────────────────────────────────
        // UTILITY
        // ──────────────────────────────────────

        clearError: () => {
          set((s) => { s.error = null; });
        },
      })),
      {
        name: 'ploky-notifications-v2',
        partialize: (state) => ({
          preferences: state.preferences,
          notifications: state.notifications.slice(0, 50),
        }),
      }
    )
  )
);

// ===================================
// INITIAL STATE
// ===================================

const initialState: NotificationState = {
  notifications: [],
  preferences: defaultPreferences,
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  isSubscribed: false,
  unsubscribe: null,
  page: 0,
  hasMore: true,
  toastQueue: [],
};

// ===================================
// SELECTORS
// ===================================

export const selectUnreadNotifications = (state: NotificationState) =>
  state.notifications.filter(n => !n.read);

export const selectNotificationsByType = (state: NotificationState, type: NotificationType) =>
  state.notifications.filter(n => n.type === type);

export const selectNotificationsByMarket = (state: NotificationState, marketId: string) =>
  state.notifications.filter(n => n.market_id === marketId);

export const selectPriceAlert = (state: NotificationState, marketId: string) =>
  state.preferences.priceAlerts[marketId];

export default useNotificationStore;
