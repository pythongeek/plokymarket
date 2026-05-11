// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

/**
 * POST /api/wallet/deposit/mfs
 * Create a pending MFS (bKash/Nagad/Rocket) deposit request
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
        const { payment_method, bdt_amount, sender_number, sender_name, txn_id } = body;

        // Validate
        if (!payment_method || !['bkash', 'nagad', 'rocket'].includes(payment_method)) {
            return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
        }
        if (!bdt_amount || bdt_amount < 100) {
            return NextResponse.json({ error: 'Minimum deposit is 100 BDT' }, { status: 400 });
        }
        if (!sender_number || !txn_id) {
            return NextResponse.json({ error: 'Sender number and TXN ID required' }, { status: 400 });
        }

        // Check for duplicate TXN ID
        const { data: existing } = await supabase
            .from('deposit_requests')
            .select('id')
            .eq('txn_id', txn_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'এই TXN ID আগে ব্যবহার হয়েছে' }, { status: 400 });
        }

        // SECURITY: Fetch exchange rate server-side — never trust client-supplied rate
        const { data: rateData } = await supabase
            .from('exchange_rates_live')
            .select('usdt_to_bdt')
            .eq('is_active', true)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        const serverRate = rateData?.usdt_to_bdt || 119;
        const calculatedUsdt = parseFloat((bdt_amount / serverRate).toFixed(6));

        // Create deposit request with server-enforced rate
        const { data: deposit, error } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: user.id,
                payment_method,
                bdt_amount,
                usdt_amount: calculatedUsdt,
                amount_usdt: calculatedUsdt,
                amount_bdt: bdt_amount,
                sender_number,
                sender_name: sender_name || null,
                txn_id,
                exchange_rate: serverRate,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('[MFS Deposit] Insert error:', error);
            return NextResponse.json({ error: 'Failed to create deposit request' }, { status: 500 });
        }

        return NextResponse.json({ success: true, deposit_id: deposit.id });
    } catch (error: any) {
        console.error('[MFS Deposit] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
