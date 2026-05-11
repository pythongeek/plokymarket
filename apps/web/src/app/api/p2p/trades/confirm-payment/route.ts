import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'লগইন করুন' }, { status: 401 });

        const body = await req.json();
        const { trade_id } = body;
        if (!trade_id) return NextResponse.json({ success: false, error: 'ট্রেড ID প্রয়োজন' }, { status: 400 });

        const trades = await query('SELECT * FROM p2p_trades WHERE id = $1', [trade_id]);
        if (trades.length === 0) return NextResponse.json({ success: false, error: 'ট্রেড পাওয়া যায়নি' }, { status: 404 });

        const trade = trades[0];
        if (trade.buyer_id !== user.id) return NextResponse.json({ success: false, error: 'শুধু ক্রেতা কনফার্ম করতে পারবে' }, { status: 403 });
        if (trade.status !== 'pending') return NextResponse.json({ success: false, error: 'ট্রেড স্ট্যাটাস অনুমোদনযোগ্য নয়' }, { status: 400 });

        await query(
            `UPDATE p2p_trades SET status = 'payment_sent', buyer_confirmed_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [trade_id]
        );

        return NextResponse.json({ success: true, message: 'পেমেন্ট কনফার্ম করা হয়েছে। বিক্রেতার কনফার্মেশনের অপেক্ষায়।' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
