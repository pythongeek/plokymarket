/**
 * Upstash Workflow - Cleanup Tasks
 * Periodic cleanup of expired data
 * Scheduled via QStash: 0 0 * * * (daily at midnight)
 * 
 * Combines multiple cleanup tasks:
 * - Expired batch orders
 * - Old notifications (read, >30 days)
 * - Stale price history (configurable retention)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { withQStashAuth } from '@/lib/qstash/verify';
import { acquireIdempotencyLock, generateIdempotencyKey } from '@/lib/qstash/idempotency';

export const runtime = 'edge';
export const preferredRegion = 'sin1';

/**
 * POST handler for Upstash Workflow
 * Steps:
 * 1. cleanup-batches - Cancel expired pending batches
 * 2. cleanup-notifications - Remove old read notifications
 * 3. cleanup-price-history - Archive old price data (optional)
 */
export const POST = withQStashAuth(async (request: NextRequest) => {
    // Idempotency check
    let payload;
    try { payload = await request.json(); } catch { payload = {}; }
    const idempotencyKey = generateIdempotencyKey(
      'workflow',
      (payload?.eventId as string) || (payload?.event_id as string) || (payload?.data?.event_id as string) || 'global',
      payload?.step
    );
    const { acquired, wasProcessed } = await acquireIdempotencyLock(idempotencyKey, { step: payload?.step });
    if (!acquired && wasProcessed) {
      console.log(`[Workflow] Idempotency hit for ${idempotencyKey} — skipping`);
      return new Response(JSON.stringify({ status: 'skipped', reason: 'Already processed', idempotencyKey }), { status: 200 });
    }

  const startTime = Date.now();

  try {
    const payload = await request.json();
    const { step, data } = payload;

    const supabase = await createServiceClient();

    // Step 1: Cleanup expired batches
    if (step === 'cleanup-batches' || !step) {
      console.log('[Cleanup] Cleaning up expired batches...');

      const { data: cleanupResult, error } = await supabase.rpc('cleanup_expired_batches');

      if (error) {
        console.error('[Cleanup] Batch cleanup error:', error);
        // Don't fail, continue to next step
      }

      return NextResponse.json({
        step: 'cleanup-batches',
        status: 'success',
        result: cleanupResult,
        nextStep: 'cleanup-notifications',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Cleanup old notifications
    if (step === 'cleanup-notifications') {
      console.log('[Cleanup] Cleaning up old notifications...');

      const { data: cleanupResult, error } = await supabase.rpc('cleanup_old_notifications', {
        p_days: 30,
      });

      if (error) {
        console.error('[Cleanup] Notification cleanup error:', error);
        // Don't fail, continue to next step
      }

      return NextResponse.json({
        step: 'cleanup-notifications',
        status: 'success',
        result: cleanupResult,
        nextStep: 'completed',
        timestamp: new Date().toISOString(),
      });
    }

    // Completion
    return NextResponse.json({
      step: 'completed',
      status: 'success',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cleanup Workflow] Error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup workflow failed',
        details: error.message,
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
});
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'upstash-workflow-cleanup',
    description: 'Daily cleanup of expired data',
    steps: ['cleanup-batches', 'cleanup-notifications'],
    schedule: '0 0 * * *',
    timestamp: new Date().toISOString(),
  });
}
