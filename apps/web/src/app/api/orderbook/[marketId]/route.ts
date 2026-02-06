import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OrderBookService } from '@/lib/clob/service';

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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Anon is enough for reading open book
        const supabase = createClient(supabaseUrl, supabaseKey);

        const engine = await OrderBookService.getEngine(supabase, marketId);
        const snapshot = engine.getSnapshot();

        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('Error fetching orderbook:', error);
        return NextResponse.json({ error: 'Failed to fetch orderbook' }, { status: 500 });
    }
}
