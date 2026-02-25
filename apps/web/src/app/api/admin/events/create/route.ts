/**
 * Create Event API
 * Uses cookie-based auth + EventService & MarketService
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { eventService } from '@/lib/services/EventService';
import { marketService } from '@/lib/services/MarketService';

// Extend Vercel serverless function timeout (default is 10s on Hobby)
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const debugLogs: string[] = [];

  const logDebug = (msg: string, data?: any) => {
    const logMsg = data ? `${msg}: ${JSON.stringify(data)}` : msg;
    debugLogs.push(logMsg);
    console.log(`🔥 [API DEBUG] ${logMsg}`);
  };

  try {
    logDebug('API called');

    // 1. Verify Authentication via cookie-based session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    logDebug('Auth result', { userId: user?.id, hasUser: !!user, authError: authError?.message });

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized — please login', debug: debugLogs }, { status: 401 });
    }

    // FAST admin check: email whitelist first, DB fallback second
    const adminEmails = ['admin@plokymarket.bd', 'admin@polymarket.bd'];
    let isAdmin = adminEmails.includes((user.email || '').toLowerCase());

    if (!isAdmin) {
      // Single combined check — try user_profiles first
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      isAdmin = !!(userProfile as any)?.is_admin;
    }

    logDebug('Admin check', { isAdmin, userId: user.id });

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required', debug: debugLogs }, { status: 403 });
    }

    // 2. Parse & Normalize Body
    const body = await request.json();
    logDebug('Raw request body keys', Object.keys(body));

    // Support both nested { event_data, resolution_config } and flat payload formats
    const eventData = body.event_data || body;
    const resolutionConfig = body.resolution_config || body.resolution_config || eventData.resolution_config || {};

    logDebug('Parsed eventData', {
      hasTitle: !!eventData.title,
      hasQuestion: !!eventData.question,
      category: eventData.category,
      status: eventData.status
    });

    // 3. Build sanitized event payload (only valid DB columns)
    const now = new Date().toISOString();
    const tradingClosesAt = eventData.trading_closes_at || eventData.tradingClosesAt || eventData.resolution_date;
    const endsAt = eventData.ends_at || eventData.endsAt || tradingClosesAt;
    const title = eventData.name || eventData.title || eventData.question || 'Untitled Event';

    // Convert resolution_delay_hours to resolution_delay (in minutes) for DB
    const resolutionDelayHours = eventData.resolution_delay_hours || eventData.resolutionDelayHours || 24;
    const resolutionDelayMinutes = eventData.resolution_delay != null
      ? eventData.resolution_delay
      : resolutionDelayHours * 60;


    const eventPayload: Record<string, any> = {
      title,
      question: eventData.question || eventData.name || title,
      description: eventData.description || '',
      slug: eventData.slug || undefined, // EventService will auto-generate if missing
      category: eventData.category || 'general',
      subcategory: eventData.subcategory || null,
      tags: eventData.tags || [],
      starts_at: eventData.starts_at || now,
      ends_at: endsAt || null,
      trading_opens_at: eventData.trading_opens_at || now,
      trading_closes_at: tradingClosesAt || null,
      image_url: eventData.image_url || eventData.imageUrl || null,
      status: eventData.status || 'active',
      is_featured: eventData.is_featured || eventData.isFeatured || false,
      resolution_source: resolutionConfig.source_urls?.[0] || eventData.resolution_source || null,
      resolution_method: resolutionConfig.primary_method || resolutionConfig.method || eventData.resolution_method || 'manual_admin',
      resolution_delay: resolutionDelayMinutes,
      ai_keywords: resolutionConfig.ai_keywords || eventData.ai_keywords || eventData.aiKeywords || [],
      ai_sources: resolutionConfig.ai_sources || eventData.ai_sources || eventData.aiSources || [],
      ai_confidence_threshold: resolutionConfig.confidence_threshold || eventData.ai_confidence_threshold || eventData.confidenceThreshold || 85,
      initial_liquidity: eventData.initial_liquidity || eventData.initialLiquidity || 1000,
      answer1: eventData.answer1 || 'হ্যাঁ (YES)',
      answer2: eventData.answer2 || 'না (NO)',
      created_by: user.id
    };

    logDebug('Event payload prepared', {
      title: eventPayload.title,
      status: eventPayload.status,
      category: eventPayload.category,
      hasSlug: !!eventPayload.slug,
      tradingClosesAt: eventPayload.trading_closes_at
    });

    // 4. Create event via EventService
    let event;
    try {
      event = await eventService.createEvent(eventPayload);
      logDebug('Event created successfully', { eventId: event.id, slug: event.slug, status: event.status });
    } catch (eventError: any) {
      logDebug('Event creation failed', { error: eventError.message });
      throw eventError;
    }

    // 5. Create Linked Market via MarketService
    let marketId = null;
    try {
      const initialLiquidity = eventData.initial_liquidity || eventData.initialLiquidity || 100;

      const marketPayload = {
        question: event.question,
        description: event.description,
        category: event.category,
        status: 'active',
        trading_closes_at: tradingClosesAt,
        event_date: endsAt,
        creator_id: user.id,
        resolution_data: {
          resolution_config: resolutionConfig
        }
      };

      const market = await marketService.createMarketWithLiquidity(
        event.id,
        marketPayload as any,
        initialLiquidity
      );
      marketId = market.id;
      logDebug('Market created', { marketId });
    } catch (err: any) {
      console.warn('[API/CreateEvent] Market creation fallback:', err.message);
      logDebug('Market creation warning (non-fatal)', { error: err.message });
    }

    const response = {
      success: true,
      event_id: event.id,
      market_id: marketId,
      slug: event.slug,
      status: event.status,
      message: 'Event and Market created successfully.',
      execution_time_ms: Date.now() - startTime,
      debug: debugLogs
    };

    logDebug('API response', response);
    return NextResponse.json(response);

  } catch (error: any) {
    logDebug('CRITICAL ERROR', { message: error.message });
    console.error('CRITICAL: Event creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error',
      debug: debugLogs,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}
