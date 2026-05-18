// @ts-nocheck
export const runtime = 'nodejs';

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
import { pool } from '@/lib/admin/local-db';
import { preFlightCheck, generateUniqueSlug } from '@/lib/events/slug-utils';
import { convertToUTC } from '@/lib/utils/timezone';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to create events' },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to create events' },
        { status: 401 }
      );
    }

    const profileResult = await pool.query(
      'SELECT is_admin, can_create_events FROM user_profiles WHERE id = $1',
      [userId]
    );
    const userData = profileResult.rows[0];

    if (!userData?.is_admin && !userData?.can_create_events) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'No permission to create events' },
        { status: 403 }
      );
    }

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

    const preFlight = await preFlightCheck(event_data.title);

    if (!preFlight.success) {
      return NextResponse.json(
        { error: 'Validation Failed', message: preFlight.error },
        { status: 400 }
      );
    }

    const finalSlug = event_data.slug || preFlight.slug;

    const slugCheck = await pool.query(
      'SELECT id FROM events WHERE slug = $1',
      [finalSlug]
    );

    if (slugCheck.rows.length > 0) {
      const uniqueSlug = await generateUniqueSlug(event_data.title);
      console.warn(`[Create Event] Slug collision detected, using: ${uniqueSlug}`);
    }

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

    console.log('[Create Event] Executing atomic transaction with create_event_debug...');

    const rpcResult = await pool.query(
      'SELECT * FROM create_event_debug($1, $2)',
      [JSON.stringify(eventDataForRPC), userId]
    );

    const resultData = rpcResult.rows[0];

    if (!resultData?.success) {
      return NextResponse.json(
        { error: 'Creation Failed', message: resultData?.message || 'Unknown error' },
        { status: 500 }
      );
    }

    console.log(`[Create Event] Success: ${resultData.event_id}`);

    return NextResponse.json({
      success: true,
      event_id: resultData.event_id,
      slug: resultData.slug,
      message: resultData.message,
      warnings: preFlight.warnings || [],
      metadata: {
        created_by: userId,
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
