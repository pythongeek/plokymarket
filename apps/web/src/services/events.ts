/**
 * Events Service
 * Handles all event CRUD operations, real-time subscriptions, and analytics
 * Reimplemented for 094_reimplemented_events_markets schema
 */

import { getBrowserClient } from '@/lib/supabase/client';
import type {
  Event,
  EventStatus,
  TradingStatus,
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
  try {
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (options.category) query = query.eq('category', options.category);
    if (options.status) query = query.eq('status', options.status);
    if (options.featured) query = query.eq('is_featured', true);
    if (options.trending) query = query.eq('is_trending', true);
    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,question.ilike.%${options.search}%`);
    }
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

    const { data, error, count } = await query;

    return {
      data: data || [],
      error: error ? new Error(error.message) : null,
      count
    };
  } catch (err: any) {
    return { data: [], error: err, count: null };
  }
}

export async function fetchEventById(id: string): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function fetchEventBySlug(slug: string): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function createEvent(eventData: Partial<Event>): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateEvent(
  id: string,
  updates: Partial<Event>
): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
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

  return { data, error: error ? new Error(error.message) : null };
}

export async function createResolutionSystem(
  config: Partial<ResolutionSystem>
): Promise<DbResult<ResolutionSystem>> {
  const { data, error } = await supabase
    .from('resolution_systems')
    .insert(config)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function updateResolutionSystem(
  id: string,
  updates: Partial<ResolutionSystem>
): Promise<DbResult<ResolutionSystem>> {
  const { data, error } = await supabase
    .from('resolution_systems')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
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

  return { data: data || [], error: error ? new Error(error.message) : null, count };
}

export async function fetchLatestAIPipeline(eventId: string): Promise<DbResult<AIResolutionPipeline>> {
  const { data, error } = await supabase
    .from('ai_resolution_pipelines')
    .select('*')
    .eq('market_id', eventId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

// ===================================
// REAL-TIME SUBSCRIPTIONS
// ===================================

export function subscribeToEvent(
  eventId: string,
  callback: (payload: RealtimePayload<Event>) => void
) {
  return supabase
    .channel(`event-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`
      },
      (payload: any) => callback(payload as RealtimePayload<Event>)
    )
    .subscribe();
}

export function subscribeToEvents(
  callback: (payload: RealtimePayload<Event>) => void
) {
  return supabase
    .channel('events-all')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events'
      },
      (payload: any) => callback(payload as RealtimePayload<Event>)
    )
    .subscribe();
}

export function subscribeToFeaturedEvents(
  callback: (payload: RealtimePayload<Event>) => void
) {
  return supabase
    .channel('events-featured')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: 'is_featured=eq.true'
      },
      (payload: any) => callback(payload as RealtimePayload<Event>)
    )
    .subscribe();
}

// ===================================
// ANALYTICS & STATISTICS
// ===================================

export async function fetchEventStats() {
  const { data, error } = await supabase
    .from('events')
    .select('status, total_volume, total_trades, unique_traders');

  return { data, error: error ? new Error(error.message) : null };
}

export async function fetchEventsByCategory() {
  const { data, error } = await supabase
    .from('events')
    .select('category')
    .eq('status', 'active');

  return { data, error: error ? new Error(error.message) : null };
}

export async function fetchTrendingEvents(limit: number = 10): Promise<DbListResult<Event>> {
  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('is_trending', true)
    .in('status', ['active', 'closed'])
    .order('total_volume', { ascending: false })
    .limit(limit);

  return { data: data || [], error: error ? new Error(error.message) : null, count };
}

export async function fetchEndingSoonEvents(limit: number = 10): Promise<DbListResult<Event>> {
  const now = new Date().toISOString();
  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('status', 'active')
    .gt('trading_closes_at', now)
    .order('trading_closes_at', { ascending: true })
    .limit(limit);

  return { data: data || [], error: error ? new Error(error.message) : null, count };
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
      status: 'resolved' as EventStatus,
      resolved_outcome: outcome === 'yes' ? 1 : 2,
      resolved_at: new Date().toISOString(),
      ...resolutionData
    })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function toggleFeatured(eventId: string, featured: boolean): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({ is_featured: featured })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function toggleTrending(eventId: string, trending: boolean): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({ is_trending: trending })
    .eq('id', eventId)
    .select()
    .single();

  return { data, error: error ? new Error(error.message) : null };
}

export async function pauseEvent(
  eventId: string,
  reason: string,
  pausedBy: string
): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({
      trading_status: 'paused' as TradingStatus,
      pause_reason: reason,
      paused_at: new Date().toISOString(),
      paused_by: pausedBy
    })
    .eq('id', eventId)
    .select()
    .single();

  return { data: data as unknown as Event, error: error ? new Error(error.message) : null };
}

export async function resumeEvent(eventId: string): Promise<DbResult<Event>> {
  const { data, error } = await supabase
    .from('events')
    .update({
      trading_status: 'active' as TradingStatus,
      pause_reason: null,
      paused_at: null,
      paused_by: null,
      estimated_resume_at: null
    })
    .eq('id', eventId)
    .select()
    .single();

  return { data: data as unknown as Event, error: error ? new Error(error.message) : null };
}

export async function pauseCategory(
  category: string,
  reason: string,
  pausedBy: string
): Promise<DbResult<any>> {
  // 1. Update all events in category
  const { error: eventError } = await supabase
    .from('events')
    .update({
      trading_status: 'paused' as TradingStatus,
      pause_reason: reason,
      paused_at: new Date().toISOString(),
      paused_by: pausedBy
    })
    .eq('category', category)
    .eq('trading_status', 'active');

  // 2. Update category settings for persistence
  const { data, error: settingsError } = await supabase
    .from('category_settings')
    .upsert({
      category,
      trading_status: 'paused',
      pause_reason: reason,
      paused_at: new Date().toISOString(),
      paused_by: pausedBy
    })
    .select()
    .single();

  return { data, error: (eventError || settingsError) ? new Error(eventError?.message || settingsError?.message) : null };
}

export async function resumeCategory(category: string): Promise<DbResult<any>> {
  // 1. Update all events in category
  const { error: eventError } = await supabase
    .from('events')
    .update({
      trading_status: 'active' as TradingStatus,
      pause_reason: null,
      paused_at: null,
      paused_by: null,
      estimated_resume_at: null
    })
    .eq('category', category)
    .eq('trading_status', 'paused');

  // 2. Update category settings
  const { data, error: settingsError } = await supabase
    .from('category_settings')
    .update({
      trading_status: 'active',
      pause_reason: null,
      paused_at: null,
      paused_by: null
    })
    .eq('category', category)
    .select()
    .single();

  return { data, error: (eventError || settingsError) ? new Error(eventError?.message || settingsError?.message) : null };
}