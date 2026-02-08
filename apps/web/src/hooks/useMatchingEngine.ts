/**
 * React Hook for Advanced Matching Engine
 * 
 * Provides:
 * - Real-time order book depth
 * - Fill notifications via WebSocket
 * - Matching performance metrics
 * - Price-time priority visualization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOrderBookDepth,
  subscribeToFillNotifications,
  getMatchingPerformance,
  fifoEnqueue,
  matchOrderFIFO,
  notifyFill,
  calculateProRataFills,
  OrderQueue,
  getNanoTimestamp,
  MATCHING_CONFIG,
} from '@/lib/matching/engine';
import type {
  OrderBookDepth,
  FillNotification,
  MatchResult,
  ProRataFill,
  EnqueueResult,
} from '@/types';

// ============================================
// TYPES
// ============================================

interface OrderBookState {
  bids: OrderBookDepth[];
  asks: OrderBookDepth[];
  spread: number;
  bestBid: number;
  bestAsk: number;
  lastUpdate: number;
}

interface MatchingMetrics {
  p50Latency: number;
  p99Latency: number;
  throughput: number;
  operationCount: number;
}

interface UseMatchingEngineReturn {
  // Order book
  orderBook: OrderBookState;
  refreshOrderBook: () => Promise<void>;
  isLoading: boolean;
  
  // Fill notifications
  recentFills: FillNotification[];
  unreadFillCount: number;
  markFillsAsRead: () => void;
  
  // Performance
  metrics: MatchingMetrics;
  refreshMetrics: () => Promise<void>;
  
  // Operations
  enqueue: (
    marketId: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ) => Promise<EnqueueResult | null>;
  
  match: (
    marketId: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ) => Promise<MatchResult[]>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMatchingEngine(
  marketId: string,
  userId: string
): UseMatchingEngineReturn {
  const [orderBook, setOrderBook] = useState<OrderBookState>({
    bids: [],
    asks: [],
    spread: 0,
    bestBid: 0,
    bestAsk: 0,
    lastUpdate: 0,
  });
  
  const [recentFills, setRecentFills] = useState<FillNotification[]>([]);
  const [unreadFillCount, setUnreadFillCount] = useState(0);
  const [metrics, setMetrics] = useState<MatchingMetrics>({
    p50Latency: 0,
    p99Latency: 0,
    throughput: 0,
    operationCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const fillsRef = useRef<FillNotification[]>([]);

  // ==========================================
  // ORDER BOOK
  // ==========================================

  const refreshOrderBook = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const depth = await getOrderBookDepth(marketId);
      
      const bids = depth
        .filter(d => d.side === 'BUY')
        .sort((a, b) => b.price - a.price);
      
      const asks = depth
        .filter(d => d.side === 'SELL')
        .sort((a, b) => a.price - b.price);
      
      const bestBid = bids[0]?.price || 0;
      const bestAsk = asks[0]?.price || 0;
      
      setOrderBook({
        bids,
        asks,
        spread: bestAsk - bestBid,
        bestBid,
        bestAsk,
        lastUpdate: Date.now(),
      });
    } catch (error) {
      console.error('Error refreshing order book:', error);
    } finally {
      setIsLoading(false);
    }
  }, [marketId]);

  // ==========================================
  // FILL NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    // Subscribe to fill notifications
    subscriptionRef.current = subscribeToFillNotifications(userId, (notification) => {
      fillsRef.current = [notification, ...fillsRef.current].slice(0, 50);
      setRecentFills(fillsRef.current);
      setUnreadFillCount(prev => prev + 1);
    });

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, [userId]);

  const markFillsAsRead = useCallback(() => {
    setUnreadFillCount(0);
  }, []);

  // ==========================================
  // METRICS
  // ==========================================

  const refreshMetrics = useCallback(async () => {
    try {
      const performance = await getMatchingPerformance();
      
      if (performance.length > 0) {
        const latest = performance[0];
        setMetrics({
          p50Latency: latest.p50_latency_us,
          p99Latency: latest.p99_latency_us,
          throughput: latest.operation_count / 60, // per second
          operationCount: latest.operation_count,
        });
      }
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  }, []);

  // ==========================================
  // OPERATIONS
  // ==========================================

  const enqueue = useCallback(async (
    marketId: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ): Promise<EnqueueResult | null> => {
    // Note: In production, orderId and accountId would come from auth
    const orderId = `order-${getNanoTimestamp()}`;
    const accountId = userId;
    
    return fifoEnqueue(marketId, side, price, orderId, accountId, size);
  }, [userId]);

  const match = useCallback(async (
    marketId: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ): Promise<MatchResult[]> => {
    return matchOrderFIFO(marketId, side, price, size);
  }, []);

  // ==========================================
  // AUTO-REFRESH
  // ==========================================

  useEffect(() => {
    refreshOrderBook();
    refreshMetrics();

    const interval = setInterval(() => {
      refreshOrderBook();
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, [refreshOrderBook, refreshMetrics]);

  return {
    orderBook,
    refreshOrderBook,
    isLoading,
    recentFills,
    unreadFillCount,
    markFillsAsRead,
    metrics,
    refreshMetrics,
    enqueue,
    match,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook for pro-rata matching calculations
 */
export function useProRataMatching() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ProRataFill[]>([]);

  const calculate = useCallback(async (
    incomingSize: number,
    priceLevelId: string
  ) => {
    setIsCalculating(true);
    
    try {
      const fills = await calculateProRataFills(incomingSize, priceLevelId);
      setResult(fills);
      return fills;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return { calculate, isCalculating, result };
}

/**
 * Hook for order queue visualization
 */
export function useOrderQueue() {
  const queueRef = useRef(new OrderQueue());
  const [nodes, setNodes] = useState<Array<{ id: string; size: number; price: number }>>([]);

  const addNode = useCallback((id: string, size: number, price: number) => {
    // This is a simplified visualization - in production would use actual OrderNodes
    setNodes(prev => [...prev, { id, size, price }]);
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    nodes,
    addNode,
    removeNode,
    totalVolume: nodes.reduce((sum, n) => sum + n.size, 0),
    count: nodes.length,
  };
}

/**
 * Hook for latency monitoring
 */
export function useLatencyMonitor() {
  const [latencies, setLatencies] = useState<number[]>([]);
  const [stats, setStats] = useState({
    p50: 0,
    p99: 0,
    avg: 0,
    min: 0,
    max: 0,
  });

  const record = useCallback((latencyUs: number) => {
    setLatencies(prev => {
      const newLatencies = [...prev, latencyUs].slice(-100); // Keep last 100
      
      // Calculate stats
      const sorted = [...newLatencies].sort((a, b) => a - b);
      const p50Index = Math.floor(sorted.length * 0.5);
      const p99Index = Math.floor(sorted.length * 0.99);
      
      setStats({
        p50: sorted[p50Index] || 0,
        p99: sorted[p99Index] || 0,
        avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
        min: sorted[0] || 0,
        max: sorted[sorted.length - 1] || 0,
      });
      
      return newLatencies;
    });
  }, []);

  return { latencies, stats, record };
}
