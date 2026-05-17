import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const amountBdt = parseFloat(req.query.amount as string || '0');

        if (!amountBdt || amountBdt < 100) {
            return res.status(400).json({ error: 'Minimum deposit amount is \u09f3100' });
        }

        const { data: agents, error } = await supabase.rpc('get_matching_agents', {
            p_amount_bdt: amountBdt
        });

        if (error) {
            console.error('get_matching_agents error:', error);
            return res.status(500).json({ error: 'Failed to fetch agents' });
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

        return res.status(200).json({
            agents: agents || [],
            exchangeRate: rate,
            usdtAmount: parseFloat(usdtAmount),
            amountBdt
        });
    } catch (err) {
        console.error('Agent match API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
