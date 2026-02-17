/**
 * Market Store
 * Zustand store for market/event state management
 * Includes real-time subscriptions and caching
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Event, RealtimePayload } from '@/types/database';
import * as eventsService from '@/services/events';

// ===================================
// STORE STATE INTERFACE
// ===================================

interface MarketState {
  // Data
  events: Map<string, Event>;
  filteredEventIds: string[];
  selectedEventId: string | null;
  featuredEventIds: string[];
  trendingEventIds: string[];
  endingSoonEventIds: string[];
  
  // Filters
  selectedCategory: string | null;
  selectedStatus: string | null;
  searchQuery: string;
  sortBy: 'volume' | 'ending' | 'newest' | 'movement' | 'trending';
  
  // UI State
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Pagination
  page: number;
  limit: number;
  totalCount: number;
  
  // Subscriptions
  unsubscribeEvents: (() => void) | null;
  unsubscribeFeatured: (() => void) | null;
}

interface MarketActions {
  // Data Actions
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  setSelectedEvent: (id: string | null) => void;
  
  // Filter Actions
  setCategory: (category: string | null) => void;
  setStatus: (status: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: MarketState['sortBy']) => void;
  
  // Fetch Actions
  fetchEvents: (reset?: boolean) => Promise<void>;
  fetchMoreEvents: () => Promise<void>;
  fetchEventById: (id: string) => Promise<Event | null>;
  fetchEventBySlug: (slug: string) => Promise<Event | null>;
  fetchFeaturedEvents: () => Promise<void>;
  fetchTrendingEvents: () => Promise<void>;
  fetchEndingSoonEvents: () => Promise<void>;
  refreshEvent: (id: string) => Promise<void>;
  
  // Real-time Actions
  subscribeToEvents: () => void;
  subscribeToFeatured: () => void;
  unsubscribeAll: () => void;
  
  // Utility Actions
  clearError: () => void;
  resetFilters: () => void;
}

// ===================================
// STORE IMPLEMENTATION
// ===================================

const initialState: MarketState = {
  events: new Map(),
  filteredEventIds: [],
  selectedEventId: null,
  featuredEventIds: [],
  trendingEventIds: [],
  endingSoonEventIds: [],
  selectedCategory: null,
  selectedStatus: null,
  searchQuery: '',
  sortBy: 'volume',
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 20,
  totalCount: 0,
  unsubscribeEvents: null,
  unsubscribeFeatured: null,
};

export const useMarketStore = create<MarketState & MarketActions>()(
  immer(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initialState,

          // ===================================
          // DATA ACTIONS
          // ===================================
          
          setEvents: (events) => {
            set((state) => {
              state.events = new Map(events.map((e) => [e.id, e]));
              state.filteredEventIds = events.map((e) => e.id);
              state.hasMore = events.length === state.limit;
            });
          },

          addEvent: (event) => {
            set((state) => {
              state.events.set(event.id, event);
              recalculateFiltered(state);
            });
          },

          updateEvent: (id, updates) => {
            set((state) => {
              const existing = state.events.get(id);
              if (existing) {
                state.events.set(id, { ...existing, ...updates });
                recalculateFiltered(state);
              }
            });
          },

          removeEvent: (id) => {
            set((state) => {
              state.events.delete(id);
              recalculateFiltered(state);
            });
          },

          setSelectedEvent: (id) => {
            set((state) => {
              state.selectedEventId = id;
            });
          },

          // ===================================
          // FILTER ACTIONS
          // ===================================
          
          setCategory: (category) => {
            set((state) => {
              state.selectedCategory = category;
              state.page = 1;
            });
            get().fetchEvents(true);
          },

          setStatus: (status) => {
            set((state) => {
              state.selectedStatus = status;
              state.page = 1;
            });
            get().fetchEvents(true);
          },

          setSearchQuery: (query) => {
            set((state) => {
              state.searchQuery = query;
              state.page = 1;
            });
            // Debounce search
            setTimeout(() => get().fetchEvents(true), 300);
          },

          setSortBy: (sort) => {
            set((state) => {
              state.sortBy = sort;
            });
            recalculateFiltered(get());
          },

          // ===================================
          // FETCH ACTIONS
          // ===================================
          
          fetchEvents: async (reset = false) => {
            const state = get();
            
            if (reset) {
              set((s) => {
                s.page = 1;
                s.events.clear();
              });
            }

            set((s) => {
              s.isLoading = !reset;
              s.error = null;
            });

            try {
              const { data, error, count } = await eventsService.fetchEvents({
                category: state.selectedCategory || undefined,
                status: state.selectedStatus || undefined,
                search: state.searchQuery || undefined,
                limit: state.limit,
                offset: (state.page - 1) * state.limit,
              });

              if (error) throw error;

              set((s) => {
                if (reset) {
                  s.events = new Map(data.map((e) => [e.id, e]));
                  s.filteredEventIds = data.map((e) => e.id);
                } else {
                  data.forEach((e) => s.events.set(e.id, e));
                  s.filteredEventIds = Array.from(s.events.keys());
                }
                s.totalCount = count || 0;
                s.hasMore = data.length === s.limit;
              });

              recalculateFiltered(get());
            } catch (err) {
              set((s) => {
                s.error = err instanceof Error ? err.message : 'Failed to fetch events';
              });
            } finally {
              set((s) => {
                s.isLoading = false;
              });
            }
          },

          fetchMoreEvents: async () => {
            const state = get();
            if (state.isLoadingMore || !state.hasMore) return;

            set((s) => {
              s.isLoadingMore = true;
              s.page += 1;
            });

            try {
              const { data, error } = await eventsService.fetchEvents({
                category: state.selectedCategory || undefined,
                status: state.selectedStatus || undefined,
                search: state.searchQuery || undefined,
                limit: state.limit,
                offset: (state.page - 1) * state.limit,
              });

              if (error) throw error;

              set((s) => {
                data.forEach((e) => s.events.set(e.id, e));
                s.filteredEventIds = Array.from(s.events.keys());
                s.hasMore = data.length === s.limit;
              });

              recalculateFiltered(get());
            } catch (err) {
              set((s) => {
                s.error = err instanceof Error ? err.message : 'Failed to fetch more events';
              });
            } finally {
              set((s) => {
                s.isLoadingMore = false;
              });
            }
          },

          fetchEventById: async (id) => {
            const { data, error } = await eventsService.fetchEventById(id);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return null;
            }
            if (data) {
              set((s) => {
                s.events.set(id, data);
              });
            }
            return data;
          },

          fetchEventBySlug: async (slug) => {
            const { data, error } = await eventsService.fetchEventBySlug(slug);
            if (error) {
              set((s) => {
                s.error = error.message;
              });
              return null;
            }
            if (data) {
              set((s) => {
                s.events.set(data.id, data);
                s.selectedEventId = data.id;
              });
            }
            return data;
          },

          fetchFeaturedEvents: async () => {
            const { data, error } = await eventsService.fetchEvents({
              featured: true,
              limit: 10,
            });

            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.events.set(e.id, e));
                s.featuredEventIds = data.map((e) => e.id);
              });
            }
          },

          fetchTrendingEvents: async () => {
            const { data, error } = await eventsService.fetchTrendingEvents(10);

            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.events.set(e.id, e));
                s.trendingEventIds = data.map((e) => e.id);
              });
            }
          },

          fetchEndingSoonEvents: async () => {
            const { data, error } = await eventsService.fetchEndingSoonEvents(10);

            if (!error && data) {
              set((s) => {
                data.forEach((e) => s.events.set(e.id, e));
                s.endingSoonEventIds = data.map((e) => e.id);
              });
            }
          },

          refreshEvent: async (id) => {
            const { data, error } = await eventsService.fetchEventById(id);
            if (!error && data) {
              set((s) => {
                s.events.set(id, data);
              });
            }
          },

          // ===================================
          // REAL-TIME ACTIONS
          // ===================================
          
          subscribeToEvents: () => {
            const unsubscribe = eventsService.subscribeToEvents((payload) => {
              const { eventType, new: newEvent, old: oldEvent } = payload;

              switch (eventType) {
                case 'INSERT':
                  get().addEvent(newEvent as Event);
                  break;
                case 'UPDATE':
                  get().updateEvent((newEvent as Event).id, newEvent as Partial<Event>);
                  break;
                case 'DELETE':
                  get().removeEvent((oldEvent as Event).id);
                  break;
              }
            });

            set((s) => {
              s.unsubscribeEvents = unsubscribe;
            });
          },

          subscribeToFeatured: () => {
            const unsubscribe = eventsService.subscribeToFeaturedEvents((payload) => {
              const { eventType, new: newEvent } = payload;

              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                const event = newEvent as Event;
                if (event.is_featured) {
                  get().addEvent(event);
                  set((s) => {
                    if (!s.featuredEventIds.includes(event.id)) {
                      s.featuredEventIds.unshift(event.id);
                    }
                  });
                } else {
                  set((s) => {
                    s.featuredEventIds = s.featuredEventIds.filter((id) => id !== event.id);
                  });
                }
              }
            });

            set((s) => {
              s.unsubscribeFeatured = unsubscribe;
            });
          },

          unsubscribeAll: () => {
            const state = get();
            state.unsubscribeEvents?.();
            state.unsubscribeFeatured?.();
            
            set((s) => {
              s.unsubscribeEvents = null;
              s.unsubscribeFeatured = null;
            });
          },

          // ===================================
          // UTILITY ACTIONS
          // ===================================
          
          clearError: () => {
            set((s) => {
              s.error = null;
            });
          },

          resetFilters: () => {
            set((s) => {
              s.selectedCategory = null;
              s.selectedStatus = null;
              s.searchQuery = '';
              s.sortBy = 'volume';
              s.page = 1;
            });
            get().fetchEvents(true);
          },
        }),
        {
          name: 'market-store',
          partialize: (state) => ({
            selectedCategory: state.selectedCategory,
            selectedStatus: state.selectedStatus,
            sortBy: state.sortBy,
            limit: state.limit,
          }),
        }
      )
    )
  )
);

// ===================================
// HELPER FUNCTIONS
// ===================================

function recalculateFiltered(state: MarketState) {
  let events = Array.from(state.events.values());

  // Category filter
  if (state.selectedCategory) {
    events = events.filter((e) => e.category === state.selectedCategory);
  }

  // Status filter
  if (state.selectedStatus) {
    events = events.filter((e) => e.trading_status === state.selectedStatus);
  }

  // Search filter
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    events = events.filter(
      (e) =>
        (e.name && e.name.toLowerCase().includes(query)) ||
        (e.title && e.title.toLowerCase().includes(query)) ||
        (e.question && e.question.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query))
    );
  }

  // Sorting
  events.sort((a, b) => {
    switch (state.sortBy) {
      case 'volume':
        return (b.volume || 0) - (a.volume || 0);
      case 'ending':
        return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'movement':
        return Math.abs(b.price_24h_change || 0) - Math.abs(a.price_24h_change || 0);
      case 'trending':
        if (a.is_trending && !b.is_trending) return -1;
        if (!a.is_trending && b.is_trending) return 1;
        return (b.volume || 0) - (a.volume || 0);
      default:
        return 0;
    }
  });

  state.filteredEventIds = events.map((e) => e.id);
}

// ===================================
// SELECTORS
// ===================================

export const selectEvents = (state: MarketState) => 
  state.filteredEventIds.map((id) => state.events.get(id)).filter(Boolean) as Event[];

export const selectEventById = (state: MarketState, id: string) => 
  state.events.get(id);

export const selectSelectedEvent = (state: MarketState) => 
  state.selectedEventId ? state.events.get(state.selectedEventId) : null;

export const selectFeaturedEvents = (state: MarketState) => 
  state.featuredEventIds.map((id) => state.events.get(id)).filter(Boolean) as Event[];

export const selectTrendingEvents = (state: MarketState) => 
  state.trendingEventIds.map((id) => state.events.get(id)).filter(Boolean) as Event[];

export const selectEndingSoonEvents = (state: MarketState) => 
  state.endingSoonEventIds.map((id) => state.events.get(id)).filter(Boolean) as Event[];

export const selectCategories = (state: MarketState) => {
  const categories = new Set<string>();
  state.events.forEach((e) => categories.add(e.category));
  return Array.from(categories).sort();
};
