import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 120; // ISR: revalidate every 2 minutes

/**
 * GET /api/markets/[id]/related
 * Get related markets based on category
 * Returns: { data: Market[] }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const marketId = params.id;

    // Get current market's category
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('category')
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      return NextResponse.json({ data: [] });
    }

    // Get related markets from same category
    const { data, error } = await supabase
      .from('markets')
      .select('id, name, name_bn, question, yes_price, no_price, total_volume, image_url, category, status, trading_closes_at')
      .eq('category', market.category)
      .eq('status', 'active')
      .neq('id', marketId)
      .order('total_volume', { ascending: false })
      .limit(4);

    if (error) {
      console.error('[Related Markets] Error:', error);
      return NextResponse.json({ data: [] });
    }

    // If not enough markets in same category, get from other categories
    if ((data?.length || 0) < 4) {
      const { data: additionalMarkets } = await supabase
        .from('markets')
        .select('id, name, name_bn, question, yes_price, no_price, total_volume, image_url, category, status, trading_closes_at')
        .neq('category', market.category)
        .eq('status', 'active')
        .neq('id', marketId)
        .order('total_volume', { ascending: false })
        .limit(4 - (data?.length || 0));

      return NextResponse.json({ 
        data: [...(data || []), ...(additionalMarkets || [])] 
      });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('[Related Markets] Unexpected error:', error);
    return NextResponse.json({ data: [] });
  }
}
