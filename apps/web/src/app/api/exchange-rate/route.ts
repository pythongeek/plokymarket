import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchUSDTPrice } from '@/lib/binance/price';

// ─── Module-level in-memory cache (secondary cache layer) ────────────────────
// NOTE: This catches repeat requests within the same serverless function instance.
let instanceCachedRate: number | null = null;
let instanceLastFetch: number = 0;
const INSTANCE_CACHE_TTL = 60 * 1000; // 1 minute for instance-level cache

// ─── Fetch rate from CoinGecko ────────────────────────────────────────────────
// Uses Next.js built-in fetch cache (revalidate: 300 = 5 minutes).
async function fetchFromCoinGecko(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=bdt',
      {
        next: { revalidate: 300 },
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn(`[exchange-rate] CoinGecko responded with status ${response.status}`);
      return null;
    }

    const data = await response.json();
    const rate = data?.tether?.bdt;
    if (typeof rate !== 'number' || rate <= 0 || rate > 99999) {
      console.warn('[exchange-rate] CoinGecko returned unexpected rate value:', rate);
      return null;
    }

    return rate;
  } catch (err) {
    console.error('[exchange-rate] CoinGecko fetch failed:', err);
    return null;
  }
}

// ─── Fallback: Fetch rate from ExchangeRate-API (free, no key required) ───────
async function fetchFromExchangeRateAPI(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      {
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const rate = data?.rates?.BDT;

    if (typeof rate !== 'number' || rate <= 0) return null;

    return rate;
  } catch (err) {
    console.error('[exchange-rate] ExchangeRate-API fetch failed:', err);
    return null;
  }
}

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    const now = Date.now();

    // Layer 1: Check instance-level memory cache
    if (
      instanceCachedRate !== null &&
      (now - instanceLastFetch) < INSTANCE_CACHE_TTL
    ) {
      return NextResponse.json({
        success: true,
        rate: instanceCachedRate,
        source: 'instance_cache',
        updated_at: new Date(instanceLastFetch).toISOString(),
        cached: true,
      });
    }

    // Layer 2: Try CoinGecko (Next.js fetch cache handles 5-min server caching)
    let rate = await fetchFromCoinGecko();
    let source = 'coingecko';

    // Layer 3: Try ExchangeRate-API if CoinGecko failed
    if (rate === null) {
      rate = await fetchFromExchangeRateAPI();
      source = 'exchangerate_api';
    }

    // Layer 4: Try Binance P2P (Original source) if others fail
    if (rate === null) {
      try {
        const binanceData = await fetchUSDTPrice();
        rate = binanceData.price;
        source = binanceData.source;
      } catch (err) {
        console.error('[exchange-rate] Binance fetch failed:', err);
      }
    }

    // Layer 5: Hard fallback
    if (rate === null) {
      rate = 120;
      source = 'fallback';
    }

    // Update instance cache
    instanceCachedRate = rate;
    instanceLastFetch = now;

    // Maintain existing database recording logic
    const supabase = await createClient();
    await supabase.from('exchange_rates').insert({
      bdt_to_usdt: rate,
      usdt_to_bdt: rate,
      source: source,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      rate,
      source,
      updated_at: new Date().toISOString(),
      cached: false,
    });

  } catch (error) {
    console.error('[exchange-rate] Unexpected error in GET handler:', error);
    return NextResponse.json(
      {
        success: true,
        rate: instanceCachedRate ?? 120,
        source: 'error_fallback',
        updated_at: new Date().toISOString(),
        cached: true,
      },
      { status: 200 }
    );
  }
}

// ─── POST handler (Maintain Admin Force Refresh) ─────────────────────────────
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

    // Fetch fresh rate from Binance
    const priceData = await fetchUSDTPrice();

    // Reset instance cache to force update for everyone
    instanceCachedRate = priceData.price;
    instanceLastFetch = Date.now();

    // Store in database
    await supabase.from('exchange_rates').insert({
      bdt_to_usdt: priceData.price,
      usdt_to_bdt: priceData.price,
      source: priceData.source,
      metadata: {
        timestamp: priceData.timestamp,
        refreshed_by: user.id,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      rate: priceData.price,
      source: priceData.source,
      updated_at: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Exchange rate refresh error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}
