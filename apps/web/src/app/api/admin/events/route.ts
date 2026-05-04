// apps/web/src/app/api/admin/events/route.ts
// Admin-only events listing — used by /sys-cmd-7x9k2/events page
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { NextRequest, NextResponse } from 'next/server';
import type { UnifiedEvent } from '@/types/unified';
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

// ─── GET /api/admin/events ────────────────────────────────────────────────────
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
    const status   = searchParams.get('status')   || undefined;
    const category = searchParams.get('category') || undefined;
    const search   = searchParams.get('search')   || undefined;
    const limit    = Math.min(parseInt(searchParams.get('limit')  || '100'), 200);
    const offset   = parseInt(searchParams.get('offset') || '0');

    // Try the RPC function first (returns resolver_reference + market_count)
    try {
      const rpcResult = await pool.query(
        'SELECT * FROM get_admin_events($1, $2, $3, $4, $5)',
        [status ?? null, category ?? null, search ?? null, limit, offset]
      );

      if (rpcResult.rows && rpcResult.rows.length > 0) {
        return NextResponse.json({ data: rpcResult.rows as unknown as UnifiedEvent[], count: rpcResult.rows.length });
      }
    } catch (rpcError: any) {
      console.warn('[admin/events] RPC failed, falling back to direct query:', rpcError?.message);
    }

    // Fallback: direct table query if RPC fails
    let sql = 'SELECT * FROM events';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    if (search) {
      conditions.push(`(title ILIKE $${paramIndex} OR question ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(sql, params);

    if (result.error) {
      console.error('[admin/events] Fallback query error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Get count
    let countSql = 'SELECT COUNT(*) FROM events';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await pool.query(countSql, params.slice(0, -2));
    const count = parseInt(countResult.rows[0]?.count || '0');

    return NextResponse.json({ data: (result.rows ?? []) as UnifiedEvent[], count });
  } catch (err: any) {
    console.error('[admin/events] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}

// ─── PATCH /api/admin/events ──────────────────────────────────────────────────
// Body: { id, ...fields }  — patch any event fields
export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event id required' }, { status: 400 });
    }

    // Disallow changing created_by through this endpoint
    delete updates.created_by;

    // Add updated_at
    updates.updated_at = new Date().toISOString();

    const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = [...Object.values(updates), id];
    
    const result = await pool.query(
      `UPDATE events SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
