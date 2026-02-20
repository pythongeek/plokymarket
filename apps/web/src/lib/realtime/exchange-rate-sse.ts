'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getExchangeRate, ExchangeRate, fetchBinanceP2PRates } from './binance-p2p';

// Types
export interface SSERateUpdate {
  type: 'rate_update' | 'error' | 'connected' | 'ping';
  rate?: ExchangeRate;
  error?: string;
  timestamp?: number;
}

// Hook for SSE-based exchange rate updates
export function useExchangeRateSSE(enabled: boolean = true) {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // First, try to get initial rate from API
      const initialRate = await getExchangeRate();
      setRate(initialRate);
      setLastUpdated(new Date());

      // Then connect to SSE for real-time updates
      const eventSource = new EventSource('/api/exchange-rate/sse');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: SSERateUpdate = JSON.parse(event.data);
          
          if (data.type === 'rate_update' && data.rate) {
            setRate(data.rate);
            setLastUpdated(new Date());
            setError(null);
          } else if (data.type === 'error') {
            setError(data.error || 'Unknown error');
          }
        } catch (e) {
          console.error('[SSE] Failed to parse message:', e);
        }
      };

      eventSource.onerror = () => {
        setError('SSE connection lost, falling back to polling');
        eventSource.close();
        eventSourceRef.current = null;
        
        // Fall back to polling
        startPolling();
      };

    } catch (e: any) {
      setError(e.message || 'Failed to connect');
      // Fall back to polling
      startPolling();
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Polling fallback
  const startPolling = useCallback(async () => {
    const poll = async () => {
      try {
        const newRate = await fetchBinanceP2PRates();
        if (newRate) {
          setRate(newRate);
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    // Initial poll
    poll();

    // Set up interval (every 30 seconds)
    const intervalId = setInterval(poll, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const newRate = await getExchangeRate();
      setRate(newRate);
      setLastUpdated(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rate,
    loading,
    error,
    lastUpdated,
    refresh,
    isConnected: !error && rate !== null
  };
}

// Hook for auto-refresh every X seconds
export function useAutoRefreshRate(intervalSeconds: number = 300) {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = useCallback(async () => {
    setLoading(true);
    try {
      const newRate = await fetchBinanceP2PRates();
      if (newRate) {
        setRate(newRate);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchRate();

    // Set up interval
    const intervalId = setInterval(fetchRate, intervalSeconds * 1000);

    return () => clearInterval(intervalId);
  }, [fetchRate, intervalSeconds]);

  return {
    rate,
    loading,
    error,
    lastUpdated,
    refresh: fetchRate
  };
}

// Format rate for display
export function formatRate(rate: number, decimals: number = 2): string {
  return rate.toFixed(decimals);
}

// Format rate with currency
export function formatRateWithCurrency(rate: number, from: string = 'USDT', to: string = 'BDT'): string {
  return `1 ${from} = ${formatRate(rate)} ${to}`;
}

// Calculate conversion
export function calculateConversion(amount: number, rate: number): number {
  return amount * rate;
}

// Get rate change percentage
export function getRateChange(oldRate: number, newRate: number): number {
  if (oldRate === 0) return 0;
  return ((newRate - oldRate) / oldRate) * 100;
}

// Format rate change for display
export function formatRateChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}
