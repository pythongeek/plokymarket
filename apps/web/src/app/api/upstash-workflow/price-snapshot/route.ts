/**
 * Upstash Workflow - Price Snapshot
 * Records hourly price snapshots for all active markets
 * Scheduled via QStash: 0 * * * * (every hour)
 * 
 * This replaces the Vercel Cron to stay within free tier limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'sin1';

/**
 * POST handler for Upstash Workflow
 * Steps:
 * 1. record-snapshots - Insert price snapshots for all active markets
 * 2. update-changes - Calculate 24h price changes
 * 3. calculate-ohlc - Calculate daily OHLC for completed days
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const payload = await request.json();
    const { step, data } = payload;

    const supabase = await createServiceClient();

    // Step 1: Record price snapshots
    if (step === 'record-snapshots' || !step) {
      console.log('[PriceSnapshot] Recording hourly price snapshots...');

      // Call the SQL function to record snapshots
      const { error: snapshotError } = await supabase.rpc('record_price_snapshots');

      if (snapshotError) {
        console.error('[PriceSnapshot] Snapshot Error:', snapshotError);
        throw snapshotError;
      }

      return NextResponse.json({
        step: 'record-snapshots',
        status: 'success',
        nextStep: 'update-changes',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Update 24h price changes
    if (step === 'update-changes') {
      console.log('[PriceSnapshot] Updating 24h price changes...');

      const { error: changeError } = await supabase.rpc('update_price_changes');

      if (changeError) {
        console.error('[PriceSnapshot] Change Update Error:', changeError);
        // Don't fail, just log
      }

      return NextResponse.json({
        step: 'update-changes',
        status: 'success',
        nextStep: 'calculate-ohlc',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 3: Calculate daily OHLC for yesterday
    if (step === 'calculate-ohlc') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      console.log(`[PriceSnapshot] Calculating OHLC for ${yesterdayStr}...`);

      const { error: ohlcError } = await supabase.rpc('calculate_daily_ohlc', {
        p_date: yesterdayStr,
      });

      if (ohlcError) {
        console.error('[PriceSnapshot] OHLC Error:', ohlcError);
        // Don't fail, just log
      }

      return NextResponse.json({
        step: 'calculate-ohlc',
        status: 'completed',
        ohlcDate: yesterdayStr,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Unknown step
    return NextResponse.json(
      { error: 'Unknown workflow step', step },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[PriceSnapshot Workflow] Error:', error);
    return NextResponse.json(
      {
        error: 'Price snapshot workflow failed',
        details: error.message,
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Workflow status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'upstash-workflow-price-snapshot',
    description: 'Hourly price snapshots and OHLC calculations',
    steps: ['record-snapshots', 'update-changes', 'calculate-ohlc'],
    schedule: '0 * * * *',
    timestamp: new Date().toISOString(),
  });
}
