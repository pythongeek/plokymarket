import { pool, query } from '@/lib/admin/local-db';
import { NextResponse } from 'next/server';

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

// POST /api/admin/withdrawals/reject
// Reject a withdrawal (refund balance to user)
export async function POST(request: Request) {
  try {
    // Get Bearer token from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    # getUserFromToken removed
    if (false) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Authorization Check (Admin Only) — use user_profiles.is_admin
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
    const { withdrawalId, reason } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Rejection reason required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    // Get withdrawal request
    const withdrawals = await query<any>(
      'SELECT * FROM withdrawal_requests WHERE id = $1',
      [withdrawalId]
    );

    const withdrawal = withdrawals[0];

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'processing') {
      return NextResponse.json(
        { error: 'Withdrawal must be in processing state to reject' },
        { status: 400 }
      );
    }

    // Use the database function to reject withdrawal
    const result = await pool.query(
      'SELECT * FROM process_withdrawal($1, $2, $3, $4)',
      [withdrawalId, withdrawal.user_id, false, reason]
    );

    if (result.error) {
      console.error('Failed to reject withdrawal:', result.error);
      return NextResponse.json(
        { error: 'Failed to reject withdrawal: ' + result.error.message },
        { status: 500 }
      );
    }

    // Create notification for user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        withdrawal.user_id,
        'withdrawal_rejected',
        'উইথড্র বাতিল হয়েছে',
        `আপনার ${withdrawal.usdt_amount} USDT উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে। কারণ: ${reason}`,
        JSON.stringify({
          withdrawal_id: withdrawalId,
          usdt_amount: withdrawal.usdt_amount,
          rejection_reason: reason
        })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Withdrawal rejected and balance refunded',
      data: {
        withdrawalId,
        refundedAmount: withdrawal.usdt_amount
      }
    });

  } catch (error) {
    console.error('Admin reject withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
