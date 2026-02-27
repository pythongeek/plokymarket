import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * GET /api/cron/price-snapshot
 * Records hourly price snapshots for all active markets
 * Called by Vercel Cron: 0 * * * * (every hour)
 * Requires: Authorization: Bearer CRON_SECRET
 * 
 * Also supports POST for Upstash Workflow compatibility
 */
async function processPriceSnapshot(supabase: any) {
  // Call the SQL function to record snapshots
  const { error: snapshotError } = await supabase.rpc('record_price_snapshots');

  if (snapshotError) {
    console.error('[Cron/PriceSnapshot] Snapshot Error:', snapshotError);
    throw snapshotError;
  }

  // Also update 24h price changes
  const { error: changeError } = await supabase.rpc('update_price_changes');

  if (changeError) {
    console.error('[Cron/PriceSnapshot] Change Update Error:', changeError);
    // Don't fail the whole request, just log
  }

  // Calculate daily OHLC for completed days
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { error: ohlcError } = await supabase.rpc('calculate_daily_ohlc', {
    p_date: yesterdayStr,
  });

  if (ohlcError) {
    console.error('[Cron/PriceSnapshot] OHLC Error:', ohlcError);
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Price snapshots recorded',
    ohlcCalculated: yesterdayStr,
  };
}

export async function GET(req: NextRequest) {
  try {
    // Secure cron endpoint
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const result = await processPriceSnapshot(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron/PriceSnapshot] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for Upstash Workflow compatibility
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const result = await processPriceSnapshot(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron/PriceSnapshot] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
