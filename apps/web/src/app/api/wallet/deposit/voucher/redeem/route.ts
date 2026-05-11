import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/wallet/deposit/voucher/redeem
 * ভাউচার কোড রিডিম এপিএই
 * Body: { code: string }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'থাবে লগইন করুন' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const code = (body.code || '').trim().toUpperCase();

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'ভাউচার কোড প্রদান করুন' },
                { status: 400 }
            );
        }

        // ভাউচার চেক করুন
        const vouchers = await query(
            `SELECT * FROM voucher_codes WHERE code = $1 AND status = 'active'`,
            [code]
        );

        if (vouchers.length === 0) {
            return NextResponse.json(
                { success: false, error: 'জানুয় ভাউচার কোড নেই বা ব্যবহার করা হয়েছে' },
                { status: 400 }
            );
        }

        const voucher = vouchers[0];

        // মেয়াদ চেক করুন
        if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
            await query(
                `UPDATE voucher_codes SET status = 'expired' WHERE id = $1`,
                [voucher.id]
            );
            return NextResponse.json(
                { success: false, error: 'ভাউচারটির মেয়াদ শেষ' },
                { status: 400 }
            );
        }

        // রিডিম করুন
        await query(
            `UPDATE voucher_codes SET status = 'redeemed', redeemed_by = $1, redeemed_at = NOW() WHERE id = $2`,
            [user.id, voucher.id]
        );

        // ওয়ালেট ক্রেডিট করুন (RPC ব্যবহার করুন)
        const { error: rpcError } = await supabase.rpc('credit_wallet', {
            p_user_id: user.id,
            p_amount: voucher.usdt_value,
        });

        if (rpcError) {
            // রিভার্স করুন
            await query(
                `UPDATE voucher_codes SET status = 'active', redeemed_by = NULL, redeemed_at = NULL WHERE id = $1`,
                [voucher.id]
            );
            throw rpcError;
        }

        return NextResponse.json({
            success: true,
            message: `${voucher.usdt_value} USDT সফলভাবে যোগ হয়েছে`,
            amount: voucher.usdt_value,
        });

    } catch (err: any) {
        console.error('Voucher redeem error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
