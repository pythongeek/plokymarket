import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/wallet/balance
// Get user's current balance
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, total_deposited, total_withdrawn, kyc_status, daily_withdrawal_limit')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to get user balance:', profileError);
      return NextResponse.json(
        { error: 'Failed to get user balance' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get current exchange rate
    const { data: exchangeRateData, error: rateError } = await supabase
      .from('exchange_rates')
      .select('bdt_to_usdt')
      .eq('effective_until', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    const exchangeRate = rateError ? 100.0000 : exchangeRateData.bdt_to_usdt;

    // Calculate BDT equivalent
    const bdtEquivalent = parseFloat((profile.balance * exchangeRate).toFixed(2));

    return NextResponse.json({
      success: true,
      balance: {
        usdt: profile.balance,
        bdt: bdtEquivalent,
        exchangeRate: exchangeRate,
        totalDeposited: profile.total_deposited,
        totalWithdrawn: profile.total_withdrawn,
        kycStatus: profile.kyc_status,
        dailyWithdrawalLimit: profile.daily_withdrawal_limit
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}