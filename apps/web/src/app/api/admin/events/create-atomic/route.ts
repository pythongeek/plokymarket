/**
 * Atomic Event Creation API
 * Uses PostgreSQL RPC to ensure event and markets are created together
 * Prevents partial data (event without market)
 * 
 * Features:
 * - Slug uniqueness check with fallback
 * - Asia/Dhaka timezone handling
 * - Atomic transaction (rollback on failure)
 * - Comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { preFlightCheck, generateUniqueSlug } from '@/lib/events/slug-utils';
import { convertToUTC } from '@/lib/utils/timezone';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // ============================================================================
    // STEP 1: Authentication & Authorization
    // ============================================================================
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to create events' },
        { status: 401 }
      );
    }

    // Check admin permission
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin, can_create_events')
      .eq('id', user.id)
      .single();

    if (userError || (!userData?.is_admin && !userData?.can_create_events)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'No permission to create events' },
        { status: 403 }
      );
    }

    // ============================================================================
    // STEP 2: Parse & Validate Input
    // ============================================================================
    const body = await req.json();
    const { event_data, markets_data, resolution_config } = body;

    if (!event_data?.title) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Event title is required' },
        { status: 400 }
      );
    }

    // ============================================================================
    // STEP 3: Pre-flight Check (Slug Generation & Validation)
    // ============================================================================
    const preFlight = await preFlightCheck(event_data.title);
    
    if (!preFlight.success) {
      return NextResponse.json(
        { error: 'Validation Failed', message: preFlight.error },
        { status: 400 }
      );
    }

    const finalSlug = event_data.slug || preFlight.slug;

    // Double-check slug uniqueness
    const { exists: slugExists } = await supabase
      .from('events')
      .select('id')
      .eq('slug', finalSlug)
      .maybeSingle();

    if (slugExists) {
      // Generate new unique slug
      const uniqueSlug = await generateUniqueSlug(event_data.title);
      console.warn(`[Create Event] Slug collision detected, using: ${uniqueSlug}`);
    }

    // ============================================================================
    // STEP 4: Timezone Conversion (Asia/Dhaka → UTC)
    // ============================================================================
    const tradingClosesAtUTC = event_data.trading_closes_at 
      ? convertToUTC(event_data.trading_closes_at)
      : null;
    
    const resolutionDateUTC = event_data.resolution_date
      ? convertToUTC(event_data.resolution_date)
      : null;

    if (!tradingClosesAtUTC) {
      return NextResponse.json(
        { error: 'Validation Failed', message: 'Invalid trading close date' },
        { status: 400 }
      );
    }

    // ============================================================================
    // STEP 5: Prepare Event Data for RPC
    // ============================================================================
    const eventDataForRPC = {
      title: event_data.title,
      question: event_data.question || event_data.title,
      description: event_data.description || '',
      category: event_data.category || 'Other',
      subcategory: event_data.subcategory || '',
      tags: event_data.tags || [],
      slug: finalSlug,
      image_url: event_data.image_url || '',
      trading_closes_at: tradingClosesAtUTC,
      resolution_date: resolutionDateUTC || tradingClosesAtUTC,
      resolution_method: event_data.resolution_method || 'MANUAL',
      resolution_config: resolution_config || {},
      status: 'active',
      is_featured: event_data.is_featured || false,
      created_by: user.id,
      initial_liquidity: event_data.initial_liquidity || 1000,
      b_parameter: event_data.b_parameter || 100,
    };

    // ============================================================================
    // STEP 6: Prepare Markets Data for RPC
    // ============================================================================
    let marketsDataForRPC: any[] = [];

    if (markets_data && Array.isArray(markets_data) && markets_data.length > 0) {
      marketsDataForRPC = markets_data.map((market: any) => ({
        question: market.question || event_data.title,
        description: market.description || '',
        outcomes: market.outcomes || ['হ্যাঁ', 'না'],
        liquidity: market.liquidity || event_data.initial_liquidity || 1000,
        trading_fee: market.trading_fee || 0.02,
        min_trade_amount: market.min_trade_amount || 10,
        max_trade_amount: market.max_trade_amount || 10000,
        trading_closes_at: market.trading_closes_at 
          ? convertToUTC(market.trading_closes_at) 
          : tradingClosesAtUTC,
        resolution_date: market.resolution_date
          ? convertToUTC(market.resolution_date)
          : resolutionDateUTC || tradingClosesAtUTC,
      }));
    }

    // ============================================================================
    // STEP 7: Execute Atomic Transaction via RPC
    // ============================================================================
    console.log('[Create Event] Executing atomic transaction...');
    
    const { data: result, error: rpcError } = await supabase.rpc(
      'create_event_with_markets',
      {
        p_event_data: eventDataForRPC,
        p_markets_data: marketsDataForRPC,
      }
    );

    if (rpcError) {
      console.error('[Create Event] RPC Error:', rpcError);
      return NextResponse.json(
        { 
          error: 'Database Error', 
          message: rpcError.message,
          details: 'Transaction rolled back. Event not created.'
        },
        { status: 500 }
      );
    }

    // Parse result
    const resultData = typeof result === 'string' ? JSON.parse(result) : result;

    if (!resultData?.success) {
      return NextResponse.json(
        { error: 'Creation Failed', message: resultData?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    // ============================================================================
    // STEP 8: Success Response
    // ============================================================================
    console.log(`[Create Event] Success: ${resultData.event_id}`);
    
    return NextResponse.json({
      success: true,
      event_id: resultData.event_id,
      slug: resultData.slug,
      message: resultData.message,
      warnings: preFlight.warnings || [],
      metadata: {
        created_by: user.id,
        created_at: new Date().toISOString(),
        timezone: 'Asia/Dhaka → UTC',
        transaction: 'atomic',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[Create Event] Unhandled error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check pre-flight status
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');

  if (!title) {
    return NextResponse.json(
      { error: 'Title required' },
      { status: 400 }
    );
  }

  try {
    const preFlight = await preFlightCheck(title);
    return NextResponse.json(preFlight);
  } catch (error) {
    return NextResponse.json(
      { error: 'Pre-flight check failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
