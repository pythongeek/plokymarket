'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeOrders(marketId: string) {
    const [orders, setOrders] = useState<any[]>([]);
    const supabase = createClient();

    useEffect(() => {
        // Initial fetch: load all open or partially filled orders for this market
        const fetchOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('market_id', marketId)
                .in('status', ['open', 'partially_filled'])
                .order('created_at', { ascending: false });
            setOrders(data || []);
        };

        fetchOrders();

        // Subscribe to all changes (INSERT, UPDATE, DELETE) on the orders table
        // filtered to the current marketId only
        const channel = supabase
            .channel(`orders:${marketId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `market_id=eq.${marketId}`
                },
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        // Prepend new order to the top of the list
                        setOrders(prev => [payload.new as any, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        // Replace the matching order in-place by id
                        setOrders(prev =>
                            prev.map(o => o.id === (payload.new as any).id ? payload.new as any : o)
                        );
                    } else if (payload.eventType === 'DELETE') {
                        // Remove the deleted order by matching on payload.old.id
                        setOrders(prev =>
                            prev.filter(o => o.id !== (payload.old as any).id)
                        );
                    }
                }
            )
            .subscribe();

        // Cleanup: unsubscribe from the channel when the component unmounts
        // or when marketId changes
        return () => {
            supabase.removeChannel(channel);
        };
    }, [marketId]); // Re-run effect only when marketId changes

    return orders;
}

export function useRealtimeTrades(marketId: string) {
    const [trades, setTrades] = useState<any[]>([]);
    const supabase = createClient();

    useEffect(() => {
        // Initial fetch: load the 50 most recent trades for this market
        const fetchTrades = async () => {
            const { data } = await supabase
                .from('trades')
                .select('*')
                .eq('market_id', marketId)
                .order('created_at', { ascending: false })
                .limit(50);
            setTrades(data || []);
        };

        fetchTrades();

        // Subscribe to INSERT events only on the trades table
        // filtered to the current marketId only
        const channel = supabase
            .channel(`trades:${marketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'trades',
                    filter: `market_id=eq.${marketId}`
                },
                (payload: any) => {
                    // Prepend new trade and cap the list at 50 items
                    setTrades(prev => [payload.new as any, ...prev].slice(0, 50));
                }
            )
            .subscribe();

        // Cleanup: unsubscribe from the channel when the component unmounts
        // or when marketId changes
        return () => {
            supabase.removeChannel(channel);
        };
    }, [marketId]); // Re-run effect only when marketId changes

    return trades;
}
