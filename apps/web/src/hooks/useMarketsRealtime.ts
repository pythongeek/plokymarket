import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import type { Market } from '@/types';

interface MarketFilter {
    category: string;
    sortBy: string;
    status: string;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const BACKOFF_INTERVALS = [1000, 2000, 4000, 8000, 16000, 30000]; // Exp backoff up to 30s
const POLLING_INTERVAL = 10000; // 10s fallback polling

export const useMarketsRealtime = (filter: MarketFilter) => {
    const { markets, fetchMarkets, addMarket, updateMarket, removeMarket } = useStore();
    const reconnectAttemptsTracker = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<any>(null);

    // Fallback Polling Mechanism
    const startPolling = useCallback(() => {
        if (pollingIntervalRef.current) return;
        console.log('[MarketsRealtime] Starting fallback polling mechanism...');
        pollingIntervalRef.current = setInterval(() => {
            fetchMarkets();
        }, POLLING_INTERVAL);
    }, [fetchMarkets]);

    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    const connectRealtime = useCallback(() => {
        // Clean up previous channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel('markets-feed')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'events',
            }, (payload: any) => {
                const newMarket = payload.new as Market;
                addMarket(newMarket);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'events',
            }, (payload: any) => {
                updateMarket(payload.new.id, payload.new as Partial<Market>);
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'events',
            }, (payload: any) => {
                removeMarket(payload.old.id);
            })
            .subscribe((status: string, err?: any) => {
                console.log('[MarketsRealtime] Status:', status, err);

                if (status === 'SUBSCRIBED') {
                    // Success: reset attempts, stop polling
                    reconnectAttemptsTracker.current = 0;
                    stopPolling();
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    // Failure: Exponential backoff logic
                    if (reconnectAttemptsTracker.current < MAX_RECONNECT_ATTEMPTS) {
                        const backoffTime = BACKOFF_INTERVALS[Math.min(reconnectAttemptsTracker.current, BACKOFF_INTERVALS.length - 1)];
                        console.log(`[MarketsRealtime] Reconnecting in ${backoffTime}ms (Attempt ${reconnectAttemptsTracker.current + 1})`);

                        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                        reconnectTimeoutRef.current = setTimeout(() => {
                            reconnectAttemptsTracker.current += 1;
                            connectRealtime();
                        }, backoffTime);
                    } else {
                        // Max attempts reached, fallback to polling
                        console.log(`[MarketsRealtime] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Falling back to polling.`);
                        startPolling();
                    }
                }
            });

        channelRef.current = channel;
    }, [addMarket, updateMarket, removeMarket, startPolling, stopPolling]);

    // Initial Boot & Cleanup
    useEffect(() => {
        // Initial fetch to ensure hydration
        fetchMarkets();

        // Start realtime connection
        connectRealtime();

        return () => {
            // Cleanup all resources when hook unmounts or filter completely changes context
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            stopPolling();
        };
    }, [connectRealtime, fetchMarkets, stopPolling]);

    // Returning derived/filtered lists can be handled at page level or here
    return { markets };
};
