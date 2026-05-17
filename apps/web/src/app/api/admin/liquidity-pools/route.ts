import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

interface LiquidityPool {
  id: string;
  market_id: string;
  name: string;
  current_liquidity: number;
  initial_liquidity: number;
  total_shares: number;
  fee_rate: number;
  status: string;
  created_at: string;
  market_question?: string;
}

// GET /api/admin/liquidity-pools
export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = `
      SELECT p.*, m.question as market_question
      FROM pmf_liquidity_pools p
      LEFT JOIN markets m ON p.market_id = m.id
    `;
    const values: any[] = [];
    if (status) {
      query += ' WHERE p.status = $1';
      values.push(status);
    }
    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query<LiquidityPool>(query, values);
    return NextResponse.json({ success: true, pools: result.rows });
  } catch (error: any) {
    console.error('[LiquidityPools GET]', error);
    return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
  }
}

// POST /api/admin/liquidity-pools
export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;
  const adminId = authResult.user.id;

  try {
    const body = await req.json();
    const { market_id, initial_liquidity = 1000, fee_rate = 0.002 } = body;

    if (!market_id) {
      return NextResponse.json({ error: 'market_id is required' }, { status: 400 });
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
      'SELECT question, creator_id FROM markets WHERE id = $1',
      [market_id]
    );
    if (marketRes.rows.length === 0) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    const market = marketRes.rows[0];

    // Create pool
    const poolResult = await pool.query<LiquidityPool>(
      `INSERT INTO pmf_liquidity_pools (
        market_id, name, description, initial_liquidity, current_liquidity,
        total_shares, reserve0, reserve1, fee_rate, creator_id, status,
        pmf_vector, outcome_distribution
      ) VALUES ($1, $2, $3, $4, $4, $5, $6, $6, $7, $8, 'active', $9, $10)
      RETURNING *`,
      [
        market_id,
        market.question + ' Pool',
        'Liquidity pool for market',
        initial_liquidity,
        initial_liquidity * 2,
        initial_liquidity,
        fee_rate,
        market.creator_id || adminId,
        JSON.stringify({ yes: 0.5, no: 0.5 }),
        JSON.stringify({ yes: 50, no: 50 }),
      ]
    );

    const newPool = poolResult.rows[0];

    // Audit log
    try {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, new_value, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [adminId, 'CREATE', 'liquidity_pool', newPool.id, JSON.stringify(newPool)]
      );
    } catch (auditErr) {
      console.error('[LiquidityPools POST] Audit log failed:', auditErr);
    }

    return NextResponse.json({ success: true, pool: newPool }, { status: 201 });
  } catch (error: any) {
    console.error('[LiquidityPools POST]', error);
    return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 });
  }
}
