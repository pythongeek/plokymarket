import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';

// Types
export interface WalletData {
  usdt_balance: number;
  locked_usdt: number;
  total_deposited: number;
  total_withdrawn: number;
  updated_at: string;
}

export interface BalanceUpdate {
  type: 'balance_update' | 'connected' | 'ping';
  balance?: WalletData;
  timestamp?: number;
}

// Hook for subscribing to wallet balance changes
export function useWalletRealtime(
  supabase: SupabaseClient,
  userId: string | undefined,
  onBalanceUpdate?: (balance: WalletData) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && onBalanceUpdate) {
            onBalanceUpdate(payload.new as WalletData);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, onBalanceUpdate]);

  return { isConnected };
}

// Hook for subscribing to deposit/withdrawal status changes
export function useTransactionRealtime(
  supabase: SupabaseClient,
  userId: string | undefined,
  onTransactionUpdate?: (payload: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to deposit requests
    const depositChannel = supabase
      .channel(`deposits:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposit_requests',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (onTransactionUpdate) {
            onTransactionUpdate({ type: 'deposit', ...payload });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
      });

    // Subscribe to withdrawal requests
    const withdrawalChannel = supabase
      .channel(`withdrawals:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawal_requests',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (onTransactionUpdate) {
            onTransactionUpdate({ type: 'withdrawal', ...payload });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(depositChannel);
      supabase.removeChannel(withdrawalChannel);
    };
  }, [userId, supabase, onTransactionUpdate]);

  return { isConnected };
}

// Subscribe to exchange rate updates
export function useExchangeRateRealtime(
  supabase: SupabaseClient,
  onRateUpdate?: (rate: number) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('exchange_rates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exchange_rates_live'
        },
        (payload) => {
          if (payload.new && onRateUpdate) {
            onRateUpdate((payload.new as any).usdt_to_bdt);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, onRateUpdate]);

  return { isConnected };
}

// Generic channel manager for custom subscriptions
export class RealtimeChannelManager {
  private channels: Map<string, ReturnType<SupabaseClient['channel']>> = new Map();
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  subscribe(
    channelName: string,
    table: string,
    filter?: string,
    callback?: (payload: any) => void
  ) {
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}