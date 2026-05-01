// @ts-nocheck
'use client';

/**
 * useSmartNotifications Hook
 * Phase 4 - Enhanced smart notification system with AI-powered recommendations
 * Supports Bengali language, price alerts, market recommendations, and real-time updates
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore, type Notification, type NotificationPreferences, type NotificationType } from '@/store/notificationStore';

// ===================================
// TYPES
// ===================================

export interface PriceAlert {
  marketId: string;
  marketTitle: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
  createdAt: string;
}

export interface NotificationFilter {
  type?: NotificationType;
  marketId?: string;
  unreadOnly?: boolean;
  limit?: number;
}

export interface SmartNotificationContext {
  userId: string;
  isAuthenticated: boolean;
  preferredLanguage: 'bn' | 'en';
  notificationPreferences: NotificationPreferences;
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
// HOOK
// ===================================

export function useSmartNotifications(userId?: string) {
  const supabase = createClient();
  
  // Store state
  const store = useNotificationStore();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [followedMarketIds, setFollowedMarketIds] = useState<Set<string>>(new Set());
  const [context, setContext] = useState<SmartNotificationContext>({
    userId: userId || '',
    isAuthenticated: false,
    preferredLanguage: 'bn',
    notificationPreferences: defaultPreferences,
  });

  // Refs for cleanup
  const priceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // ──────────────────────────────────────
  // INITIALIZATION
  // ──────────────────────────────────────

  // Load user context
  useEffect(() => {
    const loadUserContext = async () => {
      if (!userId) {
        setContext(prev => ({ ...prev, isAuthenticated: false }));
        setIsLoading(false);
        return;
      }

      try {
        // Get user profile for language preference
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('notification_preferences, preferred_language')
          .eq('user_id', userId)
          .single();

        // Get followed markets
        const { data: follows } = await supabase
          .from('market_follows')
          .select('market_id')
          .eq('user_id', userId);

        const followedIds = new Set(follows?.map(f => f.market_id) || []);
        
        // Load price alerts from preferences
        const prefs = profile?.notification_preferences || defaultPreferences;
        const alerts: PriceAlert[] = Object.entries(prefs.priceAlerts || {}).map(([marketId, alert]) => ({
          marketId,
          marketTitle: '', // Will be populated later
          targetPrice: alert.above || alert.below,
          direction: alert.above ? 'above' : 'below',
          triggered: false,
          createdAt: new Date().toISOString(),
        }));

        setContext({
          userId,
          isAuthenticated: true,
          preferredLanguage: profile?.preferred_language === 'en' ? 'en' : 'bn',
          notificationPreferences: prefs,
        });
        
        setFollowedMarketIds(followedIds);
        setPriceAlerts(alerts);
        
        // Sync with store
        store.updatePreferences(prefs);
        
      } catch (error) {
        console.error('Error loading user context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserContext();
  }, [userId]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId || isInitializedRef.current) return;
    
    isInitializedRef.current = true;
    store.subscribeToNotifications(userId);
    
    return () => {
      store.unsubscribeFromNotifications();
    };
  }, [userId]);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // ──────────────────────────────────────
  // PRICE ALERT MONITORING
  // ──────────────────────────────────────

  // Monitor price alerts
  useEffect(() => {
    if (priceAlerts.length === 0) return;

    const checkPrices = async () => {
      for (const alert of priceAlerts) {
        if (alert.triggered) continue;

        try {
          // Fetch current market price
          const { data: market } = await supabase
            .from('markets')
            .select('current_yes_price, question')
            .eq('id', alert.marketId)
            .single();

          if (!market) continue;

          const currentPrice = market.current_yes_price;
          const shouldTrigger = 
            alert.direction === 'above' 
              ? currentPrice >= alert.targetPrice
              : currentPrice <= alert.targetPrice;

          if (shouldTrigger) {
            // Trigger notification
            await triggerPriceAlertNotification(alert, currentPrice, market.question);
            
            // Mark as triggered
            setPriceAlerts(prev =>
              prev.map(a =>
                a.marketId === alert.marketId
                  ? { ...a, triggered: true }
                  : a
              )
            );
          }
        } catch (error) {
          console.error(`Error checking price for market ${alert.marketId}:`, error);
        }
      }
    };

    // Check every 30 seconds
    priceCheckIntervalRef.current = setInterval(checkPrices, 30000);

    // Initial check
    checkPrices();

    return () => {
      if (priceCheckIntervalRef.current) {
        clearInterval(priceCheckIntervalRef.current);
      }
    };
  }, [priceAlerts, context.isAuthenticated]);

  // ──────────────────────────────────────
  // NOTIFICATION ACTIONS
  // ──────────────────────────────────────

  const triggerPriceAlertNotification = async (
    alert: PriceAlert,
    currentPrice: number,
    marketQuestion: string
  ) => {
    if (!userId) return;

    const directionText = alert.direction === 'above' ? 'পূরণ হয়েছে' : 'নিচে নেমেছে';
    const title = `📢 মূল্য সতর্কতা - ${directionText}`;
    const body = `${marketQuestion} এর দাম এখন ${(currentPrice * 100).toFixed(1)}% - আপনার লক্ষ্য ছিল ${(alert.targetPrice * 100).toFixed(1)}%`;

    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'price_alert',
        title,
        body,
        market_id: alert.marketId,
        priority: 'high',
        read: false,
        action_url: `/markets/${alert.marketId}`,
        metadata: {
          alertPrice: alert.targetPrice,
          currentPrice,
          direction: alert.direction,
        },
      });
    } catch (error) {
      console.error('Error creating price alert notification:', error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      store.updatePreferences({ pushEnabled: result === 'granted' });
      return result;
    }
    return 'denied';
  }, []);

  const savePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    await store.updatePreferences(newPrefs);
    setContext(prev => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, ...newPrefs },
    }));
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    await store.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    await store.markAllAsRead();
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await store.deleteNotification(notificationId);
  }, []);

  const clearAll = useCallback(async () => {
    await store.clearAll();
  }, []);

  // ──────────────────────────────────────
  // PRICE ALERTS
  // ──────────────────────────────────────

  const addPriceAlert = useCallback(async (
    marketId: string,
    marketTitle: string,
    targetPrice: number,
    direction: 'above' | 'below'
  ) => {
    const newAlert: PriceAlert = {
      marketId,
      marketTitle,
      targetPrice,
      direction,
      triggered: false,
      createdAt: new Date().toISOString(),
    };

    setPriceAlerts(prev => [...prev, newAlert]);
    
    // Update store preferences
    const { priceAlerts: currentAlerts } = context.notificationPreferences;
    const updatedAlerts = {
      ...currentAlerts,
      [marketId]: {
        above: direction === 'above' ? targetPrice : (currentAlerts[marketId]?.above || 0),
        below: direction === 'below' ? targetPrice : (currentAlerts[marketId]?.below || 0),
        enabled: true,
      },
    };
    
    await savePreferences({ priceAlerts: updatedAlerts });
  }, [context.notificationPreferences, savePreferences]);

  const removePriceAlert = useCallback(async (marketId: string) => {
    setPriceAlerts(prev => prev.filter(a => a.marketId !== marketId));
    
    const { [marketId]: _, ...remainingAlerts } = context.notificationPreferences.priceAlerts;
    await savePreferences({ priceAlerts: remainingAlerts });
  }, [context.notificationPreferences.priceAlerts, savePreferences]);

  // ──────────────────────────────────────
  // MARKET FOLLOW/UNFOLLOW
  // ──────────────────────────────────────

  const followMarket = useCallback(async (marketId: string) => {
    if (!userId) return;

    setFollowedMarketIds(prev => new Set([...prev, marketId]));

    try {
      await supabase.from('market_follows').insert({
        user_id: userId,
        market_id: marketId,
      });
    } catch (error) {
      console.error('Error following market:', error);
      setFollowedMarketIds(prev => {
        const next = new Set(prev);
        next.delete(marketId);
        return next;
      });
    }
  }, [userId]);

  const unfollowMarket = useCallback(async (marketId: string) => {
    if (!userId) return;

    setFollowedMarketIds(prev => {
      const next = new Set(prev);
      next.delete(marketId);
      return next;
    });

    try {
      await supabase
        .from('market_follows')
        .delete()
        .eq('user_id', userId)
        .eq('market_id', marketId);
    } catch (error) {
      console.error('Error unfollowing market:', error);
      setFollowedMarketIds(prev => new Set([...prev, marketId]));
    }
  }, [userId]);

  const isFollowingMarket = useCallback((marketId: string) => {
    return followedMarketIds.has(marketId);
  }, [followedMarketIds]);

  // ──────────────────────────────────────
  // FILTER & QUERY
  // ──────────────────────────────────────

  const getFilteredNotifications = useCallback((filter: NotificationFilter = {}) => {
    let filtered = store.notifications;

    if (filter.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    if (filter.marketId) {
      filtered = filtered.filter(n => n.market_id === filter.marketId);
    }

    if (filter.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }, [store.notifications]);

  // ──────────────────────────────────────
  // COMPUTED VALUES
  // ──────────────────────────────────────

  const unreadCount = useMemo(() => {
    return store.notifications.filter(n => !n.read).length;
  }, [store.notifications]);

  const unreadByType = useMemo(() => {
    const counts: Record<string, number> = {};
    store.notifications.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + (n.read ? 0 : 1);
    });
    return counts;
  }, [store.notifications]);

  const recentNotifications = useMemo(() => {
    return store.notifications.slice(0, 10);
  }, [store.notifications]);

  const activePriceAlerts = useMemo(() => {
    return priceAlerts.filter(a => !a.triggered);
  }, [priceAlerts]);

  // ──────────────────────────────────────
  // TRANSLATION HELPERS (Bengali)
  // ──────────────────────────────────────

  const translateNotificationType = useCallback((type: NotificationType): string => {
    const translations: Record<NotificationType, { bn: string; en: string }> = {
      price_alert: { bn: 'মূল্য সতর্কতা', en: 'Price Alert' },
      market_update: { bn: 'বাজার আপডেট', en: 'Market Update' },
      order_filled: { bn: 'অর্ডার পূরণ', en: 'Order Filled' },
      order_cancelled: { bn: 'অর্ডার বাতিল', en: 'Order Cancelled' },
      position_settled: { bn: 'পজিশন সমাধান', en: 'Position Settled' },
      deposit_received: { bn: 'জমা প্রাপ্ত', en: 'Deposit Received' },
      withdrawal_processed: { bn: 'উইথড্র চলমান', en: 'Withdrawal Processed' },
      market_resolution: { bn: 'বাজার সমাধান', en: 'Market Resolution' },
      system: { bn: 'সিস্টেম', en: 'System' },
      recommendation: { bn: 'সুপারিশ', en: 'Recommendation' },
    };
    return translations[type]?.[context.preferredLanguage] || type;
  }, [context.preferredLanguage]);

  const getBengaliTimeAgo = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHours < 24) return `${diffHours} ঘন্টা আগে`;
    if (diffDays < 7) return `${diffDays} দিন আগে`;
    
    return date.toLocaleDateString('bn-BD', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // ──────────────────────────────────────
  // RETURN
  // ──────────────────────────────────────

  return {
    // State
    notifications: store.notifications,
    preferences: context.notificationPreferences,
    isLoading,
    permission,
    unreadCount,
    priceAlerts: activePriceAlerts,
    followedMarketIds: Array.from(followedMarketIds),
    
    // Computed
    unreadByType,
    recentNotifications,
    filteredNotifications: getFilteredNotifications,
    
    // Translation helpers
    translateNotificationType,
    getBengaliTimeAgo,
    preferredLanguage: context.preferredLanguage,
    
    // Actions
    requestPermission,
    savePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    
    // Price alerts
    addPriceAlert,
    removePriceAlert,
    isPriceAlertActive: (marketId: string) => 
      priceAlerts.some(a => a.marketId === marketId && !a.triggered),
    
    // Market follow
    followMarket,
    unfollowMarket,
    isFollowingMarket,
    
    // Store actions
    fetchNotifications: store.fetchNotifications,
    fetchMoreNotifications: store.fetchMoreNotifications,
  };
}

export default useSmartNotifications;
