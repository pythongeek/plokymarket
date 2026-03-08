import { createClient } from '@/lib/supabase/server';
import { UsdtUserDetailClient } from './UsdtUserDetailClient';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get user info
  const { data: user } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      phone,
      full_name,
      created_at,
      wallets (
        usdt_balance,
        locked_usdt,
        total_deposited,
        total_withdrawn,
        updated_at
      )
    `)
    .eq('id', id)
    .single();

  // Get exchange rate
  const { data: exchangeRate } = await supabase
    .from('exchange_rates_live')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  // Get transaction history
  const { data: deposits } = await supabase
    .from('deposit_requests')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const rate = exchangeRate?.usdt_to_bdt || 120;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">ইউজার পাওয়া যায়নি</h2>
          <p className="text-muted-foreground mt-2">এই আইডির কোনো ইউজার নেই।</p>
        </div>
      </div>
    );
  }

  return (
    <UsdtUserDetailClient
      user={user as any}
      deposits={deposits as any}
      withdrawals={withdrawals as any}
      rate={rate}
    />
  );
}
