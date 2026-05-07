/**
 * New Markets Page — নতুন মার্কেট
 * Polymarket-style new markets feed with Bengali content
 */
import { createPublicClient } from '@/lib/supabase/server';
import NewPageClient from './NewPageClient';

export const revalidate = 60;

const CATEGORY_MAP: Record<string, { bn: string }> = {
  politics: { bn: 'রাজনীতি' },
  Politics: { bn: 'রাজনীতি' },
  sports: { bn: 'খেলাধুলা' },
  Sports: { bn: 'খেলাধুলা' },
  crypto: { bn: 'ক্রিপ্টো' },
  Crypto: { bn: 'ক্রিপ্টো' },
  technology: { bn: 'প্রযুক্তি' },
  Technology: { bn: 'প্রযুক্তি' },
  economy: { bn: 'অর্থনীতি' },
  Economy: { bn: 'অর্থনীতি' },
  general: { bn: 'সাধারণ' },
  General: { bn: 'সাধারণ' },
  space: { bn: 'মহাকাশ' },
  Space: { bn: 'মহাকাশ' },
  automotive: { bn: 'যানবাহন' },
  Automotive: { bn: 'যানবাহন' },
  entertainment: { bn: 'বিনোদন' },
  Entertainment: { bn: 'বিনোদন' },
  infrastructure: { bn: 'অবকাঠামো' },
  Infrastructure: { bn: 'অবকাঠামো' },
};

function getCatBn(cat: string | null) {
  if (!cat) return 'অন্যান্য';
  return CATEGORY_MAP[cat]?.bn || cat;
}

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
  politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600',
  Politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600',
  sports: 'https://images.unsplash.com/photo-1461896836934-voices-80474205a63b?w=600',
  Sports: 'https://images.unsplash.com/photo-1461896836934-voices-80474205a63b?w=600',
  crypto: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600',
  Crypto: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600',
  technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
  Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600',
  economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
  Economy: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
  Entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
  space: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
  Space: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
  infrastructure: 'https://images.unsplash.com/photo-1555883038-73599d14a51e?w=600',
  Infrastructure: 'https://images.unsplash.com/photo-1555883038-73599d14a51e?w=600',
  automotive: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600',
  Automotive: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600',
};

function getImage(e: { category?: string; image_url?: string }) {
  if (e.image_url) return e.image_url;
  return DEFAULT_IMAGES[e.category || 'general'] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600';
}

export default async function NewPage() {
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
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[NewPage] Error:', error);
  }

  const items = (events || []).map((e) => {
    const yesPrice = Number(e.current_yes_price || 0.5);
    const prob = Math.round(yesPrice * 100);
    return {
      id: e.id,
      question: e.question || e.title || 'Untitled',
      description: e.description || '',
      category: getCatBn(e.category),
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

  const totalVol = (events || []).reduce((s, e) => s + Number(e.total_volume || 0), 0);

  return (
    <NewPageClient
      items={items}
      stats={{
        totalItems: toBengaliNum(items.length),
        totalVolume: formatVolumeBn(totalVol),
        activeNow: toBengaliNum(items.filter((_, i) => i < 5).length),
      }}
    />
  );
}
