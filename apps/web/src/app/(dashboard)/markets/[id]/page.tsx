import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { MarketPageClient } from './MarketPageClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  // Try to find market by ID or event_id
  const { data } = await supabase
    .from('markets')
    .select('*, events(*)')
    .or(`id.eq.${id},event_id.eq.${id}`)
    .maybeSingle();

  const market = data as any;

  if (!market) {
    return {
      title: 'মার্কেট পাওয়া যায়নি — Plokymarket',
      description: 'অনুরোধ করা মার্কেটটি খুঁজে পাওয়া যায়নি। Plokymarket-এ অন্যান্য মার্কেটে ট্রেড করুন।',
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
  const supabase = await createClient();

  // Fetch initial data for the client component
  const { data: market } = await supabase
    .from('markets')
    .select('*, outcomes(*)')
    .or(`id.eq.${id},event_id.eq.${id}`)
    .maybeSingle();

  return <MarketPageClient initialMarket={market as any} />;
}
