// apps/web/src/app/api/admin/custom-categories/route.ts
// Get custom categories for EventCreationPanel
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';


// GET /api/admin/custom-categories - Get active custom categories
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

    // Fetch custom categories
    const result = await pool.query(
      `SELECT name, slug, is_active, display_order
       FROM custom_categories
       WHERE is_active = true
       ORDER BY display_order ASC`
    );

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.rows || [] });
  } catch (err: any) {
    console.error('[admin/custom-categories] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
