/**
 * Event Creation API
 * Creates events and markets with proper error handling and workflow integration
 * Uses direct database inserts (RPC function removed in migration 139 cleanup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { Client as QStashClient } from '@upstash/qstash';
import { MarketService } from '@/lib/services/MarketService';

export const runtime = 'edge';
export const maxDuration = 30;

// Initialize Supabase client
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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
  const supabase = getSupabase();

  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Event Create] No authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Bearer token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[Event Create] Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // 2. Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Event Create] Profile fetch error:', profileError);
    }

    if (!profile?.is_admin && !profile?.is_super_admin) {
      console.error('[Event Create] User not admin:', user.id);
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
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: data.title,
        name: data.title,
        name_en: data.title,
        slug: data.slug,
        question: data.question,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        status: 'active',
        starts_at: new Date().toISOString(),
        trading_opens_at: new Date().toISOString(),
        trading_closes_at: data.trading_closes_at,
        event_date: data.trading_closes_at,
        resolution_method: data.resolution_method,
        resolution_delay_hours: data.resolution_delay_hours,
        initial_liquidity: data.initial_liquidity,
        current_liquidity: data.initial_liquidity,
        is_featured: data.is_featured,
        answer_type: 'binary',
        answer1: data.answer1,
        answer2: data.answer2,
        created_by: user.id,
        image_url: data.image_url,
        tags: data.tags,
      })
      .select()
      .single();

    if (eventError) {
      console.error('[Event Create] Event insert error:', eventError);
      return NextResponse.json(
        { success: false, error: `Failed to create event: ${eventError.message}` },
        { status: 500 }
      );
    }

    const eventId = event.id;
    console.log('[Event Create] Event created:', eventId);

    // 5. Create Market SYNCHRONOUSLY (not async) to ensure reliability
    // We create the market immediately in the same request to guarantee it exists
    console.log('[Event Create] Creating market for event:', eventId);

    // Only use columns that exist in the markets table
    const marketInsertData = {
      event_id: eventId,
      name: data.title,
      question: data.question,
      description: data.description || null,
      category: data.category,
      subcategory: data.subcategory || null,
      trading_closes_at: data.trading_closes_at,
      event_date: data.trading_closes_at,  // Required field
      initial_liquidity: data.initial_liquidity,
      liquidity: data.initial_liquidity,
      status: 'active',
      slug: `${data.slug}-market`,
      answer_type: 'binary',
      answer1: data.answer1,
      answer2: data.answer2,
      is_featured: data.is_featured || false,
      created_by: user.id,
      image_url: data.image_url || null,
      total_volume: 0,
    };

    const { data: market, error: marketError } = await supabase
      .from('markets')
      .insert(marketInsertData)
      .select()
      .single();

    if (marketError) {
      console.error('[Event Create] Market insert error:', marketError);
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

    const marketId = market.id;
    console.log('[Event Create] Market created:', marketId);

    // 6. Update event with market_id
    await supabase
      .from('events')
      .update({ market_id: marketId })
      .eq('id', eventId);

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

      const { error: outcomesError } = await supabase.from('outcomes').insert(outcomes);
      if (outcomesError) {
        console.warn('[Event Create] Outcomes creation error:', outcomesError.message);
      } else {
        console.log('[Event Create] Outcomes created for market:', marketId);
      }
    } catch (outcomesError: any) {
      console.warn('[Event Create] Outcomes creation failed:', outcomesError.message);
    }

    // 8. Seed initial orderbook for the market
    try {
      const seedOrders = [
        {
          market_id: marketId,
          user_id: user.id,
          order_type: 'limit',
          side: 'buy',
          outcome: 'YES',
          price: 0.48,
          quantity: Math.floor(data.initial_liquidity / 2 / 0.48),
          status: 'open',
          filled_quantity: 0,
        },
        {
          market_id: marketId,
          user_id: user.id,
          order_type: 'limit',
          side: 'buy',
          outcome: 'NO',
          price: 0.48,
          quantity: Math.floor(data.initial_liquidity / 2 / 0.48),
          status: 'open',
          filled_quantity: 0,
        }
      ];

      const { error: seedError } = await supabase.from('orders').insert(seedOrders);
      if (seedError) {
        console.warn('[Event Create] Orderbook seeding error:', seedError.message);
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
