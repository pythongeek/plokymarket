import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';

const redis = Redis.fromEnv();
const CACHE_TTL = 1; // 1 second for near real-time

export interface OrderBookLevel {
    price: number;
    size: number;
    total: number;
}

export interface OrderBookSnapshot {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    spread: number;
    lastPrice: number;
    timestamp: string;
}

export class OrderBookService {
    async getOrderBook(marketId: string): Promise<OrderBookSnapshot> {
        const cacheKey = `orderbook:${marketId}`;

        // Try cache first — avoids DB query on every request
        const cached = await redis.get<OrderBookSnapshot>(cacheKey);
        if (cached) {
            return cached;
        }

        // Cache miss — reconstruct from database
        const supabase = await createClient();

        // Fetch all open or partially filled YES outcome orders
        const { data: yesOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .eq('outcome', 'yes')
            .in('status', ['open', 'partially_filled'])
            .order('price', { ascending: false });

        // Fetch all open or partially filled NO outcome orders
        const { data: noOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .eq('outcome', 'no')
            .in('status', ['open', 'partially_filled'])
            .order('price', { ascending: false });

        /*
          BID SIDE = demand for YES outcome
          - Users buying YES contracts
          - Users selling NO contracts (equivalent exposure)
          Sorted DESCENDING (highest bid first)
        */
        const bids = this.aggregateOrders(
            [
                ...(yesOrders?.filter(o => o.side === 'buy') || []),
                ...(noOrders?.filter(o => o.side === 'sell') || [])
            ],
            'desc'
        );

        /*
          ASK SIDE = supply of YES outcome
          - Users selling YES contracts
          - Users buying NO contracts (equivalent exposure)
          Sorted ASCENDING (lowest ask first)
        */
        const asks = this.aggregateOrders(
            [
                ...(yesOrders?.filter(o => o.side === 'sell') || []),
                ...(noOrders?.filter(o => o.side === 'buy') || [])
            ],
            'asc'
        );

        const bestBid = bids[0]?.price || 0;
        const bestAsk = asks[0]?.price || 1;

        const snapshot: OrderBookSnapshot = {
            bids,
            asks,
            spread: bestAsk - bestBid,
            lastPrice: (bestBid + bestAsk) / 2,
            timestamp: new Date().toISOString()
        };

        // Write to Redis cache; expires after CACHE_TTL seconds
        await redis.setex(cacheKey, CACHE_TTL, snapshot);

        return snapshot;
    }

    /*
      Aggregates raw order rows into price levels.
      - Groups orders by price
      - Sums remaining unfilled quantity at each price level
      - Skips fully filled orders (remaining <= 0)
      - Returns sorted array of { price, size, total }
    */
    private aggregateOrders(
        orders: any[],
        sort: 'asc' | 'desc'
    ): OrderBookLevel[] {
        const aggregated = new Map<number, number>();

        for (const order of orders) {
            const remaining = order.quantity - order.filled_quantity;
            if (remaining > 0) {
                const current = aggregated.get(order.price) || 0;
                aggregated.set(order.price, current + remaining);
            }
        }

        const result = Array.from(aggregated.entries())
            .map(([price, size]) => ({ price, size, total: price * size }))
            .sort((a, b) =>
                sort === 'desc' ? b.price - a.price : a.price - b.price
            );

        return result;
    }

    // Call this after any order mutation (create, cancel, fill) to force DB re-read
    async invalidateCache(marketId: string): Promise<void> {
        await redis.del(`orderbook:${marketId}`);
    }
}

// Export singleton instance — import this everywhere, do NOT instantiate a new class
export const orderBookService = new OrderBookService();
