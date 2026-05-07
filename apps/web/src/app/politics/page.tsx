/**
 * Politics Markets Page — রাজনীতি প্রেডিকশন মার্কেট
 * Polymarket-style grid card layout
 */
import { createPublicClient } from '@/lib/supabase/server';
import PoliticsPageClient from './PoliticsPageClient';

export const revalidate = 60;

function toBengaliNum(n: number | string): string {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.',
  };
  return String(n).replace(/[0-9.]/g, (d) => map[d] || d);
}

function formatVolumeBn(n: number): string {
  if (!n || n <= 0) return '৳০';
  if (n >= 1e7) return `৳${toBengaliNum((n / 1e7).toFixed(1))} কোটি`;
  if (n >= 1e5) return `৳${toBengaliNum((n / 1e5).toFixed(1))} লাখ`;
  if (n >= 1e3) return `৳${toBengaliNum((n / 1e3).toFixed(1))} হাজার`;
  return `৳${toBengaliNum(Math.round(n))}`;
}

function timeAgoBn(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return '১ মিনিট আগে';
  if (diffMins < 60) return `${toBengaliNum(diffMins)} মিনিট আগে`;
  if (diffHours < 24) return `${toBengaliNum(diffHours)} ঘণ্টা আগে`;
  if (diffDays < 7) return `${toBengaliNum(diffDays)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
}

const DEFAULT_IMAGES: Record<string, string> = {
  politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400',
  Politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400',
};

function getImage(e: { category?: string; image_url?: string }) {
  if (e.image_url) return e.image_url;
  return DEFAULT_IMAGES[e.category || 'politics'] || 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400';
}

export default async function PoliticsPage() {
  const client = createPublicClient();

  const { data: events, error } = await client
    .from('events')
    .select(`
      id, title, question, description, category, subcategory, tags,
      image_url, slug, status, is_featured, trading_closes_at,
      starts_at, ends_at, total_volume, current_yes_price, current_no_price,
      volume_24h, total_trades, unique_traders, created_at
    `)
    .eq('status', 'active')
    .or('category.eq.politics,category.eq.Politics')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[PoliticsPage] Error:', error);
  }

  const items = (events || []).map((e) => {
    const yesPrice = Number(e.current_yes_price || 0.5);
    const prob = Math.round(yesPrice * 100);
    return {
      id: e.id,
      question: e.question || e.title || 'Untitled',
      description: e.description || '',
      category: 'রাজনীতি',
      prob,
      volume: formatVolumeBn(Number(e.total_volume || 0)),
      vol24h: formatVolumeBn(Number(e.volume_24h || 0)),
      trades: toBengaliNum(Number(e.total_trades || 0)),
      timeAgo: timeAgoBn(e.created_at || new Date().toISOString()),
      image: getImage(e),
      slug: e.slug || e.id,
      yesPrice,
      noPrice: 100 - prob,
      isFeatured: e.is_featured,
      createdAt: e.created_at,
    };
  });

  return <PoliticsPageClient items={items} />;
}
