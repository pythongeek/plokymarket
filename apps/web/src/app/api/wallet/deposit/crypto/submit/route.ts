import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/wallet/deposit/crypto/submit
 * ট্রানজাকশন হ্যাশ সাবমিট
 * Body: { network, txn_hash, amount_usdt?, from_address? }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'থাবে লগইন করুন' }, { status: 401 });
        }

        const body = await req.json();
        const { network, txn_hash, amount_usdt, from_address } = body;

        if (!network || !txn_hash) {
            return NextResponse.json({ success: false, error: 'নেটওয়ার্ক ও ট্রানজাকশন হ্যাশ প্রদান করুন' }, { status: 400 });
        }

        const validNetworks = ['bep20', 'trc20', 'ton', 'erc20'];
        if (!validNetworks.includes(network.toLowerCase())) {
            return NextResponse.json({ success: false, error: 'অবৈধ নেটওয়ার্ক' }, { status: 400 });
        }

        // বিতরকর্ম চেক করুন
        const existing = await query(
            'SELECT id FROM user_crypto_deposits WHERE txn_hash = $1 AND network = $2 LIMIT 1',
            [txn_hash.trim(), network.toLowerCase()]
        );
        if (existing.length > 0) {
            return NextResponse.json({ success: false, error: 'এই ট্রানজাকশ঩ হ্যাশ আগে জমা হয়েছে' }, { status: 409 });
        }

        // প্লাটফর্ম এড্রেস নিন
        const wallets = await query(
            'SELECT address, memo_pattern FROM platform_crypto_wallets WHERE network = $1 AND is_active = true LIMIT 1',
            [network.toLowerCase()]
        );
        const toAddress = wallets.length > 0 ? wallets[0].address : '';
        const userShort = user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
        const memo = (wallets[0]?.memo_pattern || 'PLY_{user_id_short}').replace('{user_id_short}', userShort);

        await query(
            `INSERT INTO user_crypto_deposits (user_id, network, amount_usdt, txn_hash, from_address, to_address, memo, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())`,
            [user.id, network.toLowerCase(), amount_usdt || null, txn_hash.trim(), from_address || null, toAddress, memo]
        );

        return NextResponse.json({
            success: true,
            message: 'ডিপোজিট সাবমিশন সফলভাবে গ্রহণ করা হয়েছে। অ্যাডমিন ধন্যবাদ পরে ব্যালেন্স ক্রেডিট হবে।',
        });

    } catch (err: any) {
        console.error('Crypto submit error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
