/**
 * Create Event API - Edge Function
 * Optimized for Vercel Free Tier + Upstash Workflow
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
    const response = await fetch(process.env.UPSTASH_WORKFLOW_URL!, {
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

    // Parse request body
    const body = await request.json();

    // Support both wrapped (frontend) and flat (direct API call) formats
    const event_data = body.event_data || {
      name: body.name || body.title,
      question: body.question,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      tags: body.tags,
      trading_closes_at: body.trading_closes_at || body.tradingClosesAt || body.endsAt || body.ends_at,
      resolution_delay_hours: body.resolution_delay_hours || 24,
      initial_liquidity: body.initial_liquidity || body.initialLiquidity || 1000,
      image_url: body.image_url,
      slug: body.slug,
      answer1: body.answer1 || 'Yes',
      answer2: body.answer2 || 'No',
      is_featured: body.is_featured || false
    };

    const resolution_config = body.resolution_config || {
      primary_method: body.primary_method || 'manual'
    };

    // Validation
    if (!event_data.name || event_data.name.length < 10) {
      return NextResponse.json(
        { error: 'শিরোনাম কমপক্ষে ১০ অক্ষর হতে হবে' },
        { status: 400 }
      );
    }

    if (!event_data.question || event_data.question.length < 20) {
      return NextResponse.json(
        { error: 'প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে' },
        { status: 400 }
      );
    }

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('markets')
      .insert({
        name: event_data.name,
        question: event_data.question,
        description: event_data.description,
        category: event_data.category,
        subcategory: event_data.subcategory,
        tags: event_data.tags,
        trading_closes_at: event_data.trading_closes_at,
        resolution_delay_hours: event_data.resolution_delay_hours,
        initial_liquidity: event_data.initial_liquidity,
        liquidity: event_data.initial_liquidity,
        image_url: event_data.image_url,
        status: 'active',
        created_by: user.id,
        slug: event_data.slug,
        answer_type: 'binary',
        answer1: event_data.answer1,
        answer2: event_data.answer2,
        is_featured: event_data.is_featured
      })
      .select()
      .single();

    if (eventError) {
      throw new Error(`Event creation failed: ${eventError.message}`);
    }

    // Map question to title for frontend compatibility
    if (event) {
      event.title = event.question;
    }

    // Create resolution config (graceful fallback if table doesn't exist)
    if (resolution_config) {
      try {
        const { error: configError } = await supabase
          .from('resolution_systems')
          .insert({
            event_id: event.id,
            primary_method: resolution_config.primary_method,
            ai_keywords: resolution_config.ai_keywords || [],
            ai_sources: resolution_config.ai_sources || [],
            confidence_threshold: resolution_config.confidence_threshold || 85,
            status: 'pending'
          });

        if (configError) {
          console.error('Resolution config error:', configError);
        }
      } catch (error) {
        console.warn('Resolution systems table may not exist, skipping config creation:', error);
      }
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action_type: 'create_event',
      p_resource_type: 'market',
      p_resource_id: event.id,
      p_new_values: {
        name: event_data.name,
        category: event_data.category,
        resolution_method: resolution_config?.primary_method
      },
      p_reason: 'Manual event creation'
    });

    // Trigger workflow for async processing
    await triggerWorkflow(event.id, resolution_config);

    // Send notification
    await sendNotification(event_data.name, event.id, profile.full_name || 'Admin');

    return NextResponse.json({
      success: true,
      event_id: event.id,
      message: 'ইভেন্ট সফলভাবে তৈরি হয়েছে',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'ইভেন্ট তৈরি করতে ব্যর্থ',
        execution_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
