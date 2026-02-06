import { useEffect, useState } from 'react';
import { OrderLevel, OrderBookState } from '@/lib/clob/types';

// Mocking the WS interface with polling for MVP Next.js API compatibility
export function useOrderBook(marketId: string, depth: number = 20) {
    const [bids, setBids] = useState<OrderLevel[]>([]);
    const [asks, setAsks] = useState<OrderLevel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchBook = async () => {
            try {
                const res = await fetch(`/api/orderbook/${marketId}`);
                if (!res.ok) return;
                const data: OrderBookState = await res.json();

                if (mounted) {
                    setBids(data.bids.slice(0, depth));
                    setAsks(data.asks.slice(0, depth));
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to fetch orderbook", e);
            }
        };

        fetchBook();
        // Poll every 1 second
        const interval = setInterval(fetchBook, 1000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [marketId, depth]);

    return { bids, asks, loading };
}
