'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import {
  Search, TrendingUp, Zap, Newspaper, BarChart3, Menu, X,
  ChevronRight, Flame, LayoutGrid, LogIn, UserPlus,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────
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

// ── Helpers ────────────────────────────────────────────
const toBengali = (n: number | string): string => {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.',
  };
  return String(n).replace(/[0-9.]/g, (d) => map[d] || d);
};

// ── Mini Sparkline ─────────────────────────────────────
function MiniChart({ data, color }: { data: { t: number; v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5} />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="text-xs px-2 py-1 rounded-md" style={{ background: '#1a1a2e', color: '#fff' }}>
                {toBengali(Math.round(payload[0].value as number))}%
              </div>
            ) : null
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Market Card ────────────────────────────────────────
function MarketCard({ market }: { market: MarketCardData }) {
  const [sel, setSel] = useState<'yes' | 'no' | null>(null);
  const [placing, setPlacing] = useState(false);
  const color = market.prob >= 50 ? '#16a34a' : '#dc2626';

  const placeOrder = useCallback(async (side: 'yes' | 'no') => {
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
      alert('❌ নেটওয়ার্ক ত্রুটি');
    } finally {
      setPlacing(false);
    }
  }, [market]);

  return (
    <div
      className="group relative flex flex-col gap-2.5 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition-shadow duration-200 hover:shadow-lg"
    >
      <Link href={`/markets/${market.slug}`} className="absolute inset-0 z-0" />

      {/* Header */}
      <div className="relative z-10 flex items-start gap-2">
        <span className="text-xl shrink-0">{market.icon}</span>
        <div className="min-w-0">
          <span className="inline-block text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
            {market.tag}
          </span>
          <p className="text-[13px] font-bold text-gray-900 mt-1 leading-snug line-clamp-2">
            {market.question}
          </p>
        </div>
      </div>

      {/* Prob + Chart */}
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <span className="text-2xl font-black" style={{ color }}>
            {toBengali(market.prob)}%
          </span>
          <span className="text-[10px] text-gray-400 ml-1">সম্ভাবনা</span>
        </div>
        <div className="w-24">
          <MiniChart data={market.chartData} color={color} />
        </div>
      </div>

      {/* Yes / No Buttons */}
      <div className="relative z-10 flex gap-2">
        <button
          disabled={placing}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSel('yes'); placeOrder('yes'); }}
          className={`flex-1 py-1.5 rounded-xl text-[13px] font-bold transition-all border-2 ${
            sel === 'yes'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-green-50 text-green-600 border-gray-200 hover:border-green-400'
          }`}
        >
          {placing && sel === 'yes' ? '...' : `হ্যাঁ ${toBengali(market.yesPrice)}¢`}
        </button>
        <button
          disabled={placing}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSel('no'); placeOrder('no'); }}
          className={`flex-1 py-1.5 rounded-xl text-[13px] font-bold transition-all border-2 ${
            sel === 'no'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-red-50 text-red-600 border-gray-200 hover:border-red-400'
          }`}
        >
          {placing && sel === 'no' ? '...' : `না ${toBengali(market.noPrice)}¢`}
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100">
        <span>{market.volume} ভলিউম</span>
        <span>{market.date}</span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export default function HomePageClient({ initialMarkets, hero, categoryTabs, stats }: Props) {
  const [activeFilter, setActiveFilter] = useState('সব');
  const [activeNav, setActiveNav] = useState('ট্রেন্ডিং');
  const [heroSel, setHeroSel] = useState<'yes' | 'no' | null>(null);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filtered = initialMarkets.filter((m) =>
    (activeFilter === 'সব' || activeFilter === 'আরো →' || m.tag === activeFilter) &&
    (!search || m.question.toLowerCase().includes(search.toLowerCase()) || m.tag.includes(search))
  );

  const navTabs = [
    { label: 'ট্রেন্ডিং', href: '/' },
    { label: 'ব্রেকিং', href: '/breaking' },
    { label: 'নতুন', href: '/markets?sort=new' },
    { label: 'রাজনীতি', href: '/markets?category=রাজনীতি' },
    { label: 'খেলাধুলা', href: '/markets?category=খেলাধুলা' },
    { label: 'ক্রিপ্টো', href: '/markets?category=ক্রিপ্টো' },
    { label: 'অর্থনীতি', href: '/markets?category=অর্থনীতি' },
    { label: 'আরো...', href: '/markets' },
  ];

  // Breaking news from top movers
  const breakingNews = initialMarkets.slice(0, 3).map((m, i) => ({
    title: m.question,
    prob: m.prob,
    change: i % 2 === 0 ? `+${toBengali((m.prob % 20) + 5)}%` : `▼${toBengali((m.prob % 15) + 3)}%`,
    up: i % 2 === 0,
  }));

  // Hot topics by category volume
  const hotTopics = Array.from(
    new Map(initialMarkets.map((m) => [m.tag, { name: m.tag, vol: m.volume }]))
  ).slice(0, 5).map(([_, v], i) => ({ ...v, rank: i + 1 }));

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap');
        .hscroll::-webkit-scrollbar { display: none; }
        .hscroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .card-anim { animation: fadeUp 0.4s ease both; }
      `}</style>

      {/* ═════ Navbar ═════ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-black text-gray-900 tracking-tight hidden sm:block">
              পলিমার্কেট
            </span>
            <img src="/bd-flag.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-sm mx-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="মার্কেট খুঁজুন..."
              className="w-full bg-gray-100 text-gray-900 text-sm rounded-lg py-2 pl-9 pr-3 border border-gray-200 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <Link href="/markets" className="text-gray-600 text-sm hover:text-gray-900 transition-colors font-medium">
              মার্কেট
            </Link>
            <Link href="/how-it-works" className="text-gray-600 text-sm hover:text-gray-900 transition-colors font-medium">
              কীভাবে কাজ করে
            </Link>
            <Link
              href="/auth-portal-3m5n8"
              className="flex items-center gap-1.5 text-sm text-gray-700 px-3.5 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium"
            >
              <LogIn className="w-3.5 h-3.5" /> লগইন
            </Link>
            <Link
              href="/auth-portal-3m5n8?tab=register"
              className="flex items-center gap-1.5 text-sm font-bold text-white px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> সাইন আপ
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600 ml-auto"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Nav tabs */}
        <div className="hscroll max-w-7xl mx-auto px-4 flex gap-0.5 overflow-x-auto">
          {navTabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`text-[13px] px-3.5 py-2 whitespace-nowrap border-b-2 transition-colors ${
                activeNav === t.label
                  ? 'text-gray-900 border-blue-500 font-semibold'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => setActiveNav(t.label)}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-2 shadow-lg">
            <Link href="/markets" className="block text-gray-700 py-2 font-medium">মার্কেট</Link>
            <Link href="/how-it-works" className="block text-gray-700 py-2 font-medium">কীভাবে কাজ করে</Link>
            <Link href="/auth-portal-3m5n8" className="block text-gray-700 py-2 font-medium">লগইন</Link>
            <Link href="/auth-portal-3m5n8?tab=register" className="block text-blue-600 py-2 font-bold">সাইন আপ</Link>
          </div>
        )}
      </nav>

      {/* ═════ Main Content ═════ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* ── Left Column ── */}
          <div className="flex-1 min-w-0">

            {/* Hero */}
            {hero && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
                <div className="flex flex-wrap gap-5">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex gap-2 mb-2.5">
                      <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        ফিচার্ড
                      </span>
                      <span className="bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        ট্রেন্ডিং
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-snug mb-3">
                      {hero.question}
                    </h2>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl font-black text-green-600">
                        {toBengali(hero.prob)}%
                      </span>
                      <span className="text-sm text-green-600 font-bold">
                        সম্ভাবনা {hero.change}
                      </span>
                    </div>
                    <div className="flex gap-2.5 mb-4">
                      {[
                        ['yes' as const, 'হ্যাঁ', '#16a34a', '#dcfce7'],
                        ['no' as const, 'না', '#dc2626', '#fee2e2'],
                      ].map(([k, lbl, col, bg]) => (
                        <button
                          key={k}
                          onClick={() => setHeroSel(heroSel === k ? null : k)}
                          className={`flex-1 py-2.5 rounded-xl text-[15px] font-extrabold border-2 transition-all ${
                            heroSel === k
                              ? 'text-white'
                              : 'text-current'
                          }`}
                          style={{
                            background: heroSel === k ? col : bg,
                            borderColor: heroSel === k ? col : '#e5e7eb',
                            color: heroSel === k ? '#fff' : col,
                          }}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      {hero.news.map((n, i) => (
                        <div key={i} className="flex gap-2 text-xs p-1.5 rounded-lg bg-slate-50">
                          <Newspaper className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-gray-700">{n.source}</span>
                            <span className="text-gray-400 ml-1.5">{n.time}</span>
                            <p className="text-gray-600 mt-0.5 leading-relaxed">{n.headline}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-64 shrink-0">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hero.chartData}>
                          <XAxis dataKey="t" hide />
                          <Line type="monotone" dataKey="v" stroke="#16a34a" dot={false} strokeWidth={2.5} />
                          <Tooltip
                            content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="text-xs px-2 py-1 rounded-md" style={{ background: '#0d1117', color: '#fff' }}>
                                  {toBengali(Math.round(payload[0].value as number))}%
                                </div>
                              ) : null
                            }
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>মোট ভলিউম</span>
                      <span className="font-bold text-gray-900">{hero.volume}</span>
                    </div>
                    <Link
                      href={`/markets/${hero.slug}`}
                      className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors"
                    >
                      বিস্তারিত দেখুন <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <div className="hscroll flex gap-1.5 overflow-x-auto mb-4">
              {categoryTabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFilter(t)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-all ${
                    activeFilter === t
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Section header */}
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-gray-700" />
              <h2 className="text-base font-extrabold text-gray-900">সব মার্কেট</h2>
              <span className="text-xs text-gray-400 ml-auto">
                {toBengali(filtered.length)} টি মার্কেট
              </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filtered.map((m, i) => (
                <div key={m.id} className="card-anim" style={{ animationDelay: `${i * 40}ms` }}>
                  <MarketCard market={m} />
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-base font-semibold">কোনো মার্কেট পাওয়া যায়নি</p>
                <p className="text-sm mt-1">অন্য কিওয়ার্ড দিয়ে খুঁজুন</p>
              </div>
            )}

            {/* Load more */}
            {filtered.length > 0 && filtered.length >= 12 && (
              <div className="text-center mt-8">
                <button className="bg-white border border-gray-200 text-gray-700 font-bold px-8 py-3 rounded-xl text-sm shadow-sm hover:shadow-md transition-shadow">
                  আরো মার্কেট দেখুন
                </button>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ── */}
          <aside className="w-72 shrink-0 hidden lg:flex flex-col gap-3.5">

            {/* Breaking News */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-red-500" /> ব্রেকিং নিউজ
                </span>
                <span className="text-blue-500 text-xs cursor-pointer">সব →</span>
              </div>
              {breakingNews.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between gap-2.5 py-2.5 ${
                    i < breakingNews.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <p className="text-xs text-gray-700 leading-relaxed flex-1 line-clamp-2">
                    {item.title}
                  </p>
                  <div className="text-right shrink-0">
                    <div className="text-[15px] font-black text-gray-900">{toBengali(item.prob)}%</div>
                    <div className={`text-[11px] font-bold ${item.up ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hot Topics */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" /> হট টপিক
                </span>
                <span className="text-blue-500 text-xs cursor-pointer">সব →</span>
              </div>
              {hotTopics.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-400 w-4">
                      {toBengali(t.rank)}
                    </span>
                    <span className="text-[13px] font-bold text-gray-700">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-gray-400">{t.vol}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}>
              <div className="font-extrabold text-sm mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> আজকের পরিসংখ্যান
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  [stats.totalMarkets, 'মোট মার্কেট'],
                  [stats.activeUsers, 'সক্রিয় ব্যবহারকারী'],
                  [stats.totalVolume, 'মোট ভলিউম'],
                  [stats.resolved, 'সমাধান হয়েছে'],
                ].map(([v, l]) => (
                  <div key={String(l)} className="bg-white/10 rounded-xl p-2.5">
                    <div className="text-base font-black">{v}</div>
                    <div className="text-[11px] text-blue-200 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="font-extrabold text-sm text-gray-900 mb-3">দ্রুত লিংক</div>
              <div className="space-y-1">
                {[
                  ['লিডারবোর্ড', '/leaderboard'],
                  ['আমার পোর্টফোলিও', '/portfolio'],
                  ['ডিপোজিট', '/deposit'],
                  ['উইথড্র', '/withdraw'],
                ].map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-slate-50 transition-colors text-sm text-gray-700"
                  >
                    {label}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ═════ Footer ═════ */}
      <footer className="bg-[#0d1117] text-gray-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-900 font-black text-base">পলিমার্কেট</span>
                <img src="/bd-flag.png" alt="BD" className="w-5 h-3 rounded-sm object-cover" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                বাংলাদেশের সেরা প্রেডিকশন মার্কেট। তথ্য দিয়ে টাকা আয় করুন।
              </p>
            </div>
            {[
              { title: 'মার্কেট', links: ['নির্বাচন', 'অর্থনীতি', 'খেলাধুলা', 'ক্রিপ্টো', 'রাজনীতি'] },
              { title: 'সহায়তা', links: ['শিখুন', 'এপিআই', 'লিডারবোর্ড', 'নির্ভুলতা'] },
              { title: 'যোগাযোগ', links: ['ফেসবুক', 'টুইটার', 'টেলিগ্রাম', 'ইমেইল'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-gray-200 font-bold text-xs mb-3">{col.title}</h4>
                {col.links.map((l) => (
                  <div key={l} className="text-xs mb-1.5 cursor-pointer hover:text-white transition-colors">
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-[#21262d] pt-4 text-[11px] text-gray-600 text-center">
            © {toBengali(2026)} পলিমার্কেট বিডি। সর্বস্বত্ব সংরক্ষিত। | গোপনীয়তা নীতি | ব্যবহারের শর্তাবলী
          </div>
        </div>
      </footer>
    </div>
  );
}
