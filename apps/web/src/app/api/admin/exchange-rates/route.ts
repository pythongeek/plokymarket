// apps/web/src/app/api/admin/exchange-rates/route.ts
// Get exchange rate history for P2PRateDisplay
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

// GET /api/admin/exchange-rates - Get exchange rate history
export async function GET(req: NextRequest) {
  try {
    // Auth via requireAdminUser (local JWT validation)
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const { user: adminUser, pool: adminPool } = authResult;
    const userId = adminUser.id;

    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch exchange rates history
    const result = await pool.query(
      `SELECT usdt_to_bdt, source, fetched_at
       FROM exchange_rates_live
       ORDER BY fetched_at DESC
       LIMIT 24`
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.rows || [] });
  } catch (err: any) {
    console.error('[admin/exchange-rates] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
