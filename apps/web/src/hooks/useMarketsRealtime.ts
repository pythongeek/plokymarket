'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useMarketStore } from '@/store/marketStore';
import { Event } from '@/types/database';

/**
 * useMarketsRealtime Hook
 * 
 * Subscribes to real-time changes in the 'markets' and 'events' tables
 * and synchronizes them with the Zustand marketStore.
 * Filters for 'active' status on inserts and updates.
 */
export function useMarketsRealtime() {
    const { addEvent, updateEvent, removeEvent } = useMarketStore();

    useEffect(() => {
        if (!supabase) return;

        // 1. Subscribe to 'events' table
        const eventsChannel = supabase
            .channel('public:events:home')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'events',
                    filter: 'status=eq.active'
                },
                (payload: any) => {
                    console.log('Real-time Event INSERT:', payload.new);
                    addEvent(payload.new as Event);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'events'
                },
                (payload: any) => {
                    const updatedEvent = payload.new as Event;
                    console.log('Real-time Event UPDATE:', updatedEvent);

                    if (updatedEvent.status === 'active') {
                        updateEvent(updatedEvent.id, updatedEvent);
                    } else {
                        removeEvent(updatedEvent.id);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'events'
                },
                (payload: any) => {
                    console.log('Real-time Event DELETE:', payload.old);
                    removeEvent((payload.old as any).id);
                }
            )
            .subscribe((status: string) => {
                if (status !== 'SUBSCRIBED') {
                    console.warn('Supabase events subscription status:', status);
                }
            });

        // 2. Subscribe to 'markets' table
        const marketsChannel = supabase
            .channel('public:markets:home')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'markets',
                    filter: 'status=eq.active'
                },
                (payload: any) => {
                    console.log('Real-time Market INSERT:', payload.new);
                    // Add market data to relevant event
                    const market = payload.new;
                    updateEvent(market.event_id, {
                        ...market, // Merging market fields into event for UI
                        has_market: true,
                        market_id: market.id
                    } as any);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'markets'
                },
                (payload: any) => {
                    const updatedMarket = payload.new as any;
                    console.log('Real-time Market UPDATE:', updatedMarket);

                    if (updatedMarket.status === 'active') {
                        updateEvent(updatedMarket.id, updatedMarket);
                    } else {
                        removeEvent(updatedMarket.id);
                    }
                }
            )
            .subscribe();

        // Cleanup on unmount
        return () => {
            supabase.removeChannel(eventsChannel);
            supabase.removeChannel(marketsChannel);
        };
    }, [addEvent, updateEvent, removeEvent]);
}
