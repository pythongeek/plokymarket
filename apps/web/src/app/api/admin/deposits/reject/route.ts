import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextResponse } from 'next/server';


// POST /api/admin/deposits/reject
// Reject a deposit request
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
    const { depositId, reason } = body;

    if (!depositId) {
      return NextResponse.json(
        { error: 'Deposit ID required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Rejection reason required (minimum 5 characters)' },
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

    // Update deposit request as rejected
    const updateResult = await pool.query(
      `UPDATE deposit_requests SET 
        status = 'rejected', 
        rejection_reason = $1, 
        verified_by = $2, 
        verified_at = $3, 
        updated_at = $4 
      WHERE id = $5`,
      [reason.trim(), userId, new Date().toISOString(), new Date().toISOString(), depositId]
    );

    if (updateResult.error) {
      console.error('Failed to reject deposit:', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to reject deposit' },
        { status: 500 }
      );
    }

    // Create notification for user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        deposit.user_id,
        'deposit_rejected',
        'ডিপোজিট বাতিল হয়েছে',
        `আপনার ৳${deposit.bdt_amount} ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে। কারণ: ${reason}`,
        JSON.stringify({ deposit_id: depositId, rejection_reason: reason })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Deposit rejected successfully'
    });

  } catch (error) {
    console.error('Admin reject deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
