import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';
import { MarketPageClient } from './MarketPageClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  if (!id) {
    return {
      title: 'মার্কেট পাওয়া যায়নি — Plokymarket',
      description: 'অনুরোধ করা মার্কেটটি খুঁজে পাওয়া যায়নি।',
    };
  }

  const client = createPublicClient();
  let market: any = null;

  try {
    const byId = await client.from('markets').select('*').eq('id', id).maybeSingle().then((r: any) => r.data);
    if (byId) market = byId;
    else {
      const byEvent = await client.from('markets').select('*').eq('event_id', id).maybeSingle().then((r: any) => r.data);
      if (byEvent) market = byEvent;
    }
  } catch (e) {
    // silent fail, return fallback metadata
  }

  if (!market) {
    return {
      title: 'মার্কেট পাওয়া যায়নি — Plokymarket',
      description: 'অনুরোধ করা মার্কেটটি খুঁজে পাওয়া যায়নি। Plokymarket-এ অন্যান্য মার্কেটে ট্রেড করুন।',
    };
  }

  const marketName = market.question || 'Market Detail';
  const price = Math.round((Number(market.yes_price) || 0.5) * 100);
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

  if (!id) {
    return <MarketPageClient initialMarket={null} />;
  }

  const client = createPublicClient();
  let market: any = null;

  try {
    const byId = await client.from('markets').select('*').eq('id', id).maybeSingle().then((r: any) => r.data);
    if (byId) market = byId;
    else {
      const byEvent = await client.from('markets').select('*').eq('event_id', id).maybeSingle().then((r: any) => r.data);
      if (byEvent) market = byEvent;
    }
  } catch (e) {
    // silent fail, client will fetch
  }

  return <MarketPageClient initialMarket={market as any} />;
}
