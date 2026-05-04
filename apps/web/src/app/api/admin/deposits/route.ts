// apps/web/src/app/api/admin/deposits/route.ts
// Get deposit requests for AdminDepositQueue
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

// GET /api/admin/deposits - Get deposit requests with filters
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const limit = parseInt(searchParams.get('limit') || '100');

    let sql = `SELECT dr.*, up.full_name, up.email
               FROM deposit_requests dr
               LEFT JOIN user_profiles up ON dr.user_id = up.id
               WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      sql += ` AND dr.status = $${paramIndex++}`;
      params.push(status);
    }

    if (method && method !== 'all') {
      sql += ` AND dr.payment_method = $${paramIndex++}`;
      params.push(method);
    }

    sql += ` ORDER BY dr.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(sql, params);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Map to expected format with user_profiles nested
    const data = (result.rows || []).map((row: any) => ({
      ...row,
      user_profiles: row.full_name ? { full_name: row.full_name, email: row.email } : null
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('[admin/deposits] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
