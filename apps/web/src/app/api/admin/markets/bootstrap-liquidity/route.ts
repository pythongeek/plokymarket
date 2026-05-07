import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

/**
 * POST /api/admin/markets/bootstrap-liquidity
 * Auto-create PMF liquidity pool + seed initial liquidity for a market
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdminUser(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { market_id, initial_liquidity = 1000 } = await req.json();
    if (!market_id) {
      return NextResponse.json({ error: 'market_id required' }, { status: 400 });
    }

    // Check if pool already exists
    const existing = await pool.query(
      'SELECT id FROM pmf_liquidity_pools WHERE market_id = $1',
      [market_id]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Pool already exists', pool_id: existing.rows[0].id }, { status: 409 });
    }

    // Get market details
    const marketRes = await pool.query(
      'SELECT question, creator_id, initial_liquidity FROM markets WHERE id = $1',
      [market_id]
    );
    if (marketRes.rows.length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    const market = marketRes.rows[0];

    // Create PMF pool
    const poolResult = await pool.query(
      `INSERT INTO pmf_liquidity_pools (
        market_id, name, description, initial_liquidity, current_liquidity,
        total_shares, reserve0, reserve1, fee_rate, creator_id, status,
        pmf_vector, outcome_distribution
      ) VALUES ($1, $2, $3, $4, $4, $5, $6, $6, $7, $8, 'active', $9, $10)
      RETURNING id`,
      [
        market_id,
        market.question + ' Pool',
        'Auto-generated liquidity pool',
        initial_liquidity,
        initial_liquidity * 2, // total shares = 2x liquidity
        initial_liquidity, // reserve0 = reserve1 = liquidity
        0.002, // 0.2% fee
        market.creator_id || admin.id,
        JSON.stringify({ yes: 0.5, no: 0.5 }),
        JSON.stringify({ yes: 50, no: 50 }),
      ]
    );
    const poolId = poolResult.rows[0].id;

    // Update market liquidity
    await pool.query(
      'UPDATE markets SET liquidity = $1, current_price_yes = 0.5, current_price_no = 0.5 WHERE id = $2',
      [initial_liquidity, market_id]
    );

    // Log to audit
    await pool.query(
      `INSERT INTO admin_audit_log (action, performed_by, target_table, target_id, diff_jsonb)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'bootstrap_liquidity',
        admin.id || admin.userId || 'system',
        'pmf_liquidity_pools',
        poolId,
        JSON.stringify({ market_id, initial_liquidity, pool_id: poolId }),
      ]
    );

    return NextResponse.json({
      success: true,
      pool_id: poolId,
      market_id,
      initial_liquidity,
      message: 'Liquidity pool created and seeded',
    });
  } catch (err: any) {
    console.error('[Bootstrap Liquidity] Error:', err);
    return NextResponse.json({ error: err.message || 'Bootstrap failed' }, { status: 500 });
  }
}
