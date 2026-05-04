// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

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
 * POST /api/admin/usdt/credit
 * Credit USDT to a user's wallet (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const targetUserId = formData.get('user_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const reason = formData.get('reason') as string;

    if (!targetUserId || !amount || amount <= 0 || !reason) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Get current wallet balance and version
    const walletResult = await pool.query(
      'SELECT usdt_balance, version FROM wallets WHERE user_id = $1',
      [targetUserId]
    );
    const wallet = walletResult.rows[0];

    if (!wallet) {
      // Create wallet if doesn't exist
      await pool.query(
        `INSERT INTO wallets (user_id, usdt_balance, locked_usdt, total_deposited, total_withdrawn, version, created_at, updated_at)
         VALUES ($1, $2, 0, $2, 0, 1, NOW(), NOW())`,
        [targetUserId, amount]
      );
    } else {
      // Update wallet balance with optimistic locking
      const updateResult = await pool.query(
        `UPDATE wallets 
         SET usdt_balance = usdt_balance + $1,
             total_deposited = total_deposited + $1,
             version = version + 1,
             updated_at = NOW()
         WHERE user_id = $2 AND version = $3`,
        [amount, targetUserId, wallet.version || 0]
      );

      if (updateResult.rowCount === 0) {
        return NextResponse.json({
          error: 'Concurrency error: The wallet was updated by another process. Please try again.'
        }, { status: 409 });
      }
    }

    // Log transaction
    await pool.query(
      `INSERT INTO usdt_transactions 
       (user_id, type, amount, balance_after, reference, metadata, created_at)
       VALUES ($1, 'admin_credit', $2, $3, $4, $5, NOW())`,
      [targetUserId, amount, (wallet?.usdt_balance || 0) + amount, `admin:${userId}`, { reason, admin_id: userId }]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO admin_audit_log 
       (admin_id, action, target_user_id, details, created_at)
       VALUES ($1, 'usdt_credit', $2, $3, NOW())`,
      [userId, targetUserId, { amount, reason }]
    );

    console.log(`[Admin Credit] ${userId} credited ${amount} USDT to ${targetUserId}`);

    return NextResponse.json({
      success: true,
      message: `${amount} USDT সফলভাবে ক্রেডিট করা হয়েছে`,
      newBalance: (wallet?.usdt_balance || 0) + amount
    });
  } catch (error: any) {
    console.error('[Admin Credit] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
