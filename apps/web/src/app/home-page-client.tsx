'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CategoryTabs, TrendingTags } from '@/components/home/CategoryTabs';
import { PolymarketCard, PolymarketCardSkeleton } from '@/components/home/PolymarketRow';
import PremiumFooter from '@/components/home/PremiumFooter';
import LiveMarketsTicker from '@/components/home/LiveMarketsTicker';
import { Search, TrendingUp, BarChart2, Zap, ArrowRight, ArrowUpDown, Clock, TrendingUp as VolumeHigh, Droplets, Loader2, ArrowDown, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Type for event data
export interface Event {
    id: string;
    title: string;
    question: string;
    description?: string;
    category: string;
    subcategory?: string;
    tags?: string[];
    image_url?: string;
    slug?: string;
    status: string;
    is_featured?: boolean;
    trading_closes_at?: string;
    starts_at?: string;
    ends_at?: string;
    total_volume: number;
    created_at: string;
    yes_price?: number;
    no_price?: number;
}

// Type for ticker market data
export interface TickerMarket {
    id: string;
    title: string;
    question: string;
    yes_price: number;
    no_price: number;
    change_24h: number;
    volume: number;
}

// Props from server component (ISR data)
interface HomePageClientProps {
    initialEvents: Event[];
    initialRecommended: Event[];
    initialTickerMarkets?: TickerMarket[];
}

export default function HomePageClient({ initialEvents, initialRecommended, initialTickerMarkets = [] }: HomePageClientProps) {
    // Use initial data from server (ISR cached)
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeCategory, setActiveCategory] = useState('trending');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('trending');
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [recommended, setRecommended] = useState<Event[]>(initialRecommended);
    const [userId, setUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    // Infinite scroll ref for Intersection Observer
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const SORT_OPTIONS = [
        { id: 'trending', label: '🔥 ট্রেন্ডিং', icon: TrendingUp },
        { id: 'ending_soon', label: '⏰ শীঘ্রই শেষ', icon: Clock },
        { id: 'high_volume', label: '📈 উচ্চ ভলিউম', icon: VolumeHigh },
        { id: 'newest', label: '✨ নতুন', icon: Zap },
        { id: 'high_liquidity', label: '💧 উচ্চ তরলতা', icon: Droplets },
    ];

    const CATEGORY_LABELS: Record<string, string> = {
        sports: 'খেলাধুলা', politics: 'রাজনীতি', economy: 'অর্থনীতি',
        technology: 'প্রযুক্তি', entertainment: 'বিনোদন', international: 'আন্তর্জাতিক',
        weather: 'আবহাওয়া', infrastructure: 'অবকাঠামো', startup: 'স্টার্টআপ',
    };

    const CATEGORY_ICONS: Record<string, string> = {
        sports: '🏏', politics: '🏛️', economy: '💰', technology: '💻',
        entertainment: '🎬', international: '🌍', weather: '🌦️', infrastructure: '🏗️',
    };

    useEffect(() => {
        async function loadUserId() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) setUserId(user.id);
            } catch (err) { /* anonymous user */ }
        }
        loadUserId();
    }, []);

    // Fetch fresh data on mount with cache-first strategy
    useEffect(() => {
        async function loadEvents() {
            try {
                let url = '/api/events?limit=12';
                if (userId) url += `&user_id=${userId}`;

                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                setEvents(data.events || initialEvents);
                setNextCursor(data.nextCursor || null);
                setHasMore(data.hasMore || false);
                setRecommended(data.recommended || initialRecommended);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError('মার্কেট লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
            } finally {
                setLoading(false);
            }
        }
        loadEvents();
    }, [userId, retryKey]);

    // Infinite scroll with Intersection Observer
    const loadMoreEvents = useCallback(async () => {
        if (loadingMore || !nextCursor) return;
        setLoadingMore(true);
        try {
            let url = `/api/events?limit=12&cursor=${nextCursor}`;
            if (userId) url += `&user_id=${userId}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch more');
            const data = await res.json();
            setEvents(prev => [...prev, ...(data.events || [])]);
            setNextCursor(data.nextCursor || null);
            setHasMore(data.hasMore || false);
        } catch (err) { console.error('Failed to load more:', err); }
        finally { setLoadingMore(false); }
    }, [loadingMore, nextCursor, userId]);

    const trendingTags = useMemo(() => {
        const tagCounts: Record<string, number> = {};
        events.forEach(e => { if (e.tags) e.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }); });
        return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ id: tag, label: tag, count }));
    }, [events]);

    const filteredEvents = useMemo(() => {
        let result = [...events];
        switch (sortBy) {
            case 'ending_soon':
                result.sort((a, b) => new Date(a.trading_closes_at || a.created_at).getTime() - new Date(b.trading_closes_at || b.created_at).getTime());
                break;
            case 'high_volume':
                result.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'high_liquidity':
                result.sort((a, b) => { const liqA = (a.yes_price || 0.5) * (a.no_price || 0.5); const liqB = (b.yes_price || 0.5) * (b.no_price || 0.5); return liqB - liqA; });
                break;
            default:
                result.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
        }
        if (activeCategory === 'latest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        else if (activeCategory === 'new') { const w = new Date(); w.setDate(w.getDate() - 7); result = result.filter(e => new Date(e.created_at) >= w); }
        else if (activeCategory !== 'trending') result = result.filter(e => e.category?.toLowerCase() === activeCategory);
        if (activeTag) result = result.filter(e => (e.tags || []).includes(activeTag) || CATEGORY_LABELS[e.category?.toLowerCase()] === activeTag || e.category === activeTag);
        if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); result = result.filter(e => (e.title || '').toLowerCase().includes(q) || (e.question || '').toLowerCase().includes(q)); }
        return result;
    }, [events, activeCategory, activeTag, searchQuery, sortBy]);

    const showCategoryView = activeCategory === 'trending' && !activeTag && !searchQuery.trim() && sortBy === 'trending';

    // Intersection Observer for infinite scroll (placed after showCategoryView is declared)
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [target] = entries;
                if (target.isIntersecting && hasMore && !loadingMore && !showCategoryView) {
                    loadMoreEvents();
                }
            },
            { root: null, rootMargin: '200px', threshold: 0.1 }
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [hasMore, loadingMore, showCategoryView, loadMoreEvents]);

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            <Navbar />
            {/* Live Markets Ticker with Real-time Updates */}
            <LiveMarketsTicker initialMarkets={initialTickerMarkets} />
            <CategoryTabs activeCategory={activeCategory} onCategoryChange={c => { setActiveCategory(c); setActiveTag(null); setSearchQuery(''); }} />
            {trendingTags.length > 0 && (
                <div className="border-b border-gray-100 bg-white"><div className="max-w-7xl mx-auto"><TrendingTags tags={trendingTags} activeTag={activeTag} onTagClick={setActiveTag} /></div></div>
            )}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                                <div><p className="text-sm font-medium text-red-800">{error}</p><p className="text-xs text-red-600">সার্ভার সংযোগে সমস্যা হতে পারে</p></div>
                            </div>
                            <button onClick={() => { setRetryKey(k => k + 1); setLoading(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <RefreshCw className="w-4 h-4" /> পুনরায় চেষ্টা করুন
                            </button>
                        </div>
                    </div>
                )}
                <div className="mb-5 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="মার্কেট খুঁজুন..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm" />
                    </div>
                    <div className="relative">
                        <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="সাজানোর অপশন" className="appearance-none w-full sm:w-48 pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm cursor-pointer">
                            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                        <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                {!showCategoryView && filteredEvents.length > 0 ? (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-[18px] font-bold text-gray-900">{`${CATEGORY_ICONS[activeCategory] || '📊'} ${CATEGORY_LABELS[activeCategory] || activeCategory}`} {sortBy !== 'trending' && <span className="text-[12px] font-normal text-gray-500">{SORT_OPTIONS.find(o => o.id === sortBy)?.label.replace(/^[\d\w\s]+ /, '') || ''}</span>}</h2>
                            <span className="text-[12px] text-gray-400">{filteredEvents.length}টি ফলাফল</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredEvents.slice(0, 8).map(event => <PolymarketCard key={event.id} market={event} />)}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {recommended.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4"><h2 className="text-[18px] font-bold text-gray-900">আপনার জন্য সুপারিশ</h2><span className="text-[12px] text-gray-400">{recommended.length}টি</span></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{recommended.map(e => <PolymarketCard key={e.id} market={e} />)}</div>
                            </div>
                        )}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[18px] font-bold text-gray-900">{showCategoryView ? '🔥 সব ট্রেন্ডিং মার্কেট' : '📊 সকল মার্কেট'}</h2>
                                <span className="text-[12px] text-gray-400">{filteredEvents.length}টি ফলাফল</span>
                            </div>
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <PolymarketCardSkeleton key={i} />)}</div>
                            ) : filteredEvents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{filteredEvents.map(e => <PolymarketCard key={e.id} market={e} />)}</div>
                            ) : (
                                <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4"><Search className="w-6 h-6 text-gray-400" /></div>
                                    <h3 className="text-[15px] font-semibold text-gray-700 mb-1">কোনো মার্কেট পাওয়া যায়নি</h3>
                                    <p className="text-[13px] text-gray-400">অন্য ক্যাটাগরি বা ট্যাগ দিয়ে চেষ্টা করুন</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div className="text-center py-10">
                    <Link href="/markets" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                        সকল মার্কেট দেখুন <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                {/* Infinite Scroll Trigger Element - Intersection Observer handles loading */}
                {hasMore && !loading && !showCategoryView && (
                    <div
                        ref={loadMoreRef}
                        className="flex justify-center py-8"
                    >
                        {loadingMore && (
                            <div className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-xl">
                                <Loader2 className="w-4 h-4 animate-spin" /> লোড হচ্ছে...
                            </div>
                        )}
                    </div>
                )}
            </main>
            <PremiumFooter />
        </div>
    );
}