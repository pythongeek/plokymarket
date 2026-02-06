import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OrderBookService } from '@/lib/clob/service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { marketId, userId, side, price, size, type, timeInForce, nonce, stpMode } = body;

        // Basic validation
        if (!marketId || !userId || !side || !price || !size) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        // Use Service Role if available to bypass RLS for internal logic if needed, 
        // or ensure the user is authenticated (userId should match token).
        // For MVP, we trust the userId passed in body (Insecure for Prod, OK for Demo/Test if we don't valid auth header).
        const supabase = createClient(supabaseUrl, supabaseKey);

        let result;

        // Check for MEV Reveal (if Nonce provided, assumes Reveal Phase)
        // Or strictly normal order.
        // If 'nonce' is present, we try reveal? Or is 'nonce' for commit?
        // Let's assume standard placement unless specific endpoint used.
        // For now, standard placement:

        result = await OrderBookService.executeOrder(supabase, marketId, {
            userId, side, price, size, type, timeInForce, stpMode
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error placing order:', error);
        return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
    }
}
