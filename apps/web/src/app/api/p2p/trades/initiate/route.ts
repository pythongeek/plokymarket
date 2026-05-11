import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/p2p/trades/initiate
 * ট্রেড শুরু করুন
 * Body: { offer_id, amount_usdt }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'থাবে লগইন করুন' }, { status: 401 });
        }

        const body = await req.json();
        const { offer_id, amount_usdt } = body;

        if (!offer_id || !amount_usdt) {
            return NextResponse.json({ success: false, error: 'অফার ID ও পরিমাণ প্রদান করুন' }, { status: 400 });
        }

        const offers = await query(
            'SELECT * FROM p2p_offers WHERE id = $1 AND status = $2',
            [offer_id, 'active']
        );

        if (offers.length === 0) {
            return NextResponse.json({ success: false, error: 'অফার পাওয়া যায়নি বা অকার্যকর' }, { status: 404 });
        }

        const offer = offers[0];

        if (offer.seller_id === user.id) {
            return NextResponse.json({ success: false, error: 'নিজের অফারে ট্রেড করা যাবে না' }, { status: 400 });
        }

        if (amount_usdt < offer.min_trade_usdt || amount_usdt > (offer.max_trade_usdt || offer.crypto_amount_usdt)) {
            return NextResponse.json({ success: false, error: `ট্রেড পরিমাণ ${offer.min_trade_usdt} - ${offer.max_trade_usdt || offer.crypto_amount_usdt} USDT হতে হবে` }, { status: 400 });
        }

        const total_bdt = amount_usdt * offer.price_per_usdt_bdt;

        const result = await query(
            `INSERT INTO p2p_trades (offer_id, buyer_id, seller_id, amount_usdt, price_per_usdt_bdt, total_bdt, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING id`,
            [offer_id, user.id, offer.seller_id, amount_usdt, offer.price_per_usdt_bdt, total_bdt]
        );

        return NextResponse.json({
            success: true,
            trade_id: result[0].id,
            message: 'ট্রেড সফলভাবে শুরু হয়েছে। এখন বিক্রেতাকে USDT পাঠিয়ে দিন।',
            total_bdt,
            payment_methods: offer.payment_methods,
        });

    } catch (err: any) {
        console.error('P2P trade initiate error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
