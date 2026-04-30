'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchUSDTPrice,
  subscribeToUSDTPrice,
  getBinanceWebSocket,
  type BinancePriceResponse,
} from '@/lib/binance/price';

interface UseBinancePriceOptions {
  /**
   * Enable real-time WebSocket updates
   * @default true
   */
  realtime?: boolean;
  
  /**
   * Refresh interval for polling (in ms) when WebSocket is not available
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;
  
  /**
   * Auto-reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean;
  
  /**
   * Callback when price updates
   */
  onPriceUpdate?: (price: BinancePriceResponse) => void;
  
  /**
   * Callback when connection status changes
   */
  onConnectionChange?: (connected: boolean) => void;
}

interface UseBinancePriceReturn {
  /** Current price data */
  price: BinancePriceResponse | null;
  
  /** Current price value (convenience) */
  priceValue: number | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** WebSocket connected state */
  isConnected: boolean;
  
  /** Manually refresh price */
  refresh: () => Promise<void>;
  
  /** Start WebSocket connection */
  connect: () => void;
  
  /** Disconnect WebSocket */
  disconnect: () => void;
  
  /** Price change percentage (24h) */
  change24h: number | null;
  
  /** Last updated timestamp */
  lastUpdated: Date | null;
}

/**
 * Hook for fetching and subscribing to real-time Binance USDT price
 * 
 * @example
 * ```tsx
 * function PriceDisplay() {
 *   const { price, isConnected, change24h } = useBinancePrice({
 *     realtime: true,
 *     onPriceUpdate: (p) => console.log('Price update:', p.price)
 *   });
 *   
 *   return (
 *     <div>
 *       <span>USDT: ৳{price?.price}</span>
 *       <span className={change24h && change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
 *         {change24h?.toFixed(2)}%
 *       </span>
 *       {!isConnected && <span className="text-yellow-500">Reconnecting...</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBinancePrice(options: UseBinancePriceOptions = {}): UseBinancePriceReturn {
  const {
    realtime = true,
    refreshInterval = 30000,
    autoReconnect = true,
    onPriceUpdate,
    onConnectionChange,
  } = options;

  const [price, setPrice] = useState<BinancePriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectionUnsubscribeRef = useRef<(() => void) | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch price via REST API
   */
  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const priceData = await fetchUSDTPrice();
      setPrice(priceData);
      setLastUpdated(new Date(priceData.timestamp));
      onPriceUpdate?.(priceData);
    } catch (err) {
      console.error('Price fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  }, [onPriceUpdate]);

  /**
   * Start WebSocket connection
   */
  const connect = useCallback(() => {
    if (!realtime) return;

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const manager = getBinanceWebSocket();

    // Subscribe to price updates
    unsubscribeRef.current = subscribeToUSDTPrice((newPrice) => {
      setPrice(newPrice);
      setLastUpdated(new Date(newPrice.timestamp));
      setLoading(false);
      setError(null);
      onPriceUpdate?.(newPrice);
    });

    // Subscribe to connection status
    connectionUnsubscribeRef.current = manager.onConnectionChange((connected) => {
      setIsConnected(connected);
      onConnectionChange?.(connected);
      
      // If disconnected and auto-reconnect is enabled, start polling
      if (!connected && autoReconnect) {
        startPolling();
      } else {
        stopPolling();
      }
    });

    // Start connection if not already connected
    if (!manager.isConnected()) {
      manager.connect(['usdtusdt']);
    }
  }, [realtime, autoReconnect, onPriceUpdate, onConnectionChange]);

  /**
   * Disconnect WebSocket
   */
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (connectionUnsubscribeRef.current) {
      connectionUnsubscribeRef.current();
      connectionUnsubscribeRef.current = null;
    }
    stopPolling();
    setIsConnected(false);
  }, []);

  /**
   * Start polling for price updates
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(fetchPrice, refreshInterval);
  }, [fetchPrice, refreshInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchPrice();
  }, [fetchPrice]);

  // Initialize
  useEffect(() => {
    // Initial fetch
    fetchPrice();

    // Start WebSocket if realtime is enabled
    if (realtime) {
      connect();
    } else {
      // Start polling if not using realtime
      startPolling();
    }

    // Cleanup
    return () => {
      disconnect();
    };
  }, [realtime, fetchPrice, connect, disconnect, startPolling]);

  return {
    price,
    priceValue: price?.price ?? null,
    loading,
    error,
    isConnected,
    refresh,
    connect,
    disconnect,
    change24h: price?.change24h ?? null,
    lastUpdated,
  };
}

/**
 * Simplified hook for just getting the current USDT price
 */
export function useUSDTPrice() {
  const { priceValue, loading, error, refresh } = useBinancePrice({
    realtime: true,
  });

  return {
    price: priceValue,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook for USDT/BDT conversion with real-time rate
 */
export function useUSDTConversion() {
  const { price, loading, error, isConnected } = useBinancePrice({
    realtime: true,
  });

  const rate = price?.price ?? 100; // Default fallback rate

  const bdtToUsdt = useCallback((bdt: number): number => {
    return Math.round((bdt / rate) * 100) / 100;
  }, [rate]);

  const usdtToBdt = useCallback((usdt: number): number => {
    return Math.round((usdt * rate) * 100) / 100;
  }, [rate]);

  const formatBDT = useCallback((amount: number): string => {
    return `৳${amount.toFixed(2)}`;
  }, []);

  const formatUSDT = useCallback((amount: number): string => {
    return `$${amount.toFixed(2)} USDT`;
  }, []);

  return {
    rate,
    loading,
    error,
    isConnected,
    bdtToUsdt,
    usdtToBdt,
    formatBDT,
    formatUSDT,
  };
}