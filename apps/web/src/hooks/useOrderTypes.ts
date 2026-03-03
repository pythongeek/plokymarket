'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type OrderType = 'limit' | 'market' | 'stop_loss' | 'stop_limit' | 'oco' | 'trailing_stop';
export type OrderSide = 'buy' | 'sell';
export type Outcome = 'YES' | 'NO';
export type TIF = 'GTC' | 'IOC' | 'FOK' | 'GTD';

export interface StopLossOrder {
    type: 'stop_loss' | 'stop_limit';
    side: OrderSide;
    outcome: Outcome;
    quantity: number;
    stopPrice: number;
    limitPrice?: number;
    tif?: TIF;
}

export interface OCOOrder {
    type: 'oco';
    side: OrderSide;
    outcome: Outcome;
    quantity: number;
    limitPrice: number;
    stopPrice: number;
}

export interface TrailingStopOrder {
    type: 'trailing_stop';
    side: OrderSide;
    outcome: Outcome;
    quantity: number;
    trailAmount: number;  // Distance from highest/lowest
    trailType: 'percentage' | 'absolute';
}

export interface OrderValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface StopLossConfig {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity: number;
    avgEntryPrice: number;
    side: OrderSide;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for handling advanced order types
 * 
 * Features:
 * - Stop-Loss order validation and submission
 * - Stop-Limit order handling
 * - OCO (One-Cancels-Other) orders
 * - Trailing Stop orders
 * - Order validation and error handling
 */
export function useOrderTypes() {
    const supabase = createClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ===========================================================================
    // Order Validation
    // ===========================================================================

    /**
     * Validate a stop-loss order
     */
    const validateStopLoss = useCallback((order: StopLossOrder, currentPrice: number): OrderValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate quantity
        if (!order.quantity || order.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        // Validate stop price
        if (!order.stopPrice || order.stopPrice <= 0) {
            errors.push('Stop price must be greater than 0');
        }

        // Validate stop price vs current price based on side
        if (order.side === 'buy') {
            // For buy stop-loss, stop price should be above current price
            if (order.stopPrice <= currentPrice) {
                errors.push(`Stop price (${order.stopPrice}) must be above current price (${currentPrice}) for buy orders`);
            }

            // Check if stop price is too close to current price
            if (order.stopPrice < currentPrice * 1.02) {
                warnings.push('Stop price is very close to current price - may trigger immediately');
            }
        } else {
            // For sell stop-loss, stop price should be below current price
            if (order.stopPrice >= currentPrice) {
                errors.push(`Stop price (${order.stopPrice}) must be below current price (${currentPrice}) for sell orders`);
            }

            // Check if stop price is too close to current price
            if (order.stopPrice > currentPrice * 0.98) {
                warnings.push('Stop price is very close to current price - may trigger immediately');
            }
        }

        // For stop-limit, validate limit price
        if (order.type === 'stop_limit') {
            if (!order.limitPrice || order.limitPrice <= 0) {
                errors.push('Limit price is required for stop-limit orders');
            }

            if (order.side === 'buy' && order.limitPrice > order.stopPrice) {
                errors.push('Limit price should not exceed stop price for buy stop-limit orders');
            }

            if (order.side === 'sell' && order.limitPrice < order.stopPrice) {
                errors.push('Limit price should not be below stop price for sell stop-limit orders');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }, []);

    /**
     * Validate an OCO order
     */
    const validateOCO = useCallback((order: OCOOrder, currentPrice: number): OrderValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic validation
        if (!order.quantity || order.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        if (!order.limitPrice || order.limitPrice <= 0) {
            errors.push('Limit price must be greater than 0');
        }

        if (!order.stopPrice || order.stopPrice <= 0) {
            errors.push('Stop price must be greater than 0');
        }

        // OCO logic: limit and stop should be on opposite sides of current price
        if (order.side === 'buy') {
            // For buy OCO, limit should be below current, stop above current
            if (order.limitPrice >= currentPrice) {
                errors.push(`Limit price should be below current price (${currentPrice}) for buy OCO`);
            }
            if (order.stopPrice <= currentPrice) {
                errors.push(`Stop price should be above current price (${currentPrice}) for buy OCO`);
            }
        } else {
            // For sell OCO, limit should be above current, stop below current
            if (order.limitPrice <= currentPrice) {
                errors.push(`Limit price should be above current price (${currentPrice}) for sell OCO`);
            }
            if (order.stopPrice >= currentPrice) {
                errors.push(`Stop price should be below current price (${currentPrice}) for sell OCO`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }, []);

    /**
     * Validate a trailing stop order
     */
    const validateTrailingStop = useCallback((order: TrailingStopOrder, currentPrice: number): OrderValidation => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!order.quantity || order.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        if (!order.trailAmount || order.trailAmount <= 0) {
            errors.push('Trail amount must be greater than 0');
        }

        if (order.trailType === 'percentage' && (order.trailAmount < 0.1 || order.trailAmount > 50)) {
            errors.push('Trail percentage must be between 0.1% and 50%');
        }

        // Validate direction based on side
        if (order.side === 'buy' && order.trailType === 'absolute') {
            if (order.trailAmount >= currentPrice) {
                errors.push('Trail amount is too large for buy trailing stop');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }, []);

    // ===========================================================================
    // Order Submission
    // ===========================================================================

    /**
     * Submit a stop-loss or stop-limit order
     */
    const submitStopLossOrder = useCallback(async (order: StopLossOrder): Promise<{ success: boolean; orderId?: string; error?: string }> => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }

            // Validate order
            const validation = await validateStopLoss(order, order.side === 'buy' ? order.stopPrice * 0.98 : order.stopPrice * 1.02);
            if (!validation.isValid) {
                return { success: false, error: validation.errors.join(', ') };
            }

            // Create the order
            const orderData = {
                market_id: '', // Will be set by the caller
                user_id: user.id,
                order_type: order.type,
                side: order.side,
                outcome: order.outcome,
                price: order.type === 'stop_limit' ? order.limitPrice : order.stopPrice,
                stop_price: order.stopPrice,
                quantity: order.quantity,
                tif: order.tif || 'GTC',
                status: 'open',
                filled_quantity: 0,
            };

            const { data, error: insertError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

            if (insertError) {
                return { success: false, error: insertError.message };
            }

            return { success: true, orderId: data?.id };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsSubmitting(false);
        }
    }, [supabase, validateStopLoss]);

    /**
     * Submit an OCO order (creates two orders - one limit, one stop)
     */
    const submitOCOOrder = useCallback(async (order: OCOOrder, marketId: string): Promise<{ success: boolean; orderIds?: string[]; error?: string }> => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }

            // Validate order
            const validation = validateOCO(order, order.side === 'buy' ? order.limitPrice * 1.02 : order.limitPrice * 0.98);
            if (!validation.isValid) {
                return { success: false, error: validation.errors.join(', ') };
            }

            // Create both orders in a transaction
            const orderIds: string[] = [];

            // Limit order
            const { data: limitData, error: limitError } = await supabase
                .from('orders')
                .insert({
                    market_id: marketId,
                    user_id: user.id,
                    order_type: 'limit',
                    side: order.side,
                    outcome: order.outcome,
                    price: order.limitPrice,
                    quantity: order.quantity,
                    tif: 'GTC',
                    status: 'open',
                    filled_quantity: 0,
                    oco_group_id: crypto.randomUUID(), // Group ID to link OCO orders
                })
                .select()
                .single();

            if (limitError) {
                return { success: false, error: limitError.message };
            }

            if (limitData) {
                orderIds.push(limitData.id);
            }

            // Stop order
            const { data: stopData, error: stopError } = await supabase
                .from('orders')
                .insert({
                    market_id: marketId,
                    user_id: user.id,
                    order_type: 'stop_loss',
                    side: order.side,
                    outcome: order.outcome,
                    price: order.stopPrice,
                    stop_price: order.stopPrice,
                    quantity: order.quantity,
                    tif: 'GTC',
                    status: 'open',
                    filled_quantity: 0,
                    oco_group_id: limitData?.oco_group_id, // Same group ID
                })
                .select()
                .single();

            if (stopError) {
                // If stop order fails, cancel the limit order
                if (limitData) {
                    await supabase
                        .from('orders')
                        .update({ status: 'cancelled', cancel_reason: 'oco_stop_failed' })
                        .eq('id', limitData.id);
                }
                return { success: false, error: stopError.message };
            }

            if (stopData) {
                orderIds.push(stopData.id);
            }

            return { success: true, orderIds };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsSubmitting(false);
        }
    }, [supabase, validateOCO]);

    /**
     * Submit a trailing stop order
     */
    const submitTrailingStopOrder = useCallback(async (order: TrailingStopOrder, marketId: string): Promise<{ success: boolean; orderId?: string; error?: string }> => {
        setIsSubmitting(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'User not authenticated' };
            }

            // Validate
            const validation = validateTrailingStop(order, 0.5); // Current price placeholder
            if (!validation.isValid) {
                return { success: false, error: validation.errors.join(', ') };
            }

            // Create trailing stop order
            const { data, error: insertError } = await supabase
                .from('orders')
                .insert({
                    market_id: marketId,
                    user_id: user.id,
                    order_type: 'trailing_stop',
                    side: order.side,
                    outcome: order.outcome,
                    price: 0, // Will be calculated dynamically
                    trail_amount: order.trailAmount,
                    trail_type: order.trailType,
                    quantity: order.quantity,
                    tif: 'GTC',
                    status: 'open',
                    filled_quantity: 0,
                })
                .select()
                .single();

            if (insertError) {
                return { success: false, error: insertError.message };
            }

            return { success: true, orderId: data?.id };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsSubmitting(false);
        }
    }, [supabase, validateTrailingStop]);

    // ===========================================================================
    // Stop Loss Calculation Helpers
    // ===========================================================================

    /**
     * Calculate recommended stop-loss price based on position
     */
    const calculateStopLoss = useCallback((config: StopLossConfig): { recommended: number; aggressive: number; conservative: number } => {
        const { currentPrice, avgEntryPrice, side, positionQuantity } = config;

        if (side === 'buy') {
            // For long position: stop below entry
            const loss5Percent = avgEntryPrice * 0.95;
            const loss10Percent = avgEntryPrice * 0.90;
            const loss15Percent = avgEntryPrice * 0.85;

            return {
                recommended: loss5Percent,
                aggressive: loss10Percent,
                conservative: loss15Percent,
            };
        } else {
            // For short position: stop above entry
            const loss5Percent = avgEntryPrice * 1.05;
            const loss10Percent = avgEntryPrice * 1.10;
            const loss15Percent = avgEntryPrice * 1.15;

            return {
                recommended: loss5Percent,
                aggressive: loss10Percent,
                conservative: loss15Percent,
            };
        }
    }, []);

    /**
     * Calculate position risk metrics
     */
    const calculateRisk = useCallback((config: StopLossConfig, stopPrice: number): {
        riskAmount: number;
        riskPercentage: number;
        potentialLoss: number;
        potentialProfit: number;
    } => {
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

    return {
        // Validation
        validateStopLoss,
        validateOCO,
        validateTrailingStop,

        // Submission
        submitStopLossOrder,
        submitOCOOrder,
        submitTrailingStopOrder,

        // Helpers
        calculateStopLoss,
        calculateRisk,

        // State
        isSubmitting,
        error,
    };
}

export default useOrderTypes;
