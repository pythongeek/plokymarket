// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { pool } from '@/lib/admin/local-db';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { orderBookService } from '@/lib/services/orderBookService';
import { ActivityService } from '@/lib/activity';
import { syncAfterMatch, initializeRealtimeEngine } from '@/lib/realtime/OrderBookBroadcast';
import { checkTradingRateLimit, addRateLimitHeaders } from '@/lib/upstash/rateLimit';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX');

async function getUserFromRequest(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}

export async function POST(request: Request) {
    try {
        const supabase = createPublicClient();

        // Authenticate — all order operations require a logged-in user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { market_id, side, outcome, price, quantity, order_type = 'limit' } = body;

        // Apply trading-specific rate limiting (per market, 5 trades per 10 seconds)
        let tradingResult; try { tradingResult = await checkTradingRateLimit(user.id, market_id); } catch { tradingResult = { allowed: true }; }
        
        if (!tradingResult.allowed) {
            const response = NextResponse.json(
                {
                    error: 'Trading rate limit exceeded. Please slow down.',
                    code: 'TRADING_RATE_LIMITED',
                    retryAfter: tradingResult.retryAfter,
                },
                { status: 429 }
            );
            return addRateLimitHeaders(response, tradingResult);
        }

        // Field-level validation — all five core fields are required
        if (!market_id || !side || !outcome || !price || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        /*
          Price must be a probability between 0.01 and 0.99.
          Prices of exactly 0 or 1 are not allowed as they represent
          certainty and would break the matching logic.
        */
        if (price < 0.01 || price > 0.99) {
            return NextResponse.json(
                { error: 'Price must be between 0.01 and 0.99' },
                { status: 400 }
            );
        }

        /*
          Minimum order size is ৳10 (BDT).
          This prevents dust orders that would clog the order book.
        */
        if (quantity < 10) {
            return NextResponse.json(
                { error: 'Minimum order size is ৳10' },
                { status: 400 }
            );
        }

        // Total cost for buyer = price * quantity
        const requiredFunds = price * quantity;

        // Idempotency key — client provided, or fallback generated
        const idempotencyKey = body.idempotency_key || `order-${user.id}-${Date.now()}`;

        // ✅ SINGLE ATOMIC RPC — balance check + freeze + order insert
        // Eliminates TOCTOU race condition
        const poolResult = await pool.query('SELECT order_id, error FROM place_order_atomic($1, $2, $3, $4, $5, $6, $7, $8)', [
            user.id,
            market_id,
            side,
            outcome,
            price,
            quantity,
            order_type,
            idempotencyKey
        ]);

        const result = poolResult.rows[0] as { error?: string, order_id?: string } | null;

        if (!result || result?.error) {
            return NextResponse.json(
                { error: result?.error || 'Order placement failed' },
                { status: result?.error === 'Insufficient balance' ? 400 : 500 }
            );
        }

        const orderId = result?.order_id;
        if (!orderId) {
            return NextResponse.json({ error: 'Order placement failed (no ID)' }, { status: 500 });
        }

        /*
          Trigger the matching engine via a Supabase RPC.
          The `match_order` function matches the order against counterparty orders.
          Fire-and-forget from the API perspective — errors don't roll back the order.
        */
        try {
            await supabase.rpc('match_order', { p_order_id: orderId });
        } catch (matchError) {
            // Matching failed - order remains open for future matching
            console.error('[Order API] match_order error:', matchError);
        }

        // Broadcast realtime orderbook update after match
        try {
            await syncAfterMatch(market_id, orderId);
        } catch (broadcastError) {
            console.warn('[Order API] Realtime broadcast error:', broadcastError);
        }

        // Invalidate order book cache so next reader gets fresh data
        await orderBookService.invalidateCache(market_id);

        // Log Activity
        try {
            const activityService = new ActivityService();
            await activityService.logActivity({
                userId: user.id,
                type: 'TRADE',
                data: {
                    marketId: market_id,
                    side: side,
                    outcome: outcome,
                    price: price,
                    quantity: quantity,
                    total: price * quantity
                }
            });
        } catch (actError) {
            console.warn('[Order API] Failed to log activity:', actError);
        }

        const response = NextResponse.json({ success: true, orderId });
        return addRateLimitHeaders(response, tradingResult);

    } catch (error) {
        console.error('Order placement error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const supabase = createPublicClient();

        // Authenticate
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('market_id');   // optional filter
        const status = searchParams.get('status');         // optional filter

        /*
          Fetch orders belonging to this user only.
          Users must never be able to see other users' orders via this endpoint.
          Default sort: newest first.
        */
        let query = supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // Conditionally apply filters — only if the query param was provided
        if (marketId) {
            query = query.eq('market_id', marketId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: orders, error } = await query;

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        return NextResponse.json({ orders });

    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
