/**
 * Event Creation API
 * Creates events and markets with proper error handling and workflow integration
 * Replaces the RPC-based approach with direct database operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { Client as QStashClient } from '@upstash/qstash';

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
  for (const [bn, en] of Object.entries(bnMap)) {
    slug = slug.split(bn).join(en);
  }

  slug = slug
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const timestamp = nanoid(6);
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

    const validation = validateEventData(body);
    if (!validation.valid) {
      console.error('[Event Create] Validation error:', validation.error);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data!;

    // 4. Create Event using existing RPC function
    console.log('[Event Create] Calling create_event_complete RPC with title:', data.title);
    
    const { data: result, error: rpcError } = await supabase.rpc('create_event_complete', {
      p_event_data: {
        title: data.title,
        question: data.question,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        trading_closes_at: data.trading_closes_at,
        resolution_method: data.resolution_method,
        initial_liquidity: data.initial_liquidity,
        is_featured: data.is_featured,
        image_url: data.image_url,
        tags: data.tags,
      },
      p_admin_id: user.id,
    });

    if (rpcError) {
      console.error('[Event Create] RPC error:', rpcError);
      return NextResponse.json(
        { success: false, error: `Failed to create event: ${rpcError.message}`, details: rpcError },
        { status: 500 }
      );
    }

    // Parse result
    const eventResult = typeof result === 'string' ? JSON.parse(result) : result;
    
    if (!eventResult.success) {
      console.error('[Event Create] RPC returned error:', eventResult.error);
      return NextResponse.json(
        { success: false, error: eventResult.error || 'Event creation failed' },
        { status: 500 }
      );
    }

    const eventId = eventResult.event_id;
    const marketId = eventResult.market_id;
    const slug = eventResult.slug;

    console.log('[Event Create] Event created:', eventId, 'Market:', marketId);

    // 7. Log admin action (non-critical)
    try {
      await supabase.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_action_type: 'create_event',
        p_resource_type: 'event',
        p_resource_id: event.id,
        p_new_values: {
          title: data.title,
          category: data.category,
          market_id: market.id,
        },
        p_reason: 'Event created via admin panel',
      });
    } catch (logError: any) {
      console.warn('[Event Create] Admin log warning:', logError.message);
    }

    // 8. Trigger workflow (non-critical)
    if (process.env.QSTASH_TOKEN) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        const qstashClient = new QStashClient({ token: process.env.QSTASH_TOKEN });

        await qstashClient.publishJSON({
          url: `${baseUrl}/api/workflows/event-processor`,
          body: {
            event_id: event.id,
            market_id: market.id,
            action: 'post_create',
          }
        });
      } catch (workflowError: any) {
        console.warn('[Event Create] Workflow trigger warning:', workflowError.message);
      }
    }

    // 6. Return success response
    console.log('[Event Create] Success! Event:', eventId, 'Market:', marketId);
    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event_id: eventId,
      market_id: marketId,
      slug: slug,
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
