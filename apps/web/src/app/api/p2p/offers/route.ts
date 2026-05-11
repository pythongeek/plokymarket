import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/p2p/offers?status=active&limit=50
 * সক্রিয় সেল অফার দেখুন
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'active';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

        let sql = `SELECT o.*, u.email as seller_email, up.full_name as seller_name
                   FROM p2p_offers o
                   LEFT JOIN users u ON o.seller_id = u.id
                   LEFT JOIN user_profiles up ON o.seller_id = up.id`;
        const params: any[] = [];

        if (status !== 'all') {
            sql += ` WHERE o.status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const offers = await query(sql, params);

        return NextResponse.json({ success: true, data: offers || [], count: offers?.length || 0 });

    } catch (err: any) {
        console.error('P2P offers error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/p2p/offers/create
 * নতুন সেল অফার তৈরি করুন
 * Body: { crypto_amount_usdt, price_per_usdt_bdt, payment_methods[], min_trade_usdt?, max_trade_usdt?, terms? }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'থাবে লগইন করুন' }, { status: 401 });
        }

        const body = await req.json();
        const { crypto_amount_usdt, price_per_usdt_bdt, payment_methods, min_trade_usdt, max_trade_usdt, terms } = body;

        if (!crypto_amount_usdt || !price_per_usdt_bdt || !payment_methods || payment_methods.length === 0) {
            return NextResponse.json({ success: false, error: 'সকল তথ্য প্রদান করুন' }, { status: 400 });
        }

        await query(
            `INSERT INTO p2p_offers (seller_id, crypto_amount_usdt, price_per_usdt_bdt, payment_methods, min_trade_usdt, max_trade_usdt, terms, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
            [user.id, crypto_amount_usdt, price_per_usdt_bdt, payment_methods, min_trade_usdt || 5, max_trade_usdt || crypto_amount_usdt, terms || null]
        );

        return NextResponse.json({ success: true, message: 'সেল অফার সফলভাবে তৈরি হয়েছে' });

    } catch (err: any) {
        console.error('P2P offer create error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
