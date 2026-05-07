// apps/web/src/app/api/admin/positions/route.ts
// Get user positions for UserPositionsView
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';


// GET /api/admin/positions?userId=xxx - Get positions for a specific user
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Fetch positions
    const positionsResult = await pool.query(
      `SELECT p.*, m.question as market_question, m.status as market_status
       FROM positions p
       LEFT JOIN markets m ON p.market_id = m.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [targetUserId]
    );

    if (positionsResult.error) {
      return NextResponse.json({ error: positionsResult.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: positionsResult.rows || [] });
  } catch (err: any) {
    console.error('[admin/positions] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
