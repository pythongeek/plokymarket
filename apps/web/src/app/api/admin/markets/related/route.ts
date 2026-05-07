// apps/web/src/app/api/admin/markets/related/route.ts
// Get related markets by category for RelatedMarkets component
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';


// GET /api/admin/markets/related?category=xxx&currentMarketId=xxx - Get related markets
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
    const category = searchParams.get('category');
    const currentMarketId = searchParams.get('currentMarketId');

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    // Fetch related markets
    const result = await pool.query(
      `SELECT id, question, category, yes_price, total_volume, image_url, trading_closes_at, status
       FROM markets
       WHERE category = $1
         AND id != $2
         AND status IN ('active', 'open')
       ORDER BY total_volume DESC
       LIMIT 4`,
      [category, currentMarketId || '']
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.rows || [] });
  } catch (err: any) {
    console.error('[admin/markets/related] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
