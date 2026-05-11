// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// GET /api/wallet/balance
// Get user's current balance
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function GET(request: Request) {
  try {

    // Get user session
    const user = await getUserFromRequest(request);

    if (!user) {
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

    // Get current exchange rate from live table
    const { data: exchangeRateData, error: rateError } = await supabase
      .from('exchange_rates_live')
      .select('usdt_to_bdt')
      .eq('is_active', true)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const exchangeRate = rateError ? 119.0000 : exchangeRateData.usdt_to_bdt;

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