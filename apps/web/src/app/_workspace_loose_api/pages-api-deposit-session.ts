import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

function generateSessionCode(): string {
    return 'PLK-' + randomBytes(3).toString('hex').toUpperCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { agent_id, amount_bdt, payment_method } = req.body;

        if (!agent_id || !amount_bdt || amount_bdt < 100) {
            return res.status(400).json({ error: 'Agent, amount (min \u09f3100) required' });
        }

        if (!['bkash', 'nagad', 'rocket', 'upay'].includes(payment_method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const { data: rateData } = await supabase
            .from('exchange_rates')
            .select('rate')
            .eq('pair', 'USDTBDT')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        const rate = rateData?.rate || 119.5;
        const usdtAmount = parseFloat((amount_bdt / rate).toFixed(2));

        const { data: agent, error: agentErr } = await supabase
            .from('agent_wallets')
            .select('*, user:users_1(username)')
            .eq('id', agent_id)
            .eq('is_active', true)
            .single();

        if (agentErr || !agent) {
            return res.status(404).json({ error: 'Agent not found or inactive' });
        }

        const today = new Date().toISOString().split('T')[0];
        const { data: todayVolume } = await supabase
            .from('deposit_sessions')
            .select('usdt_amount')
            .eq('agent_id', agent_id)
            .eq('status', 'completed')
            .gte('created_at', today + 'T00:00:00');

        const dailyUsed = (todayVolume || []).reduce((s: number, r: any) => s + (r.usdt_amount || 0), 0);
        if (dailyUsed + usdtAmount > agent.daily_limit) {
            return res.status(400).json({ error: 'Agent daily limit exceeded. Try another agent.' });
        }

        const mfsNumber = agent[`${payment_method}_number`];
        if (!mfsNumber) {
            return res.status(400).json({ error: `Agent does not accept ${payment_method}` });
        }

        const sessionCode = generateSessionCode();
        const { data: session, error: sessErr } = await supabase
            .from('deposit_sessions')
            .insert({
                buyer_id: user.id,
                agent_id,
                amount_bdt,
                usdt_amount: usdtAmount,
                payment_method,
                session_code: sessionCode,
                status: 'awaiting_payment',
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (sessErr) {
            console.error('Session insert error:', sessErr);
            return res.status(500).json({ error: 'Failed to create session' });
        }

        return res.status(200).json({
            success: true,
            session,
            payment_details: {
                send_to: mfsNumber,
                amount: amount_bdt,
                method: payment_method,
                reference: sessionCode
            },
            instructions: `Send \u09f3${amount_bdt} to ${mfsNumber} via ${payment_method}. Use reference: ${sessionCode}. Then upload screenshot.`
        });
    } catch (err) {
        console.error('Deposit session API error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
