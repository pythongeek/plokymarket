import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/markets/[id]/outcomes
 * Get all outcomes for a multi-outcome market
 * 
 * Industry Standard:
 * - Sum of all outcome probabilities should be ~1.0 (100%)
 * - Each outcome has a current_price representing its probability
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const marketId = params.id;

    const { data, error } = await supabase
      .from('outcomes')
      .select('*')
      .eq('market_id', marketId)
      .order('display_order');

    if (error) {
      console.error('[Outcomes] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no outcomes found and this is a binary market, return default YES/NO
    if (!data || data.length === 0) {
      const { data: market } = await (supabase
        .from('markets')
        .select('yes_price, no_price, total_volume, market_type')
        .eq('id', marketId)
        .single() as any);

      if (market && (market.market_type === 'binary' || !market.market_type)) {
        return NextResponse.json({
          data: [
            {
              id: `${marketId}-yes`,
              market_id: marketId,
              label: 'YES',
              label_bn: 'হ্যাঁ',
              current_price: market.yes_price || 0.5,
              total_volume: (market.total_volume || 0) / 2,
              display_order: 0,
            },
            {
              id: `${marketId}-no`,
              market_id: marketId,
              label: 'NO',
              label_bn: 'না',
              current_price: market.no_price || 0.5,
              total_volume: (market.total_volume || 0) / 2,
              display_order: 1,
            }
          ],
          isBinary: true,
        });
      }
    }

    // Validate probability sum
    const totalProb = (data || []).reduce((sum, o) => sum + (o.current_price || 0), 0);
    const normalized = totalProb > 0 && Math.abs(totalProb - 1.0) > 0.01;

    return NextResponse.json({
      data: data || [],
      totalProbability: totalProb,
      normalized,
      isBinary: false,
    });
  } catch (error) {
    console.error('[Outcomes] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/markets/[id]/outcomes
 * Create outcomes for a multi-outcome market (Admin only)
 * 
 * Security: Requires admin role
 * Validation: Total probability must be <= 1.05 (allowing small rounding errors)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require admin role
    const { data: profile, error: profileError } = await (supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single() as any);

    if (profileError || (!profile?.is_admin && !profile?.is_super_admin)) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const marketId = params.id;
    const body = await req.json();
    const outcomes = Array.isArray(body.outcomes) ? body.outcomes : [body];

    // Validate probability sum (should be ~1.0)
    const totalProb = outcomes.reduce((sum: number, o: any) =>
      sum + (o.current_price ?? 1 / outcomes.length), 0
    );

    if (totalProb > 1.05) {
      return NextResponse.json(
        { error: 'Total probability exceeds 1.0', total: totalProb },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('outcomes')
      .insert(
        outcomes.map((o: any, i: number) => ({
          market_id: marketId,
          label: o.label,
          label_bn: o.label_bn,
          image_url: o.image_url,
          current_price: o.current_price ?? (1 / outcomes.length),
          display_order: i,
        }))
      )
      .select();

    if (error) {
      console.error('[Outcomes Create] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update market type to multi_outcome
    await (supabase
      .from('markets')
      .update({ market_type: 'multi_outcome' } as any)
      .eq('id', marketId) as any);

    return NextResponse.json({
      data,
      totalProbability: totalProb,
    });
  } catch (error) {
    console.error('[Outcomes Create] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
