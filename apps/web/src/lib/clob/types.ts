export type Side = 'BUY' | 'SELL';
export type OrderType = 'LIMIT' | 'MARKET';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';
export type OrderStatus = 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELED';
export type STPMode = 'STP_DECREMENT' | 'STP_CANCEL_BOTH' | 'STP_CANCEL_OLDER';

export interface Order {
    id: string;
    marketId: string;
    userId: string;
    side: Side;
    price: number;
    size: number; // Original size
    filled: number; // Amount filled
    remaining: number; // Helper: size - filled
    status: OrderStatus;
    type: OrderType;
    timeInForce: TimeInForce;
    postOnly: boolean;
    stpMode?: STPMode;
    createdAt: number; // Timestamp
    updatedAt: number;
}

export interface OrderLevel {
    price: number;
    size: number;
    total: number; // Cumulative depth (optional visualization helper)
}

export interface OrderBookState {
    marketId: string;
    bids: OrderLevel[];
    asks: OrderLevel[];
    lastUpdateId: number;
}

export interface Trade {
    id: string;
    marketId: string;
    makerOrderId?: string;
    takerOrderId?: string;
    price: number;
    size: number;
    side: Side; // Side of the taker (the aggressor)
    fee?: number;
    makerRebate?: number;
    createdAt: number;
}

export interface FillResult {
    fills: Trade[];
    remainingSize: number;
    order: Order; // The updated state of the incoming order
}
