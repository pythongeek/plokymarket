import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUSDTPrice } from '@/lib/binance/price';

// GET /api/exchange-rate
// Get current exchange rate (cached or fresh)
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check for recent rate in database (cache for 5 minutes)
    const { data: cachedRate } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    const isCacheValid = cachedRate && 
      (Date.now() - new Date(cachedRate.created_at).getTime()) < cacheExpiry;
    
    if (isCacheValid) {
      return NextResponse.json({
        success: true,
        rate: cachedRate.bdt_to_usdt,
        source: cachedRate.source || 'cache',
        updated_at: cachedRate.created_at,
        cached: true,
      });
    }
    
    // Fetch fresh rate from Binance
    const priceData = await fetchUSDTPrice();
    
    // Store in database
    const { error: insertError } = await supabase
      .from('exchange_rates')
      .insert({
        bdt_to_usdt: priceData.price,
        usdt_to_bdt: priceData.price,
        source: priceData.source,
        metadata: {
          timestamp: priceData.timestamp,
          change24h: priceData.change24h,
        },
        created_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('Failed to cache exchange rate:', insertError);
    }
    
    return NextResponse.json({
      success: true,
      rate: priceData.price,
      source: priceData.source,
      updated_at: new Date().toISOString(),
      cached: false,
    });
    
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    
    // Return fallback rate
    return NextResponse.json({
      success: false,
      rate: 100.00, // Fallback rate
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST /api/exchange-rate
// Force refresh exchange rate (admin only)
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Fetch fresh rate
    const priceData = await fetchUSDTPrice();
    
    // Store in database
    const { error: insertError } = await supabase
      .from('exchange_rates')
      .insert({
        bdt_to_usdt: priceData.price,
        usdt_to_bdt: priceData.price,
        source: priceData.source,
        metadata: {
          timestamp: priceData.timestamp,
          change24h: priceData.change24h,
          refreshed_by: user.id,
        },
        created_at: new Date().toISOString(),
      });
    
    if (insertError) {
      throw insertError;
    }
    
    return NextResponse.json({
      success: true,
      rate: priceData.price,
      source: priceData.source,
      updated_at: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Exchange rate refresh error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
