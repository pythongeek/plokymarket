import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

function periodToInterval(period: string): string {
  switch (period) {
    case '24h': return "NOW() - INTERVAL '24 hours'";
    case '7d': return "NOW() - INTERVAL '7 days'";
    case '30d': return "NOW() - INTERVAL '30 days'";
    default: return "NOW() - INTERVAL '30 days'";
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '24h';
  const interval = periodToInterval(period);

  try {
    // Summary stats
    const summaryResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE created_at > ${interval})::int as new_users,
        (SELECT COUNT(*) FROM orders WHERE created_at > ${interval})::int as new_orders,
        (SELECT COALESCE(SUM(total_volume), 0) FROM markets) as total_volume,
        (SELECT COUNT(*) FROM markets WHERE status = 'active')::int as active_markets,
        (SELECT COUNT(*) FROM markets WHERE status = 'resolved')::int as resolved_markets,
        (SELECT COALESCE(SUM(usdt_amount), 0) FROM deposit_requests WHERE status = 'verified' AND created_at > ${interval}) as deposit_volume,
        (SELECT COALESCE(SUM(usdt_amount), 0) FROM withdrawal_requests WHERE status = 'completed' AND created_at > ${interval}) as withdrawal_volume,
        (SELECT COUNT(*) FROM trades WHERE created_at > ${interval})::int as trade_count,
        (SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at > ${interval})::int as active_traders
    `);

    // Volume over time (daily buckets)
    const seriesResult = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(filled_quantity * price), 0) as volume
      FROM orders
      WHERE created_at > ${interval}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `);

    // Top markets by volume
    const topMarketsResult = await pool.query(`
      SELECT question, total_volume, trader_count
      FROM markets
      WHERE status = 'active'
      ORDER BY total_volume DESC
      LIMIT 10
    `);

    // User growth
    const userGrowthResult = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as users
      FROM users
      WHERE created_at > ${interval}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `);

    return NextResponse.json({
      summary: summaryResult.rows[0] || {},
      volumeSeries: seriesResult.rows.map(r => ({
        date: r.date ? new Date(r.date).toISOString().slice(5, 10) : '',
        orders: parseInt(r.orders) || 0,
        volume: parseFloat(r.volume) || 0,
      })),
      topMarkets: topMarketsResult.rows.map(r => ({
        name: r.question?.slice(0, 40) || 'Unknown',
        volume: parseFloat(r.total_volume) || 0,
        traders: parseInt(r.trader_count) || 0,
      })),
      userGrowth: userGrowthResult.rows.map(r => ({
        date: r.date ? new Date(r.date).toISOString().slice(5, 10) : '',
        users: parseInt(r.users) || 0,
      })),
    });
  } catch (error: any) {
    console.error('[Analytics]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
