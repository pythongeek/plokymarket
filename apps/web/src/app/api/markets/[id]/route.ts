/**
 * Market Lookup API — resolves market by ID, event_id, or slug
 * Uses local PostgREST (createPublicClient)
 */
import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = createPublicClient();

    // Step 1: Try by market ID
    const market = await client.from('markets').select('*').eq('id', id).maybeSingle().then((r: any) => r.data);
    if (market) {
      return NextResponse.json({ ...market, _source: 'market_id' });
    }

    // Step 2: Try by event_id
    const marketByEvent = await client.from('markets').select('*').eq('event_id', id).maybeSingle().then((r: any) => r.data);
    if (marketByEvent) {
      return NextResponse.json({ ...marketByEvent, _source: 'event_id' });
    }

    // Step 3: Try by slug
    const marketBySlug = await client.from('markets').select('*').eq('slug', id).maybeSingle().then((r: any) => r.data);
    if (marketBySlug) {
      return NextResponse.json({ ...marketBySlug, _source: 'slug' });
    }

    return NextResponse.json({ error: 'Market not found' }, { status: 404 });
  } catch (error: any) {
    console.error('[markets/[id]] error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 });
  }
}
