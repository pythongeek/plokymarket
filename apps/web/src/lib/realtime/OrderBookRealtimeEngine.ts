// @ts-nocheck
/**
 * OrderBookRealtimeEngine - Singleton managing in-memory OrderBookEngine instances
 * for real-time WebSocket feeds using Supabase Realtime.
 * 
 * This engine:
 * - Maintains a Map of marketId -> { engine, publisher, channel }
 * - Hydrates engines from DB on first subscription
 * - Handles order/trade updates via postgres_changes
 * - Uses MarketDataPublisher for efficient delta encoding (L1/L2/L3)
 */

import { OrderBookEngine } from '@/lib/clob/OrderBookEngine';
import { MarketDataPublisher } from '@/lib/clob/realtime/MarketDataPublisher';
import { Order, Trade, OrderStatus } from '@/lib/clob/types';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// Scale factor for BigInt conversion
const SCALE = 1_000_000n;

interface MarketEngineState {
    engine: OrderBookEngine;
    publisher: MarketDataPublisher;
    channel: any; // SupabaseChannel
    subscribers: Set<string>;
    isHydrated: boolean;
    lastSequence: number;
}

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

export class OrderBookRealtimeEngine {
    private static instance: OrderBookRealtimeEngine;
    
    // Map of marketId -> MarketEngineState
    private engines: Map<string, MarketEngineState> = new Map();
    
    // Admin client for server-side operations
    private adminClient: SupabaseClient | null = null;
    
    // Whether postgres_changes subscriptions are active
    private isListening: boolean = false;
    
    // Global channel for DB change notifications
    private dbChangeChannel: any = null;

    private constructor() {}

    public static getInstance(): OrderBookRealtimeEngine {
        if (!OrderBookRealtimeEngine.instance) {
            OrderBookRealtimeEngine.instance = new OrderBookRealtimeEngine();
        }
        return OrderBookRealtimeEngine.instance;
    }

    /**
     * Initialize with admin client for server-side DB access
     */
    public async initialize(): Promise<void> {
        if (this.adminClient) return;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[OrderBookRealtimeEngine] Missing Supabase credentials');
            return;
        }

        this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        // Start listening for DB changes
        await this.startListening();
    }

    /**
     * Hydrate an engine from DB — loads all open/partially_filled orders
     */
    public async hydrateEngine(marketId: string): Promise<OrderBookEngine> {
        let state = this.engines.get(marketId);
        
        if (state?.isHydrated) {
            return state.engine;
        }

        if (!this.adminClient) {
            await this.initialize();
        }

        const supabase = this.adminClient!;

        // Fetch open orders from DB
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .in('status', ['open', 'partially_filled']);

        if (error) {
            console.error(`[OrderBookRealtimeEngine] Error hydrating engine for ${marketId}:`, error);
            throw error;
        }

        const bids: Order[] = [];
        const asks: Order[] = [];

        for (const dbOrder of (orders || []) as DbOrder[]) {
            const order = this.mapDbOrderToMemory(dbOrder);
            if (order.side === 'buy' || order.side === 'bid') {
                bids.push(order);
            } else {
                asks.push(order);
            }
        }

        // Create or get engine
        const engine = new OrderBookEngine(marketId, 100n, bids, asks);

        // Create publisher with initial sequence
        const channel = supabase.channel(`market:${marketId}`);
        const publisher = new MarketDataPublisher(engine, channel, Date.now());

        state = {
            engine,
            publisher,
            channel,
            subscribers: new Set(),
            isHydrated: true,
            lastSequence: Date.now()
        };

        this.engines.set(marketId, state);

        console.log(`[OrderBookRealtimeEngine] Hydrated engine for ${marketId} with ${bids.length} bids, ${asks.length} asks`);

        return engine;
    }

    /**
     * Handle order update from postgres_changes
     */
    public async handleOrderUpdate(marketId: string, order: any): Promise<void> {
        const state = this.engines.get(marketId);
        if (!state) {
            console.warn(`[OrderBookRealtimeEngine] No engine found for ${marketId}`);
            return;
        }

        const engine = state.engine;
        const dbOrder = order as DbOrder;

        switch (dbOrder.status) {
            case 'open':
            case 'partially_filled':
                // New or updated order - add/update in book
                await this.addOrUpdateOrder(engine, dbOrder);
                break;
            case 'filled':
            case 'cancelled':
            case 'expired':
                // Order removed from book
                await this.removeOrder(engine, dbOrder.id);
                break;
            default:
                console.warn(`[OrderBookRealtimeEngine] Unknown order status: ${dbOrder.status}`);
        }

        // Trigger publisher to broadcast update
        state.publisher.publishL2();
        state.publisher.flushBatch();
    }

    /**
     * Handle trade update from postgres_changes
     */
    public async handleTradeUpdate(marketId: string, trade: any): Promise<void> {
        const state = this.engines.get(marketId);
        if (!state) {
            console.warn(`[OrderBookRealtimeEngine] No engine found for ${marketId}`);
            return;
        }

        const engine = state.engine;
        const dbTrade = trade as DbTrade;

        // Update the engine with the fill
        await this.applyTrade(engine, dbTrade);

        // Trigger publisher to broadcast update
        state.publisher.publishL2();
        state.publisher.flushBatch();
    }

    /**
     * Subscribe to a market's realtime channel
     */
    public subscribe(marketId: string, channel: any): void {
        let state = this.engines.get(marketId);
        
        if (!state) {
            // Need to hydrate first
            this.hydrateEngine(marketId).then(() => {
                state = this.engines.get(marketId);
                if (state) {
                    state.subscribers.add(channel.topic);
                }
            });
        } else {
            state.subscribers.add(channel.topic);
        }
    }

    /**
     * Unsubscribe from a market
     */
    public unsubscribe(marketId: string, channel: any): void {
        const state = this.engines.get(marketId);
        if (state) {
            state.subscribers.delete(channel.topic);
            
            // If no more subscribers, cleanup
            if (state.subscribers.size === 0) {
                this.cleanupMarket(marketId);
            }
        }
    }

    /**
     * Get engine for a market (must be hydrated first)
     */
    public getEngine(marketId: string): OrderBookEngine | null {
        const state = this.engines.get(marketId);
        return state?.engine || null;
    }

    /**
     * Get publisher for a market
     */
    public getPublisher(marketId: string): MarketDataPublisher | null {
        const state = this.engines.get(marketId);
        return state?.publisher || null;
    }

    /**
     * Start listening to postgres_changes for orders and trades
     */
    private async startListening(): Promise<void> {
        if (this.isListening || !this.adminClient) return;

        const supabase = this.adminClient;

        // Listen for all order changes across all markets
        this.dbChangeChannel = supabase
            .channel('orderbook-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    const order = payload.new || payload.old;
                    if (order?.market_id) {
                        this.handleOrderUpdate(order.market_id, order);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trades'
                },
                (payload) => {
                    const trade = payload.new;
                    if (trade?.market_id) {
                        this.handleTradeUpdate(trade.market_id, trade);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    this.isListening = true;
                    console.log('[OrderBookRealtimeEngine] Subscribed to DB changes');
                }
            });
    }

    /**
     * Stop listening to postgres_changes
     */
    public async stopListening(): Promise<void> {
        if (this.dbChangeChannel && this.adminClient) {
            await this.adminClient.removeChannel(this.dbChangeChannel);
            this.dbChangeChannel = null;
            this.isListening = false;
        }
    }

    /**
     * Cleanup a market when no more subscribers
     */
    private cleanupMarket(marketId: string): void {
        const state = this.engines.get(marketId);
        if (state) {
            state.publisher.stop();
            state.channel.unsubscribe();
            this.engines.delete(marketId);
            console.log(`[OrderBookRealtimeEngine] Cleaned up engine for ${marketId}`);
        }
    }

    /**
     * Add or update an order in the engine
     */
    private async addOrUpdateOrder(engine: OrderBookEngine, dbOrder: DbOrder): Promise<void> {
        const existingOrder = engine.getOrder(dbOrder.id);
        
        if (existingOrder) {
            // Update existing order (e.g., partial fill)
            if (dbOrder.status === 'partially_filled') {
                // The engine's internal state should already be updated via matching
                // This is a sync mechanism to ensure consistency
                console.log(`[OrderBookRealtimeEngine] Order ${dbOrder.id} partially filled`);
            }
        } else {
            // New order - add to book
            const order = this.mapDbOrderToMemory(dbOrder);
            try {
                await engine.placeOrder(order);
            } catch (err) {
                console.error(`[OrderBookRealtimeEngine] Error adding order ${dbOrder.id}:`, err);
            }
        }
    }

    /**
     * Remove an order from the engine
     */
    private async removeOrder(engine: OrderBookEngine, orderId: string): Promise<void> {
        try {
            await engine.cancelOrder(orderId);
            console.log(`[OrderBookRealtimeEngine] Order ${orderId} removed`);
        } catch (err) {
            console.error(`[OrderBookRealtimeEngine] Error removing order ${orderId}:`, err);
        }
    }

    /**
     * Apply a trade to the engine (fill)
     */
    private async applyTrade(engine: OrderBookEngine, dbTrade: DbTrade): Promise<void> {
        // For trades, we need to update the maker order's filled quantity
        // The engine should have been updated during matching
        // This is mainly for sync purposes
        const makerOrder = engine.getOrder(dbTrade.maker_order_id);
        if (makerOrder) {
            const fillSize = BigInt(Math.round(dbTrade.size * Number(SCALE)));
            makerOrder.filledQuantity += fillSize;
            makerOrder.remainingQuantity = makerOrder.quantity - makerOrder.filledQuantity;
            
            if (makerOrder.remainingQuantity === 0n) {
                makerOrder.status = 'filled';
            } else {
                makerOrder.status = 'partially_filled';
            }
        }
    }

    /**
     * Map DB order to memory order
     */
    private mapDbOrderToMemory(dbOrder: DbOrder): Order {
        return {
            id: dbOrder.id,
            marketId: dbOrder.market_id,
            userId: dbOrder.user_id,
            side: dbOrder.side === 'buy' ? 'buy' : 'sell',
            price: BigInt(Math.round(Number(dbOrder.price) * Number(SCALE))),
            quantity: BigInt(Math.round(Number(dbOrder.size) * Number(SCALE))),
            filledQuantity: BigInt(Math.round(Number(dbOrder.filled) * Number(SCALE))),
            remainingQuantity: BigInt(Math.round((Number(dbOrder.size) - Number(dbOrder.filled)) * Number(SCALE))),
            status: dbOrder.status as OrderStatus,
            type: dbOrder.order_type as any,
            timeInForce: (dbOrder.time_in_force || 'GTC') as any,
            postOnly: dbOrder.post_only || false,
            stpFlag: 'none',
            createdAt: new Date(dbOrder.created_at).getTime(),
            updatedAt: new Date(dbOrder.updated_at).getTime(),
            cancelRequested: false
        };
    }

    /**
     * Get snapshot for a market (from engine or DB fallback)
     */
    public async getSnapshot(marketId: string): Promise<{
        bids: { price: number; size: number; total: number }[];
        asks: { price: number; size: number; total: number }[];
        timestamp: number;
    }> {
        const state = this.engines.get(marketId);
        
        if (state?.isHydrated) {
            const bids = state.engine.depthManager.getDepth('buy', 1);
            const asks = state.engine.depthManager.getDepth('sell', 1);
            
            return {
                bids: bids.map(l => ({
                    price: Number(l.price) / Number(SCALE),
                    size: Number(l.size) / Number(SCALE),
                    total: Number(l.total) / Number(SCALE)
                })),
                asks: asks.map(l => ({
                    price: Number(l.price) / Number(SCALE),
                    size: Number(l.size) / Number(SCALE),
                    total: Number(l.total) / Number(SCALE)
                })),
                timestamp: Date.now()
            };
        }

        // Fallback to DB
        if (!this.adminClient) {
            await this.initialize();
        }

        const supabase = this.adminClient!;
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .in('status', ['open', 'partially_filled']);

        if (error) throw error;

        const bids: Map<number, number> = new Map();
        const asks: Map<number, number> = new Map();

        for (const order of (orders || []) as DbOrder[]) {
            const price = Number(order.price);
            const size = Number(order.size) - Number(order.filled);
            const map = order.side === 'buy' ? bids : asks;
            map.set(price, (map.get(price) || 0) + size);
        }

        const toArray = (map: Map<number, number>, ascending: boolean) => {
            const arr = Array.from(map.entries())
                .map(([price, size]) => ({ price, size, total: size }))
                .sort((a, b) => ascending ? a.price - b.price : b.price - a.price);
            return arr;
        };

        return {
            bids: toArray(bids, false),
            asks: toArray(asks, true),
            timestamp: Date.now()
        };
    }

    /**
     * Shutdown the engine and cleanup all resources
     */
    public async shutdown(): Promise<void> {
        await this.stopListening();
        
        for (const [marketId, state] of this.engines) {
            state.publisher.stop();
            state.channel.unsubscribe();
        }
        
        this.engines.clear();
        console.log('[OrderBookRealtimeEngine] Shutdown complete');
    }
}

// Export singleton accessor
export const orderBookRealtimeEngine = OrderBookRealtimeEngine.getInstance();
