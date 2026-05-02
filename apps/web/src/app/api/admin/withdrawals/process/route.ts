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

/**
 * POST /api/admin/withdrawals/process
 * Transitions a withdrawal from 'pending' → 'processing'
 * Called when admin starts working on a withdrawal request
 * Frontend sends: { withdrawalId, notes }
 */
export async function POST(request: Request) {
  try {
    // Get Bearer token from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userId = await getUserFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization Check (Admin Only) — use user_profiles.is_admin
    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Access Denied: Admins Only' }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, notes } = body;

    if (!withdrawalId) {
      return NextResponse.json({ error: 'Missing withdrawalId' }, { status: 400 });
    }

    // 3. Status Verification — must be 'pending' to start processing
    const withdrawals = await query<any>(
      'SELECT * FROM withdrawal_requests WHERE id = $1',
      [withdrawalId]
    );

    const withdrawal = withdrawals[0];

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot start processing: withdrawal is '${withdrawal.status}', must be 'pending'` },
        { status: 400 }
      );
    }

    // 4. Transition: pending → processing
    const updateResult = await pool.query(
      `UPDATE withdrawal_requests SET 
        status = 'processing', 
        admin_notes = $1, 
        processed_by = $2 
      WHERE id = $3`,
      [notes || 'Processing started by admin', userId, withdrawalId]
    );

    if (updateResult.error) throw updateResult.error;

    return NextResponse.json({
      success: true,
      message: 'Withdrawal processing started',
      status: 'processing',
    });

  } catch (error: any) {
    console.error('CRITICAL_WITHDRAWAL_ERROR:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message,
    }, { status: 500 });
  }
}
