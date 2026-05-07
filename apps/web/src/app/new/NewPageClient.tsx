'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Sparkles, TrendingUp, Clock, BarChart3, Flame,
  ChevronDown, X, Filter,
} from 'lucide-react';

interface MarketItem {
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
  items: MarketItem[];
}

const toBengali = (n: number | string): string => {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.',
  };
  return String(n).replace(/[0-9.]/g, (d) => map[d] || d);
};

const SORT_TABS = [
  { label: 'ট্রেন্ডিং', key: 'trending' },
  { label: 'লিকুিডিটি', key: 'liquidity' },
  { label: 'ভলিউম', key: 'volume' },
  { label: 'নতুনতম', key: 'newest' },
  { label: 'শেষ হচ্ছে', key: 'ending' },
  { label: 'প্রতিজোগিতা', key: 'competitive' },
  { label: 'সমাপ্ত', key: 'resolved' },
];

const TOPIC_PILLS = [
  'সব', 'ট্রাম্প', 'ইরান', 'যুক্তরাজ্য',
  'হান্টাভাইরাস', 'তেল', 'জামেস কোমেি',
  'কিশর', 'নেসেরল লিগ', 'আইপিও',
  'আর্থনীতি', 'ক্রিপ্টো', 'খেলাধুলা',
];

function GridCard({ item }: { item: MarketItem }) {
  return (
    <Link
      href={`/markets/${item.slug}`}
      className="group block rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
        <img
          src={item.image}
          alt={item.question}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      {/* Content */}
      <div className="p-3">
        <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
          {item.question}
        </h3>
        {/* Outcome buttons */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-100">
            <span className="text-[11px] font-semibold text-green-700">হ্যাঁ</span>
            <span className="text-[11px] font-bold text-green-700">{toBengali(item.yesPrice)}¢</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100">
            <span className="text-[11px] font-semibold text-red-700">না</span>
            <span className="text-[11px] font-bold text-red-700">{toBengali(item.noPrice)}¢</span>
          </div>
        </div>
        {/* Meta */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400">
          <span>{item.volume} ভলিউম</span>
          <span>{item.timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}

export default function NewPageClient({ items }: Props) {
  const [search, setSearch] = useState('');
  const [activeSort, setActiveSort] = useState('newest');
  const [activeTopic, setActiveTopic] = useState('সব');
  const [showMoreTopics, setShowMoreTopics] = useState(false);

  const filtered = useMemo(() => {
    let result = [...items];
    if (activeTopic !== 'সব') {
      result = result.filter((m) => m.category.includes(activeTopic) || m.question.toLowerCase().includes(activeTopic.toLowerCase()));
    }
    if (search) {
      result = result.filter((m) => m.question.toLowerCase().includes(search.toLowerCase()));
    }
    if (activeSort === 'volume') {
      result.sort((a, b) => {
        const av = parseFloat(a.volume.replace(/[^0-9.]/g, '')) || 0;
        const bv = parseFloat(b.volume.replace(/[^0-9.]/g, '')) || 0;
        return bv - av;
      });
    } else if (activeSort === 'ending') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return result;
  }, [items, activeTopic, search, activeSort]);

  const visibleTopics = showMoreTopics ? TOPIC_PILLS : TOPIC_PILLS.slice(0, 8);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-[1350px] mx-auto px-4 lg:px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">নতুন</h1>
          <p className="text-sm text-gray-500 mt-1">সর্বশেষ নতুন প্রেডিকশন মার্কেট ব্রাউজ করুন</p>
        </div>
      </div>

      {/* Sort + Search + Topics */}
      <div className="border-b border-gray-100 sticky top-0 bg-white z-20">
        <div className="max-w-[1350px] mx-auto px-4 lg:px-6">
          {/* Sort tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
            {SORT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSort(tab.key)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  activeSort === tab.key
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Search + Topic pills */}
          <div className="flex items-center gap-3 pb-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="মার্কেট খুঁজুন..."
                className="w-full bg-gray-100 text-gray-900 text-sm rounded-lg py-2 pl-10 pr-4 outline-none focus:bg-gray-50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {visibleTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setActiveTopic(topic === activeTopic ? 'সব' : topic)}
                  className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors ${
                    activeTopic === topic
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {topic}
                </button>
              ))}
              <button
                onClick={() => setShowMoreTopics(!showMoreTopics)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                {showMoreTopics ? 'কম দেখুন' : 'আরো দেখুন'} <ChevronDown className={`w-3 h-3 transition-transform ${showMoreTopics ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1350px] mx-auto px-4 lg:px-6 py-6">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <GridCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base font-semibold">কোনো মার্কেট পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}
