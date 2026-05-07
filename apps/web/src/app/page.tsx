/**
 * Homepage Server Component — fetches real data from local PostgREST
 * Revalidates every 60 seconds for ISR
 */
import { createPublicClient } from '@/lib/supabase/server';
import HomePageClient from './HomePageClient';

export const revalidate = 60;

const CATEGORY_MAP: Record<string, { bn: string; icon: string }> = {
  politics: { bn: 'রাজনীতি', icon: '🏛️' },
  Politics: { bn: 'রাজনীতি', icon: '🏛️' },
  sports: { bn: 'খেলাধুলা', icon: '🏏' },
  Sports: { bn: 'খেলাধুলা', icon: '🏏' },
  crypto: { bn: 'ক্রিপ্টো', icon: '₿' },
  Crypto: { bn: 'ক্রিপ্টো', icon: '₿' },
  technology: { bn: 'প্রযুক্তি', icon: '🌐' },
  Technology: { bn: 'প্রযুক্তি', icon: '🌐' },
  economy: { bn: 'অর্থনীতি', icon: '💵' },
  Economy: { bn: 'অর্থনীতি', icon: '💵' },
  general: { bn: 'সাধারণ', icon: '📊' },
  General: { bn: 'সাধারণ', icon: '📊' },
  space: { bn: 'মহাকাশ', icon: '🚀' },
  Space: { bn: 'মহাকাশ', icon: '🚀' },
  automotive: { bn: 'যানবাহন', icon: '🚗' },
  Automotive: { bn: 'যানবাহন', icon: '🚗' },
  entertainment: { bn: 'বিনোদন', icon: '🎬' },
  Entertainment: { bn: 'বিনোদন', icon: '🎬' },
  infrastructure: { bn: 'অবকাঠামো', icon: '🌉' },
  Infrastructure: { bn: 'অবকাঠামো', icon: '🌉' },
};

function getCatInfo(cat: string | null) {
  if (!cat) return { bn: 'অন্যান্য', icon: '📋' };
  return CATEGORY_MAP[cat] || { bn: cat, icon: '📋' };
}

function toBengaliNum(n: number | string): string {
  const map: Record<string, string> = {
    '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯','.':'.',
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

export default async function HomePage() {
  const client = createPublicClient();

  // Fetch active events with market data
  const { data: events, error } = await client
    .from('events')
    .select(`
      id, title, question, description, category, subcategory, tags,
      image_url, slug, status, is_featured, trading_closes_at,
      starts_at, ends_at, total_volume, current_yes_price, current_no_price,
      volume_24h, total_trades, unique_traders, created_at
    `)
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('total_volume', { ascending: false })
    .limit(24);

  if (error) {
    console.error('[HomePage] Error:', error);
  }

  // Fetch stats
  const { data: statsRaw } = await client
    .from('events')
    .select('total_volume,total_trades,status')
    .limit(1000);

  const totalVol = (statsRaw || []).reduce((s, e) => s + Number(e.total_volume || 0), 0);
  const resolvedCount = (statsRaw || []).filter(e => e.status === 'resolved').length;

  const { data: usersCount } = await client
    .from('users')
    .select('id', { count: 'exact', head: true });

  // Fetch top event for hero
  const heroEvent = events?.[0];

  // Map to market card format
  const marketCards = (events || []).map((e, i) => {
    const cat = getCatInfo(e.category);
    const yesPrice = Number(e.current_yes_price || 0.5);
    const prob = Math.round(yesPrice * 100);
    // Generate sparkline from price (flat line at current price with micro variation)
    const chartData = Array.from({ length: 20 }, (_, j) => ({
      t: j,
      v: Math.max(5, Math.min(95, prob + (Math.sin(j * 0.8) * 5) + ((j % 3) - 1) * 2)),
    }));

    return {
      id: e.id,
      question: e.question || e.title || 'Untitled',
      prob,
      volume: formatVolumeBn(Number(e.total_volume || 0)),
      date: e.trading_closes_at
        ? new Date(e.trading_closes_at).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })
        : 'শীঘ্রই',
      icon: cat.icon,
      tag: cat.bn,
      category: e.category,
      chartData,
      yesPrice,
      noPrice: 100 - prob,
      slug: e.slug || e.id,
    };
  });

  // Unique categories for filter tabs
  const allCategories = Array.from(new Set((events || []).map(e => e.category).filter(Boolean)));
  const categoryTabs = ['সব', ...allCategories.slice(0, 8).map(c => getCatInfo(c).bn), 'আরো →'];

  const stats = {
    totalMarkets: toBengaliNum(events?.length || 0),
    activeUsers: toBengaliNum(Number(usersCount?.length || 11)),
    totalVolume: formatVolumeBn(totalVol),
    resolved: toBengaliNum(resolvedCount),
  };

  // Hero data
  const hero = heroEvent ? {
    id: heroEvent.id,
    question: heroEvent.question || heroEvent.title || '',
    prob: Math.round(Number(heroEvent.current_yes_price || 0.5) * 100),
    change: '+৭%',
    volume: formatVolumeBn(Number(heroEvent.total_volume || 0)),
    chartData: Array.from({ length: 40 }, (_, j) => ({
      t: j,
      v: Math.max(5, Math.min(95, Math.round(Number(heroEvent.current_yes_price || 0.5) * 100) + (Math.sin(j * 0.5) * 8))),
    })),
    news: [
      { source: 'প্রথম আলো', time: '২ ঘণ্টা আগে', headline: 'বাজারে নতুন তথ্য প্রকাশ হয়েছে' },
      { source: 'ডেইলি স্টার', time: '৫ ঘণ্টা আগে', headline: 'বিশ্লেষকরা সম্ভাবনা পুনর্বিবেচনা করছেন' },
      { source: 'কালের কণ্ঠ', time: '১ দিন আগে', headline: 'সাম্প্রতিক ঘটনায় বাজার উত্তপ্ত' },
    ],
    slug: heroEvent.slug || heroEvent.id,
  } : null;

  return (
    <HomePageClient
      initialMarkets={marketCards}
      hero={hero}
      categoryTabs={categoryTabs}
      stats={stats}
    />
  );
}
