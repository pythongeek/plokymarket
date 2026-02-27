import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/markets/[id]/follow
 * Toggle follow status for a market with notification preferences
 * Body: { notifyOnTrade?: boolean, notifyOnResolve?: boolean }
 * Returns: { following: boolean }
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

    const marketId = params.id;
    const body = await req.json().catch(() => ({}));

    // Use the toggle function
    const { data, error } = await supabase.rpc('toggle_market_follow', {
      p_market_id: marketId,
      p_notify_on_trade: body.notifyOnTrade ?? false,
      p_notify_on_resolve: body.notifyOnResolve ?? true
    });

    if (error) {
      console.error('[Follow] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Follow] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/markets/[id]/follow
 * Check if user is following this market
 * Returns: { 
 *   following: boolean, 
 *   notifyOnTrade?: boolean, 
 *   notifyOnResolve?: boolean,
 *   notifyOnPriceChange?: boolean,
 *   priceAlertThreshold?: number
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ following: false });
    }

    const marketId = params.id;

    const { data, error } = await supabase
      .from('market_followers')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Follow Check] Error:', error);
    }

    if (!data) {
      return NextResponse.json({ following: false });
    }

    return NextResponse.json({
      following: true,
      notifyOnTrade: data.notify_on_trade,
      notifyOnResolve: data.notify_on_resolve,
      notifyOnPriceChange: data.notify_on_price_change,
      priceAlertThreshold: data.price_alert_threshold
    });
  } catch (error) {
    console.error('[Follow Check] Unexpected error:', error);
    return NextResponse.json({ following: false });
  }
}

/**
 * PATCH /api/markets/[id]/follow
 * Update notification preferences for a followed market
 * Body: { 
 *   notifyOnTrade?: boolean, 
 *   notifyOnResolve?: boolean,
 *   notifyOnPriceChange?: boolean,
 *   priceAlertThreshold?: number
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const marketId = params.id;
    const body = await req.json().catch(() => ({}));

    const updates: Record<string, any> = {};
    if (body.notifyOnTrade !== undefined) updates.notify_on_trade = body.notifyOnTrade;
    if (body.notifyOnResolve !== undefined) updates.notify_on_resolve = body.notifyOnResolve;
    if (body.notifyOnPriceChange !== undefined) updates.notify_on_price_change = body.notifyOnPriceChange;
    if (body.priceAlertThreshold !== undefined) updates.price_alert_threshold = body.priceAlertThreshold;

    const { data, error } = await supabase
      .from('market_followers')
      .update(updates)
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .select()
      .single();

    if (error) {
      console.error('[Follow Update] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      following: true,
      notifyOnTrade: data.notify_on_trade,
      notifyOnResolve: data.notify_on_resolve,
      notifyOnPriceChange: data.notify_on_price_change,
      priceAlertThreshold: data.price_alert_threshold
    });
  } catch (error) {
    console.error('[Follow Update] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
