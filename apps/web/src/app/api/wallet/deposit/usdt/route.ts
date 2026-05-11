// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

/**
 * POST /api/wallet/deposit/usdt
 * Create a pending USDT P2P deposit request
 */
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


export async function POST(request: NextRequest) {
    try {

        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { payment_method, usdt_amount, txn_id } = body;

        // Validate
        if (!payment_method || !['usdt_trc20', 'usdt_erc20', 'usdt_bep20'].includes(payment_method)) {
            return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
        }

        const minAmount = payment_method === 'usdt_erc20' ? 20 : 10;
        if (!usdt_amount || usdt_amount < minAmount) {
            return NextResponse.json({ error: `Minimum deposit is ${minAmount} USDT` }, { status: 400 });
        }
        if (!txn_id) {
            return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
        }

        // Check for duplicate TXN
        const { data: existing } = await supabase
            .from('deposit_requests')
            .select('id')
            .eq('txn_id', txn_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'এই TXN হ্যাশ আগে ব্যবহার হয়েছে' }, { status: 400 });
        }

        // Get current exchange rate for BDT equivalent
        const { data: rateData } = await supabase
            .from('exchange_rates_live')
            .select('usdt_to_bdt')
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        const rate = rateData?.usdt_to_bdt || 120;

        const { data: deposit, error } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: user.id,
                payment_method,
                usdt_amount,
                amount_usdt: usdt_amount,
                bdt_amount: usdt_amount * rate,
                amount_bdt: usdt_amount * rate,
                txn_id,
                exchange_rate: rate,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('[USDT Deposit] Insert error:', error);
            return NextResponse.json({ error: 'Failed to create deposit request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, deposit_id: deposit.id });
    } catch (error: any) {
        console.error('[USDT Deposit] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
