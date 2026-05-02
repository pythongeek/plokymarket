// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool, query, ensureAdminProfile } from '@/lib/admin/local-db';

/**
 * Auth helper: validate token against cloud Supabase, return user ID.
 */
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

// GET /api/admin/users - List/search users via pg
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = await getUserFromToken(authHeader.split(' ')[1]);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin in local DB
        const profiles = await query<{ is_admin: boolean }>(
            'SELECT is_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') || '';
        const status = searchParams.get('status');
        const kyc = searchParams.get('kyc');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Try RPC first; fall back to direct query
        let data: any[];
        try {
            const rpcResult = await pool.query(
                'SELECT * FROM search_users($1, $2, $3, $4, $5)',
                [q, status || null, kyc || null, limit, offset]
            );
            data = rpcResult.rows;
        } catch (rpcErr) {
            // Fallback: direct query on user_profiles + auth.users
            let sql = `
                SELECT
                    u.id as user_id,
                    u.email,
                    up.full_name,
                    up.account_status,
                    up.kyc_status,
                    up.verification_tier,
                    u.created_at
                FROM auth.users u
                LEFT JOIN user_profiles up ON up.id = u.id
                WHERE 1=1
            `;
            const params: any[] = [];
            let i = 1;
            if (q) {
                sql += ` AND (u.email ILIKE $${i} OR up.full_name ILIKE $${i})`;
                params.push(`%${q}%`);
                i++;
            }
            if (status) {
                sql += ` AND up.account_status = $${i++}`;
                params.push(status);
            }
            if (kyc) {
                sql += ` AND up.kyc_status = $${i++}`;
                params.push(kyc);
            }
            sql += ` ORDER BY u.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
            params.push(limit, offset);
            const result = await pool.query(sql, params);
            data = result.rows;
        }

        return NextResponse.json({
            data: data || [],
            total: data?.[0]?.total_matches || data?.length || 0
        });
    } catch (error: any) {
        console.error('Error searching users:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search users' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/users - Update user status via pg
export async function PATCH(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = await getUserFromToken(authHeader.split(' ')[1]);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profiles = await query<{ is_admin: boolean }>(
            'SELECT is_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { user_id, status_changes, reason, dual_auth_admin_id } = body;

        if (!user_id || !status_changes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Try RPC; fall back to direct update
        try {
            await pool.query(
                'SELECT update_user_status($1, $2, $3, $4, $5)',
                [userId, status_changes, reason || null, dual_auth_admin_id || null, userId]
            );
        } catch (rpcErr) {
            // Direct update fallback
            const updates: string[] = [];
            const values: any[] = [];
            let i = 1;
            if (status_changes.account_status !== undefined) {
                updates.push(`account_status = $${i++}`);
                values.push(status_changes.account_status);
            }
            if (status_changes.can_trade !== undefined) {
                updates.push(`can_trade = $${i++}`);
                values.push(status_changes.can_trade);
            }
            if (status_changes.can_deposit !== undefined) {
                updates.push(`can_deposit = $${i++}`);
                values.push(status_changes.can_deposit);
            }
            if (status_changes.can_withdraw !== undefined) {
                updates.push(`can_withdraw = $${i++}`);
                values.push(status_changes.can_withdraw);
            }
            if (updates.length === 0) {
                return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
            }
            values.push(user_id);
            await pool.query(
                `UPDATE user_profiles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
                values
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating user status:', error);
        if (error.message?.includes('Dual authorization required')) {
            return NextResponse.json(
                { error: error.message, requires_dual_auth: true },
                { status: 403 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Failed to update status' },
            { status: 500 }
        );
    }
}
