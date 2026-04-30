/**
 * Market Lookup API — resolves market by ID, event_id, or slug
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

        // ── Step 1: Try by market ID ──────────────────────────────────────────
        const { data: market } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .single();

        if (market) {
            return NextResponse.json({ ...market, _source: 'market_id' });
        }

        // ── Step 2: Try by event_id (homepage passes event IDs) ───────────────
        const { data: marketByEventId } = await supabase
            .from('markets')
            .select('*')
            .eq('event_id', id)
            .limit(1)
            .single();

        if (marketByEventId) {
            return NextResponse.json({ ...marketByEventId, _source: 'event_id' });
        }

        // ── Step 3: Try by slug ───────────────────────────────────────────────
        const { data: marketBySlug } = await supabase
            .from('markets')
            .select('*')
            .eq('slug', id)
            .limit(1)
            .single();

        if (marketBySlug) {
            return NextResponse.json({ ...marketBySlug, _source: 'slug' });
        }

        // ── Step 4: Fallback - try events table directly ──────────────────────
        // Some IDs might be event IDs where no market has been created yet
        const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (event) {
            // Return the event data with a marker that no market exists
            return NextResponse.json({
                ...event,
                _source: 'event_only',
                _no_market: true,
                question: event.question || event.title,
            });
        }

        // ── Step 5: Try by event slug ──────────────────────────────────────────
        const { data: eventBySlug } = await supabase
            .from('events')
            .select('*')
            .eq('slug', id)
            .single();

        if (eventBySlug) {
            return NextResponse.json({
                ...eventBySlug,
                _source: 'event_slug',
                _no_market: true,
            });
        }

        return NextResponse.json({ error: 'Market or event not found' }, { status: 404 });
    } catch (err) {
        console.error('[Market API] Error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
