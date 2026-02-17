/**
 * QStash Scheduled Endpoint: Execute News Workflow Verification
 * Triggered every 15 minutes to verify news events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';
import { verifyQStashSignature } from '@/lib/qstash/verify';

export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

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
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No news events to verify',
        executed: 0 
      });
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

    return NextResponse.json({
      success: true,
      executed: results.length,
      results
    });

  } catch (error: any) {
    console.error('[Workflow News] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
