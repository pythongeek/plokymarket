import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'all';
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

        let sql = `SELECT d.*, u.email as user_email, up.full_name as user_name
                   FROM user_crypto_deposits d
                   LEFT JOIN users u ON d.user_id = u.id
                   LEFT JOIN user_profiles up ON d.user_id = up.id`;
        const params: any[] = [];

        if (status !== 'all') {
            sql += ` WHERE d.status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const deposits = await query(sql, params);
        return NextResponse.json({ success: true, data: deposits || [] });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const adminId = authResult.user.id;

        const body = await req.json();
        const { deposit_id, action, notes } = body;

        if (!deposit_id || !action) {
            return NextResponse.json({ success: false, error: 'ডিপোজিট ID ও একশন প্রয়োজন' }, { status: 400 });
        }

        const deposits = await query('SELECT * FROM user_crypto_deposits WHERE id = $1', [deposit_id]);
        if (deposits.length === 0) return NextResponse.json({ success: false, error: 'ডিপোজিট পাওয়া যায়নি' }, { status: 404 });

        const deposit = deposits[0];

        if (action === 'approve') {
            if (deposit.status === 'approved') {
                return NextResponse.json({ success: false, error: 'ইতিমধ্যে অনুমোদন করা হয়েছে' }, { status: 400 });
            }

            const { createClient } = await import('@/lib/supabase/server');
            const supabase = await createClient();
            const { error: rpcError } = await supabase.rpc('credit_wallet', {
                p_user_id: deposit.user_id,
                p_amount: deposit.amount_usdt || 0,
            });
            if (rpcError) throw rpcError;

            await query(
                `UPDATE user_crypto_deposits SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), credited_at = NOW(), notes = COALESCE($2, notes) WHERE id = $3`,
                [adminId, notes || null, deposit_id]
            );

            return NextResponse.json({ success: true, message: `ডিপোজিট অনুমোদন করা হয়েছে। ${deposit.amount_usdt || 0} USDT ক্রেডিট হয়েছে।` });
        }

        if (action === 'reject') {
            await query(
                `UPDATE user_crypto_deposits SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), notes = COALESCE($2, notes) WHERE id = $3`,
                [adminId, notes || null, deposit_id]
            );
            return NextResponse.json({ success: true, message: 'ডিপোজিট বাতিল করা হয়েছে' });
        }

        return NextResponse.json({ success: false, error: 'অবৈধ একশন' }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
