import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/wallet/deposit/crypto/address?network=bep20|trc20|ton|erc20
 * ইুসারের জন্য ডিপোজিট এড্রেস ফিরিয়ান্ত করুন
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'থাবে লগইন করুন' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const network = (searchParams.get('network') || 'bep20').toLowerCase();

        const validNetworks = ['bep20', 'trc20', 'ton', 'erc20'];
        if (!validNetworks.includes(network)) {
            return NextResponse.json({ success: false, error: 'অবৈধ নেটওয়ার্ক' }, { status: 400 });
        }

        const wallets = await query(
            'SELECT * FROM platform_crypto_wallets WHERE network = $1 AND is_active = true LIMIT 1',
            [network]
        );

        if (wallets.length === 0) {
            return NextResponse.json({ success: false, error: 'এই নেটওয়ার্কের জন্য কোনো ডিপোজিট এড্রেস নেই' }, { status: 404 });
        }

        const wallet = wallets[0];
        const userShort = user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
        const memo = (wallet.memo_pattern || 'PLY_{user_id_short}').replace('{user_id_short}', userShort);

        return NextResponse.json({
            success: true,
            network,
            address: wallet.address,
            memo,
            fee_usdt: wallet.fee_usdt,
            confirmation_blocks: wallet.confirmation_blocks,
            instructions: wallet.instructions,
        });

    } catch (err: any) {
        console.error('Crypto address error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
