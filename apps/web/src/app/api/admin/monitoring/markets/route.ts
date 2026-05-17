/**
 * GET /api/admin/monitoring/markets - Aggregated market stats for monitoring
 * Single-query approach — no N+1 loop
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Single aggregated query — replaces N+1 loop
    const { rows } = await pool.query(`
      SELECT
        e.id AS "marketId",
        e.question,
        e.status,
        COALESCE(e.volume, 0) AS "totalVolume",
        e.created_at AS "createdAt",
        e.category,

        -- 24h volume
        COALESCE(SUM(
          CASE WHEN t.created_at >= $1 THEN t.price * t.quantity ELSE 0 END
        ), 0) AS "volume24h",

        -- 24h trades
        COUNT(CASE WHEN t.created_at >= $1 THEN 1 END) AS "trades24h",

        -- unique traders (from positions)
        COALESCE(p.unique_traders, 0) AS "uniqueTraders",

        -- order book depth
        COALESCE(ob.bid_depth, 0) AS "bidDepth",
        COALESCE(ob.ask_depth, 0) AS "askDepth",

        -- yes/no prices from latest outcomes
        MAX(CASE WHEN o.outcome_type = 'YES' THEN o.probability END) AS "yesPrice",
        MAX(CASE WHEN o.outcome_type = 'NO' THEN o.probability END) AS "noPrice",

        -- price change (simple: last 24h avg vs prior 24h avg)
        COALESCE(AVG(
          CASE WHEN t.created_at >= $1 THEN t.price END
        ), 0.5) AS "avgPrice24h",
        COALESCE(AVG(
          CASE WHEN t.created_at >= $1 AND t.created_at < $1::timestamp + interval '24 hours'
               THEN NULL
               WHEN t.created_at < $1 THEN t.price END
        ), 0.5) AS "avgPricePrior"

      FROM events e
      LEFT JOIN trades t ON t.event_id = e.id
      LEFT JOIN outcomes o ON o.event_id = e.id
      LEFT JOIN LATERAL (
        SELECT COUNT(DISTINCT user_id) AS unique_traders
        FROM positions WHERE event_id = e.id
      ) p ON true
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(SUM(
            CASE WHEN side = 'buy' THEN remaining_quantity ELSE 0 END
          ), 0) AS bid_depth,
          COALESCE(SUM(
            CASE WHEN side = 'sell' THEN remaining_quantity ELSE 0 END
          ), 0) AS ask_depth
        FROM orders WHERE event_id = e.id AND status = 'open'
      ) ob ON true

      GROUP BY e.id, e.question, e.status, e.volume, e.created_at, e.category,
               p.unique_traders, ob.bid_depth, ob.ask_depth
      ORDER BY e.created_at DESC
      LIMIT 50
    `, [dayAgo]);

    const markets = rows.map(r => ({
      marketId: r.marketId,
      question: r.question,
      status: r.status,
      volume24h: Number(r.volume24h),
      totalVolume: Number(r.totalVolume),
      yesPrice: Number(r.yesPrice) || 0.5,
      noPrice: Number(r.noPrice) || 0.5,
      bidDepth: Number(r.bidDepth),
      askDepth: Number(r.askDepth),
      uniqueTraders: Number(r.uniqueTraders),
      trades24h: Number(r.trades24h),
      priceChange24h: Number(r.avgPrice24h) - Number(r.avgPricePrior),
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ data: markets });
  } catch (err) {
    console.error('Error fetching market monitoring data:', err);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
