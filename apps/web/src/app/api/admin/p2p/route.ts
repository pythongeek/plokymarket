import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'trades';

    if (type === 'trades') {
      const rows = await query(
        `SELECT t.*,
          bo.seller_name as seller_name, bb.full_name as buyer_name,
          o.payment_methods
         FROM p2p_trades t
         LEFT JOIN (SELECT id, full_name as seller_name FROM user_profiles) bo ON t.seller_id = bo.id
         LEFT JOIN (SELECT id, full_name as buyer_name FROM user_profiles) bb ON t.buyer_id = bb.id
         LEFT JOIN p2p_offers o ON t.offer_id = o.id
         ORDER BY t.created_at DESC LIMIT 200`, []
      );
      return NextResponse.json({ success: true, data: rows });
    }

    if (type === 'disputes') {
      const rows = await query(
        `SELECT d.*, t.amount_usdt, t.total_bdt, t.status as trade_status,
          bo.full_name as opener_name
         FROM p2p_disputes d
         LEFT JOIN p2p_trades t ON d.trade_id = t.id
         LEFT JOIN user_profiles bo ON d.opened_by = bo.id
         ORDER BY d.created_at DESC LIMIT 200`, []
      );
      return NextResponse.json({ success: true, data: rows });
    }

    return NextResponse.json({ success: false, error: 'bad type' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminUser(req);
    if ('error' in auth) return auth.error;
    const adminId = auth.user.id;

    const body = await req.json();
    const { trade_id, action, resolution } = body;
    if (!trade_id || !action) return NextResponse.json({ success: false, error: 'trade_id + action required' }, { status: 400 });

    if (action === 'resolve_dispute') {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const trades = await query('SELECT * FROM p2p_trades WHERE id=$1', [trade_id]);
      if (!trades.length) return NextResponse.json({ success: false, error: 'trade not found' }, { status: 404 });
      const trade = trades[0];

      if (resolution === 'release_to_buyer') {
        const { error: rpcErr } = await supabase.rpc('credit_wallet', { p_user_id: trade.buyer_id, p_amount: trade.amount_usdt });
        if (rpcErr) throw rpcErr;
        await query(`UPDATE p2p_trades SET status='completed', escrow_released=true, completed_at=NOW(), updated_at=NOW() WHERE id=$1`, [trade_id]);
      } else if (resolution === 'return_to_seller') {
        const { error: rpcErr } = await supabase.rpc('credit_wallet', { p_user_id: trade.seller_id, p_amount: trade.amount_usdt });
        if (rpcErr) throw rpcErr;
        await query(`UPDATE p2p_trades SET status='completed', escrow_released=true, completed_at=NOW(), updated_at=NOW() WHERE id=$1`, [trade_id]);
      } else {
        return NextResponse.json({ success: false, error: 'resolution must be release_to_buyer or return_to_seller' }, { status: 400 });
      }

      await query(`UPDATE p2p_disputes SET status='resolved', resolved_by=$1, resolution=$2, resolved_at=NOW() WHERE trade_id=$3 AND status='open'`, [adminId, resolution, trade_id]);
      return NextResponse.json({ success: true, message: 'দিসপিউ মিমাংশা সমাধান হয়েছে' });
    }

    if (action === 'cancel_trade') {
      await query(`UPDATE p2p_trades SET status='cancelled', updated_at=NOW() WHERE id=$1`, [trade_id]);
      return NextResponse.json({ success: true, message: 'ট্রেড বাতিল হয়েছে' });
    }

    return NextResponse.json({ success: false, error: 'bad action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
