/**
 * GET /api/admin/users/me - Get current admin user info
 * POST /api/admin/users/me - Admin logout (log to audit)
 * Uses local PostgreSQL (pg) via admin auth guard
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin, getAdminUser } from '@/lib/admin/auth-guard';

export async function GET() {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.profile?.full_name || null,
        is_admin: adminUser.profile?.is_admin || false,
        is_super_admin: adminUser.profile?.is_super_admin || false,
      }
    });
  } catch (err) {
    console.error('Admin users/me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  try {
    const body = await req.json().catch(() => ({}));
    
    if (body.action === 'logout') {
      // Log the logout to audit
      await result.pool.query(`
        INSERT INTO admin_access_log (admin_id, action, resource, ip_address)
        VALUES ($1, 'logout', 'system', $2)
      `, [body.user_id || null, req.headers.get('x-forwarded-for') || 'unknown']);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Admin users/me POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
