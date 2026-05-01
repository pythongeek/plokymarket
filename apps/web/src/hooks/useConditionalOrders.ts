/**
 * React Hook for Conditional Orders
 * 
 * Provides:
 * - Stop-loss order management
 * - Take-profit order management
 * - OCO (One-Cancels-Other) orders
 * - Trailing stop orders
 * - Real-time order status updates
 */

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    validateConditionalOrder,
    createConditionalOrder,
    createOCOOrder,
    getUserConditionalOrders,
    cancelConditionalOrder,
    cancelOCOGroup,
    subscribeToConditionalOrderUpdates,
    subscribeToMarketConditionalOrders,
    calculateTrailingStopPrice,
    type ConditionalOrder,
    type CreateConditionalOrderParams,
    type ValidationResult,
    type StopLossRiskMetrics,
    type StopLossRecommendations,
    type StopLossConfig,
} from '@/lib/services/conditionalOrders';
import type { Outcome, OrderSide } from '@/types';

export interface UseConditionalOrdersOptions {
    marketId?: string;
    userId: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface UseConditionalOrdersReturn {
    // Orders
    orders: ConditionalOrder[];
    pendingOrders: ConditionalOrder[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    createStopLoss: (params: CreateConditionalOrderParams) => Promise<{ success: boolean; orderId?: string; error?: string }>;
    createStopLimit: (params: CreateConditionalOrderParams) => Promise<{ success: boolean; orderId?: string; error?: string }>;
    createTakeProfit: (params: CreateConditionalOrderParams) => Promise<{ success: boolean; orderId?: string; error?: string }>;
    createTrailingStop: (params: CreateConditionalOrderParams) => Promise<{ success: boolean; orderId?: string; error?: string }>;
    createOCO: (
        params: Omit<CreateConditionalOrderParams, 'conditionType' | 'ocoGroupId'>,
        limitPrice: number,
        stopPrice: number
    ) => Promise<{ success: boolean; groupId?: string; orderIds?: string[]; error?: string }>;
    cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
    cancelOCOGroup: (ocoGroupId: string) => Promise<{ success: boolean; error?: string }>;
    
    // Validation
    validateOrder: (params: CreateConditionalOrderParams, currentPrice: number) => ValidationResult;
    
    // Helpers
    calculateRisk: (config: StopLossConfig, stopPrice: number) => StopLossRiskMetrics;
    calculateStopLossRecommendations: (config: StopLossConfig) => StopLossRecommendations;
    refreshOrders: () => Promise<void>;
}

export function useConditionalOrders(options: UseConditionalOrdersOptions): UseConditionalOrdersReturn {
    const { marketId, userId, autoRefresh = false, refreshInterval = 30000 } = options;
    
    const [orders, setOrders] = useState<ConditionalOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const supabase = createClient();
    
    // Fetch orders
    const refreshOrders = useCallback(async () => {
        if (!userId) return;
        
        try {
            const data = await getUserConditionalOrders(userId, marketId);
            setOrders(data);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch orders';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, marketId]);
    
    // Initial fetch and auto-refresh
    useEffect(() => {
        refreshOrders();
        
        if (autoRefresh && userId) {
            const interval = setInterval(refreshOrders, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [refreshOrders, autoRefresh, refreshInterval, userId]);
    
    // Subscribe to updates if marketId is provided
    useEffect(() => {
        if (!marketId || !userId) return;
        
        const unsubscribe = subscribeToMarketConditionalOrders(
            marketId,
            (order, eventType) => {
                if (eventType === 'INSERT') {
                    setOrders(prev => [order, ...prev]);
                } else if (eventType === 'UPDATE') {
                    setOrders(prev => prev.map(o => o.id === order.id ? order : o));
                } else if (eventType === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id !== order.id));
                }
            }
        );
        
        return unsubscribe;
    }, [marketId, userId]);
    
    // Create stop-loss order
    const createStopLoss = useCallback(async (params: CreateConditionalOrderParams) => {
        return createConditionalOrder({
            ...params,
            conditionType: 'stop_loss',
        });
    }, []);
    
    // Create stop-limit order
    const createStopLimit = useCallback(async (params: CreateConditionalOrderParams) => {
        return createConditionalOrder({
            ...params,
            conditionType: 'stop_limit',
        });
    }, []);
    
    // Create take-profit order
    const createTakeProfit = useCallback(async (params: CreateConditionalOrderParams) => {
        return createConditionalOrder({
            ...params,
            conditionType: 'take_profit',
        });
    }, []);
    
    // Create trailing-stop order
    const createTrailingStop = useCallback(async (params: CreateConditionalOrderParams) => {
        if (!params.trailAmount || !params.trailType) {
            return { success: false, error: 'Trail amount and type are required for trailing stop' };
        }
        return createConditionalOrder({
            ...params,
            conditionType: 'trailing_stop',
        });
    }, []);
    
    // Create OCO order
    const createOCO = useCallback(async (
        params: Omit<CreateConditionalOrderParams, 'conditionType' | 'ocoGroupId'>,
        limitPrice: number,
        stopPrice: number
    ) => {
        return createOCOOrder(params, limitPrice, stopPrice);
    }, []);
    
    // Cancel order
    const cancelOrder = useCallback(async (orderId: string) => {
        const result = await cancelConditionalOrder(orderId, userId);
        if (result.success) {
            await refreshOrders();
        }
        return result;
    }, [userId, refreshOrders]);
    
    // Cancel OCO group
    const cancelOCOGroupFn = useCallback(async (ocoGroupId: string) => {
        const result = await cancelOCOGroup(ocoGroupId, userId);
        if (result.success) {
            await refreshOrders();
        }
        return result;
    }, [userId, refreshOrders]);
    
    // Validate order
    const validateOrder = useCallback((params: CreateConditionalOrderParams, currentPrice: number) => {
        return validateConditionalOrder(params, currentPrice);
    }, []);
    
    // Calculate risk metrics
    const calculateRisk = useCallback((config: StopLossConfig, stopPrice: number): StopLossRiskMetrics => {
        const { currentPrice, avgEntryPrice, positionQuantity, side } = config;
        
        let riskAmount: number;
        let riskPercentage: number;
        
        if (side === 'buy') {
            riskAmount = avgEntryPrice - stopPrice;
            riskPercentage = (riskAmount / avgEntryPrice) * 100;
        } else {
            riskAmount = stopPrice - avgEntryPrice;
            riskPercentage = (riskAmount / avgEntryPrice) * 100;
        }
        
        const potentialLoss = riskAmount * positionQuantity;
        const potentialProfit = (currentPrice - avgEntryPrice) * positionQuantity;
        
        return {
            riskAmount,
            riskPercentage,
            potentialLoss,
            potentialProfit,
        };
    }, []);
    
    // Calculate stop-loss recommendations
    const calculateStopLossRecommendations = useCallback((config: StopLossConfig): StopLossRecommendations => {
        const { currentPrice, avgEntryPrice, side } = config;
        
        if (side === 'buy') {
            // For long position: stop below entry
            return {
                recommended: avgEntryPrice * 0.95,
                aggressive: avgEntryPrice * 0.90,
                conservative: avgEntryPrice * 0.85,
            };
        } else {
            // For short position: stop above entry
            return {
                recommended: avgEntryPrice * 1.05,
                aggressive: avgEntryPrice * 1.10,
                conservative: avgEntryPrice * 1.15,
            };
        }
    }, []);
    
    // Filter pending orders
    const pendingOrders = orders.filter(o => o.status === 'pending');
    
    return {
        orders,
        pendingOrders,
        isLoading,
        error,
        createStopLoss,
        createStopLimit,
        createTakeProfit,
        createTrailingStop,
        createOCO,
        cancelOrder,
        cancelOCOGroup: cancelOCOGroupFn,
        validateOrder,
        calculateRisk,
        calculateStopLossRecommendations,
        refreshOrders,
    };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for managing a single conditional order with real-time updates
 */
export function useSingleConditionalOrder(orderId: string | null, userId: string) {
    const [order, setOrder] = useState<ConditionalOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!orderId) {
            setOrder(null);
            setIsLoading(false);
            return;
        }
        
        const supabase = createClient();
        
        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from('conditional_orders')
                    .select('*')
                    .eq('id', orderId)
                    .eq('user_id', userId)
                    .single();
                
                if (error) throw error;
                setOrder(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch order');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchOrder();
        
        // Subscribe to updates
        if (orderId) {
            const unsubscribe = subscribeToConditionalOrderUpdates(orderId, (updatedOrder) => {
                setOrder(updatedOrder);
            });
            
            return () => {
                unsubscribe();
            };
        }
    }, [orderId, userId]);
    
    const cancel = useCallback(async () => {
        if (!orderId) return { success: false, error: 'No order ID' };
        return cancelConditionalOrder(orderId, userId);
    }, [orderId, userId]);
    
    return { order, isLoading, error, cancelOrder: cancel };
}

/**
 * Hook for market's conditional orders (for display in market page)
 */
export function useMarketConditionalOrders(marketId: string) {
    const [orders, setOrders] = useState<ConditionalOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!marketId) return;
        
        const supabase = createClient();
        
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('conditional_orders')
                    .select('*')
                    .eq('market_id', marketId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true });
                
                if (error) throw error;
                setOrders(data || []);
            } catch (err) {
                console.error('Error fetching market conditional orders:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchOrders();
        
        // Subscribe to updates
        const unsubscribe = subscribeToMarketConditionalOrders(
            marketId,
            (order, eventType) => {
                if (eventType === 'INSERT') {
                    if (order.status === 'pending') {
                        setOrders(prev => [...prev, order]);
                    }
                } else if (eventType === 'UPDATE') {
                    if (order.status === 'pending') {
                        setOrders(prev => prev.map(o => o.id === order.id ? order : o));
                    } else {
                        setOrders(prev => prev.filter(o => o.id !== order.id));
                    }
                } else if (eventType === 'DELETE') {
                    setOrders(prev => prev.filter(o => o.id !== order.id));
                }
            }
        );
        
        return () => {
            unsubscribe();
        };
    }, [marketId]);
    
    return { orders, isLoading };
}
