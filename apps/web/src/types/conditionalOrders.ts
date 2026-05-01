/**
 * Conditional Orders Types
 * 
 * Type definitions for stop-loss, take-profit, OCO, and trailing stop orders
 */

import type { Database } from './database.types';

// Re-export database enums
export type OrderConditionType = Database['public']['Enums']['order_condition_type'];
export type OrderSide = Database['public']['Enums']['order_side'];
export type Outcome = Database['public']['Enums']['outcome_type'];

// ============================================================
// CONDITIONAL ORDER TYPES
// ============================================================

/** Conditional order status */
export type ConditionalOrderStatus = 'pending' | 'triggered' | 'executed' | 'cancelled' | 'expired';

/** Conditional order condition types */
export type ConditionalOrderConditionType = 
    | 'stop_loss' 
    | 'stop_limit' 
    | 'oco' 
    | 'trailing_stop'
    | 'take_profit';

/** Conditional order from database */
export interface ConditionalOrder {
    id: string;
    user_id: string;
    market_id: string;
    parent_order_id: string | null;
    oco_group_id: string | null;
    condition_type: ConditionalOrderConditionType;
    side: OrderSide;
    outcome: Outcome;
    trigger_price: number;
    limit_price: number | null;
    trail_amount: number | null;
    trail_type: 'percentage' | 'absolute' | null;
    highest_price: number | null;
    lowest_price: number | null;
    quantity: number;
    filled_quantity: number;
    status: ConditionalOrderStatus;
    triggered_at: string | null;
    executed_at: string | null;
    cancelled_at: string | null;
    cancel_reason: string | null;
    executed_order_id: string | null;
    execution_price: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
}

/** Input for creating a new conditional order */
export interface CreateConditionalOrderInput {
    marketId: string;
    conditionType: ConditionalOrderConditionType;
    side: OrderSide;
    outcome: Outcome;
    triggerPrice: number;
    limitPrice?: number;
    quantity: number;
    trailAmount?: number;
    trailType?: 'percentage' | 'absolute';
    parentOrderId?: string;
    ocoGroupId?: string;
    expiresAt?: string;
}

/** OCO (One-Cancels-Other) order pair */
export interface OCOOrderPair {
    groupId: string;
    limitOrder: ConditionalOrder;
    stopOrder: ConditionalOrder;
}

/** Validation result for conditional orders */
export interface ConditionalOrderValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/** Risk metrics for stop-loss orders */
export interface StopLossRiskMetrics {
    riskAmount: number;
    riskPercentage: number;
    potentialLoss: number;
    potentialProfit: number;
}

/** Stop-loss configuration */
export interface StopLossConfig {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity: number;
    avgEntryPrice: number;
    side: OrderSide;
}

/** Stop-loss recommendations */
export interface StopLossRecommendations {
    recommended: number;
    aggressive: number;
    conservative: number;
}

/** Result from executing a conditional order */
export interface ExecutionResult {
    success: boolean;
    conditionalOrderId?: string;
    executedOrderId?: string;
    executionPrice?: number;
    error?: string;
}

/** Result from checking conditional orders */
export interface CheckConditionalOrdersResult {
    triggeredCount: number;
    triggeredOrders: string[];
    errors?: string[];
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ConditionalOrdersResponse {
    orders: ConditionalOrder[];
    error?: string;
}

export interface SingleConditionalOrderResponse {
    order: ConditionalOrder | null;
    error?: string;
}

export interface CreateConditionalOrderResponse {
    order?: ConditionalOrder;
    error?: string;
}

export interface CancelConditionalOrderResponse {
    success: boolean;
    error?: string;
}

export interface ExecuteConditionalOrderResponse {
    success: boolean;
    triggeredCount?: number;
    triggeredOrders?: string[];
    error?: string;
}

// ============================================================
// COMPONENT PROP TYPES
// ============================================================

/** Props for StopLossPanel component */
export interface StopLossPanelProps {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity?: number;
    avgEntryPrice?: number;
    onSuccess?: (orderId: string) => void;
    onCancel?: () => void;
}

/** Props for TakeProfitPanel component */
export interface TakeProfitPanelProps {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity?: number;
    avgEntryPrice?: number;
    onSuccess?: (orderId: string) => void;
    onCancel?: () => void;
}

/** Props for OCOPanel component */
export interface OCOPanelProps {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity?: number;
    avgEntryPrice?: number;
    onSuccess?: (groupId: string, orderIds: string[]) => void;
    onCancel?: () => void;
}

/** Props for TrailingStopPanel component */
export interface TrailingStopPanelProps {
    marketId: string;
    currentPrice: number;
    outcome: Outcome;
    positionQuantity?: number;
    avgEntryPrice?: number;
    onSuccess?: (orderId: string) => void;
    onCancel?: () => void;
}

/** Props for ConditionalOrderList component */
export interface ConditionalOrderListProps {
    marketId?: string;
    status?: ConditionalOrderStatus;
    onCancel?: (orderId: string) => void;
    onEdit?: (order: ConditionalOrder) => void;
}
