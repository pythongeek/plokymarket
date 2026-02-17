/**
 * Events Service
 * Handles all event/market related operations
 */

import { getBrowserClient } from '@/lib/supabase/client';
import type { 
  Event, 
  ResolutionSystem, 
  AIResolutionPipeline,
  DbResult,
  DbListResult,
  RealtimePayload 
} from '@/types/database';

const supabase = getBrowserClient();

// ===================================
// EVENT CRUD OPERATIONS
// ===================================

export async function fetchEvents(options: {
  category?: string;
  status?: string;
  featured?: boolean;
  trending?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<DbListResult<Event>> {
  let query = supabase
    .from('events')
    .select('*', { count: 'exact' });

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.status) {
    query = query.eq('trading_status', options.status);
  }

  if (options.featured !== undefined) {
    query = query.eq('is_featured', options.featured);
  }

  if (options.trending !== undefined) {
    query = query.eq('is_trending', options.trending);
  }

  if (options.search) {
    query = query.textSearch('search_vector', options.search);
  }

  query = query
    .order('created_at', { ascending: false })
    .limit(options.limit || 50)
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

  const { data, error, count } = await query;

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchEventById(id: string): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function fetchEventBySlug(slug: string): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  return { data, error };
}

export async function createEvent(eventData: Partial<Event>): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  return { data, error };
}

export async function updateEvent(
  id: string, 
  updates: Partial<Event>
): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// ===================================
// RESOLUTION SYSTEM OPERATIONS
// ===================================

export async function fetchResolutionSystem(eventId: string): Promise<DbResult<ResolutionSystem>> {
  const { data, error } = await supabase
    .from('resolution_systems')
    .select('*')
    .eq('event_id', eventId)
    .single();

  return { data, error };
}

export async function createResolutionSystem(
  config: Partial<ResolutionSystem>
): Promise<DbResult<ResolutionSystem>> {
  const { data, error } = await supabase
    .from('resolution_systems')
    .insert(config)
    .select()
    .single();

  return { data, error };
}

export async function updateResolutionSystem(
  id: string,
  updates: Partial<ResolutionSystem>
): Promise<DbResult<ResolutionSystem>> {
  const { data, error } = await supabase
    .from('resolution_systems')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// ===================================
// AI RESOLUTION PIPELINE OPERATIONS
// ===================================

export async function fetchAIPipelines(eventId: string): Promise<DbListResult<AIResolutionPipeline>> {
  const { data, error, count } = await supabase
    .from('ai_resolution_pipelines')
    .select('*', { count: 'exact' })
    .eq('market_id', eventId)
    .order('created_at', { ascending: false });

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchLatestAIPipeline(eventId: string): Promise<DbResult<AIResolutionPipeline>> {
  const { data, error } = await supabase
    .from('ai_resolution_pipelines')
    .select('*')
    .eq('market_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { data, error };
}

// ===================================
// REAL-TIME SUBSCRIPTIONS
// ===================================

export function subscribeToEvent(
  eventId: string,
  callback: (payload: RealtimePayload<Event>) => void
) {
  const channel = supabase
    .channel(`event-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToEvents(
  callback: (payload: RealtimePayload<Event>) => void
) {
  const channel = supabase
    .channel('events-all')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToFeaturedEvents(
  callback: (payload: RealtimePayload<Event>) => void
) {
  const channel = supabase
    .channel('events-featured')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: 'is_featured=eq.true',
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ===================================
// ANALYTICS & STATISTICS
// ===================================

export async function fetchEventStats() {
  const { data, error } = await supabase
    .rpc('get_event_stats');

  return { data, error };
}

export async function fetchEventsByCategory() {
  const { data, error } = await supabase
    .from('events')
    .select('category, count')
    .group('category');

  return { data, error };
}

export async function fetchTrendingEvents(limit: number = 10): Promise<DbListResult<Event>> {
  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('is_trending', true)
    .eq('trading_status', 'active')
    .order('volume', { ascending: false })
    .limit(limit);

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchEndingSoonEvents(limit: number = 10): Promise<DbListResult<Event>> {
  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('trading_status', 'active')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(limit);

  return {
    data: data || [],
    error,
    count,
  };
}

// ===================================
// ADMIN OPERATIONS
// ===================================

export async function resolveEvent(
  eventId: string,
  outcome: 'yes' | 'no',
  resolutionData?: Record<string, any>
): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({
      trading_status: 'resolved',
      resolved_outcome: outcome === 'yes' ? 1 : 2,
      resolved_at: new Date().toISOString(),
      resolution_data: resolutionData,
    })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}

export async function toggleFeatured(eventId: string, featured: boolean): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({ is_featured: featured })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}

export async function toggleTrending(eventId: string, trending: boolean): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({ is_trending: trending })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}

export async function pauseEvent(
  eventId: string,
  reason: string,
  pausedBy: string
): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({
      trading_status: 'paused',
      pause_reason: reason,
      paused_by: pausedBy,
      paused_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}

export async function resumeEvent(eventId: string): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({
      trading_status: 'active',
      pause_reason: null,
      paused_by: null,
      paused_at: null,
    })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error };
}