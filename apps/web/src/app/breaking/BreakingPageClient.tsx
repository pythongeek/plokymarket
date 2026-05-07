'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  Search, Zap, TrendingUp, Clock, BarChart3, ChevronRight,
  Newspaper, ArrowUpRight, ArrowDownRight, Activity, LayoutGrid,
  Filter, Sparkles, List, Flame,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────
interface BreakingItem {
  id: string;
  question: string;
  description: string;
  category: string;
  prob: number;
  volume: string;
  vol24h: string;
  trades: string;
  timeAgo: string;
  image: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  isFeatured: boolean;
}

interface Props {
  items: BreakingItem[];
  topMovers: BreakingItem[];
  stats: { totalItems: string; totalVolume: string; activeNow: string };
}

// ── Helpers ────────────────────────────────────────────
const toBengali = (n: number | string): string => {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.',
  };
  return String(n).replace(/[0-9.]/g, (d) => map[d] || d);
};

const CATEGORIES = [
  { label: 'সব', key: 'সব', icon: LayoutGrid },
  { label: 'রাজনীতি', key: 'রাজনীতি', icon: Flame },
  { label: 'খেলাধুলা', key: 'খেলাধুলা', icon: Zap },
  { label: 'ক্রিপ্টো', key: 'ক্রিপ্টো', icon: TrendingUp },
  { label: 'অর্থনীতি', key: 'অর্থনীতি', icon: BarChart3 },
  { label: 'প্রযুক্তি', key: 'প্রযুক্তি', icon: Sparkles },
  { label: 'বিনোদন', key: 'বিনোদন', icon: Newspaper },
  { label: 'অবকাঠামো', key: 'অবকাঠামো', icon: Activity },
];

function MiniSpark({ value, color }: { value: number; color: string }) {
  const data = Array.from({ length: 20 }, (_, i) => ({
    t: i,
    v: Math.max(5, Math.min(95, value + (Math.sin(i * 0.7) * 6) + ((i % 3) - 1) * 2)),
  }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} dot={false} strokeWidth={1.5} />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="text-[10px] px-2 py-0.5 rounded bg-gray-900 text-white">
                {toBengali(Math.round(payload[0].value as number))}%
              </div>
            ) : null
          }
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Section Header Component ──────────────────────────
function SectionHeader({ icon: Icon, title, count, action }: {
  icon: React.ElementType;
  title: string;
  count?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="bg-blue-50 rounded-lg p-1.5">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
        {count && (
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
        >
          {action.label} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

// ── Featured Hero Card ─────────────────────────────────────────────
function FeaturedCard({ item }: { item: BreakingItem }) {
  const color = item.prob >= 50 ? '#16a34a' : '#dc2626';
  return (
    <Link
      href={`/markets/${item.slug}`}
      className="group block relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-[380px] h-[200px] md:h-[240px] shrink-0 bg-gray-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.question}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Zap className="w-3 h-3" /> ব্রেকিং
            </span>
            <span className="bg-black/60 text-white text-[11px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
              {item.category}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 text-[11px] text-white/90">
              <Clock className="w-3 h-3" /> {item.timeAgo}
              <span className="mx-1">•</span>
              <BarChart3 className="w-3 h-3" /> {item.volume} ভলিউম
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-snug mb-2 line-clamp-2">
              {item.question}
            </h3>
            <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
              {item.description || `${item.category} বিষয়ক একটি গুরুত্বপূর্ণ প্রেডিকশন মার্কেত। বাজারের প্রবণতা অনুযায়ী আপনার পজিশন নিন।`}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-3xl font-black" style={{ color }}>
                  {toBengali(item.prob)}%
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {item.prob >= 50 ? (
                    <span className="text-green-600 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> হ্যাঁ জয়ী
                    </span>
                  ) : (
                    <span className="text-red-600 font-bold flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" /> না জয়ী
                    </span>
                  )}
                </div>
              </div>
              <div className="w-28">
                <MiniSpark value={item.prob} color={color} />
              </div>
            </div>

            <div className="flex gap-2">
              <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded-xl border border-green-200">
                হ্যাঁ {toBengali(item.yesPrice)}¢
              </span>
              <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-xl border border-red-200">
                না {toBengali(item.noPrice)}¢
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Regular List Card ──────────────────────────────────────────────
function ListCard({ item, index }: { item: BreakingItem; index: number }) {
  const color = item.prob >= 50 ? '#16a34a' : '#dc2626';
  return (
    <Link
      href={`/markets/${item.slug}`}
      className="group flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md transition-all"
    >
      {/* Number */}
      <div className="hidden sm:flex flex-col items-center justify-center w-10 shrink-0">
        <span className="text-lg font-black text-gray-300">{toBengali(index + 1)}</span>
      </div>

      {/* Image */}
      <div className="relative w-28 h-20 sm:w-36 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.question}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {index < 3 && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
            ব্রেকিং
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1">
            <span className="font-semibold text-blue-600">{item.category}</span>
            <span>•</span>
            <Clock className="w-3 h-3" /> {item.timeAgo}
          </div>
          <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
            {item.question}
          </h4>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black" style={{ color }}>
              {toBengali(item.prob)}%
            </span>
            <div className="w-16">
              <MiniSpark value={item.prob} color={color} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Activity className="w-3 h-3" /> {item.trades} ট্রেড
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Sidebar Mover Card ──────────────────────────────────────────
function MoverCard({ item, index }: { item: BreakingItem; index: number }) {
  const color = item.prob >= 50 ? '#16a34a' : '#dc2626';
  const up = index % 2 === 0;
  return (
    <Link
      href={`/markets/${item.slug}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <span className="text-xs font-black text-gray-300 w-4">{toBengali(index + 1)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-gray-800 leading-snug line-clamp-2">
          {item.question}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-black" style={{ color }}>{toBengali(item.prob)}%</span>
          <span className={`text-[10px] font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
            {up ? '+' : '▼'}{toBengali((item.prob % 15) + 3)}%
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function BreakingPageClient({ items, topMovers, stats }: Props) {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('সব');

  const filtered = useMemo(() => {
    let result = items;
    if (activeCat !== 'সব') {
      result = result.filter((m) => m.category === activeCat);
    }
    if (search) {
      result = result.filter((m) =>
        m.question.toLowerCase().includes(search.toLowerCase()) || m.category.includes(search)
      );
    }
    return result;
  }, [items, activeCat, search]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { 'সব': items.length };
    items.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> ব্রেকিং নিউজ
                </span>
                <span className="text-xs text-gray-400">
                  লাইভ আপডেট
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                সর্বশেষ প্রেডিকশন মার্কেট
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                বাংলাদেশ ও বিশ্বের সর্বশেষ ঘটনাপ্রবাহ অনুযায়ী প্রেডিক্ট করুন
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">{stats.totalItems}</div>
                <div className="text-[11px] text-gray-400">মোট মার্কেট</div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-right">
                <div className="text-2xl font-black text-blue-600">{stats.totalVolume}</div>
                <div className="text-[11px] text-gray-400">মোট ভলিউম</div>
              </div>
            </div>
          </div>

          {/* Search + Category tabs row */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ব্রেকিং মার্কেট খুঁজুন..."
                className="w-full bg-gray-100 text-gray-900 text-sm rounded-xl py-2.5 pl-10 pr-4 border border-gray-200 outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>
            <div className="hscroll flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {CATEGORIES.map((cat) => {
                const isActive = activeCat === cat.key;
                const count = catCounts[cat.key] || 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCat(cat.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-all ${
                      isActive
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <cat.icon className="w-3 h-3" />
                    {cat.label}
                    {count > 0 && (
                      <span className={`ml-0.5 text-[10px] px-1 py-0 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {toBengali(count)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Main Feed */}
          <div className="flex-1 min-w-0">

            {/* Featured Section */}
            {featured && (
              <div className="mb-6">
                <SectionHeader
                  icon={Sparkles}
                  title="শীর্ষ ব্রেকিং মার্কেট"
                  action={{ label: 'সব দেখুন', href: '/markets' }}
                />
                <FeaturedCard item={featured} />
              </div>
            )}

            {/* List Section */}
            {rest.length > 0 && (
              <div className="mb-6">
                <SectionHeader
                  icon={List}
                  title="সর্বশেষ মার্কেট"
                  count={toBengali(rest.length)}
                />
                <div className="space-y-3">
                  {rest.map((item, i) => (
                    <ListCard key={item.id} item={item} index={i + 1} />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-base font-semibold">কোনো ব্রেকিং মার্কেট পাওয়া যায়নি</p>
                <p className="text-sm text-gray-400 mt-1">অন্য ক্যাটেগরি চয়ন করুন বা অনুসন্ধান করুন</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-80 shrink-0 hidden lg:block space-y-4">

            {/* Top Movers */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-50 rounded-lg p-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-extrabold text-sm text-gray-900">টপ মুভার্স</span>
              </div>
              <div className="divide-y divide-gray-50">
                {topMovers.map((item, i) => (
                  <MoverCard key={item.id} item={item} index={i} />
                ))}
              </div>
              <Link
                href="/markets"
                className="flex items-center justify-center gap-1 text-xs font-bold text-blue-600 mt-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
              >
                সব মার্কেট দেখুন <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Live Stats */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 text-white">
              <div className="font-extrabold text-sm mb-3 flex items-center gap-2">
                <div className="bg-white/10 rounded-lg p-1.5">
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                লাইভ পরিসংখ্যান
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  [stats.totalItems, 'মোট মার্কেট'],
                  [stats.activeNow, 'এখন সক্রিয়'],
                  [stats.totalVolume, 'মোট ভলিউম'],
                  [toBengali(0), 'আজকের ট্রেড'],
                ].map(([v, l]) => (
                  <div key={String(l)} className="bg-white/10 rounded-xl p-3">
                    <div className="text-base font-black">{v}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-50 rounded-lg p-1.5">
                  <Filter className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-extrabold text-sm text-gray-900">ক্যাটেগরি ফিল্টার</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(1).map((cat) => {
                  const count = catCounts[cat.key] || 0;
                  const isActive = activeCat === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCat(cat.key)}
                      className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <cat.icon className="w-3 h-3" />
                      {cat.label}
                      {count > 0 && (
                        <span className={`text-[10px] px-1 py-0 rounded-full ${isActive ? 'bg-white/20' : 'bg-white'}`}>
                          {toBengali(count)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
              <div className="font-extrabold text-sm text-blue-900 mb-1">
                ব্রেকিং আলার্ট পান
              </div>
              <p className="text-xs text-blue-600 mb-3">
                নতুন মার্কেট এবং বড় পরিবর্তনের নোটিফিকেশন পেতে সাবস্ক্রাইব করুন
              </p>
              <div className="flex gap-2">
                <input
                  placeholder="ইমেইল"
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-blue-200 outline-none focus:border-blue-500"
                />
                <button className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  সাবস্ক্রাইব
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
