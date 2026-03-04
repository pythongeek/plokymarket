import type { Metadata } from 'next';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { MarketPageClient } from './MarketPageClient';

// Use admin client to bypass RLS for public market pages
const getAdminClient = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = getAdminClient();

  // Validate ID exists
  if (!id) {
    return {
      title: 'মার্কেট পাওয়া যায়নি — Plokymarket',
      description: 'অনুরোধ করা মার্কেটটি খুঁজে পাওয়া যায়নি।',
    };
  }

  // Try to find market by ID first, then by event_id (safer than .or())
  let market = null;

  // First try by market ID
  const { data: marketById } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (marketById) {
    market = marketById;
  } else {
    // Try by event_id
    const { data: marketByEventId } = await supabase
      .from('markets')
      .select('*')
      .eq('event_id', id)
      .maybeSingle();

    if (marketByEventId) {
      market = marketByEventId;
    }
  }

  // If market has event_id, try to fetch event name separately
  let eventData = null;
  if (market?.event_id) {
    const { data: evt } = await supabase
      .from('events')
      .select('title, question, description')
      .eq('id', market.event_id)
      .maybeSingle();
    eventData = evt;
  }

  if (!market) {
    return {
      title: 'মার্কেট পাওয়া যায়নি — Plokymarket',
      description: 'অনুরোধ করা মার্কেটটি খুঁজে পাওয়া যায়নি। Plokymarket-এ অন্যান্য মার্কেটে ট্রেড করুন।',
    };
  }

  // Market name is usually the question, but we use the provided logic
  const marketName = market.question || 'Market Detail';
  const price = Math.round((market.yes_price ?? 0.5) * 100);
  const description = `${marketName} — বর্তমান YES মূল্য: ${price}¢. ট্রেড করুন Plokymarket-এ।`;

  return {
    title: `${marketName} — Plokymarket`,
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
  const supabase = getAdminClient();

  if (!id) {
    return <MarketPageClient initialMarket={null} />;
  }

  // Fetch initial data for the client component - try by ID first, then by event_id
  let market = null;

  const { data: marketById } = await supabase
    .from('markets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (marketById) {
    market = marketById;
  } else {
    const { data: marketByEventId } = await supabase
      .from('markets')
      .select('*')
      .eq('event_id', id)
      .maybeSingle();

    if (marketByEventId) {
      market = marketByEventId;
    }
  }

  return <MarketPageClient initialMarket={market as any} />;
}
