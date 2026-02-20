import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/exchange-rate/refresh
 * Manually refresh USDT/BDT exchange rate from Binance P2P
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Fetch from Binance P2P
        const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                asset: 'USDT',
                fiat: 'BDT',
                tradeType: 'BUY',
                page: 1,
                rows: 10
            })
        });

        if (!response.ok) {
            throw new Error('Binance P2P API unavailable');
        }

        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            throw new Error('No Binance P2P data available');
        }

        // Calculate average of top 10 offers
        const prices = data.data.map((d: any) => parseFloat(d.adv.price));
        const avgRate = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

        // Store in database
        const { error: insertError } = await supabase
            .from('exchange_rates_live')
            .insert({
                usdt_to_bdt: avgRate,
                bdt_to_usdt: 1 / avgRate,
                source: 'binance_p2p',
                fetched_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('[Exchange Rate Refresh] Insert error:', insertError);
        }

        console.log(`[Exchange Rate Refresh] Updated: 1 USDT = ${avgRate.toFixed(2)} BDT`);

        return NextResponse.json({
            success: true,
            rate: {
                usdt_to_bdt: avgRate,
                bdt_to_usdt: 1 / avgRate,
                source: 'binance_p2p',
                fetched_at: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error('[Exchange Rate Refresh] Error:', error);

        // Return last known rate on error
        const supabase = await createClient();
        const { data: lastRate } = await supabase
            .from('exchange_rates_live')
            .select('*')
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        return NextResponse.json({
            success: false,
            error: error.message,
            rate: lastRate || {
                usdt_to_bdt: 120,
                bdt_to_usdt: 0.0083,
                source: 'fallback',
                fetched_at: new Date().toISOString()
            }
        });
    }
}