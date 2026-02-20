'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface WalletBalance {
  usdt_balance: number;
  locked_usdt: number;
  total_deposited: number;
  total_withdrawn: number;
  updated_at: string;
}

type BalanceCallback = (balance: WalletBalance) => void;
type ErrorCallback = (error: Error) => void;

// Hook for listening to wallet balance changes in real-time
export function useBalanceListener(
  userId: string | undefined,
  onUpdate: BalanceCallback,
  onError?: ErrorCallback
) {
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Set up the realtime subscription
    const channel = supabase
      .channel(`wallet-balance-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as WalletBalance);
            
            // Show notification for balance change
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('ব্যালেন্স আপডেট', {
                  body: `আপনার নতুন ব্যালেন্স: ${(payload.new as WalletBalance).usdt_balance} USDT`,
                  icon: '/favicon.ico'
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Failed to subscribe to balance updates'));
        }
      });

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, onUpdate, onError]);
}

// Fetch current balance
export async function fetchBalance(userId: string): Promise<WalletBalance | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching balance:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
}

// Calculate available balance (total - locked)
export function calculateAvailable(balance: WalletBalance | null): number {
  if (!balance) return 0;
  return balance.usdt_balance - balance.locked_usdt;
}

// Format balance for display
export function formatBalance(balance: number, decimals: number = 2): string {
  return balance.toFixed(decimals);
}

// Format balance with currency symbol
export function formatBalanceWithCurrency(balance: number, currency: string = 'USDT'): string {
  return `${formatBalance(balance)} ${currency}`;
}

// Convert USDT to BDT using exchange rate
export function convertUsdtToBdt(usdtAmount: number, rate: number): number {
  return usdtAmount * rate;
}

// Convert BDT to USDT using exchange rate
export function convertBdtToUsdt(bdtAmount: number, rate: number): number {
  return bdtAmount / rate;
}

// Hook for auto-refresh balance every X seconds
export function useAutoRefreshBalance(
  userId: string | undefined,
  intervalSeconds: number = 30,
  onUpdate: BalanceCallback
) {
  const supabase = createClient();

  const fetchAndUpdate = useCallback(async () => {
    if (!userId) return;
    
    const balance = await fetchBalance(userId);
    if (balance) {
      onUpdate(balance);
    }
  }, [userId, onUpdate]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchAndUpdate();

    // Set up interval
    const interval = setInterval(fetchAndUpdate, intervalSeconds * 1000);

    // Also listen for realtime updates
    const channel = supabase
      .channel(`auto-refresh-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as WalletBalance);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId, intervalSeconds, fetchAndUpdate, supabase, onUpdate]);
}
