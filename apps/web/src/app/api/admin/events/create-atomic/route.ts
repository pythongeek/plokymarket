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
    const { data: userData, error: userError } = await (supabase
      .from('user_profiles')
      .select('is_admin, can_create_events')
      .eq('id', user.id)
      .single() as any);

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
    console.log('[Create Event] Received body:', JSON.stringify(body, null, 2));
    
    const { event_data, markets_data, resolution_config } = body;

    if (!event_data?.title) {
      console.error('[Create Event] Missing title:', event_data);
      return NextResponse.json(
        { error: 'Bad Request', message: 'Event title is required', received: body },
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
    const { data: slugExists } = await supabase
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
    // STEP 5: Prepare Event Data for RPC (using create_event_complete)
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
      resolution_delay_hours: event_data.resolution_delay_hours || 24,
      resolution_method: event_data.resolution_method === 'MANUAL' ? 'manual_admin' : 
                        event_data.resolution_method === 'AI_ORACLE' ? 'ai_oracle' :
                        event_data.resolution_method === 'HYBRID' ? 'hybrid' :
                        (event_data.resolution_method || 'manual_admin').toLowerCase(),
      resolution_source: event_data.resolution_source || '',
      answer_type: 'binary',
      answer1: 'হ্যাঁ (Yes)',
      answer2: 'না (No)',
      status: 'active',
      is_featured: event_data.is_featured || false,
      initial_liquidity: event_data.initial_liquidity || 1000,
      ai_keywords: event_data.ai_keywords || [],
      ai_sources: event_data.ai_sources || [],
      ai_confidence_threshold: event_data.ai_confidence_threshold || 85,
    };

    // ============================================================================
    // STEP 6: Execute Atomic Transaction via RPC (create_event_complete)
    // ============================================================================
    console.log('[Create Event] Executing atomic transaction with create_event_complete...');

    const { data: result, error: rpcError } = await (supabase as any).rpc(
      'create_event_complete',
      {
        p_event_data: eventDataForRPC,
        p_admin_id: user.id,
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
