import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { ids, reason } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    // Update all in a transaction using RPC
    const { data: count, error } = await supabase.rpc('bulk_update_withdrawal_status', {
      p_ids: ids,
      p_status: 'rejected',
      p_admin_notes: reason || 'Bulk rejected by admin'
    });

    if (error) throw error;

    // Unlock funds for each
    const { data: rows } = await supabase
      .from('withdrawal_requests')
      .select('user_id, usdt_amount')
      .in('id', ids);

    for (const row of (rows || [])) {
      await supabase.rpc('unlock_withdrawal_funds', {
        p_user_id: row.user_id,
        p_amount: row.usdt_amount
      });
    }

    return NextResponse.json({ success: true, count: count || ids.length });
  } catch (err: any) {
    console.error('Bulk reject error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
