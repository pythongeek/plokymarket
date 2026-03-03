/**
 * Market Lifecycle Store
 * 
 * Unified state management for market data, real-time updates,
 * and admin synchronization.
 * 
 * Features:
 * - Real-time market data (markets, orderBooks, positions)
 * - Admin action queue for market state changes
 * - Supabase Realtime subscriptions
 * - Market resolution tracking
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type MarketStatus = 'pending' | 'active' | 'closed' | 'resolved' | 'cancelled' | 'paused';

export interface Market {
    id: string;
    event_id: string;
    question: string;
    description?: string;
    category?: string;
    status: MarketStatus;
    trading_closes_at: string;
    event_date?: string;
    resolution_source?: string;
    resolution_data?: any;
    image_url?: string;
    creator_id?: string;
    created_at?: string;
    updated_at?: string;
    total_volume?: number;
    // Real-time price data
    yes_price?: number;
    no_price?: number;
    yes_volume?: number;
    no_volume?: number;
    // Computed
    liquidity?: number;
    outcome?: string;
}

export interface OrderBookEntry {
    price: number;
    quantity: number;
    orders: number;
}

export interface OrderBook {
    market_id: string;
    bids: OrderBookEntry[];  // Buy orders (YES)
    asks: OrderBookEntry[];  // Sell orders (NO)
    last_update: string;
    spread?: number;
    mid_price?: number;
}

export interface Position {
    id: string;
    market_id: string;
    user_id: string;
    outcome: 'YES' | 'NO';
    quantity: number;
    avg_price: number;
    current_value: number;
    unrealized_pnl: number;
    realized_pnl: number;
    created_at: string;
    updated_at: string;
}

export interface Trade {
    id: string;
    market_id: string;
    buyer_id: string;
    seller_id: string;
    outcome: 'YES' | 'NO';
    price: number;
    quantity: number;
    created_at: string;
}

export interface AdminAction {
    id: string;
    type: 'pause' | 'resume' | 'resolve' | 'cancel' | 'adjust_liquidity';
    market_id: string;
    params?: Record<string, any>;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
    completed_at?: string;
    error?: string;
}

export interface PendingResolution {
    market_id: string;
    outcome: 'YES' | 'NO';
    resolution_method: string;
    scheduled_at?: string;
    confirmed_by?: string;
}

// ============================================================================
// Store Interface
// ============================================================================

interface MarketLifecycleState {
    // Real-time market data
    markets: Record<string, Market>;
    orderBooks: Record<string, OrderBook>;
    positions: Record<string, Position[]>;
    recentTrades: Record<string, Trade[]>;

    // Subscriptions
    subscribedMarkets: Set<string>;
    subscriptionChannels: Map<string, any>;

    // Admin sync
    adminActions: AdminAction[];
    pendingResolutions: PendingResolution[];

    // Loading states
    isLoadingMarkets: boolean;
    isLoadingOrderBook: boolean;
    isSyncing: boolean;

    // Last sync timestamp
    lastSync: string | null;

    // Actions
    subscribeToMarket: (marketId: string) => Promise<void>;
    unsubscribeFromMarket: (marketId: string) => void;

    fetchMarket: (marketId: string) => Promise<Market | null>;
    fetchMarkets: (filters?: MarketFilters) => Promise<Market[]>;
    fetchOrderBook: (marketId: string) => Promise<OrderBook | null>;
    fetchPositions: (marketId?: string) => Promise<Position[]>;
    fetchRecentTrades: (marketId: string, limit?: number) => Promise<Trade[]>;

    updateMarketFromRealtime: (market: Market) => void;
    updateOrderBookFromRealtime: (orderBook: OrderBook) => void;
    addTradeFromRealtime: (trade: Trade) => void;

    // Admin sync actions
    syncWithAdmin: () => Promise<void>;
    queueAdminAction: (action: Omit<AdminAction, 'id' | 'status' | 'created_at'>) => void;
    processAdminAction: (actionId: string) => Promise<void>;

    // Market resolution
    queueResolution: (resolution: PendingResolution) => void;
    confirmResolution: (marketId: string, outcome: 'YES' | 'NO') => Promise<void>;

    // Cleanup
    clearMarketData: () => void;
}

interface MarketFilters {
    status?: MarketStatus[];
    category?: string[];
    trending?: boolean;
    closing_soon?: boolean;
    min_volume?: number;
    search?: string;
}

// ============================================================================
// Store Implementation
// ============================================================================

const initialState = {
    markets: {},
    orderBooks: {},
    positions: {},
    recentTrades: {},
    subscribedMarkets: new Set<string>(),
    subscriptionChannels: new Map<string, any>(),
    adminActions: [],
    pendingResolutions: [],
    isLoadingMarkets: false,
    isLoadingOrderBook: false,
    isSyncing: false,
    lastSync: null,
};

export const useMarketLifecycleStore = create<MarketLifecycleState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ======================================================================
            // Subscription Management
            // ======================================================================

            subscribeToMarket: async (marketId: string) => {
                const { subscribedMarkets, subscriptionChannels } = get();

                if (subscribedMarkets.has(marketId)) {
                    console.log(`[MarketLifecycle] Already subscribed to ${marketId}`);
                    return;
                }

                console.log(`[MarketLifecycle] Subscribing to market: ${marketId}`);

                // Create Supabase Realtime channel
                const channel = supabase
                    .channel(`market:${marketId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'markets',
                            filter: `id=eq.${marketId}`,
                        },
                        (payload: any) => {
                            console.log(`[MarketLifecycle] Market update:`, payload);
                            if (payload.eventType === 'UPDATE') {
                                get().updateMarketFromRealtime(payload.new as Market);
                            }
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'trades',
                            filter: `market_id=eq.${marketId}`,
                        },
                        (payload: any) => {
                            console.log(`[MarketLifecycle] New trade:`, payload);
                            get().addTradeFromRealtime(payload.new as Trade);
                        }
                    )
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'orders',
                            filter: `market_id=eq.${marketId}`,
                        },
                        (payload: any) => {
                            console.log(`[MarketLifecycle] Order update:`, payload);
                            // Refresh order book on order changes
                            get().fetchOrderBook(marketId);
                        }
                    )
                    .subscribe();

                // Update state
                const newSubscribedMarkets = new Set(subscribedMarkets);
                newSubscribedMarkets.add(marketId);

                const newChannels = new Map(subscriptionChannels);
                newChannels.set(marketId, channel);

                set({
                    subscribedMarkets: newSubscribedMarkets,
                    subscriptionChannels: newChannels,
                });

                // Fetch initial data
                await Promise.all([
                    get().fetchMarket(marketId),
                    get().fetchOrderBook(marketId),
                    get().fetchPositions(marketId),
                ]);
            },

            unsubscribeFromMarket: (marketId: string) => {
                const { subscribedMarkets, subscriptionChannels } = get();

                if (!subscribedMarkets.has(marketId)) {
                    return;
                }

                console.log(`[MarketLifecycle] Unsubscribing from market: ${marketId}`);

                // Remove channel
                const channel = subscriptionChannels.get(marketId);
                if (channel) {
                    supabase.removeChannel(channel);
                }

                // Update state
                const newSubscribedMarkets = new Set(subscribedMarkets);
                newSubscribedMarkets.delete(marketId);

                const newChannels = new Map(subscriptionChannels);
                newChannels.delete(marketId);

                set({
                    subscribedMarkets: newSubscribedMarkets,
                    subscriptionChannels: newChannels,
                });
            },

            // ======================================================================
            // Data Fetching
            // ======================================================================

            fetchMarket: async (marketId: string) => {
                try {
                    const { data, error } = await supabase
                        .from('markets')
                        .select('*')
                        .eq('id', marketId)
                        .single();

                    if (error) throw error;

                    if (data) {
                        get().updateMarketFromRealtime(data);
                        return data as Market;
                    }
                    return null;
                } catch (error) {
                    console.error(`[MarketLifecycle] Error fetching market ${marketId}:`, error);
                    return null;
                }
            },

            fetchMarkets: async (filters?: MarketFilters) => {
                set({ isLoadingMarkets: true });

                try {
                    let query = supabase
                        .from('markets')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (filters?.status?.length) {
                        query = query.in('status', filters.status);
                    }

                    if (filters?.category?.length) {
                        query = query.in('category', filters.category);
                    }

                    if (filters?.min_volume) {
                        query = query.gte('total_volume', filters.min_volume);
                    }

                    if (filters?.search) {
                        query = query.ilike('question', `%${filters.search}%`);
                    }

                    const { data, error } = await query;

                    if (error) throw error;

                    if (data) {
                        // Update all markets in state
                        const markets = get().markets;
                        data.forEach((market: any) => {
                            markets[market.id] = market as Market;
                        });
                        set({ markets: { ...markets } });

                        return data as Market[];
                    }
                    return [];
                } catch (error) {
                    console.error('[MarketLifecycle] Error fetching markets:', error);
                    return [];
                } finally {
                    set({ isLoadingMarkets: false });
                }
            },

            fetchOrderBook: async (marketId: string) => {
                set({ isLoadingOrderBook: true });

                try {
                    // Fetch bids (YES orders)
                    const { data: bids, error: bidsError } = await supabase
                        .from('orders')
                        .select('price, quantity')
                        .eq('market_id', marketId)
                        .eq('side', 'buy')
                        .eq('status', 'open')
                        .order('price', { ascending: false })
                        .limit(20);

                    if (bidsError) throw bidsError;

                    // Fetch asks (NO orders)
                    const { data: asks, error: asksError } = await supabase
                        .from('orders')
                        .select('price, quantity')
                        .eq('market_id', marketId)
                        .eq('side', 'sell')
                        .eq('status', 'open')
                        .order('price', { ascending: true })
                        .limit(20);

                    if (asksError) throw asksError;

                    // Calculate spread and mid price
                    const bestBid = bids?.[0]?.price || 0;
                    const bestAsk = asks?.[0]?.price || 1;
                    const spread = bestAsk - bestBid;
                    const midPrice = (bestBid + bestAsk) / 2;

                    // Group by price level
                    const groupByPrice = (orders: any[]): OrderBookEntry[] => {
                        const grouped: Record<number, { quantity: number; orders: number }> = {};
                        orders?.forEach((order) => {
                            if (!grouped[order.price]) {
                                grouped[order.price] = { quantity: 0, orders: 0 };
                            }
                            grouped[order.price].quantity += order.quantity;
                            grouped[order.price].orders += 1;
                        });
                        return Object.entries(grouped).map(([price, data]) => ({
                            price: parseFloat(price),
                            quantity: data.quantity,
                            orders: data.orders,
                        }));
                    };

                    const orderBook: OrderBook = {
                        market_id: marketId,
                        bids: groupByPrice(bids),
                        asks: groupByPrice(asks),
                        last_update: new Date().toISOString(),
                        spread,
                        mid_price: midPrice,
                    };

                    // Update state
                    const orderBooks = get().orderBooks;
                    orderBooks[marketId] = orderBook;
                    set({ orderBooks: { ...orderBooks } });

                    return orderBook;
                } catch (error) {
                    console.error(`[MarketLifecycle] Error fetching order book for ${marketId}:`, error);
                    return null;
                } finally {
                    set({ isLoadingOrderBook: false });
                }
            },

            fetchPositions: async (marketId?: string) => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return [];

                    let query = supabase
                        .from('positions')
                        .select('*')
                        .eq('user_id', user.id);

                    if (marketId) {
                        query = query.eq('market_id', marketId);
                    }

                    const { data, error } = await query;

                    if (error) throw error;

                    if (data) {
                        const positions = get().positions;
                        if (marketId) {
                            positions[marketId] = data as Position[];
                        }
                        set({ positions: { ...positions } });
                        return data as Position[];
                    }
                    return [];
                } catch (error) {
                    console.error('[MarketLifecycle] Error fetching positions:', error);
                    return [];
                }
            },

            fetchRecentTrades: async (marketId: string, limit: number = 50) => {
                try {
                    const { data, error } = await supabase
                        .from('trades')
                        .select('*')
                        .eq('market_id', marketId)
                        .order('created_at', { ascending: false })
                        .limit(limit);

                    if (error) throw error;

                    if (data) {
                        const recentTrades = get().recentTrades;
                        recentTrades[marketId] = data as Trade[];
                        set({ recentTrades: { ...recentTrades } });
                        return data as Trade[];
                    }
                    return [];
                } catch (error) {
                    console.error(`[MarketLifecycle] Error fetching trades for ${marketId}:`, error);
                    return [];
                }
            },

            // ======================================================================
            // Realtime Updates
            // ======================================================================

            updateMarketFromRealtime: (market: Market) => {
                const markets = get().markets;
                markets[market.id] = { ...markets[market.id], ...market };
                set({ markets: { ...markets } });
            },

            updateOrderBookFromRealtime: (orderBook: OrderBook) => {
                const orderBooks = get().orderBooks;
                orderBooks[orderBook.market_id] = orderBook;
                set({ orderBooks: { ...orderBooks } });
            },

            addTradeFromRealtime: (trade: Trade) => {
                const recentTrades = get().recentTrades;
                const marketTrades = recentTrades[trade.market_id] || [];

                // Add new trade at the beginning, keep last 50
                recentTrades[trade.market_id] = [trade, ...marketTrades].slice(0, 50);

                set({ recentTrades: { ...recentTrades } });
            },

            // ======================================================================
            // Admin Sync
            // ======================================================================

            syncWithAdmin: async () => {
                set({ isSyncing: true });

                try {
                    // Fetch pending admin actions
                    const { data: actions, error } = await supabase
                        .from('admin_actions')
                        .select('*')
                        .eq('status', 'pending')
                        .order('created_at', { ascending: true })
                        .limit(10);

                    if (error) throw error;

                    if (actions) {
                        set({ adminActions: actions as AdminAction[] });
                    }

                    // Fetch pending resolutions
                    const { data: resolutions } = await supabase
                        .from('pending_resolutions')
                        .select('*')
                        .order('scheduled_at', { ascending: true });

                    if (resolutions) {
                        set({ pendingResolutions: resolutions as PendingResolution[] });
                    }

                    set({ lastSync: new Date().toISOString() });
                } catch (error) {
                    console.error('[MarketLifecycle] Error syncing with admin:', error);
                } finally {
                    set({ isSyncing: false });
                }
            },

            queueAdminAction: (action: Omit<AdminAction, 'id' | 'status' | 'created_at'>) => {
                const newAction: AdminAction = {
                    ...action,
                    id: crypto.randomUUID(),
                    status: 'pending',
                    created_at: new Date().toISOString(),
                };

                const adminActions = get().adminActions;
                set({ adminActions: [...adminActions, newAction] });

                // Also try to persist to database
                supabase
                    .from('admin_actions')
                    .insert(newAction)
                    .catch(console.error);
            },

            processAdminAction: async (actionId: string) => {
                const adminActions = get().adminActions;
                const action = adminActions.find((a) => a.id === actionId);

                if (!action) return;

                // Mark as processing
                const updatedActions = adminActions.map((a) =>
                    a.id === actionId ? { ...a, status: 'processing' as const } : a
                );
                set({ adminActions: updatedActions });

                try {
                    // Execute the action based on type
                    switch (action.type) {
                        case 'pause':
                            await supabase
                                .from('markets')
                                .update({ status: 'paused' })
                                .eq('id', action.market_id);
                            break;

                        case 'resume':
                            await supabase
                                .from('markets')
                                .update({ status: 'active' })
                                .eq('id', action.market_id);
                            break;

                        case 'resolve':
                            await supabase
                                .from('markets')
                                .update({
                                    status: 'resolved',
                                    outcome: action.params?.outcome,
                                    resolved_at: new Date().toISOString(),
                                })
                                .eq('id', action.market_id);
                            break;

                        case 'adjust_liquidity':
                            // Call the liquidity adjustment API
                            await fetch('/api/admin/markets/adjust-liquidity', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    market_id: action.market_id,
                                    amount: action.params?.amount,
                                }),
                            });
                            break;
                    }

                    // Mark as completed
                    const finalActions = adminActions.map((a) =>
                        a.id === actionId
                            ? { ...a, status: 'completed' as const, completed_at: new Date().toISOString() }
                            : a
                    );
                    set({ adminActions: finalActions });
                } catch (error) {
                    // Mark as failed
                    const failedActions = adminActions.map((a) =>
                        a.id === actionId
                            ? { ...a, status: 'failed' as const, error: String(error) }
                            : a
                    );
                    set({ adminActions: failedActions });
                }
            },

            // ======================================================================
            // Market Resolution
            // ======================================================================

            queueResolution: (resolution: PendingResolution) => {
                const pendingResolutions = get().pendingResolutions;
                set({ pendingResolutions: [...pendingResolutions, resolution] });
            },

            confirmResolution: async (marketId: string, outcome: 'YES' | 'NO') => {
                try {
                    // Update market status
                    const { error } = await supabase
                        .from('markets')
                        .update({
                            status: 'resolved',
                            outcome,
                            resolved_at: new Date().toISOString(),
                        })
                        .eq('id', marketId);

                    if (error) throw error;

                    // Trigger settlement process
                    await fetch('/api/admin/settlement', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ market_id: marketId, outcome }),
                    });

                    // Remove from pending
                    const pendingResolutions = get().pendingResolutions.filter(
                        (r) => r.market_id !== marketId
                    );
                    set({ pendingResolutions });

                    // Refresh market data
                    await get().fetchMarket(marketId);
                } catch (error) {
                    console.error(`[MarketLifecycle] Error confirming resolution for ${marketId}:`, error);
                }
            },

            // ======================================================================
            // Cleanup
            // ======================================================================

            clearMarketData: () => {
                // Unsubscribe from all markets
                const { subscribedMarkets, subscriptionChannels } = get();

                subscriptionChannels.forEach((channel) => {
                    supabase.removeChannel(channel);
                });

                set(initialState);
            },
        }),
        {
            name: 'market-lifecycle-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist subscriptions and last sync
                subscribedMarkets: Array.from(state.subscribedMarkets),
                lastSync: state.lastSync,
            }),
        }
    )
);

// ============================================================================
// Helper Hook
// ============================================================================

/**
 * Hook to use market lifecycle store with automatic subscription
 */
export function useMarket(marketId: string) {
    const store = useMarketLifecycleStore();

    const market = store.markets[marketId];
    const orderBook = store.orderBooks[marketId];
    const positions = store.positions[marketId] || [];
    const trades = store.recentTrades[marketId] || [];

    const isLoading = store.isLoadingMarkets || store.isLoadingOrderBook;

    return {
        // Data
        market,
        orderBook,
        positions,
        trades,
        isLoading,

        // Actions
        subscribe: () => store.subscribeToMarket(marketId),
        unsubscribe: () => store.unsubscribeFromMarket(marketId),
        refresh: () => Promise.all([
            store.fetchMarket(marketId),
            store.fetchOrderBook(marketId),
            store.fetchPositions(marketId),
            store.fetchRecentTrades(marketId),
        ]),
    };
}

export default useMarketLifecycleStore;
