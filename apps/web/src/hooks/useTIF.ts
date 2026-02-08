/**
 * React Hook for TIF (Time In Force) Orders
 * 
 * Provides:
 * - TIF order placement (FOK, IOC, GTC, GTD, AON)
 * - Partial fill tracking
 * - VWAP calculation
 * - GTD expiry management
 * - GTC re-entry
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  placeTIFOrder,
  getPartialFillState,
  getFillRecords,
  calculateVWAP,
  getOrderVWAP,
  reEnterGTCOrder,
  checkGTDExpiry,
  getOrdersByTIF,
  getGTDNearingExpiry,
} from '@/lib/tif/service';
import type {
  TIFType,
  Order,
  PartialFillState,
  FillRecord,
  VWAPResult,
  ReEntryResult,
} from '@/types';

// ============================================
// TYPES
// ============================================

interface TIFOrderState {
  isPlacing: boolean;
  isChecking: boolean;
  result?: {
    orderId: string;
    status: string;
    message: string;
    filled?: number;
    remaining?: number;
    avgPrice?: number;
  };
}

interface UseTIFOptions {
  onSuccess?: (result: TIFOrderState['result']) => void;
  onError?: (error: string) => void;
  onPartialFill?: (state: PartialFillState) => void;
  onExpiry?: (orderId: string) => void;
}

interface UseTIFReturn {
  // Order placement
  placeOrder: (
    marketId: string,
    side: 'buy' | 'sell',
    price: number,
    size: number,
    tif: TIFType,
    options?: {
      orderType?: 'limit' | 'market';
      gtdExpiry?: string;
    }
  ) => Promise<void>;
  
  // State
  orderState: TIFOrderState;
  resetOrderState: () => void;
  
  // Fill tracking
  partialFillState?: PartialFillState;
  fillRecords: FillRecord[];
  vwapResult: VWAPResult;
  refreshFillState: (orderId: string) => Promise<void>;
  
  // GTC Re-entry
  reEnterOrder: (orderId: string, newPrice: number) => Promise<ReEntryResult>;
  
  // GTD Management
  gtdOrdersNearingExpiry: Order[];
  refreshGTDOrders: () => Promise<void>;
  
  // Queries
  getOrders: (tif: TIFType) => Promise<Order[]>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useTIF(
  userId: string,
  options: UseTIFOptions = {}
): UseTIFReturn {
  const { onSuccess, onError, onPartialFill, onExpiry } = options;
  
  const [orderState, setOrderState] = useState<TIFOrderState>({
    isPlacing: false,
    isChecking: false,
  });
  
  const [partialFillState, setPartialFillState] = useState<PartialFillState | undefined>();
  const [fillRecords, setFillRecords] = useState<FillRecord[]>([]);
  const [vwapResult, setVwapResult] = useState<VWAPResult>({
    totalValue: 0,
    totalQuantity: 0,
    averagePrice: 0,
    fills: [],
  });
  const [gtdOrdersNearingExpiry, setGtdOrdersNearingExpiry] = useState<Order[]>([]);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const resetOrderState = useCallback(() => {
    setOrderState({
      isPlacing: false,
      isChecking: false,
    });
    setPartialFillState(undefined);
    setFillRecords([]);
    setVwapResult({
      totalValue: 0,
      totalQuantity: 0,
      averagePrice: 0,
      fills: [],
    });
    currentOrderIdRef.current = null;
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  /**
   * Place a TIF order
   */
  const placeOrder = useCallback(async (
    marketId: string,
    side: 'buy' | 'sell',
    price: number,
    size: number,
    tif: TIFType,
    options?: {
      orderType?: 'limit' | 'market';
      gtdExpiry?: string;
    }
  ) => {
    setOrderState({
      isPlacing: true,
      isChecking: false,
    });

    try {
      const result = await placeTIFOrder(
        marketId,
        userId,
        side,
        price,
        size,
        tif,
        options
      );

      setOrderState({
        isPlacing: false,
        isChecking: false,
        result,
      });

      if (result.status === 'cancelled' || result.status === 'CANCELLED') {
        onError?.(result.message);
      } else {
        onSuccess?.(result);
        
        // Start polling for fill updates if order is active
        if (result.orderId && ['open', 'OPEN', 'partial', 'PARTIAL'].includes(result.status)) {
          currentOrderIdRef.current = result.orderId;
          startPolling(result.orderId);
        }
      }
    } catch (error: any) {
      setOrderState({
        isPlacing: false,
        isChecking: false,
      });
      onError?.(error?.message || 'Order placement failed');
    }
  }, [userId, onSuccess, onError]);

  /**
   * Start polling for fill updates
   */
  const startPolling = useCallback((orderId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Initial fetch
    refreshFillState(orderId);

    // Poll every 2 seconds
    pollingRef.current = setInterval(() => {
      refreshFillState(orderId);
    }, 2000);
  }, []);

  /**
   * Refresh fill state for an order
   */
  const refreshFillState = useCallback(async (orderId: string) => {
    if (!orderId) return;

    setOrderState(prev => ({ ...prev, isChecking: true }));

    try {
      const [state, records, vwap] = await Promise.all([
        getPartialFillState(orderId),
        getFillRecords(orderId),
        getOrderVWAP(orderId),
      ]);

      if (state) {
        setPartialFillState(state);
        
        // Check for partial fill updates
        if (state.filledQuantity > 0 && state.filledQuantity < state.originalQuantity) {
          onPartialFill?.(state);
        }

        // Stop polling if order is terminal
        if (['filled', 'cancelled', 'expired', 'FILLED', 'CANCELLED', 'EXPIRED'].includes(state.status)) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }

      setFillRecords(records);
      setVwapResult(vwap);
    } catch (error) {
      console.error('Error refreshing fill state:', error);
    } finally {
      setOrderState(prev => ({ ...prev, isChecking: false }));
    }
  }, [onPartialFill]);

  /**
   * Re-enter a GTC order with a new price
   */
  const reEnterOrder = useCallback(async (
    orderId: string,
    newPrice: number
  ): Promise<ReEntryResult> => {
    const result = await reEnterGTCOrder(orderId, newPrice);
    
    if (result.newOrderId) {
      // Start polling the new order
      currentOrderIdRef.current = result.newOrderId;
      startPolling(result.newOrderId);
    }
    
    return result;
  }, [startPolling]);

  /**
   * Refresh GTD orders nearing expiry
   */
  const refreshGTDOrders = useCallback(async () => {
    const orders = await getGTDNearingExpiry(userId);
    setGtdOrdersNearingExpiry(orders);
    
    // Check if any have expired
    const expired = await checkGTDExpiry();
    if (expired.length > 0) {
      expired.forEach(({ orderId }) => onExpiry?.(orderId));
    }
  }, [userId, onExpiry]);

  /**
   * Get orders by TIF type
   */
  const getOrders = useCallback(async (tif: TIFType): Promise<Order[]> => {
    return getOrdersByTIF(userId, tif);
  }, [userId]);

  // Auto-refresh GTD orders periodically
  useEffect(() => {
    refreshGTDOrders();
    
    const interval = setInterval(() => {
      refreshGTDOrders();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [refreshGTDOrders]);

  return {
    placeOrder,
    orderState,
    resetOrderState,
    partialFillState,
    fillRecords,
    vwapResult,
    refreshFillState,
    reEnterOrder,
    gtdOrdersNearingExpiry,
    refreshGTDOrders,
    getOrders,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook for VWAP calculations
 */
export function useVWAP(orderId: string | null) {
  const [vwap, setVwap] = useState<VWAPResult>({
    totalValue: 0,
    totalQuantity: 0,
    averagePrice: 0,
    fills: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchVWAP = async () => {
      setIsLoading(true);
      const result = await getOrderVWAP(orderId);
      setVwap(result);
      setIsLoading(false);
    };

    fetchVWAP();
  }, [orderId]);

  return { vwap, isLoading, recalculate: () => orderId && getOrderVWAP(orderId).then(setVwap) };
}

/**
 * Hook for fill history
 */
export function useFillHistory(orderId: string | null) {
  const [fills, setFills] = useState<FillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    const records = await getFillRecords(orderId);
    setFills(records);
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { fills, isLoading, refresh };
}

/**
 * Hook for GTD expiry countdown
 */
export function useGTDCountdown(expiryTime: string | null) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryTime) return;

    const calculateRemaining = () => {
      const expiry = new Date(expiryTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);
      setIsExpired(remaining === 0);
      
      return remaining;
    };

    calculateRemaining();
    
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return {
    timeRemaining,
    isExpired,
    formattedTime: formatTime(timeRemaining),
  };
}
