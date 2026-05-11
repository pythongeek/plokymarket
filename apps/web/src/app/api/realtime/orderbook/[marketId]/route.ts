// @ts-nocheck
/**
 * GET /api/realtime/orderbook/[marketId]
 * 
 * Returns orderbook snapshot for a market.
 * Uses in-memory engine if available, falls back to DB.
 * 
 * This endpoint establishes a Supabase Realtime channel for the market.
 * Clients should use the returned channel URL to subscribe via WebSocket.
 */

import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { orderBookRealtimeEngine } from '@/lib/realtime/OrderBookRealtimeEngine';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ marketId: string }> }
) {
    try {
        const { marketId } = await params;
        
        if (!marketId) {
            return NextResponse.json(
                { error: 'Market ID is required' },
                { status: 400 }
            );
        }

        // Get snapshot from engine (or DB fallback)
        const snapshot = await orderBookRealtimeEngine.getSnapshot(marketId);

        // Get Supabase URL for client WebSocket connection
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json(
                { error: 'Supabase not configured' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            marketId,
            snapshot,
            channel: {
                name: `market:${marketId}`,
                url: supabaseUrl,
                anonKey: supabaseAnonKey
            }
        });

    } catch (error) {
        console.error('[OrderBook API] Error fetching snapshot:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orderbook snapshot' },
            { status: 500 }
        );
    }
}
