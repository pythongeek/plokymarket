import { createServiceClient } from '@/lib/supabase/service';
import type { CreateEventInput, CreateEventResult, Event, ResolutionMethod } from './types';

const supabase = createServiceClient();

export class EventService {
  
  /**
   * Create event atomically with CLOB market
   * Uses production-ready matching engine
   */
  async createEventAtomic(
    input: CreateEventInput,
    adminId: string
  ): Promise<CreateEventResult> {
    try {
      // Validate admin
      const { data: admin, error: adminError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin')
        .eq('id', adminId)
        .single();

      if (adminError || (!admin?.is_admin && !admin?.is_super_admin)) {
        return {
          success: false,
          error: 'Unauthorized: Admin access required'
        };
      }

      // Convert resolution delay from hours to minutes for API
      const eventData = {
        ...input,
        resolution_delay: input.resolution_delay_hours ? input.resolution_delay_hours * 60 : 1440
      };

      // Call the production CLOB function
      const { data, error } = await supabase.rpc('create_event_complete', {
        p_event_data: eventData,
        p_admin_id: adminId
      });

      if (error) {
        console.error('RPC Error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data?.success) {
        return {
          success: false,
          error: data?.error || 'Unknown error creating event'
        };
      }

      return {
        success: true,
        event_id: data.event_id,
        market_id: data.market_id,
        slug: data.slug,
        message: data.message,
        features: data.features
      };

    } catch (err) {
      console.error('EventService Error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Get admin events with filtering
   */
  async getAdminEvents(params: {
    status?: string;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ events: Event[]; total: number }> {
    const { data, error } = await supabase.rpc('get_admin_events', {
      p_status: params.status || null,
      p_category: params.category || null,
      p_search: params.search || null,
      p_limit: params.limit || 100,
      p_offset: params.offset || 0
    });

    if (error) {
      console.error('getAdminEvents Error:', error);
      throw error;
    }

    return {
      events: data || [],
      total: data?.length || 0
    };
  }

  /**
   * Get order book depth for a market
   * Used for real-time order book display
   */
  async getOrderBookDepth(marketId: string, depth: number = 10) {
    const { data, error } = await supabase.rpc('get_order_book_depth', {
      p_market_id: marketId,
      p_depth: depth
    });

    if (error) {
      console.error('getOrderBookDepth Error:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get price history for charts
   */
  async getPriceHistory(marketId: string, outcome: string = 'YES', limit: number = 100) {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('market_id', marketId)
      .eq('outcome', outcome)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getPriceHistory Error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get OHLC data for candlestick charts
   */
  async getPriceOHLC(marketId: string, outcome: string = 'YES') {
    const { data, error } = await supabase
      .from('price_ohlc_1h')
      .select('*')
      .eq('market_id', marketId)
      .eq('outcome', outcome)
      .order('hour', { ascending: false })
      .limit(168); // 7 days of hourly data

    if (error) {
      console.error('getPriceOHLC Error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Resolve an event with outcome
   */
  async resolveEvent(
    eventId: string,
    outcome: number,
    adminId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update event status
      const { error } = await supabase
        .from('events')
        .update({
          status: 'resolved',
          resolution_outcome: outcome,
          resolved_at: new Date().toISOString(),
          resolved_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update resolution_systems
      await supabase
        .from('resolution_systems')
        .update({
          status: 'resolved',
          final_outcome: outcome,
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: adminId
        })
        .eq('event_id', eventId);

      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }
}

export const eventService = new EventService();
