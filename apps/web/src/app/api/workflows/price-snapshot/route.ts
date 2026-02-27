/**
 * Workflow - Price Snapshot
 * Records hourly price snapshots for all active markets
 * Called by group-hourly workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'sin1';

async function processPriceSnapshot(supabase: any) {
  // Call the SQL function to record snapshots
  const { error: snapshotError } = await supabase.rpc('record_price_snapshots');

  if (snapshotError) {
    console.error('[PriceSnapshot] Snapshot Error:', snapshotError);
    throw snapshotError;
  }

  // Also update 24h price changes
  const { error: changeError } = await supabase.rpc('update_price_changes');

  if (changeError) {
    console.error('[PriceSnapshot] Change Update Error:', changeError);
  }

  // Calculate daily OHLC for completed days
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { error: ohlcError } = await supabase.rpc('calculate_daily_ohlc', {
    p_date: yesterdayStr,
  });

  if (ohlcError) {
    console.error('[PriceSnapshot] OHLC Error:', ohlcError);
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Price snapshots recorded',
    ohlcCalculated: yesterdayStr,
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const result = await processPriceSnapshot(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PriceSnapshot] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'price-snapshot',
    description: 'Hourly price snapshots and OHLC calculations',
    timestamp: new Date().toISOString(),
  });
}
