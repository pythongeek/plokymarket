import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const amountBdt = parseFloat(searchParams.get('amount') || '0');

        if (!amountBdt || amountBdt < 100) {
            return NextResponse.json({ error: 'Minimum deposit amount is ৳100' }, { status: 400 });
        }

        const { data: agents, error } = await supabase.rpc('get_matching_agents', {
            p_amount_bdt: amountBdt
        });

        if (error) {
            console.error('get_matching_agents error:', error);
            return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
        }

        const { data: rateData } = await supabase
            .from('exchange_rates')
            .select('rate')
            .eq('pair', 'USDTBDT')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const rate = rateData?.rate || 119.5;
        const usdtAmount = (amountBdt / rate).toFixed(2);

        return NextResponse.json({
            agents: agents || [],
            exchangeRate: rate,
            usdtAmount: parseFloat(usdtAmount),
            amountBdt
        });
    } catch (err) {
        console.error('Agent match API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
