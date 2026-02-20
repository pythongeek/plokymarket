import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/exchange-rate/current
 * Get current USDT/BDT exchange rate
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('exchange_rates_live')
            .select('*')
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('[Exchange Rate] Database error:', error);
            // Return default rate if no data
            return NextResponse.json({
                success: true,
                rate: {
                    usdt_to_bdt: 120,
                    bdt_to_usdt: 0.0083,
                    source: 'default',
                    fetched_at: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({
            success: true,
            rate: data
        });
    } catch (error: any) {
        console.error('[Exchange Rate] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}