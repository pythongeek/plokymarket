// @ts-nocheck
/**
 * Unified Order API — POST /api/orders
 *
 * Atomic flow:
 *   1. Local JWT verification (retail users)
 *   2. Input validation
 *   3. place_order_atomic_v2() — DB-side atomic balance/position check + insert
 *   4. match_order_jsonb(order_id) — trigger matching engine
 *   5. Return order + match results
 */
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pgPool = new Pool({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
  database: process.env.LOCAL_DB_NAME || 'polymarket',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ||
  process.env.LOCAL_JWT_SECRET ||
  process.env.JWT_SECRET ||
  '';

/*
  Rate limit tracker — in-memory, per-process.
  For production with multiple PM2 instances, use Redis (ioredis) instead.
*/
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const TRADING_WINDOW_MS = 10_000; // 10 seconds
const TRADING_MAX_REQ = 5;        // 5 trades per window

function checkTradingRateLimit(userId: string, marketId: string): { allowed: boolean; retryAfter?: number } {
  const key = `${userId}:${marketId}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(key, { count: 1, resetAt: now + TRADING_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= TRADING_MAX_REQ) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

/* ─── POST: Place Order ─── */
export async function POST(req: Request) {
  try {
    // ── 1. Authenticate ──
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const userId = decoded.sub;
    if (!userId) {
      return NextResponse.json({ error: 'Token missing sub claim' }, { status: 401 });
    }

    // ── 2. Parse body ──
    const body = await req.json();
    const {
      market_id,
      side,
      outcome = 'YES',
      price,
      quantity,
      order_type = 'limit',
      idempotency_key,
    } = body;

    // ── 3. Rate limit ──
    const rateLimit = checkTradingRateLimit(userId, market_id || 'global');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trading rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    // ── 4. Field validation ──
    if (!market_id || !side || !quantity) {
      return NextResponse.json({ error: 'Missing required fields: market_id, side, quantity' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(side)) {
      return NextResponse.json({ error: 'side must be buy or sell' }, { status: 400 });
    }

    if (order_type === 'limit' && (price === undefined || price === null)) {
      return NextResponse.json({ error: 'Limit orders require a price' }, { status: 400 });
    }

    if (order_type === 'limit' && (price < 0.01 || price > 0.99)) {
      return NextResponse.json({ error: 'Price must be between 0.01 and 0.99' }, { status: 400 });
    }

    if (quantity < 10) {
      return NextResponse.json({ error: 'Minimum order quantity is 10' }, { status: 400 });
    }

    // ── 5. Idempotency guard ──
    const idemKey = idempotency_key || `order-${userId}-${market_id}-${side}-${quantity}-${Date.now()}`;
    const { rows: existing } = await pgPool.query(
      `SELECT id FROM orders WHERE user_id = $1 AND source = $2 LIMIT 1`,
      [userId, idemKey]
    );
    if (existing.length > 0) {
      return NextResponse.json({ success: true, order_id: existing[0].id, cached: true }, { status: 200 });
    }

    // ── 6. Atomic order placement via DB function ──
    const { rows: atomicRows } = await pgPool.query(
      `SELECT place_order_atomic_v2($1, $2, $3, $4, $5, $6, $7) AS result`,
      [userId, market_id, side, order_type, price || null, quantity, outcome]
    );

    const result = atomicRows[0]?.result;
    if (!result?.success) {
      const errMsg = result?.error || 'Order placement failed';
      const statusCode = errMsg.includes('Insufficient') ? 400 : 500;
      return NextResponse.json({ error: errMsg }, { status: statusCode });
    }

    const orderId = result.order_id;

    // ── 7. Trigger matching engine ──
    let matchResult: any = null;
    try {
      const { rows: matchRows } = await pgPool.query(
        `SELECT match_order_jsonb($1) AS match_data`,
        [orderId]
      );
      matchResult = matchRows[0]?.match_data || { matched: false, trade_count: 0 };
    } catch (matchErr) {
      console.error('[Order API] match_order_jsonb error:', matchErr);
      matchResult = { matched: false, trade_count: 0, error: 'Matching engine error' };
    }

    // ── 8. Return ──
    return NextResponse.json({
      success: true,
      order_id: orderId,
      match_results: matchResult,
    });

  } catch (error: any) {
    console.error('[Order API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ─── GET: List User Orders ─── */
export async function GET(req: Request) {
  try {
    // ── 1. Authenticate ──
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.sub;

    // ── 2. Parse filters ──
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('market_id');
    const statusFilter = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // ── 3. Build query ──
    let sql = `SELECT * FROM orders WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIdx = 2;

    if (marketId) {
      sql += ` AND market_id = $${paramIdx++}`;
      params.push(marketId);
    }
    if (statusFilter) {
      sql += ` AND status = $${paramIdx++}`;
      params.push(statusFilter);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const { rows } = await pgPool.query(sql, params);

    return NextResponse.json({ orders: rows, count: rows.length });

  } catch (error: any) {
    console.error('[Order API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
