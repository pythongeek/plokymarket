/**
 * Batch Market Processing Cron Job
 * Processes 5-10 markets per run to stay within Vercel limits
 * Uses Upstash Workflow for long-running AI processing
 * 
 * SCHEDULE SETUP:
 * - Upstash QStash Console: https://console.upstash.com/qstash/schedules
 * - Or use the setup script: node scripts/setup-qstash-schedule.js
 * - Cron Expression: Every 15 minutes (0,15,30,45 * * * *)
 * - Target URL: https://your-app.vercel.app/api/cron/batch-markets
 * - Method: GET
 * - Headers: Authorization: Bearer QSTASH_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setLock, checkLock } from '@/lib/upstash/redis';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Verify QStash signature
async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  const signature = request.headers.get('upstash-signature');
  
  if (process.env.NODE_ENV === 'development' && !signature) {
    return true;
  }
  
  if (!signature) {
    console.warn('[Cron] Missing QStash signature');
    return false;
  }
  
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify QStash signature
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const results = {
    processed: 0,
    sentToWorkflow: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  try {
    // Find markets ready for resolution (batch of 5-10)
    const now = new Date().toISOString();
    const { data: markets, error: marketError } = await supabase
      .from('markets')
      .select('id, question, category, trading_closes_at, status')
      .or(`and(status.eq.active,trading_closes_at.lt.${now}),and(status.eq.closed,resolution_source_type.eq.AI)`)
      .order('trading_closes_at', { ascending: true })
      .limit(5); // Process max 5 per run

    if (marketError) throw marketError;

    if (!markets || markets.length === 0) {
      return NextResponse.json({
        message: 'No markets to process',
        processed: 0,
        executionTimeMs: Date.now() - startTime
      });
    }

    // Process each market
    for (const market of markets) {
      try {
        // Check if already being processed
        const lockKey = `market:workflow:${market.id}`;
        const isLocked = await checkLock(lockKey);
        
        if (isLocked) {
          console.log(`[Cron] Market ${market.id} already in workflow`);
          results.skipped++;
          continue;
        }

        // Set lock for 30 minutes
        await setLock(lockKey, 'processing', 1800);

        // Close market if still active
        if (market.status === 'active') {
          await supabase
            .from('markets')
            .update({ status: 'closed', updated_at: now })
            .eq('id', market.id);
        }

        // Trigger Upstash Workflow for AI processing
        const workflowUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/upstash-workflow`;
        
        const workflowResponse = await fetch(workflowUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.N8N_API_KEY || 'dev-key'}`
          },
          body: JSON.stringify({
            step: 'fetch-sources',
            data: {
              marketId: market.id,
              marketQuestion: market.question
            }
          })
        });

        if (!workflowResponse.ok) {
          throw new Error(`Workflow trigger failed: ${workflowResponse.status}`);
        }

        results.sentToWorkflow++;
        console.log(`[Cron] Market ${market.id} sent to Upstash Workflow`);

      } catch (marketError: any) {
        console.error(`[Cron] Error processing market ${market.id}:`, marketError);
        results.failed++;
        results.errors.push(`Market ${market.id}: ${marketError.message}`);
      }
    }

    results.processed = markets.length;

    return NextResponse.json({
      success: true,
      message: 'Batch processing completed',
      ...results,
      executionTimeMs: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: error.message,
        ...results,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}
