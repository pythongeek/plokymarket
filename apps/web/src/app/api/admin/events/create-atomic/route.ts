// @ts-nocheck
/**
 * Atomic Event Creation API
 * Uses PostgreSQL RPC to ensure event and market are created together
 * Prevents partial data (event without market)
 *
 * Features:
 * - Slug uniqueness check with fallback (handled in RPC)
 * - Asia/Dhaka timezone handling
 * - Atomic transaction (rollback on failure)
 * - Comprehensive error handling
 *
 * BUG FIX (Phase 1): Fixed two critical issues:
 * 1. `if (false)` block bypassed auth entirely — userId was undefined causing ReferenceError
 * 2. RPC returns jsonb column `create_event_complete`, not individual columns —
 *    was accessing resultData.event_id which was undefined
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { preFlightCheck, generateUniqueSlug } from '@/lib/events/slug-utils';
import { convertToUTC } from '@/lib/utils/timezone';


export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH ────────────────────────────────────────────────────────────────
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // ─── PERMISSION CHECK ────────────────────────────────────────────────────
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

    // ─── PARSE BODY ─────────────────────────────────────────────────────────
    const body = await req.json();
    console.log('[Create Event] Received body:', JSON.stringify(body, null, 2));

    const { event_data } = body;

    if (!event_data?.title) {
      console.error('[Create Event] Missing title:', event_data);
      return NextResponse.json(
        { error: 'Bad Request', message: 'Event title is required', received: body },
        { status: 400 }
      );
    }

    // ─── PRE-FLIGHT SLUG CHECK ───────────────────────────────────────────────
    const preFlight = await preFlightCheck(event_data.title);

    if (!preFlight.success) {
      return NextResponse.json(
        { error: 'Validation Failed', message: preFlight.error },
        { status: 400 }
      );
    }

    const finalSlug = event_data.slug || preFlight.slug;

    // Double-check slug uniqueness (RPC also checks, but we do it early)
    const slugCheck = await pool.query(
      'SELECT id FROM events WHERE slug = $1',
      [finalSlug]
    );

    if (slugCheck.rows.length > 0) {
      // Slug collision — generate unique one
      const uniqueSlug = await generateUniqueSlug(event_data.title);
      console.warn(`[Create Event] Slug collision detected, using: ${uniqueSlug}`);
      // Override the slug used in the event
      event_data.slug = uniqueSlug;
    } else {
      event_data.slug = finalSlug;
    }

    // ─── TIMEZONE CONVERSION ─────────────────────────────────────────────────
    const tradingClosesAtUTC = event_data.trading_closes_at
      ? convertToUTC(event_data.trading_closes_at)
      : null;

    if (!tradingClosesAtUTC) {
      return NextResponse.json(
        { error: 'Validation Failed', message: 'Invalid or missing trading_closes_at date' },
        { status: 400 }
      );
    }

    // ─── BUILD EVENT DATA FOR RPC ────────────────────────────────────────────
    const eventDataForRPC = {
      title: event_data.title,
      question: event_data.question || event_data.title,
      description: event_data.description || '',
      category: event_data.category || 'Other',
      subcategory: event_data.subcategory || '',
      tags: event_data.tags || [],
      slug: event_data.slug,
      image_url: event_data.image_url || '',
      trading_closes_at: tradingClosesAtUTC,
      resolution_delay_hours: event_data.resolution_delay_hours || 24,
      // Normalize resolution_method to match DB CHECK constraint
      resolution_method: normalizeResolutionMethod(event_data.resolution_method),
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

    console.log('[Create Event] Calling create_event_complete RPC...');
    console.log('[Create Event] eventDataForRPC:', JSON.stringify(eventDataForRPC, null, 2));

    // ─── CALL RPC ───────────────────────────────────────────────────────────
    // BUG FIX #2: The RPC returns jsonb — access result.rows[0].create_event_complete
    const rpcResult = await pool.query(
      'SELECT create_event_complete($1, $2) AS result',
      [JSON.stringify(eventDataForRPC), userId]
    );

    const rpcOutput = rpcResult.rows[0]?.result;

    if (!rpcOutput) {
      console.error('[Create Event] RPC returned no output');
      return NextResponse.json(
        { error: 'Creation Failed', message: 'RPC returned empty result' },
        { status: 500 }
      );
    }

    console.log('[Create Event] RPC result:', JSON.stringify(rpcOutput, null, 2));

    // The RPC returns { success, event_id, slug, message }
    if (!rpcOutput.success) {
      return NextResponse.json(
        { error: 'Creation Failed', message: rpcOutput.message || 'Unknown RPC error' },
        { status: 500 }
      );
    }

    console.log(`[Create Event] Success: event_id=${rpcOutput.event_id}, slug=${rpcOutput.slug}`);

    // Get the created event to return its linked market_id
    const eventResult = await pool.query(
      'SELECT id, market_id, slug FROM events WHERE id = $1',
      [rpcOutput.event_id]
    );
    const event = eventResult.rows[0];

    return NextResponse.json({
      success: true,
      event_id: rpcOutput.event_id,
      market_id: event?.market_id || null,
      slug: rpcOutput.slug,
      message: rpcOutput.message,
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
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ─── HELPER: Normalize resolution_method to DB CHECK constraint values ───
function normalizeResolutionMethod(method: string | undefined): string {
  if (!method) return 'manual_admin';

  const m = method.toUpperCase();
  if (m === 'MANUAL' || m === 'MANUAL_ADMIN') return 'manual_admin';
  if (m === 'AI' || m === 'AI_ORACLE' || m === 'AI_CONSENSUS') return 'ai_oracle';
  if (m === 'UMA') return 'uma_oracle';
  if (m === 'CHAINLINK') return 'chainlink';
  if (m === 'HYBRID' || m === 'MULTI') return 'hybrid';
  if (m === 'EXPERT' || m === 'EXPERT_PANEL') return 'expert_panel';
  if (m === 'EXTERNAL' || m === 'EXTERNAL_API') return 'external_api';
  if (m === 'COMMUNITY' || m === 'COMMUNITY_VOTE') return 'community_vote';

  // Default: if it looks like a DB value, use it; else manual_admin
  const validMethods = [
    'manual_admin', 'ai_oracle', 'expert_panel',
    'external_api', 'community_vote', 'hybrid'
  ];
  return validMethods.includes(m.toLowerCase()) ? m.toLowerCase() : 'manual_admin';
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
