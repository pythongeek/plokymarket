import { useEffect, useState, useRef } from 'react';
import { MarketDataLevel, OrderBookState } from '@/lib/clob/types';
import { createClient } from '@supabase/supabase-js';
import { decode } from '@msgpack/msgpack';

// Browser-compatible zlib decompression
async function decompress(base64: string): Promise<Uint8Array> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Native browser decompression (modern browsers)
    const ds = new (window as any).DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();

    const response = new Response(ds.readable);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useOrderBook(marketId: string, depthValue: number = 100, granularity: number = 1) {
    const [bids, setBids] = useState<MarketDataLevel[]>([]);
    const [asks, setAsks] = useState<MarketDataLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [midPrice, setMidPrice] = useState<number | null>(null);

    // Sequence Tracking
    const lastSeq = useRef<number>(0);
    const isResyncing = useRef<boolean>(false);
    const watchdogTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!marketId) return;
        let mounted = true;

        const resetWatchdog = () => {
            if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
            watchdogTimer.current = setTimeout(() => {
                console.warn('[OrderBook] Watchdog timeout: 90s silence. Resyncing...');
                fetchSnapshot();
            }, 90000); // 3 missed 30s heartbeats
        };

        const fetchSnapshot = async () => {
            if (isResyncing.current) return;
            isResyncing.current = true;
            try {
                // Use granularity in API call if provided
                const res = await fetch(`/api/orderbook/${marketId}?granularity=${granularity}`);
                if (!res.ok) throw new Error('Snapshot failed');
                const data: OrderBookState = await res.json();
                if (mounted) {
                    const topBids = data.bids.slice(0, depthValue);
                    const topAsks = data.asks.slice(0, depthValue);
                    setBids(topBids);
                    setAsks(topAsks);

                    if (topBids[0] && topAsks[0]) {
                        setMidPrice((topBids[0].price + topAsks[0].price) / 2);
                    } else if (topBids[0]) {
                        setMidPrice(topBids[0].price);
                    } else if (topAsks[0]) {
                        setMidPrice(topAsks[0].price);
                    }

                    setLoading(false);
                    // Reset watchdog upon successful snapshot
                    resetWatchdog();
                }
            } catch (e) {
                console.error("Resync error:", e);
            } finally {
                isResyncing.current = false;
            }
        };

        fetchSnapshot();

        const channel = supabase.channel(`market:${marketId}:${granularity}`, {
            config: { broadcast: { self: false } }
        });

        const handleUpdate = (update: any) => {
            resetWatchdog(); // Activity detected

            // 1. Sequence & Idempotency Check
            if (update.seq <= lastSeq.current && lastSeq.current !== 0) {
                return;
            }

            if (lastSeq.current !== 0 && update.seq > lastSeq.current + 1) {
                console.warn(`[OrderBook] Gap detected: ${lastSeq.current} -> ${update.seq}. Resyncing...`);
                fetchSnapshot();
                return;
            }
            lastSeq.current = update.seq;

            // 2. ACK requested critical events
            if (update.ack) {
                channel.send({
                    type: 'broadcast',
                    event: 'market:ack',
                    payload: { seq: update.seq }
                });
            }

            // 3. Apply Deltas
            const apply = (prev: MarketDataLevel[], deltas: any[], sortAsc: boolean) => {
                const newLevels = [...prev];
                deltas.forEach(([price, size, total]: [number, number, number]) => {
                    // Note: If granularity > 1, the price in deltas must match the bucket price
                    // For now, we assume the server sends tick-level updates and we aggregate or
                    // the server sends granular updates if we subscribe to a specific channel.
                    // But our publisher doesn't support multiple granularities yet.
                    // So we must aggregate locally if granularity > 1.

                    let targetPrice = price;
                    if (granularity > 1) {
                        const tickSize = 0.0001;
                        const gFactor = granularity * tickSize;
                        targetPrice = Math.floor(price / gFactor) * gFactor;
                    }

                    const idx = newLevels.findIndex(l => Math.abs(l.price - targetPrice) < 0.000001);
                    if (size === 0) {
                        if (idx > -1) newLevels.splice(idx, 1);
                    } else {
                        const newLevel = { price: targetPrice, size, total };
                        if (idx > -1) newLevels[idx] = newLevel;
                        else newLevels.push(newLevel);
                    }
                });
                return newLevels.sort((a, b) => sortAsc ? a.price - b.price : b.price - a.price).slice(0, depthValue);
            };

            if (update.b && update.b.length > 0) setBids(prev => {
                const result = apply(prev, update.b, false);
                if (result[0] && update.a && update.a[0]) {
                    setMidPrice((result[0].price + update.a[0][0]) / 2);
                }
                return result;
            });
            if (update.a && update.a.length > 0) setAsks(prev => {
                const result = apply(prev, update.a, true);
                if (result[0] && update.b && update.b[0]) {
                    setMidPrice((update.b[0][0] + result[0].price) / 2);
                }
                return result;
            });
        };

        const handleRealtimeMessage = async (msg: any) => {
            if (!mounted || isResyncing.current) return;
            try {
                const buffer = await decompress(msg.payload.data);
                const decoded = decode(buffer) as any;

                if (decoded.t === 'upd') {
                    handleUpdate(decoded);
                } else if (decoded.t === 'batch') {
                    decoded.msgs.forEach((m: any) => {
                        if (m.t === 'upd') handleUpdate(m);
                    });
                } else if (decoded.t === 'hb') {
                    resetWatchdog(); // Heartbeat received
                }
            } catch (e) {
                console.error("Realtime decode error:", e);
            }
        };

        channel
            .on('broadcast', { event: 'market:update' }, handleRealtimeMessage)
            .subscribe();

        return () => {
            mounted = false;
            if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
            supabase.removeChannel(channel);
        };
    }, [marketId, depthValue, granularity]);

    return { bids, asks, loading, midPrice };
}
