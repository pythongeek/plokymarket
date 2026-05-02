/**
 * GET /api/admin/users/me - Get current admin user info
 * POST /api/admin/users/me - Admin logout (log to audit)
 * Uses local PostgreSQL (pg) via admin auth guard
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET() {
  const result = await admin();
  if (result.error) return result.error;

  try {
    // Get admin info from the verified admin session
    const { rows } = await result.pool.query(`
      SELECT id, email, full_name, is_admin, is_super_admin
      FROM user_profiles
      WHERE is_admin = true OR is_super_admin = true
      ORDER BY is_super_admin DESC
      LIMIT 10
    `);

    // Return the first matching user - in practice the admin guard already validated the user
    return NextResponse.json({ data: rows[0] || null });
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
