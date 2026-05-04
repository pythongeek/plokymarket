// apps/web/src/app/api/admin/markets/related/route.ts
// Get related markets by category for RelatedMarkets component
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/admin-auth';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

// GET /api/admin/markets/related?category=xxx&currentMarketId=xxx - Get related markets
export async function GET(req: NextRequest) {
  try {
    // Auth via requireAdminUser (local JWT validation)
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const { user: adminUser, pool: adminPool } = authResult;
    const userId = adminUser.id;
    }

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
