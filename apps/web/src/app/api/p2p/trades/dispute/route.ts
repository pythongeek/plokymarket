import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'লগইন করুন' }, { status: 401 });

        const body = await req.json();
        const { trade_id, reason, evidence_url } = body;
        if (!trade_id || !reason) return NextResponse.json({ success: false, error: 'ট্রেড ID ও দিসপিউ কারণ প্রয়োজন' }, { status: 400 });

        const trades = await query('SELECT * FROM p2p_trades WHERE id = $1', [trade_id]);
        if (trades.length === 0) return NextResponse.json({ success: false, error: 'ট্রেড পাওয়া যায়নি' }, { status: 404 });

        const trade = trades[0];
        if (trade.buyer_id !== user.id && trade.seller_id !== user.id) {
            return NextResponse.json({ success: false, error: 'অনুমোদনযোগ্য দাবি' }, { status: 403 });
        }
        if (trade.status === 'completed' || trade.status === 'disputed') {
            return NextResponse.json({ success: false, error: 'এই ট্রেড এর বিরুদ্ধে দিসপিউ খোলা যাবে না' }, { status: 400 });
        }

        await query(
            `UPDATE p2p_trades SET status = 'disputed', disputed_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [trade_id]
        );

        await query(
            `INSERT INTO p2p_disputes (trade_id, opened_by, reason, evidence_url, status)
             VALUES ($1, $2, $3, $4, 'open')`,
            [trade_id, user.id, reason, evidence_url || null]
        );

        return NextResponse.json({ success: true, message: 'দিসপিউ সফলভাবে খোলা হয়েছে। অ্যাডমিন শীঘ্র বিলমের পরে দেখবে।' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
