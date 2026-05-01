/**
 * Conditional Orders Service
 * 
 * Handles stop-loss, take-profit, OCO, and trailing stop orders
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type ConditionalOrder = Database['public']['Tables']['conditional_orders']['Row'];
type ConditionalOrderInsert = Database['public']['Tables']['conditional_orders']['Insert'];
type ConditionalOrderUpdate = Database['public']['Tables']['conditional_orders']['Update'];

export type ConditionalOrderType = 'stop_loss' | 'stop_limit' | 'oco' | 'trailing_stop' | 'take_profit';
export type ConditionalOrderStatus = 'pending' | 'triggered' | 'executed' | 'cancelled' | 'expired';

export interface CreateConditionalOrderParams {
    userId: string;
    marketId: string;
    conditionType: ConditionalOrderType;
    side: 'buy' | 'sell';
    outcome: 'YES' | 'NO';
    triggerPrice: number;
    limitPrice?: number;
    quantity: number;
    trailAmount?: number;
    trailType?: 'percentage' | 'absolute';
    parentOrderId?: string;
    ocoGroupId?: string;
    expiresAt?: string;
}

export interface ConditionalOrderResult {
    success: boolean;
    orderId?: string;
    error?: string;
}

export interface ExecutionResult {
    success: boolean;
    conditionalOrderId?: string;
    executedOrderId?: string;
    executionPrice?: number;
    error?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validate a conditional order before creation
 */
export function validateConditionalOrder(params: CreateConditionalOrderParams, currentPrice: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate quantity
    if (!params.quantity || params.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
    }

    // Validate trigger price
    if (!params.triggerPrice || params.triggerPrice <= 0 || params.triggerPrice >= 1) {
        errors.push('Trigger price must be between 0 and 1');
    }

    // Validate based on order type and side
    if (params.conditionType === 'stop_loss' || params.conditionType === 'stop_limit') {
        if (params.side === 'sell') {
            // For sell stop-loss, trigger should be below current price
            if (params.triggerPrice >= currentPrice) {
                errors.push(`Sell stop-loss trigger price must be below current price (${currentPrice})`);
            }
            // Warn if too close
            if (params.triggerPrice > currentPrice * 0.98) {
                warnings.push('Trigger price is very close to current price - may trigger immediately');
            }
        } else {
            // For buy stop-loss, trigger should be above current price
            if (params.triggerPrice <= currentPrice) {
                errors.push(`Buy stop-loss trigger price must be above current price (${currentPrice})`);
            }
            if (params.triggerPrice < currentPrice * 1.02) {
                warnings.push('Trigger price is very close to current price - may trigger immediately');
            }
        }
    }

    if (params.conditionType === 'take_profit') {
        if (params.side === 'sell') {
            // For sell take-profit, trigger should be above current price
            if (params.triggerPrice <= currentPrice) {
                errors.push(`Sell take-profit trigger price must be above current price (${currentPrice})`);
            }
        } else {
            // For buy take-profit, trigger should be below current price
            if (params.triggerPrice >= currentPrice) {
                errors.push(`Buy take-profit trigger price must be below current price (${currentPrice})`);
            }
        }
    }

    // For stop-limit, validate limit price
    if (params.conditionType === 'stop_limit') {
        if (!params.limitPrice || params.limitPrice <= 0 || params.limitPrice >= 1) {
            errors.push('Limit price must be between 0 and 1 for stop-limit orders');
        }
        if (params.side === 'sell' && params.limitPrice < params.triggerPrice) {
            errors.push('For sell stop-limit, limit price should be >= trigger price');
        }
        if (params.side === 'buy' && params.limitPrice > params.triggerPrice) {
            errors.push('For buy stop-limit, limit price should be <= trigger price');
        }
    }

    // For trailing stop, validate trail amount
    if (params.conditionType === 'trailing_stop') {
        if (!params.trailAmount || params.trailAmount <= 0) {
            errors.push('Trail amount is required for trailing stop orders');
        }
        if (params.trailType === 'percentage' && (params.trailAmount < 0.1 || params.trailAmount > 50)) {
            errors.push('Trail percentage must be between 0.1% and 50%');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Create a new conditional order
 */
export async function createConditionalOrder(params: CreateConditionalOrderParams): Promise<ConditionalOrderResult> {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== params.userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const insertData: ConditionalOrderInsert = {
            user_id: params.userId,
            market_id: params.marketId,
            condition_type: params.conditionType,
            side: params.side,
            outcome: params.outcome,
            trigger_price: params.triggerPrice,
            limit_price: params.limitPrice,
            quantity: params.quantity,
            trail_amount: params.trailAmount,
            trail_type: params.trailType,
            parent_order_id: params.parentOrderId,
            oco_group_id: params.ocoGroupId,
            expires_at: params.expiresAt,
            status: 'pending',
        };

        const { data, error } = await supabase
            .from('conditional_orders')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, orderId: data.id };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

/**
 * Create an OCO (One-Cancels-Other) pair
 */
export async function createOCOOrder(
    params: Omit<CreateConditionalOrderParams, 'conditionType' | 'ocoGroupId'>,
    limitPrice: number,
    stopPrice: number
): Promise<{ success: boolean; groupId?: string; orderIds?: string[]; error?: string }> {
    const supabase = createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        const ocoGroupId = crypto.randomUUID();

        // Create limit order (the "take profit" side)
        const limitResult = await createConditionalOrder({
            ...params,
            userId: user.id,
            conditionType: 'oco',
            triggerPrice: limitPrice,
            ocoGroupId,
        });

        if (!limitResult.success) {
            return { success: false, error: `Limit order failed: ${limitResult.error}` };
        }

        // Create stop order (the "stop loss" side)
        const stopResult = await createConditionalOrder({
            ...params,
            userId: user.id,
            conditionType: 'stop_loss',
            triggerPrice: stopPrice,
            ocoGroupId,
        });

        if (!stopResult.success) {
            // Rollback limit order
            await supabase
                .from('conditional_orders')
                .update({ status: 'cancelled', cancel_reason: 'OCO setup failed' })
                .eq('id', limitResult.orderId);
            
            return { success: false, error: `Stop order failed: ${stopResult.error}` };
        }

        return {
            success: true,
            groupId: ocoGroupId,
            orderIds: [limitResult.orderId!, stopResult.orderId!],
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

/**
 * Get conditional orders for a user
 */
export async function getUserConditionalOrders(userId: string, marketId?: string): Promise<ConditionalOrder[]> {
    const supabase = createClient();

    let query = supabase
        .from('conditional_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (marketId) {
        query = query.eq('market_id', marketId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching conditional orders:', error);
        return [];
    }

    return data || [];
}

/**
 * Get pending conditional orders for a market (for execution)
 */
export async function getPendingConditionalOrders(marketId: string): Promise<ConditionalOrder[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('conditional_orders')
        .select('*')
        .eq('market_id', marketId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending conditional orders:', error);
        return [];
    }

    return data || [];
}

/**
 * Cancel a conditional order
 */
export async function cancelConditionalOrder(orderId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('conditional_orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancel_reason: 'User requested cancellation',
            })
            .eq('id', orderId)
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

/**
 * Cancel all conditional orders in an OCO group
 */
export async function cancelOCOGroup(ocoGroupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();

    try {
        const { error } = await supabase
            .from('conditional_orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancel_reason: 'OCO group cancelled',
            })
            .eq('oco_group_id', ocoGroupId)
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

/**
 * Execute a conditional order (called by backend)
 */
export async function executeConditionalOrder(conditionalOrderId: string): Promise<ExecutionResult> {
    const supabase = createClient();

    try {
        // Call the database function
        const { data, error } = await supabase.rpc('execute_conditional_order', {
            p_conditional_order_id: conditionalOrderId,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: data?.success || false,
            conditionalOrderId: data?.conditional_order_id,
            executedOrderId: data?.executed_order_id,
            executionPrice: data?.execution_price,
            error: data?.error,
        };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: errorMessage };
    }
}

/**
 * Check and execute triggered conditional orders for a market
 */
export async function checkAndExecuteConditionalOrders(
    marketId: string,
    currentPrice: number
): Promise<{ triggeredCount: number; results: ExecutionResult[] }> {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.rpc('check_conditional_orders', {
            p_market_id: marketId,
            p_current_price: currentPrice,
        });

        if (error) {
            console.error('Error checking conditional orders:', error);
            return { triggeredCount: 0, results: [] };
        }

        return {
            triggeredCount: data?.triggered_count || 0,
            results: [],
        };
    } catch (err) {
        console.error('Error in checkAndExecuteConditionalOrders:', err);
        return { triggeredCount: 0, results: [] };
    }
}

/**
 * Update trailing stop highest/lowest price
 */
export async function updateTrailingStopPrice(
    orderId: string,
    highestPrice: number,
    lowestPrice: number
): Promise<void> {
    const supabase = createClient();

    await supabase
        .from('conditional_orders')
        .update({
            highest_price: highestPrice,
            lowest_price: lowestPrice,
        })
        .eq('id', orderId)
        .eq('condition_type', 'trailing_stop');
}

/**
 * Calculate current trailing stop trigger price
 */
export function calculateTrailingStopPrice(
    currentPrice: number,
    highestPrice: number,
    trailAmount: number,
    trailType: 'percentage' | 'absolute',
    side: 'buy' | 'sell'
): number {
    if (side === 'sell') {
        // For sell trailing stop, trail is below highest price
        if (trailType === 'percentage') {
            return highestPrice * (1 - trailAmount / 100);
        }
        return highestPrice - trailAmount;
    } else {
        // For buy trailing stop, trail is above lowest price
        if (trailType === 'percentage') {
            return lowestPrice * (1 + trailAmount / 100);
        }
        return lowestPrice + trailAmount;
    }
}

/**
 * Subscribe to conditional order updates
 */
export function subscribeToConditionalOrderUpdates(
    orderId: string,
    callback: (order: ConditionalOrder) => void
): () => void {
    const supabase = createClient();

    const subscription = supabase
        .from(`conditional_orders:id=eq.${orderId}`)
        .on('UPDATE', (payload) => {
            callback(payload.new as ConditionalOrder);
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

/**
 * Subscribe to conditional orders for a market
 */
export function subscribeToMarketConditionalOrders(
    marketId: string,
    callback: (order: ConditionalOrder, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
    const supabase = createClient();

    const subscription = supabase
        .from(`conditional_orders:market_id=eq.${marketId}`)
        .on('INSERT', (payload) => {
            callback(payload.new as ConditionalOrder, 'INSERT');
        })
        .on('UPDATE', (payload) => {
            callback(payload.new as ConditionalOrder, 'UPDATE');
        })
        .on('DELETE', (payload) => {
            callback(payload.old as ConditionalOrder, 'DELETE');
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
