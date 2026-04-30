// @ts-nocheck
/**
 * OrderBookBroadcast - Helper to broadcast orderbook updates after order matching
 * 
 * This module provides integration between the order matching flow and
 * the realtime orderbook engine. It should be called after match_order RPC.
 */

import { createClient } from '@supabase/supabase-js';
import { orderBookRealtimeEngine } from './OrderBookRealtimeEngine';

const SCALE = 1_000_000n;

interface DbOrder {
    id: string;
    market_id: string;
    user_id: string;
    side: 'buy' | 'sell';
    price: number;
    size: number;
    filled: number;
    status: string;
    order_type: string;
    time_in_force: string;
    post_only: boolean;
    created_at: string;
    updated_at: string;
}

interface DbTrade {
    id: string;
    market_id: string;
    maker_order_id: string;
    taker_order_id: string;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    created_at: string;
}

/**
 * Initialize the realtime engine (call once at server startup)
 */
export async function initializeRealtimeEngine(): Promise<void> {
    await orderBookRealtimeEngine.initialize();
}

/**
 * Broadcast order update after a new order is placed or an order is updated
 * Call this after place_order_atomic RPC
 */
export async function broadcastOrderUpdate(marketId: string, order: any): Promise<void> {
    try {
        await orderBookRealtimeEngine.handleOrderUpdate(marketId, order);
    } catch (err) {
        console.error('[OrderBookBroadcast] Error broadcasting order update:', err);
    }
}

/**
 * Broadcast trade update after a trade is executed
 * Call this after match_order RPC
 */
export async function broadcastTradeUpdate(marketId: string, trade: any): Promise<void> {
    try {
        await orderBookRealtimeEngine.handleTradeUpdate(marketId, trade);
    } catch (err) {
        console.error('[OrderBookBroadcast] Error broadcasting trade update:', err);
    }
}

/**
 * Get snapshot from the realtime engine
 * Falls back to DB if engine not hydrated
 */
export async function getOrderBookSnapshot(marketId: string): Promise<{
    bids: { price: number; size: number; total: number }[];
    asks: { price: number; size: number; total: number }[];
    timestamp: number;
}> {
    return orderBookRealtimeEngine.getSnapshot(marketId);
}

/**
 * Create Supabase admin client for server-side operations
 */
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase credentials');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });
}

/**
 * Sync the realtime engine after match_order RPC
 * This fetches the latest state from DB and broadcasts updates
 */
export async function syncAfterMatch(marketId: string, orderId: string): Promise<void> {
    const supabase = getAdminClient();

    try {
        // Fetch the updated order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError) {
            console.error('[OrderBookBroadcast] Error fetching order:', orderError);
            return;
        }

        // Broadcast order update
        await broadcastOrderUpdate(marketId, order);

        // Fetch any new trades for this order
        const { data: trades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .eq('taker_order_id', orderId);

        if (tradesError) {
            console.error('[OrderBookBroadcast] Error fetching trades:', tradesError);
            return;
        }

        // Broadcast each trade
        for (const trade of (trades || []) as DbTrade[]) {
            await broadcastTradeUpdate(marketId, trade);
        }

    } catch (err) {
        console.error('[OrderBookBroadcast] Error in syncAfterMatch:', err);
    }
}

/**
 * Shutdown the realtime engine (call at server shutdown)
 */
export async function shutdownRealtimeEngine(): Promise<void> {
    await orderBookRealtimeEngine.shutdown();
}
