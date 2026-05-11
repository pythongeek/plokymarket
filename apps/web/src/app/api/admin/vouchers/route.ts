import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

/**
 * GET /api/admin/vouchers
 * ভাউচার কোড সমূহ দেখুন
 * Query: ?status=active|redeemed|expired|all&limit=200
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);

    let sql = `SELECT * FROM voucher_codes`;
    const params: any[] = [];

    if (status !== 'all') {
      sql += ` WHERE status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const vouchers = await query(sql, params);

    return NextResponse.json({ success: true, data: vouchers });

  } catch (err: any) {
    console.error('Admin vouchers list error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
