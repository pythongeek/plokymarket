import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ===================================
// NOTIFICATION SERVICE
// ===================================

export interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  priority?: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  notifications_enabled: boolean;
  do_not_disturb: boolean;
  order_fills_enabled: boolean;
  order_fills_min_amount: number;
  order_fills_channels: string[];
  market_resolution_enabled: boolean;
  price_alerts_enabled: boolean;
  position_risk_enabled: boolean;
  social_notifications_enabled: boolean;
}

class NotificationService {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private callbacks: ((notification: Notification) => void)[] = [];

  // ===================================
  // REAL-TIME SUBSCRIPTION
  // ===================================

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    this.callbacks.push(callback);

    if (!this.channel) {
      this.channel = this.supabase
        .channel(`user-notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notification = payload.new as Notification;
            this.callbacks.forEach(cb => cb(notification));
          }
        )
        .subscribe();
    }

    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
      if (this.callbacks.length === 0 && this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  // ===================================
  // NOTIFICATIONS API
  // ===================================

  async getNotifications(options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
  } = {}) {
    const { limit = 50, offset = 0, unreadOnly = false, category } = options;
    
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    if (unreadOnly) params.set('unread', 'true');
    if (category) params.set('category', category);

    const res = await fetch(`/api/notifications?${params}`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }

  async markAsRead(notificationIds?: string[]) {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mark_read',
        notificationIds
      })
    });
    if (!res.ok) throw new Error('Failed to mark as read');
    return res.json();
  }

  async dismiss(notificationIds: string[]) {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismiss',
        notificationIds
      })
    });
    if (!res.ok) throw new Error('Failed to dismiss');
    return res.json();
  }

  async snooze(notificationIds: string[], minutes: number) {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'snooze',
        notificationIds,
        snoozeMinutes: minutes
      })
    });
    if (!res.ok) throw new Error('Failed to snooze');
    return res.json();
  }

  // ===================================
  // PREFERENCES API
  // ===================================

  async getPreferences() {
    const res = await fetch('/api/notifications/preferences');
    if (!res.ok) throw new Error('Failed to fetch preferences');
    const { data } = await res.json();
    return data;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const res = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  }

  // ===================================
 // PUSH NOTIFICATIONS
// ===================================

async requestPushPermission() {
    if (!('Notification' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPush() {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from server
      const { data: { vapidPublicKey } } = await this.supabase
        .from('app_config')
        .select('vapid_public_key')
        .single();

      if (!vapidPublicKey) {
        console.log('VAPID key not configured');
        return null;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      // Save subscription to server
      await this.supabase
        .from('push_subscriptions')
        .upsert({
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString()
        });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ===================================
  // LOCAL NOTIFICATIONS (In-App)
  // ===================================

  showLocalNotification(notification: Notification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    new Notification(notification.title, {
      body: notification.body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: notification.id,
      requireInteraction: notification.category === 'risk'
    });
  }

  // ===================================
  // NOTIFICATION SOUNDS
  // ===================================

  private audioContext: AudioContext | null = null;

  playNotificationSound(priority: string = 'normal') {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Different sounds for different priorities
    switch (priority) {
      case 'urgent':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.5;
        break;
      case 'high':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.3;
        break;
      default:
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.2;
    }

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }
}

export const notificationService = new NotificationService();
