/**
 * Market Lookup API — resolves market by ID or event_id
 * Uses admin client to bypass RLS
 */
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const getAdmin = () => createAdminClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = getAdmin();

        // Try by market ID first
        const { data: market } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .single();

        if (market) {
            return NextResponse.json(market);
        }

        // Fallback: try by event_id (homepage passes event IDs)
        const { data: eventMarket } = await supabase
            .from('markets')
            .select('*')
            .eq('event_id', id)
            .limit(1)
            .single();

        if (eventMarket) {
            return NextResponse.json(eventMarket);
        }

        return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    } catch (err) {
        console.error('[Market API] Error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
