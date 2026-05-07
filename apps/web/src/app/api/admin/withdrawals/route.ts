// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextResponse } from 'next/server';


// GET /api/admin/withdrawals
// List pending/processing withdrawal requests
export async function GET(request: Request) {
  try {
    // Get Bearer token from auth header
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // Check if user has admin role — use user_profiles.is_admin
    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    // Fetch withdrawal requests with user info using JOIN
    const withdrawalsResult = await pool.query(
      `SELECT wr.*, 
              p.id as user_id, p.full_name, p.email
       FROM withdrawal_requests wr
       INNER JOIN profiles p ON wr.user_id = p.id
       WHERE wr.status = $1
       ORDER BY wr.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    if (withdrawalsResult.error) {
      console.error('Failed to fetch withdrawals:', withdrawalsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM withdrawal_requests WHERE status = $1',
      [status]
    );

    const count = parseInt(countResult.rows[0]?.count || '0');

    return NextResponse.json({
      success: true,
      data: withdrawalsResult.rows,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count > offset + limit
      }
    });

  } catch (error) {
    console.error('Admin list withdrawals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
