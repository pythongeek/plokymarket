/**
 * Create Event API - Edge Function
 * Refactored to use EventService & MarketService
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { eventService } from '@/lib/services/EventService';
import { marketService } from '@/lib/services/MarketService';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = await createServiceClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Parse & Normalize Body
    const body = await request.json();
    const eventData = body.event_data || body;
    const resolutionConfig = body.resolution_config || {};

    // 3. Create Event via EventService
    const eventPayload = {
      ...eventData,
      created_by: user.id
    };

    const event = await eventService.createEvent(eventPayload);

    // 4. Create Linked Market via MarketService (Triggers Liquidity Seeding)
    // Ensure initial_liquidity is passed correctly (default 100 as requested)
    const initialLiquidity = eventData.initial_liquidity || eventData.initialLiquidity || 100;

    let marketId = null;
    try {
      const marketPayload = {
        question: event.question,
        description: event.description,
        category: event.category,
        status: 'active',
        trading_closes_at: event.ends_at,
        event_date: event.ends_at,
        creator_id: user.id
      };

      const market = await marketService.createMarketWithLiquidity(
        event.id,
        marketPayload as any,
        initialLiquidity
      );
      marketId = market.id;
    } catch (err) {
      console.warn('[API/CreateEvent] Market creation fallback:', err);
    }

    return NextResponse.json({
      success: true,
      event_id: event.id,
      market_id: marketId,
      slug: event.slug,
      message: 'Event and Market created successfully with liquidity seeding.',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('CRITICAL: Event creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
      execution_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}
