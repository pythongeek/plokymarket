'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExchangeRate {
  rate: number;
  source: string;
  updated_at: string;
  cached: boolean;
}

interface UseExchangeRateReturn {
  rate: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useExchangeRate(): UseExchangeRateReturn {
  const [rate, setRate] = useState<number>(100.00); // Default fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch rate');
      }
      
      setRate(data.rate);
      setLastUpdated(new Date(data.updated_at));
    } catch (err) {
      console.error('Exchange rate fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Keep previous rate on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchRate]);

  return {
    rate,
    loading,
    error,
    refresh: fetchRate,
    lastUpdated,
  };
}

/**
 * Calculate conversion with current rate
 */
export function useConversion(rate: number) {
  const bdtToUsdt = useCallback((bdt: number): number => {
    return Math.round((bdt / rate) * 100) / 100;
  }, [rate]);

  const usdtToBdt = useCallback((usdt: number): number => {
    return Math.round((usdt * rate) * 100) / 100;
  }, [rate]);

  return { bdtToUsdt, usdtToBdt };
}
