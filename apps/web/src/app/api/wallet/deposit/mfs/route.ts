import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/wallet/deposit/mfs
 * Create a pending MFS (bKash/Nagad/Rocket) deposit request
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const body = await request.json();
        const { payment_method, bdt_amount, usdt_amount, sender_number, sender_name, txn_id, exchange_rate } = body;

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

        // Create deposit request
        const { data: deposit, error } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: user.id,
                payment_method,
                bdt_amount,
                usdt_amount: usdt_amount || (bdt_amount / (exchange_rate || 120)),
                amount_usdt: usdt_amount || (bdt_amount / (exchange_rate || 120)),
                amount_bdt: bdt_amount,
                sender_number,
                sender_name: sender_name || null,
                txn_id,
                exchange_rate: exchange_rate || 120,
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
