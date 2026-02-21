import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate the User
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse payload
        const body = await req.json();
        const { mfs_provider, bdt_amount, txn_id, sender_number } = body;

        // Basic Validation
        if (!mfs_provider || !bdt_amount || !txn_id || !sender_number) {
            return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
        }

        if (bdt_amount < 500) {
            return NextResponse.json({ error: 'Minimum deposit is 500 BDT.' }, { status: 400 });
        }

        // 3. Fetch Live Exchange Rate
        const { data: exchangeRate, error: rateError } = await supabase
            .from('exchange_rates')
            .select('bdt_to_usdt')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (rateError || !exchangeRate) {
            return NextResponse.json({ error: 'Exchange rate unavailable. Try again later.' }, { status: 500 });
        }

        const currentRate = exchangeRate.bdt_to_usdt;

        // Calculate USDT equivalent based on config. (e.g. Rate 115 BDT = 1 USDT -> 500 BDT / 115)
        const usdt_amount = Number((bdt_amount / currentRate).toFixed(2));

        // 4. Insert into deposit_requests
        const { data: request, error: depositError } = await supabase
            .from('deposit_requests')
            .insert({
                user_id: user.id,
                bdt_amount,
                usdt_amount,
                exchange_rate: currentRate,
                mfs_provider,
                txn_id,
                sender_number,
                status: 'pending'
            })
            .select()
            .single();

        if (depositError) {
            // Check for uniqueness constraint violation (same txn_id + provider)
            if (depositError.code === '23505') {
                return NextResponse.json({ error: 'This Transaction ID has already been submitted for this provider.' }, { status: 409 });
            }
            console.error('Deposit Insert Error:', depositError);
            return NextResponse.json({ error: 'Failed to submit deposit request.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, request });

    } catch (err: any) {
        console.error('Unhandled Deposit Error:', err);
        return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
    }
}
