import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all active markets
    const { data: activeMarkets } = await supabase
      .from('markets')
      .select('id')
      .eq('status', 'active');

    if (!activeMarkets || activeMarkets.length === 0) {
      return NextResponse.json({ triggered: 0, markets: [] });
    }

    const results = [];

    // Check conditional orders for each active market
    for (const market of activeMarkets) {
      const { data } = await supabase.rpc('check_conditional_orders_for_market', {
        p_market_id: market.id,
      });
      if (data && data.triggered_count > 0) {
        results.push(data);
      }
    }

    // Log the cron run
    await supabase.from('admin_audit_log').insert({
      admin_id: null, // system
      action: 'cron_check_conditional_orders',
      resource: 'conditional_orders',
      metadata: {
        markets_checked: activeMarkets.length,
        triggered_total: results.reduce((sum, r) => sum + r.triggered_count, 0),
        results,
      },
    });

    return NextResponse.json({
      success: true,
      triggered: results.reduce((sum, r) => sum + r.triggered_count, 0),
      markets: results,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Check conditional orders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
