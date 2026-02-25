'use client';

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CategoryTabs, TrendingTags } from '@/components/home/CategoryTabs';
import { PolymarketCard, PolymarketCardSkeleton } from '@/components/home/PolymarketRow';
import PremiumFooter from '@/components/home/PremiumFooter';
import { Search, TrendingUp, BarChart2, Zap, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Bangla category mapping
const CATEGORY_LABELS: Record<string, string> = {
  sports: 'খেলাধুলা',
  politics: 'রাজনীতি',
  economy: 'অর্থনীতি',
  technology: 'প্রযুক্তি',
  entertainment: 'বিনোদন',
  international: 'আন্তর্জাতিক',
  weather: 'আবহাওয়া',
  infrastructure: 'অবকাঠামো',
  startup: 'স্টার্টআপ',
};

const CATEGORY_ICONS: Record<string, string> = {
  sports: '🏏',
  politics: '🏛️',
  economy: '💰',
  technology: '💻',
  entertainment: '🎬',
  international: '🌍',
  weather: '🌦️',
  infrastructure: '🏗️',
};

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEvents(data || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Trending tags
  const trendingTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    events.forEach(e => {
      (e.tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
      if (e.category) {
        const label = CATEGORY_LABELS[e.category.toLowerCase()] || e.category;
        tagCounts[label] = (tagCounts[label] || 0) + 1;
      }
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([label]) => ({ id: label, label }));
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (activeCategory === 'latest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (activeCategory === 'new') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter(e => new Date(e.created_at) >= weekAgo);
    } else if (activeCategory !== 'trending') {
      result = result.filter(e => e.category?.toLowerCase() === activeCategory);
    }

    if (activeTag) {
      result = result.filter(e =>
        (e.tags || []).includes(activeTag) ||
        (CATEGORY_LABELS[e.category?.toLowerCase()] === activeTag) ||
        e.category === activeTag
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.question || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [events, activeCategory, activeTag, searchQuery]);

  // Group by category for multi-row display
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    events.forEach(e => {
      const cat = e.category?.toLowerCase() || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return Object.entries(groups)
      .sort((a, b) => b[1].length - a[1].length);
  }, [events]);

  // Whether showing filtered or all-categories view
  const showCategoryView = activeCategory === 'trending' && !activeTag && !searchQuery.trim();

  // Stats
  const totalVolume = events.reduce((sum, e) => sum + (e.total_volume || 0), 0);

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={(cat) => { setActiveCategory(cat); setActiveTag(null); setSearchQuery(''); }}
      />

      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div className="border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto">
            <TrendingTags
              tags={trendingTags}
              activeTag={activeTag}
              onTagClick={setActiveTag}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-5">
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মার্কেট খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-center justify-between mb-6 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-gray-900">কিভাবে কাজ করে?</h3>
              <p className="text-[11px] text-gray-500">ইভেন্ট বেছে নিন, হ্যাঁ বা না কিনুন, সঠিক হলে জিতুন!</p>
            </div>
          </div>
          <Link href="/markets" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            বিস্তারিত <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 text-[12px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-gray-700">{events.length}</span> সক্রিয় মার্কেট
          </span>
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
            মোট ভলিউম <span className="font-semibold text-gray-700">৳{totalVolume.toLocaleString('bn-BD')}</span>
          </span>
        </div>

        {/* Content */}
        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <PolymarketCardSkeleton key={i} />
            ))}
          </div>
        ) : showCategoryView ? (
          /* Grouped Category Rows — each row shows 4 cards */
          <div className="space-y-8">
            {/* Featured / All Events Row */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                  🔥 ট্রেন্ডিং মার্কেট
                </h2>
                <Link href="/markets" className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  সব দেখুন <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {events.slice(0, 4).map((event) => (
                  <PolymarketCard key={event.id} market={event} />
                ))}
              </div>
            </section>

            {/* Category-grouped rows */}
            {groupedByCategory.map(([category, categoryEvents]) => (
              <section key={category}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                    {CATEGORY_ICONS[category] || '📊'} {CATEGORY_LABELS[category] || category}
                  </h2>
                  <button
                    onClick={() => setActiveCategory(category)}
                    className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    সব দেখুন <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categoryEvents.slice(0, 4).map((event) => (
                    <PolymarketCard key={event.id} market={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Filtered View — 4-column grid */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-gray-900">
                {activeCategory === 'trending' ? '🔥 ট্রেন্ডিং' :
                  activeCategory === 'latest' ? '⚡ সর্বশেষ' :
                    activeCategory === 'new' ? '✨ নতুন' :
                      `${CATEGORY_ICONS[activeCategory] || '📊'} ${CATEGORY_LABELS[activeCategory] || activeCategory}`}
              </h2>
              <span className="text-[12px] text-gray-400">{filteredEvents.length}টি ফলাফল</span>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredEvents.map((event) => (
                  <PolymarketCard key={event.id} market={event} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-700 mb-1">কোনো মার্কেট পাওয়া যায়নি</h3>
                <p className="text-[13px] text-gray-400">অন্য ক্যাটাগরি বা ট্যাগ দিয়ে চেষ্টা করুন</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="text-center py-10">
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            সকল মার্কেট দেখুন
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <PremiumFooter />
    </div>
  );
}
