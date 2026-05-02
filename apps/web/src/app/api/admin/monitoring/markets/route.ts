/**
 * GET /api/admin/monitoring/markets - Aggregated market stats for monitoring
 * Uses local PostgreSQL (pg) for all data operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    // Fetch recent events with outcomes
    const eventsResult = await admin.pool.query(`
      SELECT 
        e.id,
        e.question,
        e.status,
        e.volume,
        e.created_at,
        e.category,
        json_agg(
          json_build_object(
            'probability', o.probability,
            'type', o.outcome_type
          )
        ) FILTER (WHERE o.id IS NOT NULL) as outcomes
      FROM events e
      LEFT JOIN order book o ON o.event_id = e.id
      GROUP BY e.id, e.question, e.status, e.volume, e.created_at, e.category
      ORDER BY e.created_at DESC
      LIMIT 50
    `);

    const events = eventsResult.rows;

    // For each event, compute 24h trades, unique traders, order book depth
    const marketsWithStats = await Promise.all(
      events.map(async (event) => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // 24h trades
        const tradesResult = await admin.pool.query(`
          SELECT price, quantity, created_at 
          FROM trades 
          WHERE event_id = $1 AND created_at >= $2
        `, [event.id, dayAgo]);

        const volume24h = tradesResult.rows.reduce(
          (sum, t) => sum + (Number(t.price) * Number(t.quantity)), 0
        );
        const trades24h = tradesResult.rows.length;

        // Unique traders
        const positionsResult = await admin.pool.query(`
          SELECT COUNT(DISTINCT user_id) as unique_traders 
          FROM positions 
          WHERE event_id = $1
        `, [event.id]);

        const uniqueTraders = Number(positionsResult.rows[0]?.unique_traders || 0);

        // Order book depth
        const ordersResult = await admin.pool.query(`
          SELECT side, price, remaining_quantity 
          FROM orders 
          WHERE event_id = $1 AND status = 'open'
        `, [event.id]);

        const bids = ordersResult.rows
          .filter(o => o.side === 'buy')
          .reduce((sum, o) => sum + Number(o.remaining_quantity), 0);
        const asks = ordersResult.rows
          .filter(o => o.side === 'sell')
          .reduce((sum, o) => sum + Number(o.remaining_quantity), 0);

        const yesOutcome = event.outcomes?.find(o => o.outcome_type === 'YES');
        const noOutcome = event.outcomes?.find(o => o.outcome_type === 'NO');

        return {
          marketId: event.id,
          question: event.question,
          status: event.status,
          volume24h,
          totalVolume: Number(event.volume) || 0,
          yesPrice: yesOutcome ? Number(yesOutcome.probability) : 0.5,
          noPrice: noOutcome ? Number(noOutcome.probability) : 0.5,
          bidDepth: bids,
          askDepth: asks,
          uniqueTraders,
          trades24h,
          priceChange24h: 0,
        };
      })
    );

    return NextResponse.json({ data: marketsWithStats });
  } catch (err) {
    console.error('Error fetching market monitoring data:', err);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
