/**
 * Market Lookup API — resolves market by ID, event_id, event_slug, or market_slug
 * Uses local PostgREST (createPublicClient)
 */
import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = createPublicClient();
    const looksLikeUuid = UUID_RE.test(id);

    if (looksLikeUuid) {
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
    }

    // Step 3: Try by event slug -> find event -> get market by event_id
    const event = await client.from('events').select('id').eq('slug', id).maybeSingle().then((r: any) => r.data);
    if (event?.id) {
      const marketByEventSlug = await client.from('markets').select('*').eq('event_id', event.id).maybeSingle().then((r: any) => r.data);
      if (marketByEventSlug) {
        return NextResponse.json({ ...marketByEventSlug, _source: 'event_slug' });
      }
    }

    // Step 4: Try by market slug
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
