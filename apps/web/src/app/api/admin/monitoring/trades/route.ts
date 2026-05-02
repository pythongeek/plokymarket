/**
 * GET /api/admin/monitoring/trades - Trade monitoring, suspicious activity detection, volume/price stats
 * POST /api/admin/monitoring/trades - Freeze user or cancel orders
 * Uses local PostgreSQL (pg) for all data operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') || 'all';
  const userId = searchParams.get('user_id');
  const eventId = searchParams.get('event_id');

  try {
    if (tab === 'users') {
      const { rows: tradeStats } = await result.pool.query(`
        SELECT t.user_id, u.email, COUNT(*) as trade_count,
          SUM(t.quantity) as total_volume, COUNT(DISTINCT t.event_id) as markets_traded,
          MAX(t.created_at) as last_trade
        FROM trades t JOIN user_profiles u ON t.user_id = u.user_id
        GROUP BY t.user_id, u.email ORDER BY trade_count DESC LIMIT 100
      `);
      const { rows: positions } = await result.pool.query(`
        SELECT user_id, COUNT(*) as position_count, SUM(ABS(quantity)) as total_qty
        FROM positions GROUP BY user_id
      `);
      const posMap: Record<string, any> = {};
      for (const p of positions) posMap[p.user_id] = p;
      const userStats = tradeStats.map(t => ({
        ...t,
        position_count: posMap[t.user_id]?.position_count || 0,
        total_qty: posMap[t.user_id]?.total_qty || 0
      }));
      return NextResponse.json({ data: userStats });

    } else if (tab === 'volume') {
      const { rows } = await result.pool.query(`
        SELECT outcome, side, COUNT(*) as trade_count, SUM(quantity) as volume,
          AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price
        FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY outcome, side ORDER BY outcome, side
      `);
      const distMap: Record<string, any> = {};
      for (const r of rows) {
        if (!distMap[r.outcome]) {
          distMap[r.outcome] = { outcome: r.outcome, buyVolume: 0, sellVolume: 0, buyTrades: 0, sellTrades: 0, avgBuyPrice: 0, avgSellPrice: 0 };
        }
        if (r.side === 'buy') { distMap[r.outcome].buyVolume = Number(r.volume); distMap[r.outcome].buyTrades = r.trade_count; distMap[r.outcome].avgBuyPrice = Number(r.avg_price); }
        else { distMap[r.outcome].sellVolume = Number(r.volume); distMap[r.outcome].sellTrades = r.trade_count; distMap[r.outcome].avgSellPrice = Number(r.avg_price); }
      }
      return NextResponse.json({ data: Object.values(distMap) });

    } else if (tab === 'price') {
      const { rows } = await result.pool.query(`
        SELECT CASE WHEN price < 0.1 THEN '0-10' WHEN price < 0.2 THEN '10-20'
          WHEN price < 0.3 THEN '20-30' WHEN price < 0.4 THEN '30-40' WHEN price < 0.5 THEN '40-50'
          WHEN price < 0.6 THEN '50-60' WHEN price < 0.7 THEN '60-70' WHEN price < 0.8 THEN '70-80'
          WHEN price < 0.9 THEN '80-90' ELSE '90-100' END as range, COUNT(*) as count
        FROM trades WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY 1 ORDER BY 1
      `);
      const total = rows.reduce((s, r) => s + Number(r.count), 0);
      return NextResponse.json({ data: rows.map(r => ({ range: r.range, count: r.count, percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0 })) });

    } else if (tab === 'suspicious') {
      const { rows } = await result.pool.query(`
        WITH avg_stats AS (SELECT AVG(quantity) as avg_qty FROM trades WHERE created_at > NOW() - INTERVAL '24 hours')
        SELECT t.user_id, up.email, COUNT(*) as trade_count, SUM(t.quantity) as total_volume,
          COUNT(DISTINCT t.event_id) as markets, MAX(t.created_at) as last_trade,
          CASE WHEN SUM(t.quantity) > (SELECT avg_qty * 10 FROM avg_stats) THEN 'high_volume' ELSE 'normal' END as risk_level
        FROM trades t JOIN user_profiles up ON t.user_id = up.user_id
        WHERE t.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY t.user_id, up.email ORDER BY total_volume DESC LIMIT 50
      `);
      return NextResponse.json({ data: rows });

    } else {
      let query = `SELECT t.*, up.email as user_email, e.question as market_question
        FROM trades t LEFT JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN events e ON t.event_id = e.id ORDER BY t.created_at DESC LIMIT 200`;
      const params: any[] = [];
      if (userId) { query = `SELECT t.*, up.email as user_email, e.question as market_question
        FROM trades t LEFT JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN events e ON t.event_id = e.id WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 200`; params.push(userId); }
      if (eventId) { query += params.length ? ` AND t.event_id = $${params.length + 1}` : ` WHERE t.event_id = $1`; params.push(eventId); }
      const { rows } = await result.pool.query(query, params);
      return NextResponse.json({ data: rows });
    }
  } catch (err) {
    console.error('Monitoring trades error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;
  try {
    const body = await req.json();
    const { action, userId, orderIds } = body;
    if (action === 'freeze_user' && userId) {
      await result.pool.query(`UPDATE user_profiles SET is_frozen = true WHERE user_id = $1`, [userId]);
      return NextResponse.json({ success: true });
    } else if (action === 'cancel_orders' && orderIds?.length) {
      await result.pool.query(`UPDATE orders SET status = 'cancelled' WHERE id = ANY($1)`, [orderIds]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Monitoring trades POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
