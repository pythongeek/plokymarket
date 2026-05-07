// @ts-nocheck
/**
 * Event Creation API
 * Creates events and markets with proper error handling and workflow integration
 * Uses direct database inserts (RPC function removed in migration 139 cleanup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { QStashClient } from '@/lib/upstash/workflows';
import { MarketService } from '@/lib/services/MarketService';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 30;


// Generate unique slug
function generateSlug(title: string): string {
  const bnMap: Record<string, string> = {
    'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
    'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
    'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
    'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
    'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
    'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
    'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };

  let slug = title.toLowerCase().trim();

  // First, transliterate Bangla to Latin BEFORE removing non-ASCII
  // This ensures Bangla characters get converted to their Latin equivalents
  for (const [bn, en] of Object.entries(bnMap)) {
    slug = slug.split(bn).join(en);
  }

  // Now remove any remaining non-ASCII characters (should be few/none after transliteration)
  slug = slug
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = nanoid(6);
  // If slug is empty or too short, use a transliteration of the title or fallback
  if (slug.length < 2) {
    // Try to get some meaningful slug from the title bytes
    slug = 'event-' + Array.from(title).slice(0, 5).join('');
  }
  return slug.length > 5 ? `${slug}-${timestamp}` : `event-${timestamp}`;
}

// Validate request body
function validateEventData(body: any): { valid: boolean; error?: string; data?: any } {
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 5) {
    return { valid: false, error: 'Title is required and must be at least 5 characters' };
  }

  if (!body.question || typeof body.question !== 'string' || body.question.trim().length < 5) {
    return { valid: false, error: 'Question is required and must be at least 5 characters' };
  }

  if (!body.category || typeof body.category !== 'string') {
    return { valid: false, error: 'Category is required' };
  }

  if (!body.trading_closes_at) {
    return { valid: false, error: 'Trading close date is required' };
  }

  const tradingClosesAt = new Date(body.trading_closes_at);
  if (isNaN(tradingClosesAt.getTime())) {
    return { valid: false, error: 'Invalid trading close date' };
  }

  // Validate resolution method
  const validMethods = ['manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'community_vote', 'hybrid'];
  const resolutionMethod = body.resolution_method || 'manual_admin';
  if (!validMethods.includes(resolutionMethod)) {
    return { valid: false, error: `Invalid resolution method. Must be one of: ${validMethods.join(', ')}` };
  }

  return {
    valid: true,
    data: {
      title: body.title.trim(),
      question: body.question.trim(),
      description: body.description?.trim() || null,
      category: body.category.toLowerCase(),
      subcategory: body.subcategory?.trim() || null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      image_url: body.image_url?.trim() || null,
      trading_closes_at: tradingClosesAt.toISOString(),
      resolution_delay_hours: parseInt(body.resolution_delay_hours) || 24,
      resolution_method: resolutionMethod,
      answer1: body.answer1?.trim() || 'হ্যাঁ (Yes)',
      answer2: body.answer2?.trim() || 'না (No)',
      initial_liquidity: parseInt(body.initial_liquidity) || 10000,
      is_featured: !!body.is_featured,
      slug: generateSlug(body.title),
    }
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // 2. Check admin status
    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
      console.error('[Event Create] User not admin:', userId);
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[Event Create] JSON parse error:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('[Event Create] Request body:', JSON.stringify(body, null, 2));

    // Extract event_data from body - frontend sends { event_data: {...}, resolution_config: {...} }
    const eventData = body.event_data || body;

    const validation = validateEventData(eventData);
    if (!validation.valid) {
      console.error('[Event Create] Validation error:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = eventData;

    // 4. Create Event using direct inserts (RPC function removed)
    console.log('[Event Create] Creating event with title:', data.title);

    // Insert Event
    const eventResult = await pool.query(
      `INSERT INTO events (
        title, name, name_en, slug, question, description, category, subcategory,
        status, starts_at, trading_opens_at, trading_closes_at, event_date,
        resolution_method, resolution_delay_hours, initial_liquidity, current_liquidity,
        is_featured, answer_type, answer1, answer2, created_by, image_url, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *`,
      [
        data.title,
        data.title,
        data.title,
        data.slug,
        data.question,
        data.description,
        data.category,
        data.subcategory,
        'active',
        new Date().toISOString(),
        new Date().toISOString(),
        data.trading_closes_at,
        data.trading_closes_at,
        data.resolution_method,
        data.resolution_delay_hours,
        data.initial_liquidity,
        data.initial_liquidity,
        data.is_featured,
        'binary',
        data.answer1,
        data.answer2,
        userId,
        data.image_url,
        data.tags
      ]
    );

    if (eventResult.error) {
      console.error('[Event Create] Event insert error:', eventResult.error);
      return NextResponse.json(
        { success: false, error: `Failed to create event: ${eventResult.error.message}` },
        { status: 500 }
      );
    }

    const event = eventResult.rows[0];
    const eventId = event.id;
    console.log('[Event Create] Event created:', eventId);

    // 5. Create Market SYNCHRONOUSLY (not async) to ensure reliability
    // We create the market immediately in the same request to guarantee it exists
    console.log('[Event Create] Creating market for event:', eventId);

    // Only use columns that exist in the markets table
    const marketResult = await pool.query(
      `INSERT INTO markets (
        event_id, name, question, description, category, subcategory,
        trading_closes_at, event_date, initial_liquidity, liquidity, status, slug,
        answer_type, answer1, answer2, is_featured, created_by, image_url, total_volume
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        eventId,
        data.title,
        data.question,
        data.description || null,
        data.category,
        data.subcategory || null,
        data.trading_closes_at,
        data.trading_closes_at,
        data.initial_liquidity,
        data.initial_liquidity,
        'active',
        `${data.slug}-market`,
        'binary',
        data.answer1,
        data.answer2,
        data.is_featured || false,
        userId,
        data.image_url || null,
        0
      ]
    );

    if (marketResult.error) {
      console.error('[Event Create] Market insert error:', marketResult.error);
      // Don't fail the whole request - event is already created
      // Return success but with warning
      return NextResponse.json({
        success: true,
        warning: 'Event created but market creation failed. Please create market manually.',
        event_id: eventId,
        market_id: null,
        slug: data.slug,
        title: data.title,
        execution_time_ms: Date.now() - startTime,
      });
    }

    const market = marketResult.rows[0];
    const marketId = market.id;
    console.log('[Event Create] Market created:', marketId);

    // 6. Update event with market_id
    await pool.query(
      'UPDATE events SET market_id = $1 WHERE id = $2',
      [marketId, eventId]
    );

    // 7. Create outcomes in the outcomes table
    try {
      const outcomes = [
        {
          market_id: marketId,
          label: 'Yes',
          label_bn: data.answer1 || 'হ্যাঁ (Yes)',
          current_price: 0.5,
          display_order: 0,
        },
        {
          market_id: marketId,
          label: 'No',
          label_bn: data.answer2 || 'না (No)',
          current_price: 0.5,
          display_order: 1,
        }
      ];

      const outcomesResult = await pool.query(
        `INSERT INTO outcomes (market_id, label, label_bn, current_price, display_order) 
         VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)`,
        [
          marketId, 'Yes', data.answer1 || 'হ্যাঁ (Yes)', 0.5, 0,
          marketId, 'No', data.answer2 || 'না (No)', 0.5, 1
        ]
      );

      if (outcomesResult.error) {
        console.warn('[Event Create] Outcomes creation error:', outcomesResult.error.message);
      } else {
        console.log('[Event Create] Outcomes created for market:', marketId);
      }
    } catch (outcomesError: any) {
      console.warn('[Event Create] Outcomes creation failed:', outcomesError.message);
    }

    // 8. Seed initial orderbook for the market
    // Ensure outcome values are explicitly uppercase to avoid enum case issues
    const ensureUpperCase = (val: string) => val.toUpperCase() as 'YES' | 'NO';
    try {
      const seedOrders = [
        {
          market_id: marketId,
          user_id: userId,
          order_type: 'limit',
          side: 'buy',
          outcome: ensureUpperCase('YES'),
          price: 0.48,
          quantity: Math.floor(data.initial_liquidity / 2 / 0.48),
          status: 'open',
          filled_quantity: 0,
        },
        {
          market_id: marketId,
          user_id: userId,
          order_type: 'limit',
          side: 'buy',
          outcome: ensureUpperCase('NO'),
          price: 0.48,
          quantity: Math.floor(data.initial_liquidity / 2 / 0.48),
          status: 'open',
          filled_quantity: 0,
        }
      ];

      const seedResult = await pool.query(
        `INSERT INTO orders (market_id, user_id, order_type, side, outcome, price, quantity, status, filled_quantity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9), ($10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          marketId, userId, 'limit', 'buy', ensureUpperCase('YES'), 0.48, Math.floor(data.initial_liquidity / 2 / 0.48), 'open', 0,
          marketId, userId, 'limit', 'buy', ensureUpperCase('NO'), 0.48, Math.floor(data.initial_liquidity / 2 / 0.48), 'open', 0
        ]
      );

      if (seedResult.error) {
        console.warn('[Event Create] Orderbook seeding error:', seedResult.error.message);
      } else {
        console.log('[Event Create] Orderbook seeded with initial liquidity');
      }
    } catch (seedError: any) {
      console.warn('[Event Create] Orderbook seeding failed:', seedError.message);
    }

    // 9. Also trigger async workflow for any additional processing (non-critical)
    if (process.env.QSTASH_TOKEN) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        const qstashClient = new QStashClient({ token: process.env.QSTASH_TOKEN });
        await qstashClient.publishJSON({
          url: `${baseUrl}/api/workflows/event-processor`,
          body: { event_id: eventId, market_id: marketId, action: 'post_create' },
          retries: 2
        });
      } catch (workflowError: any) {
        console.warn('[Event Create] Async workflow trigger failed:', workflowError.message);
      }
    }

    // 9. Return success response
    console.log('[Event Create] Success! Event:', eventId, 'Market:', marketId);
    return NextResponse.json({
      success: true,
      message: 'Event and market created successfully',
      event_id: eventId,
      market_id: marketId,
      slug: data.slug,
      title: data.title,
      execution_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('[Event Create] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        execution_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
