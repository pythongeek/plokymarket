import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextResponse } from 'next/server';


// POST /api/admin/withdrawals/complete
// Complete a withdrawal (mark as completed after BDT transfer)
export async function POST(request: Request) {
  try {
    // Get Bearer token from auth header
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;


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
    const { withdrawalId, notes, proofUrl } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID required' },
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
        { error: 'Withdrawal not in processing state' },
        { status: 400 }
      );
    }

    // Use the database function to complete withdrawal
    const result = await pool.query(
      'SELECT * FROM process_withdrawal($1, $2, $3, $4)',
      [withdrawalId, withdrawal.user_id, true, notes || null]
    );

    if (result.error) {
      console.error('Failed to complete withdrawal:', result.error);
      return NextResponse.json(
        { error: 'Failed to complete withdrawal: ' + result.error.message },
        { status: 500 }
      );
    }

    // Update transfer proof if provided
    if (proofUrl) {
      await pool.query(
        'UPDATE withdrawal_requests SET transfer_proof_url = $1 WHERE id = $2',
        [proofUrl, withdrawalId]
      );
    }

    // Create notification for user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        withdrawal.user_id,
        'withdrawal_completed',
        'উইথড্র সম্পন্ন হয়েছে',
        `আপনার ${withdrawal.usdt_amount} USDT (${withdrawal.bdt_amount} BDT) উইথড্র সম্পন্ন হয়েছে।`,
        JSON.stringify({
          withdrawal_id: withdrawalId,
          usdt_amount: withdrawal.usdt_amount,
          bdt_amount: withdrawal.bdt_amount,
          mfs_provider: withdrawal.mfs_provider,
          recipient_number: withdrawal.recipient_number
        })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: { withdrawalId }
    });

  } catch (error) {
    console.error('Admin complete withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
