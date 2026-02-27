import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60; // Cache for 60 seconds

/**
 * GET /api/markets/[id]/price-history
 * 
 * Chart Data Algorithm:
 * - Time-based aggregation (5min, 1hour, 1day buckets)
 * - Price Delta: (Current - Start) / Start * 100
 * - OHLC data for candlestick charts
 * 
 * Query params:
 *   - hours: number (default: 24)
 *   - outcome: string (default: 'YES')
 *   - interval: '5min' | '1hour' | '1day' (default: '1hour')
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const marketId = params.id;
    
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const outcome = searchParams.get('outcome') || 'YES';
    const interval = searchParams.get('interval') || '1hour';

    // Validate hours (max 30 days)
    const validatedHours = Math.min(Math.max(hours, 1), 720);
    const since = new Date(Date.now() - validatedHours * 3600000).toISOString();

    // Fetch price history
    const { data, error } = await supabase
      .from('price_history')
      .select('price, recorded_at, volume_at_time')
      .eq('market_id', marketId)
      .eq('outcome', outcome)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate data based on interval
    const aggregated = aggregatePriceData(data || [], interval);

    // Calculate price delta
    const delta = data && data.length > 1
      ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100
      : 0;

    // Calculate highest and lowest
    const prices = data?.map(d => d.price) || [];
    const highest = prices.length > 0 ? Math.max(...prices) : null;
    const lowest = prices.length > 0 ? Math.min(...prices) : null;

    return NextResponse.json({
      data: aggregated,
      raw: data,
      delta,
      deltaPercent: delta.toFixed(2),
      outcome,
      hours: validatedHours,
      interval,
      highest,
      lowest,
    });
  } catch (error) {
    console.error('[Price History] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * Aggregate price data into buckets
 */
function aggregatePriceData(
  data: Array<{ price: number; recorded_at: string; volume_at_time: number }>,
  interval: string
) {
  if (data.length === 0) return [];

  const buckets: Record<string, {
    prices: number[];
    volumes: number[];
    open: number;
    close: number;
    high: number;
    low: number;
    timestamp: string;
  }> = {};

  // Determine bucket size in milliseconds
  const bucketSizes: Record<string, number> = {
    '5min': 5 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
    '1day': 24 * 60 * 60 * 1000,
  };
  const bucketSize = bucketSizes[interval] || bucketSizes['1hour'];

  // Group data into buckets
  for (const point of data) {
    const timestamp = new Date(point.recorded_at).getTime();
    const bucketKey = Math.floor(timestamp / bucketSize) * bucketSize;
    const bucketTime = new Date(bucketKey).toISOString();

    if (!buckets[bucketTime]) {
      buckets[bucketTime] = {
        prices: [],
        volumes: [],
        open: point.price,
        close: point.price,
        high: point.price,
        low: point.price,
        timestamp: bucketTime,
      };
    }

    const bucket = buckets[bucketTime];
    bucket.prices.push(point.price);
    bucket.volumes.push(point.volume_at_time);
    bucket.close = point.price;
    bucket.high = Math.max(bucket.high, point.price);
    bucket.low = Math.min(bucket.low, point.price);
  }

  // Convert to array and calculate averages
  return Object.values(buckets).map(bucket => ({
    timestamp: bucket.timestamp,
    open: bucket.open,
    high: bucket.high,
    low: bucket.low,
    close: bucket.close,
    average: bucket.prices.reduce((a, b) => a + b, 0) / bucket.prices.length,
    volume: bucket.volumes.reduce((a, b) => a + b, 0),
  }));
}
