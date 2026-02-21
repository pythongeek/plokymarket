import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse payload
        const body = await req.json();
        const { usdt_amount, mfs_provider, recipient_number } = body;

        if (!usdt_amount || !mfs_provider || !recipient_number) {
            return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
        }

        if (usdt_amount < 5) {
            return NextResponse.json({ error: 'Minimum withdrawal is 5 USDT.' }, { status: 400 });
        }

        // 3. Check Wallet Balance before queueing
        const { data: walletData, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (walletError || !walletData) {
            return NextResponse.json({ error: 'Could not fetch wallet balance.' }, { status: 400 });
        }

        if (walletData.balance < usdt_amount) {
            return NextResponse.json({ error: 'Insufficient available balance.' }, { status: 400 });
        }

        // 4. Fetch Live Exchange Rate mapping
        const { data: exchangeRate, error: rateError } = await supabase
            .from('exchange_rates')
            .select('usdt_to_bdt')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (rateError || !exchangeRate) {
            return NextResponse.json({ error: 'Exchange rate unavailable. Try again later.' }, { status: 500 });
        }

        const currentRate = exchangeRate.usdt_to_bdt;

        // Calculate BDT Equivalent (e.g. 5 USDT * 115 BDT = 575 BDT)
        const bdt_amount = Number((usdt_amount * currentRate).toFixed(2));

        // 5. Trigger RPC `freeze_funds`
        const { data: freezeSuccess, error: freezeError } = await supabase
            .rpc('freeze_funds', { p_user_id: user.id, p_amount: usdt_amount });

        if (freezeError || !freezeSuccess) {
            console.error("Freeze RPC Failed:", freezeError);
            return NextResponse.json({ error: 'Failed to reserve funds for withdrawal. Balance may be insufficient.' }, { status: 400 });
        }

        // 6. Insert Withdrawal Request Queue
        const { data: request, error: withdrawError } = await supabase
            .from('withdrawal_requests')
            .insert({
                user_id: user.id,
                usdt_amount,
                bdt_amount,
                exchange_rate: currentRate,
                mfs_provider,
                recipient_number,
                status: 'pending'
            })
            .select()
            .single();

        if (withdrawError) {
            console.error('Withdrawal Insert Error:', withdrawError);

            // Attempt manual rollback if queueing fails but lock succeeded
            await supabase.rpc('unfreeze_funds', { p_user_id: user.id, p_amount: usdt_amount });

            return NextResponse.json({ error: 'Failed to submit withdrawal request.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, request });

    } catch (err: any) {
        console.error('Unhandled Withdrawal Error:', err);
        return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
    }
}
