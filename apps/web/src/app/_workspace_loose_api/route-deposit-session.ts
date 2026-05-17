import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { agent_id, amount_bdt, amount_usdt, exchange_rate, payment_method } = body;

        if (!agent_id || !amount_bdt || amount_bdt < 100) {
            return NextResponse.json({ error: 'Invalid amount or agent' }, { status: 400 });
        }

        const { data: agent } = await supabase
            .from('agent_wallets')
            .select('phone_number, agent_name, method')
            .eq('id', agent_id)
            .single();

        const { data: codeData } = await supabase.rpc('generate_session_code');
        const sessionCode = codeData || 'PLY-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        const { data: session, error } = await supabase
            .from('deposit_sessions')
            .insert({
                session_code: sessionCode,
                user_id: user.id,
                agent_id,
                amount_bdt,
                amount_usdt,
                exchange_rate,
                payment_method: payment_method || agent?.method || 'bkash',
                agent_phone: agent?.phone_number,
                agent_name: agent?.agent_name,
                status: 'awaiting_payment',
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Session create error:', error);
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (err) {
        console.error('Session POST error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabase
            .from('deposit_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (code) {
            query = query.eq('session_code', code);
        }
        if (status) {
            query = query.eq('status', status);
        }

        const { data: sessions, error } = await query;

        if (error) {
            console.error('Session fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
        }

        return NextResponse.json({ sessions: sessions || [] });
    } catch (err) {
        console.error('Session GET error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { session_code, transaction_id, screenshot_url, sender_phone, status, notes } = body;

        if (!session_code) {
            return NextResponse.json({ error: 'Session code required' }, { status: 400 });
        }

        const updates: Record<string, any> = {};
        if (transaction_id !== undefined) updates.transaction_id = transaction_id;
        if (screenshot_url !== undefined) updates.screenshot_url = screenshot_url;
        if (sender_phone !== undefined) updates.sender_phone = sender_phone;
        if (notes !== undefined) updates.notes = notes;
        if (status) {
            updates.status = status;
            if (status === 'payment_sent') {
                updates.payment_sent_at = new Date().toISOString();
            }
            if (status === 'cancelled') {
                updates.cancelled_at = new Date().toISOString();
            }
        }

        const { data: session, error } = await supabase
            .from('deposit_sessions')
            .update(updates)
            .eq('session_code', session_code)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Session update error:', error);
            return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (err) {
        console.error('Session PATCH error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
