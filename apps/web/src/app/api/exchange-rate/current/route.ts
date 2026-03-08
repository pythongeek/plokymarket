import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/exchange-rate/current
 * Get current USDT/BDT exchange rate
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Try new exchange_rates_live table first
        const { data: liveData, error: liveError } = await supabase
            .from('exchange_rates_live')
            .select('*')
            .eq('is_active', true)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        if (!liveError && liveData) {
            return NextResponse.json({
                success: true,
                rate: liveData
            });
        }

        // Fallback to legacy exchange_rates table
        const { data: legacyData, error: legacyError } = await supabase
            .from('exchange_rates')
            .select('*')
            .order('effective_from', { ascending: false })
            .limit(1)
            .single();

        if (legacyError || !legacyData) {
            console.error('[Exchange Rate] Database error:', legacyError);
            // Return default rate if no data
            return NextResponse.json({
                success: true,
                rate: {
                    usdt_to_bdt: 119,
                    bdt_to_usdt: 0.008403,
                    source: 'default',
                    fetched_at: new Date().toISOString()
                }
            });
        }

        // Transform legacy data to match expected format
        return NextResponse.json({
            success: true,
            rate: {
                usdt_to_bdt: legacyData.usdt_to_bdt,
                bdt_to_usdt: legacyData.bdt_to_usdt,
                source: legacyData.source || 'binance',
                fetched_at: legacyData.effective_from || legacyData.created_at
            }
        });
    } catch (error: any) {
        console.error('[Exchange Rate] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}