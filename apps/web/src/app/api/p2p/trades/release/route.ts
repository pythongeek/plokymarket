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
        if (trade.seller_id !== user.id) return NextResponse.json({ success: false, error: 'শুধু বিক্রেতা রিলিজ করতে পারবে' }, { status: 403 });
        if (trade.status !== 'payment_sent') return NextResponse.json({ success: false, error: 'পেমেন্ট কনফার্ম না হলে রিলিজ হবে না' }, { status: 400 });

        // বায়ার ক্রেডিট
        const { error: rpcError } = await supabase.rpc('credit_wallet', {
            p_user_id: trade.buyer_id,
            p_amount: trade.amount_usdt,
        });
        if (rpcError) throw rpcError;

        await query(
            `UPDATE p2p_trades SET status = 'completed', escrow_released = true, seller_released_at = NOW(), completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [trade_id]
        );

        return NextResponse.json({ success: true, message: 'ব্যালেন্স সফলভাবে রিলিজ হয়েছে' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
