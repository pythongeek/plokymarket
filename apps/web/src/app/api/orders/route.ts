// @ts-nocheck
/**
 * Production-Ready Order Placement API
 * 
 * Features:
 * - Local JWT verification (no cloud Supabase)
 * - Market orders: execute at best available price
 * - Limit orders: placed at specified price
 * - SELL orders: validate share positions (not cash)
 * - BUY orders: validate wallet balance + freeze funds
 * - Rate limiting per user per market
 * - Idempotency keys prevent duplicate orders
 * - Comprehensive input validation
 * - Matching engine trigger after order creation
 * - Order book cache invalidation
 * - Activity logging
 */
import { pool } from '@/lib/admin/local-db';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { orderBookService } from '@/lib/services/orderBookService';
import { ActivityService } from '@/lib/activity';
import { syncAfterMatch, initializeRealtimeEngine } from '@/lib/realtime/OrderBookBroadcast';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

/* ═══════════════════════════════════════════════
   IN-MEMORY RATE LIMITER (per user, per market)
   ═══════════════════════════════════════════════ */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds
const RATE_LIMIT_MAX = 5; // 5 orders per window

function checkRateLimit(userId: string, marketId: string): { allowed: boolean; retryAfter?: number } {
  const key = `${userId}:${marketId}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

/* ═══════════════════════════════════════════════
   AUTH: Extract & verify JWT from cookie
   ═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   VALIDATION HELPERS
   ═══════════════════════════════════════════════ */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function sanitizeString(str: string, maxLen = 255): string {
  return str.replace(/[<>"'&]/g, '').substring(0, maxLen).trim();
}

/* ═══════════════════════════════════════════════
   POST: Place Order
   ═══════════════════════════════════════════════ */
export async function POST(request: Request) {
  try {
    // ── 1. Authenticate ───────────────────────────────────────────
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 });
    }

    // ── 2. Parse body ─────────────────────────────────────────────
    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      market_id: rawMarketId,
      side: rawSide,
      outcome: rawOutcome,
      price: rawPrice,
      quantity: rawQuantity,
      order_type: rawOrderType = 'limit',
    } = body;

    // ── 3. Validate required fields ───────────────────────────────
    if (!rawMarketId || !rawSide || !rawOutcome || !rawQuantity) {
      return NextResponse.json(
        { error: 'Missing required fields: market_id, side, outcome, quantity' },
        { status: 400 }
      );
    }

    const marketId = sanitizeString(rawMarketId);
    if (!isValidUUID(marketId)) {
      return NextResponse.json({ error: 'Invalid market_id format' }, { status: 400 });
    }

    const side = rawSide.toString().toLowerCase();
    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'Side must be "buy" or "sell"' }, { status: 400 });
    }

    const outcome = rawOutcome.toString().toUpperCase();
    if (!['YES', 'NO'].includes(outcome)) {
      return NextResponse.json({ error: 'Outcome must be "YES" or "NO"' }, { status: 400 });
    }

    const orderType = rawOrderType.toString().toLowerCase();
    if (!['limit', 'market'].includes(orderType)) {
      return NextResponse.json({ error: 'order_type must be "limit" or "market"' }, { status: 400 });
    }

    const quantity = Number(rawQuantity);
    if (!Number.isFinite(quantity) || quantity < 10 || quantity > 1_000_000 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'Quantity must be an integer between 10 and 1,000,000' },
        { status: 400 }
      );
    }

    // ── 4. Price validation (market orders use null price) ─────────
    let price: number | null = null;
    if (orderType === 'limit') {
      if (rawPrice === undefined || rawPrice === null) {
        return NextResponse.json({ error: 'Price is required for limit orders' }, { status: 400 });
      }
      price = Number(rawPrice);
      if (!Number.isFinite(price) || price < 0.01 || price > 0.99) {
        return NextResponse.json(
          { error: 'Limit price must be between 0.01 and 0.99' },
          { status: 400 }
        );
      }
    }

    // ── 5. Rate limiting ───────────────────────────────────────────
    const rateCheck = checkRateLimit(user.id, marketId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Trading rate limit exceeded. Please slow down.',
          code: 'TRADING_RATE_LIMITED',
          retryAfter: rateCheck.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfter) },
        }
      );
    }

    // ── 6. Market status check ─────────────────────────────────────
    const marketCheck = await pool.query(
      `SELECT status, yes_price, no_price, trading_closes_at FROM markets WHERE id = $1`,
      [marketId]
    );
    if (marketCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    const market = marketCheck.rows[0];
    if (market.status !== 'active' && market.status !== 'open') {
      return NextResponse.json(
        { error: `Market is ${market.status} — trading not allowed` },
        { status: 400 }
      );
    }
    if (market.trading_closes_at && new Date(market.trading_closes_at) < new Date()) {
      return NextResponse.json({ error: 'Market trading has closed' }, { status: 400 });
    }

    // ── 7. Market order: determine execution price ─────────────────
    if (orderType === 'market') {
      // For market orders, find the best available counterparty price
      const counterSide = side === 'buy' ? 'sell' : 'buy';
      const priceResult = await pool.query(
        `SELECT price, quantity - filled_quantity as remaining
         FROM orders
         WHERE market_id = $1
           AND side = $2
           AND outcome = $3
           AND status IN ('open', 'partially_filled')
           AND quantity > filled_quantity
           AND user_id != $4
         ORDER BY
           CASE WHEN $2 = 'sell' THEN price END ASC,
           CASE WHEN $2 = 'buy' THEN price END DESC,
           created_at ASC
         LIMIT 1`,
        [marketId, counterSide, outcome, user.id]
      );

      if (priceResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'No counterparty orders available for market order' },
          { status: 400 }
        );
      }

      // Market order executes at counterparty's price
      price = Number(priceResult.rows[0].price);
      const availableShares = Number(priceResult.rows[0].remaining);

      if (availableShares < quantity) {
        return NextResponse.json(
          {
            error: `Not enough shares available for market order. Requested: ${quantity}, Available: ${availableShares}`,
            code: 'INSUFFICIENT_LIQUIDITY',
            availableShares,
            requestedShares: quantity,
          },
          { status: 400 }
        );
      }
    }

    // ── 8. SELL order: validate share positions ────────────────────
    if (side === 'sell') {
      const posResult = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0) as total_shares
         FROM positions
         WHERE user_id = $1 AND market_id = $2 AND outcome = $3`,
        [user.id, marketId, outcome]
      );
      const totalShares = Number(posResult.rows[0].total_shares);
      if (totalShares < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient shares to sell. You own ${totalShares} ${outcome} shares but tried to sell ${quantity}.`,
            code: 'INSUFFICIENT_SHARES',
            ownedShares: totalShares,
            requestedShares: quantity,
          },
          { status: 400 }
        );
      }
    }

    // ── 9. BUY order: validate wallet balance ──────────────────────
    if (side === 'buy') {
      const totalCost = price! * quantity;
      const walletResult = await pool.query(
        `SELECT balance FROM wallets WHERE user_id = $1`,
        [user.id]
      );
      const balance = walletResult.rows.length > 0 ? Number(walletResult.rows[0].balance) : 0;
      if (balance < totalCost) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Required: ৳${totalCost.toFixed(2)}, Available: ৳${balance.toFixed(2)}`,
            code: 'INSUFFICIENT_BALANCE',
            required: totalCost,
            available: balance,
          },
          { status: 400 }
        );
      }
    }

    // ── 10. Idempotency key ────────────────────────────────────────
    const idempotencyKey = sanitizeString(
      body.idempotency_key || `order-${user.id}-${marketId}-${side}-${outcome}-${quantity}-${Date.now()}`
    );

    // ── 11. ATOMIC ORDER PLACEMENT ─────────────────────────────────
    const poolResult = await pool.query(
      'SELECT order_id, error FROM place_order_atomic($1, $2, $3, $4, $5, $6, $7, $8)',
      [user.id, marketId, side, outcome, price, quantity, orderType, idempotencyKey]
    );

    const result = poolResult.rows[0] as { error?: string; order_id?: string } | null;

    if (!result || result?.error) {
      return NextResponse.json(
        { error: result?.error || 'Order placement failed' },
        { status: result?.error === 'Insufficient balance' ? 400 : 500 }
      );
    }

    const orderId = result?.order_id;
    if (!orderId) {
      return NextResponse.json({ error: 'Order placement failed (no ID returned)' }, { status: 500 });
    }

    // ── 12. TRIGGER MATCHING ENGINE ────────────────────────────────
    // For market orders, we want immediate execution
    // For limit orders, the background matcher will pick it up
    let matched = false;
    let tradeCount = 0;
    try {
      const matchResult = await pool.query('SELECT * FROM match_order($1)', [orderId]);
      if (matchResult.rows.length > 0) {
        const row = matchResult.rows[0];
        matched = row.matched || row.column1 || false;
        tradeCount = parseInt(row.trade_count || row.column2 || 0);
      }
    } catch (matchError) {
      console.error('[Order API] match_order error:', matchError);
      // Non-fatal: order remains open for background matcher
    }

    // ── 13. BROADCAST REALTIME UPDATE ──────────────────────────────
    try {
      await syncAfterMatch(marketId, orderId);
    } catch (broadcastError) {
      console.warn('[Order API] Realtime broadcast error:', broadcastError);
    }

    // ── 14. INVALIDATE ORDER BOOK CACHE ────────────────────────────
    await orderBookService.invalidateCache(marketId);

    // ── 15. LOG ACTIVITY ───────────────────────────────────────────
    try {
      const activityService = new ActivityService();
      await activityService.logActivity({
        userId: user.id,
        type: 'TRADE',
        data: {
          marketId,
          side,
          outcome,
          price,
          quantity,
          total: price! * quantity,
          orderType,
          matched,
          tradeCount,
        },
      });
    } catch (actError) {
      console.warn('[Order API] Failed to log activity:', actError);
    }

    // ── 16. RESPONSE ───────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      orderId,
      marketId,
      side,
      outcome,
      price,
      quantity,
      orderType,
      matched,
      tradeCount,
      message: matched
        ? `Order filled! ${tradeCount} trade(s) executed.`
        : orderType === 'market'
          ? 'Market order placed (awaiting match)'
          : 'Limit order placed and open',
    });

  } catch (error: any) {
    console.error('[Order API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════
   GET: Fetch User Orders
   ═══════════════════════════════════════════════ */
export async function GET(request: Request) {
  try {
    // ── 1. Authenticate ───────────────────────────────────────────
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('market_id');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    // ── 2. Build query ────────────────────────────────────────────
    let sql = `
      SELECT 
        o.id,
        o.market_id,
        o.side,
        o.outcome,
        o.type as order_type,
        o.price,
        o.quantity,
        o.filled_quantity,
        o.status,
        o.created_at,
        o.updated_at,
        o.average_fill_price,
        o.total_cost,
        o.fee_amount,
        m.question as market_question,
        m.name as market_name
      FROM orders o
      LEFT JOIN markets m ON o.market_id = m.id
      WHERE o.user_id = $1
    `;
    const params: any[] = [user.id];
    let paramIdx = 2;

    if (marketId) {
      sql += ` AND o.market_id = $${paramIdx++}`;
      params.push(marketId);
    }

    if (status) {
      sql += ` AND o.status = $${paramIdx++}`;
      params.push(status);
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const { rows: orders } = await pool.query(sql, params);

    // ── 3. Get totals for pagination ──────────────────────────────
    const countSql = `
      SELECT COUNT(*) as total FROM orders o WHERE o.user_id = $1
      ${marketId ? 'AND o.market_id = $2' : ''}
      ${status ? (marketId ? 'AND o.status = $3' : 'AND o.status = $2') : ''}
    `;
    const countResult = await pool.query(countSql, params.slice(0, paramIdx - 3));
    const total = parseInt(countResult.rows[0]?.total || '0');

    return NextResponse.json({
      orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + orders.length < total,
      },
    });

  } catch (error: any) {
    console.error('[Order API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
