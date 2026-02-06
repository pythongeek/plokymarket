import { DoublyLinkedList } from './ds/DoublyLinkedList';

export type Side = 'bid' | 'ask';
export type OrderType = 'LIMIT' | 'MARKET'; // Type wasn't specified in strict list but implied? "timeInForce" is. "type" field check? Req doesn't show "type". Wait. "timeInForce" is there. "type" is likely needed for logic. I will keep it but maybe default? User list didn't explicitly forbid extra fields but showed specific ones. I will keep existing "type" but fix "side".
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTD';
export type OrderStatus = 'pending' | 'open' | 'partial' | 'filled' | 'cancelled';
export type STPFlag = 'none' | 'decrease' | 'cancel' | 'both';

// Core Order Structure
export interface Order {
    id: string;                    // UUID v7
    userId: string;
    side: Side;
    price: bigint;                 // Normalized to tick size
    quantity: bigint;              // was size
    remainingQuantity: bigint;     // was remaining
    filledQuantity: bigint;        // was filled
    createdAt: number;             // Nanosecond precision timestamp
    timeInForce: TimeInForce;
    stpFlag: STPFlag;              // was stpMode
    status: OrderStatus;
    cancelRequested: boolean;      // Soft cancel tracking

    // Fields NOT in user spec but likely needed for logic:
    marketId: string; // Essential for engine routing
    type: OrderType;  // Limit vs Market essential? Or implied?
    postOnly: boolean; // Common
    updatedAt: number;

    // Internal use for O(1) removal
    _node?: any;
}

export interface OrderLevel {
    price: bigint;
    totalQuantity: bigint;
    orderCount: number;
    orders: DoublyLinkedList<Order>;
    maxOrderId: string; // Debugging and audit reference
    dirty: boolean;     // Reconciliation tracking
    lastModified: number; // Unix timestamp (nanoseconds)
}

export interface Trade {
    id: string;
    marketId: string;
    makerOrderId?: string;
    takerOrderId?: string;
    price: bigint;
    size: bigint;
    side: Side;
    fee: bigint;
    makerRebate: bigint;
    createdAt: number;
}

export interface FillResult {
    fills: Trade[];
    remainingQuantity: bigint; // Renamed to match style
    order: Order;
}
