'use client';

import { useState, useEffect, useCallback } from 'react';

interface ExchangeRateData {
  rate: number;
  source: string;
  updated_at: string;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  cached: boolean;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh every 5 minutes
const FALLBACK_RATE = 120;

export function useExchangeRate(): ExchangeRateData {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [source, setSource] = useState<string>('initializing');
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [cached, setCached] = useState<boolean>(false);

  const fetchRate = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.success && typeof data.rate === 'number' && data.rate > 0) {
        setRate(data.rate);
        setSource(data.source ?? 'unknown');
        setUpdatedAt(data.updated_at ?? new Date().toISOString());
        setCached(!!data.cached);
      } else {
        throw new Error(data.error || 'Invalid rate in response');
      }
    } catch (err) {
      console.error('[useExchangeRate] Failed to fetch rate:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return {
    rate,
    source,
    updated_at: updatedAt,
    isLoading,
    isError,
    cached,
    refetch: fetchRate,
  };
}

/**
 * Simplified Conversion Hook
 */
export function useConversion(rate: number) {
  const bdtToUsdt = useCallback((bdt: number): number => {
    if (rate <= 0) return 0;
    return parseFloat((bdt / rate).toFixed(6));
  }, [rate]);

  const usdtToBdt = useCallback((usdt: number): number => {
    if (rate <= 0) return 0;
    return parseFloat((usdt * rate).toFixed(2));
  }, [rate]);

  return { bdtToUsdt, usdtToBdt };
}
