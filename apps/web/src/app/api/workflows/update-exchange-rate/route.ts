import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';
import { getExchangeRate } from '@/lib/realtime/binance-p2p';

// POST /api/workflows/update-exchange-rate
// Updates exchange rate from Binance P2P (triggered by QStash schedule)
export async function POST(request: Request) {
  try {
    // Verify QStash signature
    const signature = request.headers.get('upstash-signature') || '';
    const bodyText = await request.text();
    const isValid = verifyQStashSignature(signature, bodyText);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch fresh rate from Binance P2P (or fallbacks)
    const liveAPI = await getExchangeRate();

    // Safety Fallback check
    let baseRate = liveAPI?.usdt_to_bdt || 120.00; // Hard fallback if totally null

    // Platform Margins logic (approx 1.5%)
    const marginPercentage = 0.015; // 1.5% margin
    const combinedBuyRate = baseRate + (baseRate * marginPercentage);

    // Save strictly to the legacy `exchange_rates` table
    const { error: insertLegacyError } = await supabase
      .from('exchange_rates')
      .insert({
        usdt_to_bdt: Number(combinedBuyRate.toFixed(4)),
        bdt_to_usdt: Number((1 / combinedBuyRate).toFixed(6)), // Reverse pair
        effective_from: new Date().toISOString()
      });

    if (insertLegacyError) {
      console.error('Workflow Exchange Rate: Error inserting to legacy exchange_rates', insertLegacyError);
    }

    // Attempt RPC update for modern `exchange_rates_live` ecosystem
    const { error: rpcError } = await supabase.rpc('update_exchange_rate', {
      p_usdt_to_bdt: Number(combinedBuyRate.toFixed(4)),
      p_source: liveAPI?.source || 'binance_fallback'
    });

    if (rpcError) {
      console.warn('Workflow Exchange Rate: RPC update_exchange_rate failed or not found. Ignoring.', rpcError);
    }

    console.log(`Exchange rate updated via workflow: ৳${combinedBuyRate.toFixed(4)} / USDT (Base: ৳${baseRate})`);

    return NextResponse.json({
      success: true,
      rate: Number(combinedBuyRate.toFixed(4)),
      source: liveAPI?.source || 'binance_fallback',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Exchange rate update workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
