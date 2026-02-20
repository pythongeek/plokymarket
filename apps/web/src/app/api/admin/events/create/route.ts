/**
 * Create Event API - Edge Function
 * Reimplemented for 094_reimplemented_events_markets schema
 * Bangladesh Context Focus
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Trigger Upstash Workflow for async processing
async function triggerWorkflow(eventId: string, config: any) {
  try {
    const workflowUrl = process.env.UPSTASH_WORKFLOW_URL;
    if (!workflowUrl) return false;

    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.UPSTASH_WORKFLOW_TOKEN}`
      },
      body: JSON.stringify({
        event_id: eventId,
        action: 'event_created',
        config,
        timestamp: new Date().toISOString()
      })
    });
    return response.ok;
  } catch (error) {
    console.error('Workflow trigger failed:', error);
    return false;
  }
}

// Send Telegram notification
async function sendNotification(eventName: string, eventId: string, adminName: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const message = `
🆕 <b>নতুন ইভেন্ট তৈরি হয়েছে</b>

📌 <b>${eventName}</b>
👤 <b>তৈরি করেছেন:</b> ${adminName}
⏰ <b>সময়:</b> ${new Date().toLocaleString('bn-BD')}

🔗 <a href="https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events/${eventId}">দেখুন</a>
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Notification failed:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabase();

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body - support both wrapped and flat formats
    const body = await request.json();
    const eventData = body.event_data || body;
    const resolutionConfig = body.resolution_config || {};

    // Normalize field names
    const title = eventData.title || eventData.name || eventData.question;
    const question = eventData.question || eventData.title;
    const tradingClosesAt = eventData.trading_closes_at || eventData.tradingClosesAt || eventData.endsAt || eventData.ends_at;

    // Validation
    if (!title || title.length < 5) {
      return NextResponse.json(
        { error: 'শিরোনাম কমপক্ষে ৫ অক্ষর হতে হবে', field: 'title' },
        { status: 400 }
      );
    }

    if (!question || question.length < 10) {
      return NextResponse.json(
        { error: 'প্রশ্ন কমপক্ষে ১০ অক্ষর হতে হবে', field: 'question' },
        { status: 400 }
      );
    }

    if (!tradingClosesAt) {
      return NextResponse.json(
        { error: 'ট্রেডিং শেষের তারিখ প্রয়োজন', field: 'trading_closes_at' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = eventData.slug ||
      title.toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 80) + '-' + Date.now().toString(36);

    // Build event payload for the events table
    const eventPayload: Record<string, any> = {
      title,
      slug,
      question,
      description: eventData.description || null,
      category: eventData.category || 'general',
      subcategory: eventData.subcategory || null,
      tags: eventData.tags || [],
      image_url: eventData.image_url || null,
      answer_type: eventData.answer_type || 'binary',
      answer1: eventData.answer1 || 'হ্যাঁ (Yes)',
      answer2: eventData.answer2 || 'না (No)',
      status: eventData.status || 'active',
      trading_closes_at: tradingClosesAt,
      ends_at: eventData.ends_at || tradingClosesAt,
      resolution_method: resolutionConfig.primary_method || eventData.resolution_method || 'manual_admin',
      resolution_delay: eventData.resolution_delay || 1440,
      resolution_source: eventData.resolution_source || resolutionConfig.resolution_source || null,
      initial_liquidity: eventData.initial_liquidity || eventData.initialLiquidity || 1000,
      current_liquidity: eventData.initial_liquidity || eventData.initialLiquidity || 1000,
      is_featured: eventData.is_featured || false,
      ai_keywords: resolutionConfig.ai_keywords || eventData.ai_keywords || [],
      ai_sources: resolutionConfig.ai_sources || eventData.ai_sources || [],
      ai_confidence_threshold: resolutionConfig.confidence_threshold || eventData.ai_confidence_threshold || 85,
      created_by: user.id
    };

    // Insert into events table
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventPayload)
      .select()
      .single();

    if (eventError) {
      console.error('Event creation error:', eventError);
      throw eventError;
    }

    // Also create a linked market for CLOB compatibility
    let marketId = null;
    try {
      const { data: market, error: marketError } = await supabase
        .from('markets')
        .insert({
          event_id: event.id,
          name: title,
          question: question,
          description: eventData.description || null,
          category: eventData.category || 'general',
          subcategory: eventData.subcategory || null,
          tags: eventData.tags || [],
          trading_closes_at: tradingClosesAt,
          event_date: tradingClosesAt,
          resolution_delay: eventPayload.resolution_delay,
          initial_liquidity: eventPayload.initial_liquidity,
          liquidity: eventPayload.initial_liquidity,
          status: 'active',
          slug: slug + '-market',
          answer_type: eventPayload.answer_type,
          answer1: eventPayload.answer1,
          answer2: eventPayload.answer2,
          is_featured: eventPayload.is_featured,
          image_url: eventPayload.image_url,
          created_by: user.id,
          creator_id: user.id
        })
        .select('id')
        .single();

      if (!marketError && market) {
        marketId = market.id;
      }
    } catch (err) {
      console.warn('Market creation fallback:', err);
    }

    // Create resolution config (graceful fallback)
    try {
      await supabase
        .from('resolution_systems')
        .insert({
          event_id: marketId || event.id,
          primary_method: eventPayload.resolution_method,
          ai_keywords: eventPayload.ai_keywords,
          ai_sources: eventPayload.ai_sources,
          confidence_threshold: eventPayload.ai_confidence_threshold,
          status: 'pending'
        });
    } catch (err) {
      console.warn('Resolution config creation skipped:', err);
    }

    // Non-blocking: Log admin action
    Promise.resolve(supabase.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action_type: 'create_event',
      p_resource_type: 'event',
      p_resource_id: event.id,
      p_new_values: {
        title,
        category: eventPayload.category,
        resolution_method: eventPayload.resolution_method
      },
      p_reason: 'Event creation via admin panel'
    })).catch(() => { });

    // Non-blocking: Trigger workflow
    triggerWorkflow(event.id, resolutionConfig).catch(() => { });

    // Non-blocking: Send notification
    sendNotification(title, event.id, profile.full_name || 'Admin').catch(() => { });

    return Response.json({
      success: true,
      event_id: event.id,
      market_id: marketId,
      slug: event.slug,
      message: 'Event created successfully',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('CRITICAL: Event creation error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return Response.json({
      success: false,
      error: error.message || 'Internal Server Error',
      details: error.details,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
}
