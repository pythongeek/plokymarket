import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supabase = await createClient();

    let query = supabase
      .from('withdrawal_requests')
      .select(`
        id, user_id, usdt_amount, bdt_amount, withdrawal_method, crypto_network,
        wallet_address, bank_name, account_number, account_holder_name, branch_name,
        mfs_provider, recipient_number, recipient_name, withdrawal_fee_usdt,
        status, created_at, processed_at, admin_notes,
        user_profiles!inner(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map((item: any) => ({
      ...item,
      email: item.user_profiles?.email,
      full_name: item.user_profiles?.full_name,
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    console.error('Admin withdrawals error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
