import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 30; // ISR: revalidate every 30 seconds

/**
 * GET /api/markets/[id]/stats
 * 
 * Industry Standard Algorithm:
 * - Volume Calculation: Sum of (price * quantity) from trades table
 * - 24h Volume: Filter trades from last 24 hours
 * - Unique Traders: Count distinct user_id from positions table
 * - Liquidity Score: Based on order book depth (bid-ask spread)
 * 
 * Performance: Uses ISR (revalidate: 30) to reduce database load
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const marketId = params.id;

    // Use the optimized RPC for market stats
    const { data: stats, error: statsError } = await supabase.rpc('get_market_stats_summary', {
      p_market_id: marketId
    } as any) as any;

    if (statsError) {
      console.error('[Market Stats] RPC Error:', statsError);
      throw statsError;
    }

    return NextResponse.json({
      volume: stats?.volume || 0,
      volume24h: stats?.volume_24h || 0,
      tradeCount: stats?.trade_count || 0,
      uniqueTraders: stats?.unique_traders || 0,
      followerCount: stats?.follower_count || 0,
      bookmarkCount: stats?.bookmark_count || 0,
      liquidityScore: 0, // RPC doesn't compute liquidity score yet
      lastUpdated: stats?.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Market Stats] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
