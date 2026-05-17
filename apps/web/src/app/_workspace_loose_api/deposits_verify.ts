import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const userId = authResult.user.id;

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
