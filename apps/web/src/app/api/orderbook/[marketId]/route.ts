import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OrderBookService } from '@/lib/clob/service';
import { Granularity } from '@/lib/clob/ds/DepthManager';
import { redis } from '@/lib/upstash/redis';

// Use Service Role for engine hydration to ensure we see all OPEN orders?
// Or just anon? Anon can see OPEN orders via RLS.
// Let's use standard client creation.

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ marketId: string }> }
) {
    try {
        const { marketId } = await params;
        const granularityParam = request.nextUrl.searchParams.get('granularity');

        // Cache Lookup
        const cacheKey = granularityParam ? `orderbook:${marketId}:${granularityParam}` : `orderbook:${marketId}`;
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return NextResponse.json(JSON.parse(cachedData), {
                    headers: {
                        'Cache-Control': 's-maxage=1, stale-while-revalidate=5',
                        'X-Cache': 'HIT'
                    }
                });
            }
        } catch (cacheError) {
            console.error('Redis cache GET error:', cacheError);
            // Fallback to DB fetch on error
        }

        // In a real high-scale app, we would cache this snapshot or use Redis.
        // Here we reconstruct from DB on demand (expensive but correct for MVP).
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const engine = await OrderBookService.getEngine(supabase, marketId);

        let responseData;

        if (granularityParam) {
            const g = parseInt(granularityParam) as Granularity;
            // Validate
            if ([1, 5, 10, 50, 100].includes(g)) {
                responseData = OrderBookService.getDepthDTO(engine, g);
            }
        }

        if (!responseData) {
            const snapshot = engine.getSnapshot();
            responseData = OrderBookService.mapSnapshotToDTO(snapshot);
        }

        // Database Fetch & Store
        try {
            await redis.setex(cacheKey, 30, JSON.stringify(responseData));
        } catch (cacheSetError) {
            console.error('Redis cache SET error:', cacheSetError);
        }

        return NextResponse.json(responseData, {
            headers: {
                'Cache-Control': 's-maxage=1, stale-while-revalidate=5',
                'X-Cache': 'MISS'
            }
        });
    } catch (error) {
        console.error('Error fetching orderbook:', error);
        return NextResponse.json({ error: 'Failed to fetch orderbook' }, { status: 500 });
    }
}
