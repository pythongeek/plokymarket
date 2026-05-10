import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const { searchParams } = new URL(req.url);
        const depth = parseInt(searchParams.get('depth') || '20');

        const supabase = await createClient();

        // Get open orders aggregated by price
        const { data: buyOrders } = await supabase
            .from('orders')
            .select('price, quantity, filled_quantity')
            .eq('market_id', id)
            .eq('side', 'buy')
            .eq('status', 'open')
            .order('price', { ascending: false })
            .limit(depth * 2);

        const { data: sellOrders } = await supabase
            .from('orders')
            .select('price, quantity, filled_quantity')
            .eq('market_id', id)
            .eq('side', 'sell')
            .eq('status', 'open')
            .order('price', { ascending: true })
            .limit(depth * 2);

        // Aggregate by price level
        const aggregate = (orders: any[]) => {
            const map = new Map<number, number>();
            for (const o of orders || []) {
                const remaining = o.quantity - (o.filled_quantity || 0);
                if (remaining <= 0) continue;
                const price = Math.round(o.price * 100) / 100;
                map.set(price, (map.get(price) || 0) + remaining);
            }
            return Array.from(map.entries())
                .map(([price, size]) => ({ price, size }))
                .sort((a, b) => b.price - a.price);
        };

        const bids = aggregate(buyOrders || []);
        const asks = aggregate(sellOrders || []);

        // Calculate cumulative for depth
        const addCumulative = (arr: any[]) => {
            let cum = 0;
            return arr.map((item) => {
                cum += item.size;
                return { ...item, cumulative: cum };
            });
        };

        // Recent trades
        const { data: trades } = await supabase
            .from('trades')
            .select('price, quantity, executed_at, buyer_order_id, seller_order_id')
            .eq('market_id', id)
            .order('executed_at', { ascending: false })
            .limit(20);

        // Fetch trade sides
        const tradeDetails = [];
        if (trades) {
            for (const t of trades) {
                const { data: buyer } = await supabase
                    .from('orders')
                    .select('side')
                    .eq('id', t.buyer_order_id)
                    .single();
                tradeDetails.push({
                    price: t.price,
                    quantity: t.quantity,
                    time: t.executed_at,
                    side: buyer?.side === 'buy' ? 'buy' : 'sell',
                });
            }
        }

        // Price history (last 24h trades for sparkline)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: history } = await supabase
            .from('trades')
            .select('price, executed_at')
            .eq('market_id', id)
            .gte('executed_at', since)
            .order('executed_at', { ascending: true });

        return NextResponse.json({
            market_id: id,
            bids: addCumulative(bids.slice(0, depth)),
            asks: addCumulative(asks.slice(0, depth)),
            trades: tradeDetails,
            priceHistory: (history || []).map((h) => ({
                price: h.price,
                time: h.executed_at,
            })),
            spread: asks.length > 0 && bids.length > 0 ? asks[0].price - bids[0].price : null,
            lastPrice: tradeDetails[0]?.price || null,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
