// apps/web/src/app/api/admin/user-profiles/admin-check/route.ts
// Check if user is admin for AdminGuard component
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

// GET /api/admin/user-profiles/admin-check - Check if current user is admin
export async function GET(req: NextRequest) {
  try {
    // Auth via requireAdminUser (local JWT validation)
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const { user: adminUser, pool: adminPool } = authResult;
    const userId = adminUser.id;
    }

    // Check if user is admin
    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );

    const isAdmin = profiles[0]?.is_admin || profiles[0]?.is_super_admin || false;

    return NextResponse.json({ is_admin: isAdmin, user_id: userId });
  } catch (err: any) {
    console.error('[admin/user-profiles/admin-check] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
