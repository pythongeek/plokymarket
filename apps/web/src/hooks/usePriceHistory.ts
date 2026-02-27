import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PricePoint {
    price: number;
    recorded_at: string;
}

/**
 * Hook to fetch and track price history for a specific market outcome
 * @param marketId UUID of the market
 * @param outcome 'YES', 'NO', or custom outcome label
 * @param hours Number of hours of history to fetch (default 24)
 */
export function usePriceHistory(marketId: string, outcome: string = 'YES', hours = 24) {
    const [data, setData] = useState<PricePoint[]>([]);
    const [delta24h, setDelta24h] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!marketId) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            const supabase = createClient();
            const since = new Date(Date.now() - hours * 3600000).toISOString();

            try {
                const { data: history, error: fetchError } = await supabase
                    .from('price_history')
                    .select('price, recorded_at')
                    .eq('market_id', marketId)
                    .eq('outcome', outcome)
                    .gte('recorded_at', since)
                    .order('recorded_at', { ascending: true });

                if (fetchError) throw fetchError;

                if (history && history.length > 0) {
                    setData(history);

                    if (history.length > 1) {
                        const first = history[0].price;
                        const last = history[history.length - 1].price;
                        // Calculate delta as percentage points (0-100)
                        setDelta24h(Number(((last - first) * 100).toFixed(2)));
                    } else {
                        setDelta24h(0);
                    }
                } else {
                    setData([]);
                    setDelta24h(0);
                }
            } catch (err: any) {
                console.error('[usePriceHistory] Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        // Subscribe to real-time price updates (future enhancement)
        // const channel = supabase.channel(`price_history:${marketId}:${outcome}`)
        // ...

    }, [marketId, outcome, hours]);

    return { data, delta24h, loading, error };
}
