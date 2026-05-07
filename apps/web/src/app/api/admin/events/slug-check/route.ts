// apps/web/src/app/api/admin/events/slug-check/route.ts
// Check slug collision for Admin.tsx (checkSlugCollision function)
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';


// GET /api/admin/events/slug-check?slug=xxx - Check for slug collisions
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
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Check for slug collision using ILIKE
    const result = await pool.query(
      `SELECT slug FROM events WHERE slug ILIKE $1 LIMIT 10`,
      [`${slug}%`]
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.rows || [] });
  } catch (err: any) {
    console.error('[admin/events/slug-check] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
