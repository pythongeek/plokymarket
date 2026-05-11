import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const UPSTASH_URL = process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN;

// Local PostgreSQL pool (bypasses PostgREST RLS)
const pool = new Pool({
  host: process.env.LOCAL_DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.LOCAL_DB_PORT || process.env.POSTGRES_PORT || '5433'),
  database: process.env.LOCAL_DB_NAME || process.env.POSTGRES_DB || 'polymarket',
  user: process.env.LOCAL_DB_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || process.env.POSTGRES_PASSWORD || '',
  ssl: false,
  max: 5,
});

interface OhlcPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function redisGet(key: string): Promise<string | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.result;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/set/${key}/${encodeURIComponent(value)}?ex=${ttlSeconds}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: 'no-store',
    });
  } catch {
    // ignore cache errors
  }
}

function aggregateOhlc(
  rows: { price: number; quantity: number; executed_at: Date }[],
  range: string
): OhlcPoint[] {
  if (!rows.length) return [];

  let bucketMs: number;
  switch (range) {
    case '1H': bucketMs = 5 * 60 * 1000; break;
    case '24H': bucketMs = 60 * 60 * 1000; break;
    case '7D': bucketMs = 24 * 60 * 60 * 1000; break;
    case '30D': bucketMs = 24 * 60 * 60 * 1000; break;
    default: bucketMs = 60 * 60 * 1000;
  }

  const buckets = new Map<
    number,
    { open: number; high: number; low: number; close: number; volume: number }
  >();

  for (const row of rows) {
    const t = row.executed_at.getTime();
    const key = Math.floor(t / bucketMs) * bucketMs;
    const existing = buckets.get(key);
    if (existing) {
      existing.high = Math.max(existing.high, row.price);
      existing.low = Math.min(existing.low, row.price);
      existing.close = row.price;
      existing.volume += Number(row.quantity);
    } else {
      buckets.set(key, {
        open: Number(row.price),
        high: row.price,
        low: row.price,
        close: row.price,
        volume: Number(row.quantity),
      });
    }
  }

  const keys = Array.from(buckets.keys()).sort((a, b) => a - b);
  const result: OhlcPoint[] = [];
  let lastClose = Number(rows[0].price);

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const b = buckets.get(k)!;
    if (i > 0 && k - keys[i - 1] > bucketMs) {
      let fill = keys[i - 1] + bucketMs;
      while (fill < k) {
        result.push({
          time: new Date(fill).toISOString(),
          open: lastClose,
          high: lastClose,
          low: lastClose,
          close: lastClose,
          volume: 0,
        });
        fill += bucketMs;
      }
    }
    result.push({
      time: new Date(k).toISOString(),
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    });
    lastClose = Number(b.close);
  }

  return result;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '24H';
    const outcome = searchParams.get('outcome') || 'YES';

    const cacheKey = `price:${id}:${range}:${outcome}`;

    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        return NextResponse.json({ data: JSON.parse(cached), cached: true });
      } catch {
        // invalid cache
      }
    }

    const now = Date.now();
    let cutoffMs: number;
    switch (range) {
      case '1H': cutoffMs = 60 * 60 * 1000; break;
      case '24H': cutoffMs = 24 * 60 * 60 * 1000; break;
      case '7D': cutoffMs = 7 * 24 * 60 * 60 * 1000; break;
      case '30D': cutoffMs = 30 * 24 * 60 * 60 * 1000; break;
      default: cutoffMs = 24 * 60 * 60 * 1000;
    }

    const since = new Date(now - cutoffMs).toISOString();

    const { rows } = await pool.query(
      `SELECT price, quantity, executed_at
       FROM trades
       WHERE market_id = $1 AND executed_at >= $2 AND outcome = $3
       ORDER BY executed_at ASC`,
      [id, since, outcome]
    );

    const ohlc = aggregateOhlc(rows, range);
    await redisSet(cacheKey, JSON.stringify(ohlc), 60);

    return NextResponse.json({ data: ohlc, cached: false });
  } catch (err: any) {
    console.error('[price-history]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
