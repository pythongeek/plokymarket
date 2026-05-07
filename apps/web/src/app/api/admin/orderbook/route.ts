import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const marketId = searchParams.get('marketId');

  if (!marketId) {
    // Return list of active markets for selection
    const markets = await pool.query(
      `SELECT id, question, total_volume, current_price_yes, current_price_no, status
       FROM markets WHERE status = 'active' ORDER BY total_volume DESC LIMIT 50`
    );
    return NextResponse.json({ markets: markets.rows });
  }

  // Get order book for specific market
  const bids = await pool.query(
    `SELECT side, outcome, price, SUM(quantity - filled_quantity) as total_qty, COUNT(*) as order_count
     FROM orders
     WHERE market_id = $1 AND status = 'open' AND side = 'buy'
     GROUP BY side, outcome, price
     ORDER BY price DESC`,
    [marketId]
  );

  const asks = await pool.query(
    `SELECT side, outcome, price, SUM(quantity - filled_quantity) as total_qty, COUNT(*) as order_count
     FROM orders
     WHERE market_id = $1 AND status = 'open' AND side = 'sell'
     GROUP BY side, outcome, price
     ORDER BY price ASC`,
    [marketId]
  );

  const marketInfo = await pool.query(
    `SELECT question, total_volume, current_price_yes, current_price_no, liquidity, trader_count
     FROM markets WHERE id = $1`,
    [marketId]
  );

  const recentTrades = await pool.query(
    `SELECT t.*, u.email as trader_email
     FROM trades t
     LEFT JOIN users u ON t.buyer_id = u.id
     WHERE t.market_id = $1
     ORDER BY t.created_at DESC
     LIMIT 20`,
    [marketId]
  );

  return NextResponse.json({
    market: marketInfo.rows[0] || null,
    bids: bids.rows.map(r => ({ ...r, total_qty: parseFloat(r.total_qty) || 0 })),
    asks: asks.rows.map(r => ({ ...r, total_qty: parseFloat(r.total_qty) || 0 })),
    recentTrades: recentTrades.rows,
  });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const body = await req.json().catch(() => ({}));
  const { orderId } = body;
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  await pool.query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [orderId]);

  return NextResponse.json({ success: true });
}
