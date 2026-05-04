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

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
        const token = authHeader.split(' ')[1];

        # getUserFromToken removed
    if (false) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify admin status
        const adminResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const adminUser = adminResult.rows[0];

        if (!adminUser?.is_admin && !adminUser?.is_super_admin) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, userIds, amount, reason } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No users selected' },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid amount' },
                { status: 400 }
            );
        }

        const validActions = ['credit', 'debit'];
        if (!action || !validActions.includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            );
        }

        // Process each user
        const results = [];
        const errors = [];

        for (const targetUserId of userIds) {
            try {
                // Get or create wallet for user
                const walletResult = await pool.query(
                    'SELECT * FROM wallets WHERE user_id = $1',
                    [targetUserId]
                );
                let wallet = walletResult.rows[0];

                if (!wallet) {
                    // Create wallet if doesn't exist
                    const newWalletResult = await pool.query(
                        `INSERT INTO wallets (user_id, usdt_balance, total_deposited, total_withdrawn, locked_usdt, version, created_at, updated_at)
                         VALUES ($1, 0, 0, 0, 0, 1, NOW(), NOW())
                         RETURNING *`,
                        [targetUserId]
                    );
                    wallet = newWalletResult.rows[0];
                }

                if (action === 'credit') {
                    // Credit USDT to wallet
                    const creditResult = await pool.query(
                        `UPDATE wallets 
                         SET usdt_balance = usdt_balance + $1,
                             total_deposited = total_deposited + $1,
                             updated_at = NOW()
                         WHERE user_id = $2
                         RETURNING *`,
                        [amount, targetUserId]
                    );

                    if (creditResult.rowCount === 0) {
                        errors.push({ userId: targetUserId, error: 'Failed to credit wallet' });
                    } else {
                        // Log transaction
                        await pool.query(
                            `INSERT INTO transactions 
                             (user_id, transaction_type, amount, status, description, created_at)
                             VALUES ($1, 'deposit', $2, 'completed', $3, NOW())`,
                            [targetUserId, amount, reason || 'Bulk USDT credit by admin']
                        );

                        results.push({ userId: targetUserId, success: true });
                    }
                } else {
                    // Debit USDT from wallet
                    const currentBalance = wallet.usdt_balance || 0;
                    if (currentBalance < amount) {
                        errors.push({ userId: targetUserId, error: 'Insufficient balance' });
                        continue;
                    }

                    const debitResult = await pool.query(
                        `UPDATE wallets 
                         SET usdt_balance = usdt_balance - $1,
                             total_withdrawn = total_withdrawn + $1,
                             updated_at = NOW()
                         WHERE user_id = $2
                         RETURNING *`,
                        [amount, targetUserId]
                    );

                    if (debitResult.rowCount === 0) {
                        errors.push({ userId: targetUserId, error: 'Failed to debit wallet' });
                    } else {
                        // Log transaction
                        await pool.query(
                            `INSERT INTO transactions 
                             (user_id, transaction_type, amount, status, description, created_at)
                             VALUES ($1, 'withdrawal', $2, 'completed', $3, NOW())`,
                            [targetUserId, -amount, reason || 'Bulk USDT debit by admin']
                        );

                        // Log admin action
                        await pool.query(
                            `INSERT INTO admin_actions 
                             (admin_id, action, target_user_id, details, created_at)
                             VALUES ($1, 'usdt_bulk_debit', $2, $3, NOW())`,
                            [userId, targetUserId, { amount, reason }]
                        );

                        results.push({ userId: targetUserId, success: true });
                    }
                }
            } catch (err: any) {
                errors.push({ userId: targetUserId, error: err.message });
            }
        }

        return NextResponse.json({
            success: results.length > 0,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        console.error('Bulk USDT wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
