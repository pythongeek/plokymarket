/**
 * Create Event from AI Suggestion
 * Converts AI suggestion to actual event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabase();

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { suggestion_id, workflow_id } = body;

    // Get suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from('ai_daily_topics')
      .select('*')
      .eq('id', suggestion_id)
      .single();

    if (suggestionError || !suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Create event
    const slug = generateSlug(suggestion.suggested_title);
    
    const { data: event, error: eventError } = await supabase
      .from('markets')
      .insert({
        question: suggestion.suggested_question,
        description: suggestion.suggested_description,
        category: suggestion.suggested_category,
        subcategory: suggestion.suggested_subcategory,
        tags: suggestion.suggested_tags,
        trading_closes_at: suggestion.suggested_trading_end,
        initial_liquidity: 1000,
        liquidity: 1000,
        answer_type: 'binary',
        answer1: 'হ্যাঁ (Yes)',
        answer2: 'না (No)',
        status: 'pending',
        created_by: user.id,
        slug,
        is_featured: false
      })
      .select()
      .single();

    if (eventError) {
      throw new Error(`Event creation failed: ${eventError.message}`);
    }

    // Create resolution config
    await supabase
      .from('resolution_systems')
      .insert({
        event_id: event.id,
        primary_method: 'ai_oracle',
        ai_keywords: suggestion.suggested_tags,
        ai_sources: suggestion.source_urls || [],
        confidence_threshold: 85
      });

    // Update suggestion status
    await supabase
      .from('ai_daily_topics')
      .update({
        status: 'converted',
        market_id: event.id
      })
      .eq('id', suggestion_id);

    // Log action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action_type: 'create_event',
      p_resource_type: 'market',
      p_resource_id: event.id,
      p_new_values: {
        title: suggestion.suggested_title,
        from_ai: true,
        workflow_id
      },
      p_reason: 'Created from AI suggestion'
    });

    return NextResponse.json({
      success: true,
      event_id: event.id,
      message: 'ইভেন্ট সফলভাবে তৈরি হয়েছে',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Create from AI error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
