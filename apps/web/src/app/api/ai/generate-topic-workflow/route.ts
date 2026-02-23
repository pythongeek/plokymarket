/**
 * AI Topic Generation Workflow - Edge Function
 * Triggers Upstash Workflow for async AI processing
 * Vercel Free Tier Optimized (< 10s execution)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase admin client is managed via createServiceClient

// Trigger Upstash Workflow
async function triggerWorkflow(payload: any): Promise<string | null> {
  try {
    const response = await fetch('https://qstash.upstash.io/v2/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
        'Upstash-Forward-Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/workflow-processor`,
        body: payload,
        retries: 3,
        delay: 0
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('QStash error:', error);
      return null;
    }

    const result = await response.json();
    return result.messageId || null;
  } catch (error) {
    console.error('Workflow trigger error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { topic, context, variations = 3, user_id } = body;

    // Validation
    if (!topic || topic.trim().length < 5) {
      return NextResponse.json(
        { error: 'টপিক কমপক্ষে ৫ অক্ষর হতে হবে' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Generate workflow ID
    const workflowId = `ai-topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create pending records in database
    const suggestions = [];
    for (let i = 0; i < variations; i++) {
      const { data, error } = await supabase
        .from('ai_daily_topics')
        .insert({
          suggested_title: 'Processing...',
          suggested_question: 'Processing...',
          suggested_description: 'AI is generating suggestions...',
          suggested_category: 'pending',
          status: 'pending',
          workflow_id: workflowId,
          ai_confidence: 0,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        suggestions.push(data.id);
      }
    }

    // Trigger Upstash Workflow
    const workflowPayload = {
      workflow_id: workflowId,
      topic: topic.trim(),
      context: context?.trim() || '',
      variations,
      user_id,
      suggestion_ids: suggestions,
      timestamp: new Date().toISOString()
    };

    const messageId = await triggerWorkflow(workflowPayload);

    if (!messageId) {
      // Cleanup on failure
      await supabase
        .from('ai_daily_topics')
        .delete()
        .in('id', suggestions);

      throw new Error('Workflow trigger failed');
    }

    return NextResponse.json({
      success: true,
      workflow_run_id: workflowId,
      message_id: messageId,
      suggestion_ids: suggestions,
      status: 'pending',
      message: 'AI সাজেশন জেনারেশন শুরু হয়েছে',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: error.message || 'সার্ভার এরর',
        execution_time_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
