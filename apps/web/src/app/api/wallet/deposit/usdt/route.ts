import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/wallet/deposit/usdt
 * Create a pending USDT P2P deposit request
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
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
