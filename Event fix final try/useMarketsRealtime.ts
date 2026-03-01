/**
 * ============================================================
 * useMarketsRealtime.ts — Supabase real-time subscription hook
 * ============================================================
 * Listens to live changes in the markets and trades tables so
 * the UI updates automatically without the user refreshing.
 *
 * How Supabase real-time works:
 *   Supabase wraps PostgreSQL's logical replication (WAL) into a
 *   WebSocket channel. We subscribe to table changes with filters
 *   like eq('market_id', id), and Supabase sends us the new row
 *   whenever an INSERT/UPDATE fires on that row.
 *
 * Usage — single market page:
 *   const { yesPrice, volume, isConnected } = useMarketRealtime(marketId);
 *
 * Usage — market listing page (many markets at once):
 *   const prices = useMarketsRealtime(marketIds);
 *   // prices is a Map<marketId, { yesPrice, noPrice, volume }>
 *
 * Notes:
 *   - Requires Supabase Realtime to be ENABLED for the 'markets' table
 *     in your Supabase dashboard (Database → Replication → markets ✓)
 *   - Unsubscribes automatically when the component unmounts
 *   - Reconnects automatically on tab focus (via Supabase client internals)
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarketPrice {
  yes_price:    number;
  no_price:     number;
  total_volume: number;
  liquidity:    number;
  updated_at:   string;
}

export interface UseMarketRealtimeReturn {
  price:       MarketPrice | null;  // null until first update or initial fetch
  isConnected: boolean;
  error:       string | null;
}

export type MarketPriceMap = Map<string, MarketPrice>;

// ── Single-market hook ───────────────────────────────────────────────────────

/**
 * Subscribe to live price updates for ONE market.
 * Also performs an initial fetch so data is available before the first WS event.
 *
 * @param marketId - UUID of the market to watch, or null to disable
 */
export function useMarketRealtime(marketId: string | null): UseMarketRealtimeReturn {
  const [price, setPrice] = useState<MarketPrice | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initial data fetch — so the component has data before the first WS event
  useEffect(() => {
    if (!marketId) return;

    const supabase = createClient();
    supabase
      .from('markets')
      .select('yes_price, no_price, total_volume, liquidity, updated_at')
      .eq('id', marketId)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          return;
        }
        if (data) {
          setPrice({
            yes_price:    data.yes_price    ?? 0.50,
            no_price:     data.no_price     ?? 0.50,
            total_volume: data.total_volume ?? 0,
            liquidity:    data.liquidity    ?? 0,
            updated_at:   data.updated_at   ?? new Date().toISOString(),
          });
        }
      });
  }, [marketId]);

  // Real-time subscription
  useEffect(() => {
    if (!marketId) return;

    const supabase = createClient();

    // Each channel needs a unique name to avoid collisions
    const channelName = `market-price-${marketId}`;

    const channel = supabase
      .channel(channelName)
      // Subscribe to UPDATE events on the markets row for this market
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'markets',
          filter: `id=eq.${marketId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<MarketPrice>;
          setPrice(prev => ({
            yes_price:    updated.yes_price    ?? prev?.yes_price    ?? 0.50,
            no_price:     updated.no_price     ?? prev?.no_price     ?? 0.50,
            total_volume: updated.total_volume ?? prev?.total_volume ?? 0,
            liquidity:    updated.liquidity    ?? prev?.liquidity    ?? 0,
            updated_at:   updated.updated_at   ?? new Date().toISOString(),
          }));
        }
      )
      // Also listen to new trades so we know the volume ticked up
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'trades',
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          const trade = payload.new as { price?: number; quantity?: number; outcome?: string };
          // Optimistically bump volume on trade insert
          // (the DB trigger will send the authoritative UPDATE shortly after)
          setPrice(prev => prev ? {
            ...prev,
            total_volume: prev.total_volume + (trade.quantity ?? 0) * (trade.price ?? 0),
          } : prev);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(`Real-time connection ${status.toLowerCase()}`);
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or marketId changes
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [marketId]);

  return { price, isConnected, error };
}

// ── Multi-market hook ────────────────────────────────────────────────────────

/**
 * Subscribe to live price updates for MULTIPLE markets simultaneously.
 * Used on market listing pages where you want all cards to tick live.
 *
 * Supabase supports a single broadcast channel for multiple filters via
 * OR conditions in the filter string, but for simplicity we use one
 * subscription without a filter and client-side filter the updates.
 * This is efficient for up to ~50 markets per page.
 *
 * @param marketIds - Array of market UUIDs to watch
 */
export function useMarketsRealtime(marketIds: string[]): {
  prices: MarketPriceMap;
  isConnected: boolean;
} {
  const [prices, setPrices] = useState<MarketPriceMap>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const idSetRef = useRef<Set<string>>(new Set(marketIds));

  // Keep the ID set in sync without re-subscribing
  useEffect(() => {
    idSetRef.current = new Set(marketIds);
  }, [marketIds]);

  // Initial bulk fetch
  const fetchInitial = useCallback(async () => {
    if (marketIds.length === 0) return;
    const supabase = createClient();

    const { data } = await supabase
      .from('markets')
      .select('id, yes_price, no_price, total_volume, liquidity, updated_at')
      .in('id', marketIds);

    if (data) {
      const map = new Map<string, MarketPrice>();
      data.forEach(m => {
        map.set(m.id, {
          yes_price:    m.yes_price    ?? 0.50,
          no_price:     m.no_price     ?? 0.50,
          total_volume: m.total_volume ?? 0,
          liquidity:    m.liquidity    ?? 0,
          updated_at:   m.updated_at   ?? '',
        });
      });
      setPrices(map);
    }
  }, [marketIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Broadcast subscription — no per-market filter, we filter client-side
  useEffect(() => {
    if (marketIds.length === 0) return;

    const supabase = createClient();

    const channel = supabase
      .channel('all-markets-prices')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'markets' },
        (payload) => {
          const updated = payload.new as { id: string } & Partial<MarketPrice>;
          if (!idSetRef.current.has(updated.id)) return; // ignore unrelated markets

          setPrices(prev => {
            const next = new Map(prev);
            const existing = next.get(updated.id);
            next.set(updated.id, {
              yes_price:    updated.yes_price    ?? existing?.yes_price    ?? 0.50,
              no_price:     updated.no_price     ?? existing?.no_price     ?? 0.50,
              total_volume: updated.total_volume ?? existing?.total_volume ?? 0,
              liquidity:    updated.liquidity    ?? existing?.liquidity    ?? 0,
              updated_at:   updated.updated_at   ?? new Date().toISOString(),
            });
            return next;
          });
        }
      )
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, []); // intentionally only runs once — we update idSetRef reactively above

  return { prices, isConnected };
}

// ── Connection status hook ───────────────────────────────────────────────────

/**
 * Simple hook that indicates whether the Supabase realtime WebSocket
 * is connected. Useful for showing an offline indicator in the UI.
 */
export function useRealtimeStatus(): 'connected' | 'connecting' | 'disconnected' {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('status-check')
      .subscribe(s => {
        if (s === 'SUBSCRIBED')    setStatus('connected');
        else if (s === 'CLOSED')   setStatus('disconnected');
        else                       setStatus('connecting');
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  return status;
}
