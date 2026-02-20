import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';
import { fetchUSDTPrice } from '@/lib/binance/price';

// POST /api/workflows/update-exchange-rate
// Updates exchange rate from Binance (triggered by QStash schedule)
export async function POST(request: Request) {
  try {
    // Verify QStash signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    
    // Fetch fresh rate from Binance
    const priceData = await fetchUSDTPrice();
    
    // Store in database
    const { error } = await supabase
      .from('exchange_rates')
      .insert({
        bdt_to_usdt: priceData.price,
        usdt_to_bdt: priceData.price,
        source: `binance_${priceData.source}`,
        metadata: {
          timestamp: priceData.timestamp,
          change24h: priceData.change24h,
          auto_updated: true,
        },
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to store exchange rate:', error);
      return NextResponse.json(
        { error: 'Failed to store exchange rate' },
        { status: 500 }
      );
    }

    console.log(`Exchange rate updated: ৳${priceData.price} / USDT`);

    return NextResponse.json({
      success: true,
      rate: priceData.price,
      source: priceData.source,
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
