/**
 * Cron: Check Conditional Orders
 * GET /api/cron/check-conditional-orders
 * 
 * Uses local PostgreSQL (pg) via local-db pool.
 * Auth: CRON_SECRET bearer token.
 */
import { NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Verify cron auth
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active markets
    const { rows: activeMarkets } = await pool.query(
      `SELECT id FROM markets WHERE status = 'active'`
    );

    if (!activeMarkets || activeMarkets.length === 0) {
      return NextResponse.json({ triggered: 0, markets: [] });
    }

    const results = [];

    // Check conditional orders for each active market
    for (const market of activeMarkets) {
      try {
        const { rows } = await pool.query(
          `SELECT * FROM check_conditional_orders_for_market($1)`,
          [market.id]
        );
        if (rows && rows[0]?.triggered_count > 0) {
          results.push(rows[0]);
        }
      } catch (e) {
        // Function may not exist - skip
        console.warn(`check_conditional_orders_for_market failed for market ${market.id}:`, e);
      }
    }

    const totalTriggered = results.reduce((sum, r) => sum + (r?.triggered_count || 0), 0);

    // Log the cron run
    try {
      await pool.query(
        `INSERT INTO admin_access_log (admin_id, action, resource, metadata)
         VALUES (NULL, 'cron_check_conditional_orders', 'conditional_orders', $1)`,
        [JSON.stringify({ markets_checked: activeMarkets.length, triggered_total: totalTriggered })]
      );
    } catch (e) {
      // admin_access_log may not exist in dev - skip
    }

    return NextResponse.json({
      success: true,
      triggered: totalTriggered,
      markets: results,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Check conditional orders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
