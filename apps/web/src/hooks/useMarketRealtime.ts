'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMarketLifecycleStore, Market, OrderBook, Trade, Position } from '@/store/marketLifecycleStore';

// ============================================================================
// Types
// ============================================================================

export type RealtimeFeature = 'market' | 'orderbook' | 'trades' | 'positions' | 'resolution';

export interface MarketRealtimeConfig {
    marketId: string;
    features?: RealtimeFeature[];
    autoSubscribe?: boolean;
    onMarketUpdate?: (market: Market) => void;
    onOrderBookUpdate?: (orderBook: OrderBook) => void;
    onTrade?: (trade: Trade) => void;
    onPositionUpdate?: (positions: Position[]) => void;
    onMarketResolved?: (outcome: string) => void;
    onError?: (error: Error) => void;
}

interface RealtimeSubscription {
    marketId: string;
    channel: any;
    features: Set<RealtimeFeature>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Advanced real-time hook for market data
 * 
 * Features:
 * - Subscribes to market updates, order book changes, trades, positions
 * - Supports selective feature subscription
 * - Auto-reconnection on disconnect
 * - Optimized for performance
 */
export function useMarketRealtime(config: MarketRealtimeConfig) {
    const {
        marketId,
        features = ['market', 'orderbook', 'trades', 'positions'],
        autoSubscribe = true,
        onMarketUpdate,
        onOrderBookUpdate,
        onTrade,
        onPositionUpdate,
        onMarketResolved,
        onError,
    } = config;

    const supabase = createClient();
    const channelRef = useRef<any>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use the store for state management
    const store = useMarketLifecycleStore();

    // Subscribe to store changes
    const market = store.markets[marketId];
    const orderBook = store.orderBooks[marketId];
    const positions = store.positions[marketId] || [];
    const trades = store.recentTrades[marketId] || [];

    // ===========================================================================
    // Connection Management
    // ===========================================================================

    const connect = useCallback(() => {
        if (channelRef.current) {
            console.log(`[useMarketRealtime] Already connected to ${marketId}`);
            return;
        }

        console.log(`[useMarketRealtime] Connecting to market: ${marketId}, features:`, features);

        const channel = supabase.channel(`market-realtime:${marketId}`, {
            config: {
                presence: { key: marketId },
            },
        });

        // Market updates
        if (features.includes('market')) {
            channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'markets',
                    filter: `id=eq.${marketId}`,
                },
                (payload: any) => {
                    console.log(`[useMarketRealtime] Market update:`, payload);

                    if (payload.eventType === 'UPDATE') {
                        const updatedMarket = payload.new as Market;
                        store.updateMarketFromRealtime(updatedMarket);
                        onMarketUpdate?.(updatedMarket);

                        // Check for resolution
                        if (updatedMarket.status === 'resolved' && updatedMarket.outcome) {
                            onMarketResolved?.(updatedMarket.outcome);
                        }
                    }
                }
            );
        }

        // Order book updates (via orders table)
        if (features.includes('orderbook')) {
            channel.on(
                'postgres_changes',
                {
                    event: ['INSERT', 'UPDATE', 'DELETE'],
                    schema: 'public',
                    table: 'orders',
                    filter: `market_id=eq.${marketId}`,
                },
                (payload: any) => {
                    console.log(`[useMarketRealtime] Order book update:`, payload);
                    // Debounce order book refresh
                    store.fetchOrderBook(marketId).then((ob) => {
                        if (ob) {
                            store.updateOrderBookFromRealtime(ob);
                            onOrderBookUpdate?.(ob);
                        }
                    });
                }
            );
        }

        // Trade updates
        if (features.includes('trades')) {
            channel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trades',
                    filter: `market_id=eq.${marketId}`,
                },
                (payload: any) => {
                    console.log(`[useMarketRealtime] New trade:`, payload);
                    const newTrade = payload.new as Trade;
                    store.addTradeFromRealtime(newTrade);
                    onTrade?.(newTrade);
                }
            );
        }

        // Position updates
        if (features.includes('positions')) {
            channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'positions',
                },
                (payload: any) => {
                    // Filter to user's positions for this market
                    if (payload.new?.market_id === marketId || payload.old?.market_id === marketId) {
                        console.log(`[useMarketRealtime] Position update:`, payload);
                        store.fetchPositions(marketId).then((pos) => {
                            onPositionUpdate?.(pos);
                        });
                    }
                }
            );
        }

        // Handle connection status
        channel.on('system', { event: 'disconnected' }, () => {
            console.log(`[useMarketRealtime] Disconnected from ${marketId}`);
            channelRef.current = null;

            // Attempt reconnection after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`[useMarketRealtime] Attempting reconnection to ${marketId}`);
                connect();
            }, 3000);
        });

        channel.on('system', { event: 'connected' }, () => {
            console.log(`[useMarketRealtime] Connected to ${marketId}`);
        });

        // Subscribe
        channel.subscribe((status: string, err?: any) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[useMarketRealtime] Subscribed to ${marketId}`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`[useMarketRealtime] Channel error for ${marketId}:`, err);
                onError?.(new Error(err?.message || 'Channel error'));
            } else if (status === 'TIMED_OUT') {
                console.error(`[useMarketRealtime] Timeout for ${marketId}`);
                onError?.(new Error('Connection timeout'));
            }
        });

        channelRef.current = channel;
    }, [marketId, features, supabase, store]);

    const disconnect = useCallback(() => {
        console.log(`[useMarketRealtime] Disconnecting from ${marketId}`);

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, [marketId, supabase]);

    // ===========================================================================
    // Initial Data Fetch
    // ===========================================================================

    const fetchInitialData = useCallback(async () => {
        console.log(`[useMarketRealtime] Fetching initial data for ${marketId}`);

        try {
            await Promise.all([
                store.fetchMarket(marketId),
                store.fetchOrderBook(marketId),
                store.fetchPositions(marketId),
                store.fetchRecentTrades(marketId),
            ]);
        } catch (error) {
            console.error(`[useMarketRealtime] Error fetching initial data:`, error);
            onError?.(error as Error);
        }
    }, [marketId, store, onError]);

    // ===========================================================================
    // Effects
    // ===========================================================================

    useEffect(() => {
        if (autoSubscribe) {
            fetchInitialData().then(() => {
                connect();
            });
        }

        return () => {
            disconnect();
        };
    }, [marketId, autoSubscribe, connect, disconnect, fetchInitialData]);

    // ===========================================================================
    // Manual Controls
    // ===========================================================================

    const refresh = useCallback(async () => {
        await fetchInitialData();
    }, [fetchInitialData]);

    const subscribe = useCallback(() => {
        connect();
    }, [connect]);

    const unsubscribe = useCallback(() => {
        disconnect();
    }, [disconnect]);

    // ===========================================================================
    // Return
    // ===========================================================================

    return {
        // Data from store
        market,
        orderBook,
        positions,
        trades,

        // Connection state
        isConnected: !!channelRef.current,
        isLoading: store.isLoadingMarkets || store.isLoadingOrderBook,

        // Actions
        refresh,
        subscribe,
        unsubscribe,

        // Direct store access for advanced usage
        store,
    };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for market listing with real-time updates
 */
export function useMarketsRealtime(filters?: {
    status?: string[];
    category?: string;
    trending?: boolean;
}) {
    const store = useMarketLifecycleStore();

    useEffect(() => {
        store.fetchMarkets({
            status: filters?.status as any,
            category: filters?.category ? [filters.category] : undefined,
        });
    }, [filters?.status, filters?.category, filters?.trending]);

    return {
        markets: Object.values(store.markets),
        isLoading: store.isLoadingMarkets,
        refresh: () => store.fetchMarkets(filters as any),
    };
}

/**
 * Hook for price ticker updates
 */
export function usePriceTicker(marketId: string) {
    const supabase = createClient();

    // This is handled via the main hook, but we provide a quick accessor
    const store = useMarketLifecycleStore();
    const market = store.markets[marketId];

    return {
        yesPrice: market?.yes_price || 0.5,
        noPrice: market?.no_price || 0.5,
        yesVolume: market?.yes_volume || 0,
        noVolume: market?.no_volume || 0,
        lastUpdate: market?.updated_at,
    };
}

export default useMarketRealtime;
