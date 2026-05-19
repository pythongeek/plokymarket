import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface UseOrderBookResult {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastTradePrice: number | null;
  lastTradeSide: 'buy' | 'sell' | null;
  spread: number;
  isConnected: boolean;
  error: string | null;
}

interface RawOrder {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  filled_quantity: number;
  remaining_quantity: number;
  status: string;
}

interface RawTrade {
  price: number;
  side: 'buy' | 'sell';
}

/**
 * useOrderBook — Snapshot + Delta streaming order book
 *
 * 1. Fetches initial snapshot of open orders grouped by price
 * 2. Subscribes to Supabase Realtime for orders + trades
 * 3. Applies deltas to local React state
 */
export function useOrderBook(marketId: string): UseOrderBookResult {
  const supabase = createClient();
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [lastTradePrice, setLastTradePrice] = useState<number | null>(null);
  const [lastTradeSide, setLastTradeSide] = useState<'buy' | 'sell' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref for the book map to avoid stale closures in the realtime callback
  const bookRef = useRef<{
    bids: Map<number, OrderBookLevel>;
    asks: Map<number, OrderBookLevel>;
  }>({ bids: new Map(), asks: new Map() });

  const syncState = useCallback(() => {
    const bidLevels = Array.from(bookRef.current.bids.values())
      .filter((l) => l.quantity > 0)
      .sort((a, b) => b.price - a.price);
    const askLevels = Array.from(bookRef.current.asks.values())
      .filter((l) => l.quantity > 0)
      .sort((a, b) => a.price - b.price);
    setBids(bidLevels);
    setAsks(askLevels);
  }, []);

  // ── Snapshot fetch ──
  const fetchSnapshot = useCallback(async () => {
    if (!marketId) return;
    try {
      const { data, error: dbError } = await supabase
        .from('orders')
        .select('id, side, price, quantity, filled_quantity, remaining_quantity, status')
        .eq('market_id', marketId)
        .eq('status', 'open')
        .order('price', { ascending: false });

      if (dbError) throw dbError;

      const bidMap = new Map<number, OrderBookLevel>();
      const askMap = new Map<number, OrderBookLevel>();

      (data || []).forEach((row: RawOrder) => {
        const rem = Number(row.remaining_quantity);
        if (rem <= 0) return;
        const price = Number(row.price);
        const map = row.side === 'buy' ? bidMap : askMap;
        const existing = map.get(price);
        if (existing) {
          existing.quantity += rem;
          existing.orderCount += 1;
        } else {
          map.set(price, { price, quantity: rem, orderCount: 1 });
        }
      });

      bookRef.current = { bids: bidMap, asks: askMap };
      syncState();
    } catch (err: any) {
      console.error('[useOrderBook] Snapshot error:', err);
      setError(err.message);
    }
  }, [marketId, supabase, syncState]);

  // ── Delta application ──
  const applyDelta = useCallback(
    (payload: any) => {
      const { eventType, new: newRow, old: oldRow } = payload;
      if (!newRow && !oldRow) return;

      const side = (newRow?.side || oldRow?.side) as 'buy' | 'sell';
      const price = Number(newRow?.price || oldRow?.price);
      if (!price || !side) return;

      const map = side === 'buy' ? bookRef.current.bids : bookRef.current.asks;

      if (eventType === 'INSERT') {
        const rem = Number(newRow.remaining_quantity || newRow.quantity);
        if (newRow.status !== 'open' || rem <= 0) return;
        const existing = map.get(price);
        if (existing) {
          existing.quantity += rem;
          existing.orderCount += 1;
        } else {
          map.set(price, { price, quantity: rem, orderCount: 1 });
        }
      } else if (eventType === 'UPDATE') {
        const oldRem = Number(oldRow?.remaining_quantity || oldRow?.quantity || 0);
        const newRem = Number(newRow?.remaining_quantity || newRow?.quantity || 0);
        const delta = newRem - oldRem; // negative if filled, positive if added
        const existing = map.get(price);
        if (existing) {
          existing.quantity += delta;
          if (newRow.status !== 'open') {
            // Order closed — subtract all remaining
            existing.quantity -= newRem;
            existing.orderCount = Math.max(0, existing.orderCount - 1);
          }
          if (existing.quantity <= 0) map.delete(price);
        }
      } else if (eventType === 'DELETE') {
        const rem = Number(oldRow?.remaining_quantity || oldRow?.quantity || 0);
        const existing = map.get(price);
        if (existing) {
          existing.quantity -= rem;
          existing.orderCount = Math.max(0, existing.orderCount - 1);
          if (existing.quantity <= 0) map.delete(price);
        }
      }

      syncState();
    },
    [syncState]
  );

  useEffect(() => {
    if (!marketId) return;
    setError(null);
    setIsConnected(false);

    // 1. Snapshot
    fetchSnapshot();

    // 2. Realtime — Orders
    const orderChannel = supabase
      .channel(`market-${marketId}-orders`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          console.log('[Realtime] Order delta:', payload);
          applyDelta(payload);
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Orders channel status:', status);
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsConnected(false);
      });

    // 3. Realtime — Trades (tape)
    const tradeChannel = supabase
      .channel(`market-${marketId}-trades`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          const row = payload.new as RawTrade;
          console.log('[Realtime] Trade:', row);
          if (row.price) {
            setLastTradePrice(Number(row.price));
            setLastTradeSide(row.side);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Trades channel status:', status);
      });

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [marketId, supabase, fetchSnapshot, applyDelta]);

  const spread =
    asks.length > 0 && bids.length > 0
      ? Number((asks[0].price - bids[0].price).toFixed(4))
      : 0;

  return { bids, asks, lastTradePrice, lastTradeSide, spread, isConnected, error };
}
