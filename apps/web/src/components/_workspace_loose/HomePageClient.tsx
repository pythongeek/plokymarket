'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, BarChart3, Menu, X, ChevronRight, Flame, LayoutGrid,
  LogIn, UserPlus, ArrowUpDown, Filter, Share2, Bookmark,
  TrendingUp, Zap, Newspaper, Users,
} from 'lucide-react';

// —— Types ——
interface MarketCardData {
  id: string;
  question: string;
  prob: number;
  volume: string;
  date: string;
  icon: string;
  tag: string;
  category: string;
  chartData: { t: number; v: number }[];
  yesPrice: number;
  noPrice: number;
  slug: string;
  imageUrl: string | null;
  tradingClosesAt: string | null;
}

interface HeroData {
  id: string;
  question: string;
  prob: number;
  change: string;
  volume: string;
  chartData: { t: number; v: number }[];
  news: { source: string; time: string; headline: string }[];
  slug: string;
}

interface StatsData {
  totalMarkets: string;
  activeUsers: string;
  totalVolume: string;
  resolved: string;
}

interface Props {
  initialMarkets: MarketCardData[];
  hero: HeroData | null;
  categoryTabs: string[];
  stats: StatsData;
}

const toBengali = (n: number | string): string => {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.',
  };
  return String(n).replace(/[0-9.]/g, (d) => map[d] || d);
};

// —— Mini Sparkline SVG ——
function MiniSpark({ data, color }: { data: { t: number; v: number }[]; color: string }) {
  if (!data.length) return null;
  const w = 100;
  const h = 40;
  const max = Math.max(...data.map((d) => d.v));
  const min = Math.min(...data.map((d) => d.v));
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

// —— Countdown Hook ——
function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetDate) { setTimeLeft(''); return; }
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('শেষ'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setTimeLeft(`${toBengali(d)}দ ${toBengali(h)}ঘ`);
      else if (h > 0) setTimeLeft(`${toBengali(h)}ঘ ${toBengali(m)}মি`);
      else setTimeLeft(`${toBengali(m)}মি`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}

// —— Market Card ——
function MarketCard({ market }: { market: MarketCardData }) {
  const [sel, setSel] = useState<'yes' | 'no' | null>(null);
  const [placing, setPlacing] = useState(false);
  const countdown = useCountdown(market.tradingClosesAt);
  const yesPct = market.prob;
  const noPct = 100 - market.prob;

  const placeOrder = useCallback(async (side: 'yes' | 'no') => {
    setSel(side);
    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: market.id,
          side,
          outcome: side === 'yes' ? 'YES' : 'NO',
          price: side === 'yes' ? market.yesPrice : market.noPrice,
          quantity: 1,
          order_type: 'limit',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${side === 'yes' ? 'হ্যাঁ' : 'না'} অর্ডার সফল!`);
      } else {
        alert(`❌ ${data.error || 'অর্ডার ব্যর্থ'}`);
      }
    } catch (e) {
      alert('❌ নেটওযার্ক ত্রুটি');
    } finally {
      setPlacing(false);
    }
  }, [market]);

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition card-shadow">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px]">
            {market.icon}
          </div>
          <span className="text-xs font-semibold text-slate-400">#{market.tag}</span>
        </div>
        <Link href={`/markets/${market.slug}`} className="block">
          <p className="font-bold text-sm leading-tight line-clamp-2 mb-4 text-slate-900 group-hover:text-blue-600 transition-colors">
            {market.question}
          </p>
        </Link>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-green-600 font-medium">হ্যাঁ</span>
            <span className="font-bold text-slate-700">{toBengali(yesPct)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-600 font-medium">না</span>
            <span className="font-bold text-slate-700">{toBengali(noPct)}%</span>
          </div>
          <MiniSpark data={market.chartData} color={yesPct >= 50 ? '#16a34a' : '#dc2626'} />
        </div>
      </div>
      <div>
        <div className="flex gap-2">
          <button
            onClick={() => placeOrder('yes')}
            disabled={placing}
            className="flex-1 py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 transition disabled:opacity-50"
          >
            {placing && sel === 'yes' ? '...' : 'হ্যাঁ'}
          </button>
          <button
            onClick={() => placeOrder('no')}
            disabled={placing}
            className="flex-1 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition disabled:opacity-50"
          >
            {placing && sel === 'no' ? '...' : 'না'}
          </button>
        </div>
        <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            {market.volume} ভলিম
          </span>
          <div className="flex gap-1">
            <Bookmark className="w-3 h-3 hover:text-blue-500 cursor-pointer" />
            <Share2 className="w-3 h-3 hover:text-blue-500 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}

// —— Featured / Hero Card ——
function HeroCard({ hero }: { hero: HeroData }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden card-shadow mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              প
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">বৈশিক রাজনীতি • ট্রাম্প</span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{hero.question}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-600"><Share2 className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-slate-600"><Bookmark className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-sm text-slate-700">হ্যাঁ</span>
              <span className="font-bold text-green-600">{toBengali(hero.prob)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-sm text-slate-700">না</span>
              <span className="font-bold text-red-600">{toBengali(100 - hero.prob)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-sm text-slate-700">ভলিম</span>
              <span className="font-bold text-slate-800">{hero.volume}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="font-medium text-sm text-slate-700">পরিবর্তন</span>
              <span className="font-bold text-green-600">{hero.change}</span>
            </div>
          </div>
          <div className="relative h-40 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
            <MiniSpark data={hero.chartData} color="#3b82f6" />
            <span className="text-xs text-slate-400 absolute bottom-2 right-4">PolymarketBD</span>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Link href={`/markets/${hero.slug}`} className="flex-1">
            <button className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition text-sm">
              হ্যাঁ — {toBengali(hero.prob)}%
            </button>
          </Link>
          <Link href={`/markets/${hero.slug}`} className="flex-1">
            <button className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition text-sm">
              না — {toBengali(100 - hero.prob)}%
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// —— Header ——
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">প</span>
            </div>
            <span className="text-xl font-bold text-slate-800">পলিমার্কেট</span>
          </Link>
          <div className="relative w-full max-w-md hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="মার্কেট খুঁজুন..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/markets" className="hover:text-blue-600">মার্কেট</Link>
            <Link href="/how-it-works" className="hover:text-blue-600">কীষাবে কাজ করে</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">লগইন</Link>
            <Link href="/register" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">জয়েন অ্যাপ</Link>
            <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 px-4 py-3 space-y-2 bg-white">
          <Link href="/markets" className="block text-sm font-medium text-slate-600 hover:text-blue-600 py-1">মার্কেট</Link>
          <Link href="/how-it-works" className="block text-sm font-medium text-slate-600 hover:text-blue-600 py-1">কীষাবে কাজ করে</Link>
          <Link href="/login" className="block text-sm font-medium text-slate-600 hover:text-blue-600 py-1">লগইন</Link>
        </div>
      )}
    </header>
  );
}

// —— Footer ——
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-12">
      <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-full" />
            <span className="text-lg font-bold text-slate-800">পলিমার্কেট</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">বিশ্বের বৃহত্তম বিকেন্দ্রীভূত প্রেডিকশন মার্কেত। সঠিক ভবিষ্যদ্বাণী করুন এবং পুরস্কৃত হন।</p>
        </div>
        <div>
          <h6 className="font-bold text-slate-800 mb-4">কোম্পানি</h6>
          <ul className="text-sm text-slate-500 space-y-2">
            <li><Link href="/about" className="hover:text-blue-600">আমাদের সম্পর্কে</Link></li>
            <li><Link href="/careers" className="hover:text-blue-600">ক্যারিয়ার</Link></li>
            <li><Link href="/press" className="hover:text-blue-600">প্রেস কিট</Link></li>
          </ul>
        </div>
        <div>
          <h6 className="font-bold text-slate-800 mb-4">রিসোর্স</h6>
          <ul className="text-sm text-slate-500 space-y-2">
            <li><Link href="/help" className="hover:text-blue-600">হেল্প সেন্টার</Link></li>
            <li><Link href="/api-docs" className="hover:text-blue-600">এপিআই ডকুমেন্টেশন</Link></li>
            <li><Link href="/governance" className="hover:text-blue-600">গভর্ননস</Link></li>
          </ul>
        </div>
        <div>
          <h6 className="font-bold text-slate-800 mb-4">লিগ্যাল</h6>
          <ul className="text-sm text-slate-500 space-y-2">
            <li><Link href="/terms" className="hover:text-blue-600">শর্তাবলী</Link></li>
            <li><Link href="/privacy" className="hover:text-blue-600">প্রাইভেসি পলিসি</Link></li>
            <li><Link href="/cookies" className="hover:text-blue-600">কুকি পলিসি</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
        <p>© ২০২৪ পলিমার্কেট প্রেডিকশন মার্কেত। সর্বস্বত্ব সংরক্ষিত।</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-blue-600">টুনিন্তার</a>
          <a href="#" className="hover:text-blue-600">ডিসকর্ড</a>
          <a href="#" className="hover:text-blue-600">টেলিগ্রাম</a>
        </div>
      </div>
    </footer>
  );
}

// —— Main HomePageClient ——
export default function HomePageClient({ initialMarkets, hero, categoryTabs, stats }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [markets] = useState(initialMarkets);

  const filteredMarkets = useMemo(() => {
    if (activeTab === 0) return markets;
    const tab = categoryTabs[activeTab];
    if (tab === 'আরো →') return markets;
    return markets.filter((m) => m.tag === tab);
  }, [markets, activeTab, categoryTabs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />

      {/* Category Tabs */}
      <div className="border-t border-slate-100 bg-white overflow-x-auto">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex items-center gap-6 text-sm font-medium text-slate-500 whitespace-nowrap">
          {categoryTabs.map((tab, i) => (
            <button
              key={tab + i}
              onClick={() => setActiveTab(i)}
              className={`pb-1 border-b-2 transition ${
                i === activeTab
                  ? 'text-blue-600 border-blue-600'
                  : 'border-transparent hover:text-blue-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Market Feed */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {hero && <HeroCard hero={hero} />}

          {/* Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'মোট মার্কেট', value: stats.totalMarkets, icon: LayoutGrid },
              { label: 'সক্রিয় ইউজার', value: stats.activeUsers, icon: Users },
              { label: 'মোট ভলিম', value: stats.totalVolume, icon: TrendingUp },
              { label: 'সমাধান', value: stats.resolved, icon: Zap },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 card-shadow">
                <s.icon className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-lg font-bold text-slate-900">{s.value}</div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid Filter */}
          <div className="flex items-center justify-between" data-purpose="grid-filters">
            <h3 className="text-xl font-bold text-slate-800">অল মার্কেট</h3>
            <div className="flex items-center gap-4 text-slate-500">
              <Search className="w-5 h-5 cursor-pointer hover:text-blue-600" />
              <Filter className="w-5 h-5 cursor-pointer hover:text-blue-600" />
              <ArrowUpDown className="w-5 h-5 cursor-pointer hover:text-blue-600" />
            </div>
          </div>

          {/* Market Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-purpose="market-cards-container">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>

          {filteredMarkets.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">এই ক্যাটাগরিতে কোনো মার্কেট নেই</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 space-y-6">
          {/* Breaking News */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800">ব্রেকিং নিউজ</h4>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              {hero?.news.map((n, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-400 font-bold text-sm">{toBengali(i + 1)}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 leading-snug">{n.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-bold">{n.source}</span>
                      <span className="text-[10px] text-green-500 font-bold">↑ ১০%</span>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-xs text-slate-400">কোনো নিউজ নেই</p>
              )}
            </div>
          </section>

          {/* Hot Topics */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800">হট টপিকস</h4>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <ul className="space-y-4 text-xs font-bold text-slate-700">
              {['রাজনীতি', 'ক্রিপ্টো', 'খেলাধুলা'].map((topic, i) => (
                <li key={topic} className="flex items-center justify-between">
                  <span className="flex items-center gap-3"><span className="text-slate-400">{toBengali(i + 1)}</span> {topic}</span>
                  <span className="text-slate-500">${toBengali([26, 205, 5][i])}{['M', 'K', 'M'][i]} Vol.</span>
                </li>
              ))}
            </ul>
            <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition">সব টপিকস</button>
          </section>

          {/* Active Traders Stats */}
          <section className="bg-blue-600 rounded-xl p-6 text-white text-center">
            <h5 className="text-lg font-bold mb-1">অ্যাক্টিভ ট্রেডার্স</h5>
            <div className="text-3xl font-extrabold mb-2">{stats.activeUsers}+</div>
            <p className="text-xs opacity-80">বিশ্বের বৃহত্তম প্রেডিকশন মার্কেতে যোগ দিন আজই।</p>
            <Link href="/register">
              <button className="w-full mt-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition">শুরু করুন</button>
            </Link>
          </section>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
