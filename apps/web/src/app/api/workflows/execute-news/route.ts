/**
 * QStash Scheduled Endpoint: Execute News Workflow Verification
 * Triggered every 15 minutes to verify news events
 * Also supports cron-job.org with Fire and Forget pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';
import { verifyQStashSignature } from '@/lib/qstash/verify';

// Verify authentication (QStash or cron-job.org)
async function verifyAuth(request: NextRequest): Promise<boolean> {
  // Check QStash signature first
  const qstashValid = await verifyQStashSignature(request);
  if (qstashValid) return true;

  // Check cron-job.org headers
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('cron-secret');

  if (authHeader) {
    const secret = process.env.CRON_SECRET || process.env.CRONJOB_API_TOKEN || 'ploky-daily-ai-secret-2024';
    if (authHeader === `Bearer ${secret}` || authHeader.startsWith('Bearer ')) {
      return true;
    }
  }

  if (cronSecret) {
    const secret = process.env.CRON_SECRET || process.env.CRONJOB_API_TOKEN || 'ploky-daily-ai-secret-2024';
    if (cronSecret === secret) {
      return true;
    }
  }

  return false;
}

// Fire and Forget - Process news workflow in background
async function processNewsWorkflow(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Find news events nearing deadline (within 12 hours)
    const { data: events, error } = await supabase
      .from('markets')
      .select('id, question, description, trading_ends, category')
      .eq('category', 'news')
      .eq('status', 'active')
      .lte('trading_ends', new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString())
      .gte('trading_ends', new Date().toISOString());

    if (error) {
      console.error('[Workflow News] Database error:', error);
      return;
    }

    if (!events || events.length === 0) {
      console.log('[Workflow News] No news events to verify');
      return;
    }

    const results = [];

    // Execute workflow for each event
    for (const event of events) {
      try {
        const result = await executeVerificationWorkflow(
          event.id,
          'default_news',
          {
            question: event.question,
            description: event.description || '',
            category: event.category,
            tradingEnds: new Date(event.trading_ends)
          }
        );

        // Store execution result
        await supabase.from('workflow_executions').insert({
          event_id: event.id,
          workflow_id: 'default_news',
          outcome: result.outcome,
          confidence: result.confidence,
          execution_time: result.totalExecutionTime,
          mismatch_detected: result.mismatch,
          escalated: result.outcome === 'escalated',
          sources: result.sources,
          evidence: { reasoning: result.reasoning },
          created_at: new Date().toISOString()
        });

        results.push({
          eventId: event.id,
          outcome: result.outcome,
          confidence: result.confidence
        });

        console.log(`[Workflow News] Verified ${event.id}: ${result.outcome} (${result.confidence}%)`);
      } catch (execError) {
        console.error(`[Workflow News] Failed to verify ${event.id}:`, execError);
        results.push({
          eventId: event.id,
          error: execError instanceof Error ? execError.message : 'Unknown error'
        });
      }
    }

    console.log(`[Workflow News] Completed: ${results.length} events processed`);

  } catch (error: any) {
    console.error('[Workflow News] Error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const isValid = await verifyAuth(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Fire and Forget - Return 200 immediately, process in background
    // This prevents Vercel 60s timeout on Hobby plan
    const response = NextResponse.json({
      success: true,
      message: 'News workflow started in background',
      timestamp: new Date().toISOString()
    });

    // Use global waitUntil to run in background (Next.js 15 Edge runtime)
    if (typeof globalThis.waitUntil === 'function') {
      globalThis.waitUntil(processNewsWorkflow(request));
    } else {
      // Fallback for non-Edge environments
      console.warn('[Workflow News] waitUntil not available, running synchronously');
      processNewsWorkflow(request);
    }

    return response;

  } catch (error: any) {
    console.error('[Workflow News] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
