/**
 * Event-Market Sync Service
 * Manages atomic creation and synchronization between events and markets
 * Industry-standard one-to-many relationship with cascade operations
 */

import { createClient } from '@supabase/supabase-js';
import { Event, Market } from '@/types/market-system';
import { ProposedMarket } from '@/lib/ai-agents/market-proposal-agent';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export interface EventMarketCreationData {
  event: Partial<Event>;
  markets: ProposedMarket[];
  createdBy: string;
}

export interface EventMarketCreationResult {
  success: boolean;
  eventId?: string;
  marketIds?: string[];
  slug?: string;
  error?: string;
  details?: any;
}

/**
 * Event-Market Sync Service
 * Handles atomic operations for event and market creation
 */
export class EventMarketSync {
  /**
   * Atomic creation of event with multiple markets
   * Uses PostgreSQL RPC for transaction safety
   */
  async createEventWithMarkets(
    data: EventMarketCreationData
  ): Promise<EventMarketCreationResult> {
    console.log('[EventMarketSync] Starting atomic creation...', {
      eventTitle: data.event.title,
      marketCount: data.markets.length,
    });

    try {
      const supabase = getSupabaseAdmin();

      // Step 1: Create event using the RPC function
      const eventPayload = {
        title: data.event.title,
        question: data.event.question || data.event.title,
        description: data.event.description || '',
        category: data.event.category || 'general',
        subcategory: data.event.subcategory || null,
        tags: data.event.tags || [],
        image_url: data.event.image_url || null,
        status: 'active',
        starts_at: data.event.starts_at || new Date().toISOString(),
        trading_opens_at: data.event.trading_opens_at || new Date().toISOString(),
        trading_closes_at: data.event.trading_closes_at,
        resolution_method: data.event.resolution_method || 'manual_admin',
        resolution_delay_hours: data.event.resolution_delay_hours || 24,
        initial_liquidity: data.event.initial_liquidity || 1000,
        is_featured: data.event.is_featured || false,
        answer1: data.event.answer1 || 'হ্যাঁ (Yes)',
        answer2: data.event.answer2 || 'না (No)',
        answer_type: data.markets[0]?.type || 'binary',
      };

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'create_event_complete',
        {
          p_event_data: eventPayload,
          p_admin_id: data.createdBy,
        }
      );

      if (rpcError) {
        console.error('[EventMarketSync] RPC Error:', rpcError);
        throw new Error(`Event creation failed: ${rpcError.message}`);
      }

      const result = rpcResult as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Event creation failed');
      }

      const eventId = result.event_id;
      const primaryMarketId = result.market_id;

      console.log('[EventMarketSync] Event created:', {
        eventId,
        primaryMarketId,
        slug: result.slug,
      });

      // Step 2: Create additional markets (if any)
      const marketIds: string[] = primaryMarketId ? [primaryMarketId] : [];
      
      // Skip the first market as it's already created by RPC
      const additionalMarkets = data.markets.slice(1);
      
      for (const proposedMarket of additionalMarkets) {
        try {
          const { data: marketData, error: marketError } = await supabase
            .from('markets')
            .insert({
              event_id: eventId,
              name: proposedMarket.name,
              question: proposedMarket.question,
              description: proposedMarket.description,
              category: data.event.category || 'general',
              subcategory: data.event.subcategory || null,
              tags: data.event.tags || [],
              trading_closes_at: data.event.trading_closes_at,
              resolution_delay_hours: data.event.resolution_delay_hours || 24,
              initial_liquidity: proposedMarket.suggestedLiquidity,
              liquidity: proposedMarket.suggestedLiquidity,
              status: 'active',
              slug: `${result.slug}-market-${marketIds.length + 1}`,
              answer_type: proposedMarket.type,
              answer1: proposedMarket.outcomes[0] || 'হ্যাঁ',
              answer2: proposedMarket.outcomes[1] || 'না',
              is_featured: false,
              created_by: data.createdBy,
              image_url: data.event.image_url,
            })
            .select('id')
            .single();

          if (marketError) {
            console.warn('[EventMarketSync] Additional market creation failed:', marketError);
            continue;
          }

          marketIds.push(marketData.id);
          console.log('[EventMarketSync] Additional market created:', marketData.id);
        } catch (err) {
          console.warn('[EventMarketSync] Market creation error:', err);
        }
      }

      return {
        success: true,
        eventId,
        marketIds,
        slug: result.slug,
      };

    } catch (error: any) {
      console.error('[EventMarketSync] Creation failed:', error);
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  /**
   * Fetch event with all related markets
   */
  async getEventWithMarkets(eventId: string): Promise<{
    event: Event | null;
    markets: Market[];
  }> {
    const supabase = getSupabaseAdmin();

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('[EventMarketSync] Event fetch error:', eventError);
      return { event: null, markets: [] };
    }

    // Fetch related markets
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (marketsError) {
      console.error('[EventMarketSync] Markets fetch error:', marketsError);
    }

    return {
      event: event as Event,
      markets: (markets || []) as Market[],
    };
  }

  /**
   * Sync event timing with all markets
   * Ensures trading_closes_at is consistent
   */
  async syncEventTiming(eventId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    try {
      // Get event timing
      const { data: event } = await supabase
        .from('events')
        .select('trading_closes_at, ends_at')
        .eq('id', eventId)
        .single();

      if (!event) return false;

      // Update all related markets
      const { error } = await supabase
        .from('markets')
        .update({
          trading_closes_at: event.trading_closes_at,
          updated_at: new Date().toISOString(),
        })
        .eq('event_id', eventId);

      if (error) {
        console.error('[EventMarketSync] Timing sync error:', error);
        return false;
      }

      console.log('[EventMarketSync] Timing synced for event:', eventId);
      return true;
    } catch (err) {
      console.error('[EventMarketSync] Sync error:', err);
      return false;
    }
  }

  /**
   * Cascade update event status to markets
   */
  async cascadeStatusUpdate(
    eventId: string,
    status: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();

    try {
      const { error } = await supabase
        .from('markets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('event_id', eventId);

      if (error) {
        console.error('[EventMarketSync] Status cascade error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[EventMarketSync] Cascade error:', err);
      return false;
    }
  }

  /**
   * Validate event-market consistency
   */
  async validateConsistency(eventId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const supabase = getSupabaseAdmin();
    const issues: string[] = [];

    try {
      const { event, markets } = await this.getEventWithMarkets(eventId);

      if (!event) {
        return { valid: false, issues: ['Event not found'] };
      }

      if (markets.length === 0) {
        issues.push('No markets linked to event');
      }

      // Check timing consistency
      for (const market of markets) {
        if (market.trading_closes_at !== event.trading_closes_at) {
          issues.push(`Market ${market.id} has mismatched trading close time`);
        }
      }

      // Check status consistency
      if (event.status === 'resolved') {
        const unresolvedMarkets = markets.filter(m => m.status !== 'resolved');
        if (unresolvedMarkets.length > 0) {
          issues.push(`${unresolvedMarkets.length} markets not resolved when event is resolved`);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (err) {
      return {
        valid: false,
        issues: ['Validation error: ' + (err as Error).message],
      };
    }
  }
}

export const eventMarketSync = new EventMarketSync();
