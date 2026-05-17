// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '200');

    let query = supabase
      .from('deposit_sessions')
      .select(`
        id, session_code, user_id, agent_id,
        amount_bdt, amount_usdt, exchange_rate,
        payment_method, agent_phone, agent_name,
        status, created_at, expires_at,
        payment_sent_at, confirmed_at, cancelled_at,
        transaction_id, screenshot_url, sender_phone, notes,
        confirmed_by, confirmation_notes, rejection_reason,
        agent_wallets!agent_id(agent_name, trust_score, is_online, current_sessions),
        user_profiles!user_id(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((item: any) => ({
      ...item,
      agent: item.agent_wallets,
      user: item.user_profiles,
      minutes_elapsed: item.created_at
        ? Math.floor((Date.now() - new Date(item.created_at).getTime()) / 60000)
        : 0,
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    console.error('Agent sessions error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
