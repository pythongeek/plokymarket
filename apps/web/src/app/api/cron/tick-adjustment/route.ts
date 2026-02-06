import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MarketVolatilityService } from '@/lib/clob/MarketVolatilityService';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: markets, error: marketsError } = await supabase
            .from('markets')
            .select('*')
            .eq('status', 'active');

        if (marketsError) throw marketsError;

        for (const market of markets) {
            const vol = await MarketVolatilityService.calculate24hRealizedVolatility(market.id);
            const suggestedTick = MarketVolatilityService.calculateAdaptiveTickSize(
                vol,
                BigInt(market.yes_price || 50), // midpoint estimate
                BigInt(market.min_tick || 100),
                BigInt(market.max_tick || 10000)
            );

            // Handle pending changes
            const now = new Date();
            const pending = market.pending_tick_change;

            if (pending && new Date(pending.apply_at) <= now) {
                // Apply the change
                await supabase.from('markets').update({
                    current_tick: pending.new_tick,
                    pending_tick_change: null,
                    realized_volatility_24h: vol
                }).eq('id', market.id);

                // Note: Real-time engine would pick this up via DB listener or next reload
                console.log(`Applied tick change for ${market.id} to ${pending.new_tick}`);
            } else if (!pending && suggestedTick !== BigInt(market.current_tick)) {
                // Schedule 24h notice
                const applyAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await supabase.from('markets').update({
                    pending_tick_change: {
                        new_tick: suggestedTick.toString(),
                        scheduled_at: now.toISOString(),
                        apply_at: applyAt.toISOString()
                    },
                    realized_volatility_24h: vol
                }).eq('id', market.id);

                console.log(`Scheduled tick change for ${market.id} to ${suggestedTick} at ${applyAt}`);
            } else if (MarketVolatilityService.isEmergencyWideningRequired(vol, Number(market.realized_volatility_24h))) {
                // EMERGENCY WIDENING: Immediate apply
                const emergencyTick = suggestedTick > BigInt(market.current_tick) ? suggestedTick : BigInt(market.current_tick) * 2n;

                await supabase.from('markets').update({
                    current_tick: emergencyTick.toString(),
                    pending_tick_change: null,
                    realized_volatility_24h: vol
                }).eq('id', market.id);

                console.log(`EMERGENCY widening for ${market.id} to ${emergencyTick}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Tick adjustment cron failed', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
