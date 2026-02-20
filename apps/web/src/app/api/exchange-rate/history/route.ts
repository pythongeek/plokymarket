import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/exchange-rate/history
 * Get historical USDT/BDT exchange rates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '24');

    const { data, error } = await supabase
      .from('exchange_rates_live')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Exchange Rate History] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      history: data,
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('[Exchange Rate History] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}