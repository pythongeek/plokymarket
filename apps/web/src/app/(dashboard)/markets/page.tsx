'use client';

import { useState, useMemo, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { useMarketsRealtime } from '@/hooks/useMarketsRealtime';
import { MarketCard } from '@/components/market/MarketCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  CheckCircle2,
  X,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryStates, parseAsString, parseAsStringEnum } from 'nuqs';
import { useDebouncedCallback } from 'use-debounce';
import { supabase } from '@/lib/supabase';
import type { Market } from '@/types';
import { motion } from 'framer-motion';

function MarketsContent() {
  const { t } = useTranslation();

  // URL-synchronized State
  const [filters, setFilters] = useQueryStates({
    category: parseAsString.withDefault('all'),
    sort: parseAsStringEnum(['volume', 'ending', 'newest', 'price']).withDefault('volume'),
    search: parseAsString.withDefault(''),
    status: parseAsStringEnum(['active', 'closing', 'resolved', 'all']).withDefault('active'),
  });

  // Realtime hook replaces manual data fetching (it auto-hydrates via fetchInitial implicitly/explicitly)
  const { markets } = useMarketsRealtime({
    category: filters.category,
    sortBy: filters.sort,
    status: filters.status
  });

  // Local state for debounced search results (if active)
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Market[]>([]);

  // Debounced Search implementation using Postgres textSearch
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Use the custom search_events RPC if available, otherwise fallback to local filtering on the 'markets' array. Note: For a true robust textSearch you need an RPC or direct table query. Since we have all markets locally via the store, we can also perform highly responsive local filtering as a fallback if the network is flaky, but the spec asks for textSearch.

    // Attempting textSearch on 'events' table
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .textSearch('question', `'${query}'`, { // Using question as the primary text column
          type: 'websearch',
          config: 'english'
        })
        .limit(20);

      if (error) throw error;
      setSearchResults(data as Market[] || []);
    } catch (err) {
      console.warn('Text search failed, falling back to local filtering', err);
      // Fallback local filtering
      const filtered = markets.filter(m => m.question?.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(filtered);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  // Handle Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters({ search: val });
    debouncedSearch(val);
  };

  const clearSearch = () => {
    setFilters({ search: '' });
    setSearchResults([]);
    setIsSearching(false);
  };

  // Determine which market array to use
  const activeMarkets = filters.search.trim() ? searchResults : markets;

  // Derive categories and counts from the global markets array
  const categories = useMemo(() => {
    const counts = markets.reduce((acc, market) => {
      const cat = market.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { id: 'all', label: t('common.all'), count: markets.length },
      ...Object.entries(counts).map(([id, count]) => ({
        id,
        label: t(`categories.${id}`, id),
        count
      }))
    ].sort((a, b) => b.count - a.count);
  }, [markets, t]);

  // Client-side filtering and sorting
  const processedMarkets = useMemo(() => {
    let result = [...activeMarkets];

    // Status Filter
    if (filters.status === 'active') {
      result = result.filter(m => m.status === 'active');
    } else if (filters.status === 'closing') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      result = result.filter(m => m.status === 'active' && new Date(m.trading_closes_at) <= weekFromNow);
    } else if (filters.status === 'resolved') {
      result = result.filter(m => m.status === 'resolved');
    }

    // Category Filter (only apply if not searching, to allow global search)
    if (filters.category !== 'all' && !filters.search) {
      result = result.filter(m => m.category === filters.category);
    }

    // Sort
    if (!filters.search) { // Don't sort search results natively to respect textSearch rank
      switch (filters.sort) {
        case 'volume':
          result.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
          break;
        case 'newest':
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'ending':
          result.sort((a, b) => new Date(a.trading_closes_at).getTime() - new Date(b.trading_closes_at).getTime());
          break;
        case 'price':
          result.sort((a, b) => (b.yes_price || 0.5) - (a.yes_price || 0.5));
          break;
      }
    }

    return result;
  }, [activeMarkets, filters]);

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('markets.title')}</h1>
          <p className="text-muted-foreground">{t('markets.subtitle', { count: markets.length })}</p>
        </div>

        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('markets.search_placeholder', 'Search markets...')}
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10 h-11"
          />
          {filters.search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Animated Category Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-x-auto no-scrollbar border border-border/50">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilters({ category: cat.id })}
            className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap shrink-0 group ${filters.category === cat.id
              ? 'text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            {filters.category === cat.id && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center">
              {cat.label}
              {cat.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full transition-colors ${filters.category === cat.id
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  : 'bg-gray-200/50 dark:bg-gray-700/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                  }`}>
                  {cat.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Auxiliary Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        {/* Status Toggles */}
        <div className="flex gap-2">
          {(['all', 'active', 'closing', 'resolved'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilters({ status })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 transition-colors ${filters.status === status
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background hover:bg-muted border-border/60 text-muted-foreground'
                }`}
            >
              {status === 'active' && <TrendingUp className="w-3 h-3" />}
              {status === 'closing' && <Clock className="w-3 h-3" />}
              {status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
              {t(status === 'all' ? 'common.all' : `common.${status}`, status)}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium mr-1">{t('common.sort_by')}:</span>
          {(['volume', 'ending', 'newest', 'price'] as const).map(sort => (
            <button
              key={sort}
              onClick={() => setFilters({ sort })}
              className={`transition-colors font-medium hover:text-foreground ${filters.sort === sort ? 'text-primary underline underline-offset-4' : ''}`}
            >
              {t(`markets.${sort}_sort`, sort)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count Banner (if filtering) */}
      {(filters.category !== 'all' || filters.search || filters.status !== 'active') && (
        <div className="text-sm font-medium text-muted-foreground flex items-center justify-between bg-muted/30 px-4 py-2 rounded-md border border-border/50">
          <span>{t('markets.showing_count', { shown: processedMarkets.length, total: markets.length })}</span>
          <button onClick={() => setFilters(null)} className="text-primary hover:underline underline-offset-2">
            Clear Filters
          </button>
        </div>
      )}

      {/* Markets Grid */}
      {processedMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card/50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground">{t('markets.no_markets_found', 'No markets found')}</h3>
          <p className="text-muted-foreground max-w-md">
            We couldn't find any predictive markets matching your current filters. Try adjusting your search query or selecting a different category.
          </p>
          <Button onClick={() => setFilters(null)} className="mt-6" variant="outline">
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function MarketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading markets...</div>}>
      <MarketsContent />
    </Suspense>
  );
}
