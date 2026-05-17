/**
 * GET  /api/admin/monitoring/trades - Trade monitoring with server-side anomaly detection
 * POST /api/admin/monitoring/trades - Freeze user or cancel orders
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get('tab') || 'all';
  const userId = searchParams.get('user_id');
  const eventId = searchParams.get('event_id');

  try {
    if (tab === 'users') {
      const { rows: tradeStats } = await pool.query(`
        SELECT t.user_id, u.email, COUNT(*) as trade_count,
          SUM(t.quantity) as total_volume, COUNT(DISTINCT t.event_id) as markets_traded,
          MAX(t.created_at) as last_trade
        FROM trades t JOIN user_profiles u ON t.user_id = u.user_id
        GROUP BY t.user_id, u.email ORDER BY trade_count DESC LIMIT 100
      `);
      const { rows: positions } = await pool.query(`
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
      const { rows } = await pool.query(`
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
      const { rows } = await pool.query(`
        SELECT CASE WHEN price < 0.1 THEN '0-10' WHEN price < 0.2 THEN '10-20'
          WHEN price < 0.3 THEN '20-30' WHEN price < 0.4 THEN '30-40' WHEN price < 0.5 THEN '40-50'
          WHEN price < 0.6 THEN '50-60' WHEN price < 0.7 THEN '60-70' WHEN price < 0.8 THEN '70-80'
          WHEN price < 0.9 THEN '80-90' ELSE '90-100' END as range, COUNT(*) as count
        FROM trades WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY 1 ORDER BY 1
      `);
      const total = rows.reduce((s, r) => s + Number(r.count), 0);
      return NextResponse.json({ data: rows.map(r => ({ range: r.range, count: r.count, percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0 })) });

    } else if (tab === 'suspicious') {
      // Server-side anomaly detection: volume spike + wash trading flags
      const { rows } = await pool.query(`
        WITH avg_stats AS (
          SELECT AVG(quantity) as avg_qty FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        volume_ma AS (
          SELECT event_id,
            AVG(total_volume) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma7
          FROM (
            SELECT event_id, DATE(created_at) as day, SUM(quantity * price) as total_volume
            FROM trades WHERE created_at > NOW() - INTERVAL '14 days'
            GROUP BY event_id, DATE(created_at)
          ) sub
        ),
        wash_flags AS (
          SELECT user_id, event_id,
            COUNT(*) FILTER (WHERE side = 'buy') as buy_count,
            COUNT(*) FILTER (WHERE side = 'sell') as sell_count,
            SUM(quantity * price) FILTER (WHERE side = 'buy') as buy_vol,
            SUM(quantity * price) FILTER (WHERE side = 'sell') as sell_vol,
            MIN(created_at) as first_trade, MAX(created_at) as last_trade,
            EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as time_span_sec
          FROM trades
          WHERE created_at > NOW() - INTERVAL '24 hours'
          GROUP BY user_id, event_id
          HAVING COUNT(*) FILTER (WHERE side = 'buy') > 0
             AND COUNT(*) FILTER (WHERE side = 'sell') > 0
             AND COUNT(*) > 3
        )
        SELECT t.user_id, up.email, COUNT(*) as trade_count, SUM(t.quantity * t.price) as total_volume,
          COUNT(DISTINCT t.event_id) as markets, MAX(t.created_at) as last_trade,
          CASE
            WHEN SUM(t.quantity * t.price) > (SELECT avg_qty * 10 FROM avg_stats) THEN 'high_volume'
            WHEN wf.user_id IS NOT NULL THEN 'wash_trade'
            ELSE 'normal'
          END as risk_level,
          wf.buy_count as wash_buy_count,
          wf.sell_count as wash_sell_count,
          wf.time_span_sec as wash_time_span,
          COALESCE(vma.ma7, 0) as volume_ma7
        FROM trades t
        JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN wash_flags wf ON wf.user_id = t.user_id AND wf.event_id = t.event_id
        LEFT JOIN LATERAL (
          SELECT ma7 FROM volume_ma vm WHERE vm.event_id = t.event_id
          LIMIT 1
        ) vma ON true
        WHERE t.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY t.user_id, up.email, wf.user_id, wf.buy_count, wf.sell_count, wf.time_span_sec, vma.ma7
        ORDER BY total_volume DESC LIMIT 50
      `);
      return NextResponse.json({ data: rows });

    } else {
      // Default: trades list WITH anomaly flags per trade
      let query = `
        WITH avg_stats AS (
          SELECT AVG(quantity) as avg_qty FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        user_24h AS (
          SELECT user_id, SUM(quantity * price) as total_volume, COUNT(*) as trade_count
          FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'
          GROUP BY user_id
        ),
        wash_pairs AS (
          SELECT DISTINCT t1.id as trade_id
          FROM trades t1
          JOIN trades t2 ON t1.user_id = t2.user_id
            AND t1.event_id = t2.event_id
            AND t1.side != t2.side
            AND t1.id != t2.id
            AND ABS(EXTRACT(EPOCH FROM (t1.created_at - t2.created_at))) < 60
          WHERE t1.created_at > NOW() - INTERVAL '24 hours'
        )
        SELECT t.*, up.email as user_email, e.question as market_question, o.batch_id,
          CASE WHEN wp.trade_id IS NOT NULL THEN true ELSE false END as is_wash_trade,
          CASE WHEN u.total_volume > (SELECT avg_qty * 10 FROM avg_stats) AND u.trade_count < 5 THEN true ELSE false END as is_volume_spike,
          CASE WHEN t.quantity * t.price > 100000 THEN true ELSE false END as is_large_trade
        FROM trades t
        LEFT JOIN user_profiles up ON t.user_id = up.user_id
        LEFT JOIN events e ON t.event_id = e.id
        LEFT JOIN orders o ON t.order_id = o.id
        LEFT JOIN wash_pairs wp ON wp.trade_id = t.id
        LEFT JOIN user_24h u ON u.user_id = t.user_id
        ORDER BY t.created_at DESC LIMIT 200
      `;
      const params: any[] = [];
      if (userId) {
        query = query.replace('ORDER BY t.created_at DESC LIMIT 200',
          `WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 200`);
        params.push(userId);
      }
      if (eventId) {
        const prefix = params.length ? ` AND` : ` WHERE`;
        query = query.replace('ORDER BY t.created_at DESC LIMIT 200',
          `${prefix} t.event_id = $${params.length + 1} ORDER BY t.created_at DESC LIMIT 200`);
        params.push(eventId);
      }
      const { rows } = await pool.query(query, params);
      return NextResponse.json({ data: rows });
    }
  } catch (err) {
    console.error('Monitoring trades error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;
  try {
    const body = await req.json();
    const { action, userId, orderIds } = body;
    if (action === 'freeze_user' && userId) {
      await pool.query(`UPDATE user_profiles SET is_frozen = true WHERE user_id = $1`, [userId]);
      return NextResponse.json({ success: true });
    } else if (action === 'cancel_orders' && orderIds?.length) {
      await pool.query(`UPDATE orders SET status = 'cancelled' WHERE id = ANY($1)`, [orderIds]);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Monitoring trades POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
