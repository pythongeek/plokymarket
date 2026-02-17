/**
 * EventList Component
 * Production-ready event list with infinite scroll and filters
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { EventCard } from './EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarketStore, selectEvents, selectCategories } from '@/store/marketStore';
import type { Event } from '@/types/database';

interface EventListProps {
  variant?: 'grid' | 'list';
  featured?: boolean;
  category?: string;
  limit?: number;
}

export function EventList({ variant = 'grid', featured, category, limit }: EventListProps) {
  const store = useMarketStore();
  const events = selectEvents(store);
  const categories = selectCategories(store);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter events based on props
  const filteredEvents = limit ? events.slice(0, limit) : events;

  // Infinite scroll observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && store.hasMore && !store.isLoadingMore) {
        store.fetchMoreEvents();
      }
    },
    [store.hasMore, store.isLoadingMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  // Initial fetch
  useEffect(() => {
    store.fetchEvents(true);
    store.subscribeToEvents();

    return () => {
      store.unsubscribeAll();
    };
  }, []);

  // Fetch featured/trending if needed
  useEffect(() => {
    if (featured) {
      store.fetchFeaturedEvents();
    }
  }, [featured]);

  if (store.isLoading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading markets...</p>
      </div>
    );
  }

  if (store.error && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
        <p className="text-red-500 mb-4">{store.error}</p>
        <Button onClick={() => store.fetchEvents(true)} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={store.selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => store.setCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={store.selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => store.setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search markets..."
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => store.fetchEvents(true)}
            disabled={store.isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${store.isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['volume', 'ending', 'newest', 'movement', 'trending'] as const).map((sort) => (
          <Button
            key={sort}
            variant={store.sortBy === sort ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => store.setSortBy(sort)}
            className="capitalize"
          >
            {sort === 'volume' && 'Volume'}
            {sort === 'ending' && 'Ending Soon'}
            {sort === 'newest' && 'Newest'}
            {sort === 'movement' && 'Most Movement'}
            {sort === 'trending' && 'Trending'}
          </Button>
        ))}
      </div>

      {/* Event Grid/List */}
      <motion.div
        layout
        className={
          variant === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <EventCard 
                event={event} 
                variant={event.is_featured ? 'featured' : 'default'}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Trigger */}
      {!limit && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {store.isLoadingMore && (
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          )}
          {!store.hasMore && events.length > 0 && (
            <p className="text-gray-500">No more markets to load</p>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && !store.isLoading && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No markets found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your filters or search query
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={store.resetFilters}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
