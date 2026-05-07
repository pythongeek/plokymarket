import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextResponse } from 'next/server';


// POST /api/admin/deposits/verify
// Verify a deposit request
export async function POST(request: Request) {
  try {
    // Get Bearer token from auth header
    const authResult = await requireAdminUser(request);


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

    const body = await request.json();
    const { depositId, adminNotes } = body;

    if (!depositId) {
      return NextResponse.json(
        { error: 'Deposit ID required' },
        { status: 400 }
      );
    }

    // Get deposit request
    const deposits = await query<any>(
      'SELECT * FROM deposit_requests WHERE id = $1',
      [depositId]
    );

    const deposit = deposits[0];

    if (!deposit) {
      return NextResponse.json(
        { error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    if (deposit.status !== 'pending') {
      return NextResponse.json(
        { error: 'Deposit already processed' },
        { status: 400 }
      );
    }

    // Call RPC function to verify and credit deposit
    const result = await pool.query(
      'SELECT * FROM verify_and_credit_deposit($1, $2, $3, $4)',
      [depositId, deposit.user_id, deposit.usdt_amount, adminNotes || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Deposit verified and credited successfully',
      result: result.rows[0]
    });

  } catch (error: any) {
    console.error('Admin verify deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
