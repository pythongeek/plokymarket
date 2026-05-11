import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import { MarketPageClient } from './MarketPageClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Convert a DB event row to a Market-compatible object for the detail page */
function eventToMarket(event: any): any {
  if (!event) return null;
  return {
    id: event.id,
    event_id: event.id,
    question: event.question || event.title || 'Untitled Market',
    description: event.description || null,
    category: event.category || 'general',
    image_url: event.image_url || event.thumbnail_url || null,
    status: event.status || 'active',
    trading_status: event.status || 'active',
    trading_closes_at: event.trading_closes_at || event.ends_at || null,
    event_date: event.event_date || event.starts_at || null,
    created_at: event.created_at || null,
    resolved_at: event.resolved_at || null,
    resolution_source: event.resolution_source || null,
    winning_outcome: event.resolved_outcome || event.winning_token || null,
    yes_price: event.current_yes_price ?? event.yes_price ?? 0.5,
    no_price: event.current_no_price ?? event.no_price ?? 0.5,
    yes_shares_outstanding: event.yes_shares_outstanding || 0,
    no_shares_outstanding: event.no_shares_outstanding || 0,
    unique_traders: event.unique_traders || 0,
    total_volume: event.total_volume || 0,
    liquidity: event.current_liquidity || event.initial_liquidity || 0,
    outcomes: event.outcomes || null,
    pause_reason: event.pause_reason || null,
    paused_at: event.paused_at || null,
    estimated_resume_at: event.estimated_resume_at || null,
    resolution_details: event.resolution_details || { ai_confidence: 85 },
    slug: event.slug || event.id,
    ticker: event.ticker || null,
  };
}

async function resolveMarket(id: string, client: any) {
  const looksLikeUuid = UUID_RE.test(id);

  if (looksLikeUuid) {
    // Step 1: Try by market ID
    const byId = await client.from('markets').select('*').eq('id', id).maybeSingle().then((r: any) => r.data);
    if (byId) return byId;

    // Step 2: Try by event_id
    const byEventId = await client.from('markets').select('*').eq('event_id', id).maybeSingle().then((r: any) => r.data);
    if (byEventId) return byEventId;
  }

  // Step 3: Try by event slug -> get event -> find market by event_id
  const event = await client.from('events').select('id').eq('slug', id).maybeSingle().then((r: any) => r.data);
  if (event?.id) {
    const byEventSlug = await client.from('markets').select('*').eq('event_id', event.id).maybeSingle().then((r: any) => r.data);
    if (byEventSlug) return byEventSlug;
  }

  // Step 4: Try by market slug
  const bySlug = await client.from('markets').select('*').eq('slug', id).maybeSingle().then((r: any) => r.data);
  if (bySlug) return bySlug;

  // Step 5: No market found — try to display the event itself
  const fullEvent = await client.from('events').select('*').eq('slug', id).maybeSingle().then((r: any) => r.data);
  if (fullEvent) return eventToMarket(fullEvent);

  if (looksLikeUuid) {
    const eventById = await client.from('events').select('*').eq('id', id).maybeSingle().then((r: any) => r.data);
    if (eventById) return eventToMarket(eventById);
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (!id) {
    return {
      title: '\u09ae\u09be\u09b0\u09cd\u0995\u09c7\u099f \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf \u2014 Plokymarket',
      description: '\u0985\u09a8\u09c1\u09b0\u09cb\u09a7 \u0995\u09b0\u09be \u09ae\u09be\u09b0\u09cd\u0995\u09c7\u099f\u099f\u09bf \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964',
    };
  }

  const client = createPublicClient();
  const market = await resolveMarket(id, client);

  if (!market) {
    return {
      title: '\u09ae\u09be\u09b0\u09cd\u0995\u09c7\u099f \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf \u2014 Plokymarket',
      description: '\u0985\u09a8\u09c1\u09b0\u09cb\u09a7 \u0995\u09b0\u09be \u09ae\u09be\u09b0\u09cd\u0995\u09c7\u099f\u099f\u09bf \u0996\u09c1\u0981\u099c\u09c7 \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964 Plokymarket-\u098f \u0985\u09a8\u09cd\u09af\u09be\u09a8\u09cd\u09af \u09ae\u09be\u09b0\u09cd\u0995\u09c7\u099f\u09c7 \u099f\u09cd\u09b0\u09c7\u09a1 \u0995\u09b0\u09c1\u09a8\u0964',
    };
  }

  const marketName = market.question || 'Market Detail';
  const price = Math.round((Number(market.yes_price) || 0.5) * 100);
  const description = `${marketName} \u2014 \u09ac\u09b0\u09cd\u09a4\u09ae\u09be\u09a8 YES \u09ae\u09c2\u09b2\u09cd\u09af: ${price}\u00a2. \u099f\u09cd\u09b0\u09c7\u09a1 \u0995\u09b0\u09c1\u09a8 Plokymarket-\u098f\u0964`;

  return {
    title: `${marketName} \u2014 Plokymarket`,
    description,
    openGraph: {
      title: marketName,
      description,
      images: [market.image_url || '/og-default.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: marketName,
      description,
      images: [market.image_url || '/og-default.png'],
    },
  };
}

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return <MarketPageClient initialMarket={null} />;
  }

  const client = createPublicClient();
  const market = await resolveMarket(id, client);

  return <MarketPageClient initialMarket={market as any} />;
}
