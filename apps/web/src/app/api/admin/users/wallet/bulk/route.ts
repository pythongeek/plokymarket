// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdminUser(request);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;


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
                let rpcResult;
                if (action === 'credit') {
                    rpcResult = await pool.query(
                        'SELECT * FROM admin_credit_wallet($1, $2, $3, $4)',
                        [userId, targetUserId, amount, reason || `Bulk credit by admin`]
                    );
                } else {
                    rpcResult = await pool.query(
                        'SELECT * FROM admin_debit_wallet($1, $2, $3, $4)',
                        [userId, targetUserId, amount, reason || `Bulk debit by admin`]
                    );
                }

                if (rpcResult.rows[0]?.error) {
                    errors.push({ userId: targetUserId, error: rpcResult.rows[0].error });
                } else {
                    results.push({ userId: targetUserId, success: true });
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
        console.error('Bulk wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
