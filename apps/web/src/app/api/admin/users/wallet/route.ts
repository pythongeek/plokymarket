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

        const userId = await getUserFromToken(token);
        if (!userId) {
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
        const { action, targetUserId, amount, reason } = body;

        if (!targetUserId || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid parameters' },
                { status: 400 }
            );
        }

        let result;
        let rpcResult;

        switch (action) {
            case 'credit':
                rpcResult = await pool.query(
                    'SELECT * FROM admin_credit_wallet($1, $2, $3, $4)',
                    [userId, targetUserId, amount, reason || 'Admin credit']
                );
                result = { data: rpcResult.rows[0], error: rpcResult.rows[0]?.error };
                break;

            case 'debit':
                rpcResult = await pool.query(
                    'SELECT * FROM admin_debit_wallet($1, $2, $3, $4)',
                    [userId, targetUserId, amount, reason || 'Admin debit']
                );
                result = { data: rpcResult.rows[0], error: rpcResult.rows[0]?.error };
                break;

            case 'get':
                rpcResult = await pool.query(
                    'SELECT * FROM admin_get_user_wallet($1, $2)',
                    [userId, targetUserId]
                );
                result = { data: rpcResult.rows[0], error: rpcResult.rows[0]?.error };
                break;

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }

        if (result.error) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error: any) {
        console.error('Admin wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const targetUserId = searchParams.get('user_id');
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }
        const token = authHeader.split(' ')[1];

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!targetUserId) {
            return NextResponse.json(
                { success: false, error: 'Missing parameters' },
                { status: 400 }
            );
        }

        // Verify admin
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

        // Try RPC first, fallback to direct query
        const rpcResult = await pool.query(
            'SELECT * FROM admin_get_user_wallet($1, $2)',
            [userId, targetUserId]
        );

        if (rpcResult.rows[0]?.error || !rpcResult.rows[0]) {
            // Fallback: Get wallet and transactions directly
            const walletResult = await pool.query(
                'SELECT * FROM wallets WHERE user_id = $1',
                [targetUserId]
            );

            if (walletResult.rowCount === 0) {
                return NextResponse.json(
                    { success: false, error: 'Wallet not found' },
                    { status: 404 }
                );
            }

            const walletData = walletResult.rows[0];

            // Get recent transactions
            const txResult = await pool.query(
                `SELECT id, transaction_type, amount, status, description, created_at
                 FROM transactions
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT 50`,
                [targetUserId]
            );

            return NextResponse.json({
                success: true,
                data: {
                    ...walletData,
                    transactions: txResult.rows || []
                }
            });
        }

        // RPC returned data
        return NextResponse.json({
            success: true,
            data: rpcResult.rows[0]
        });

    } catch (error: any) {
        console.error('Get wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
