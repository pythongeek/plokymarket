import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OrderBookService } from '@/lib/clob/service';
import { Granularity } from '@/lib/clob/ds/DepthManager';

// Use Service Role for engine hydration to ensure we see all OPEN orders?
// Or just anon? Anon can see OPEN orders via RLS.
// Let's use standard client creation.

export async function GET(
    request: NextRequest,
    { params }: { params: { marketId: string } }
) {
    try {
        const marketId = params.marketId;

        // In a real high-scale app, we would cache this snapshot or use Redis.
        // Here we reconstruct from DB on demand (expensive but correct for MVP).
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const engine = await OrderBookService.getEngine(supabase, marketId);

        const granularityParam = request.nextUrl.searchParams.get('granularity');
        if (granularityParam) {
            const g = parseInt(granularityParam) as Granularity;
            // Validate
            if ([1, 5, 10, 50, 100].includes(g)) {
                return NextResponse.json(OrderBookService.getDepthDTO(engine, g));
            }
        }

        const snapshot = engine.getSnapshot();

        return NextResponse.json(OrderBookService.mapSnapshotToDTO(snapshot));
    } catch (error) {
        console.error('Error fetching orderbook:', error);
        return NextResponse.json({ error: 'Failed to fetch orderbook' }, { status: 500 });
    }
}
