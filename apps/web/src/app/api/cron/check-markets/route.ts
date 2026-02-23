/**
 * Enhanced Market Resolution Cron Job
 * Multi-step verification with Upstash rate limiting
 * Vercel Edge optimized (10s limit)
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { setLock, checkLock } from '@/lib/upstash/redis';
import { resolveMarketWithVerification, processResolutionResult } from '@/lib/oracle/enhancedResolution';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Verify QStash signature
async function verifyQStashSignature(request: Request): Promise<boolean> {
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

export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify QStash signature
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const results = {
    processed: 0,
    autoResolved: 0,
    sentToReview: 0,
    failed: 0,
    errors: [] as string[]
  };

  try {
    // Find markets ready for resolution
    const now = new Date().toISOString();
    const { data: markets, error: marketError } = await supabase
      .from('markets')
      .select('id, question, category, trading_closes_at, status')
      .or(`and(status.eq.active,trading_closes_at.lt.${now}),and(status.eq.closed,resolution_source_type.eq.AI)`)
      .order('trading_closes_at', { ascending: true })
      .limit(3); // Process max 3 per run to stay within 10s limit

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
        // Check if already being processed (global lock)
        const globalLockKey = `market:resolution:${market.id}`;
        const isLocked = await checkLock(globalLockKey);

        if (isLocked) {
          console.log(`[Cron] Market ${market.id} already being processed`);
          continue;
        }

        // Set global lock
        await setLock(globalLockKey, 'processing', 600); // 10 minutes

        // Step 1: Close market if still active
        if (market.status === 'active') {
          await supabase
            .from('markets')
            .update({ status: 'closed', updated_at: now })
            .eq('id', market.id);
        }

        // Step 2: Create resolution record if not exists
        const { data: existingResolution } = await supabase
          .from('resolution_systems')
          .select('id, resolution_status')
          .eq('event_id', market.id)
          .single();

        if (!existingResolution) {
          await supabase.from('resolution_systems').insert({
            event_id: market.id,
            primary_method: 'ai_oracle',
            resolution_status: 'in_progress',
            ai_oracle_config: {
              sources: ['prothomalo.com', 'thedailystar.net', 'bdnews24.com'],
              keywords: [market.category],
              confidence_threshold: 90,
              min_sources_required: 2
            }
          });
        } else if (existingResolution.resolution_status !== 'pending' && existingResolution.resolution_status !== 'in_progress') {
          console.log(`[Cron] Market ${market.id} already has resolution status: ${existingResolution.resolution_status}`);
          continue;
        }

        results.processed++;

        // Step 3: Perform enhanced resolution with multi-step verification
        console.log(`[Cron] Starting resolution for market ${market.id}`);

        const resolutionResult = await resolveMarketWithVerification(
          market.id,
          market.question,
          market.category
        );

        // Step 4: Process result
        await processResolutionResult(market.id, resolutionResult);

        if (resolutionResult.needsHumanReview) {
          results.sentToReview++;
          console.log(`[Cron] Market ${market.id} sent to human review (${resolutionResult.confidence}%)`);
        } else {
          results.autoResolved++;
          console.log(`[Cron] Market ${market.id} auto-resolved (${resolutionResult.confidence}%)`);
        }

      } catch (marketError: any) {
        console.error(`[Cron] Error processing market ${market.id}:`, marketError);
        results.failed++;
        results.errors.push(`Market ${market.id}: ${marketError.message}`);

        // Update market with error status
        await supabase.from('resolution_systems').update({
          resolution_status: 'failed',
          evidence: [{ type: 'error', message: marketError.message, timestamp: now }]
        }).eq('event_id', market.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Resolution processing completed',
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
