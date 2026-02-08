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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_SECRET_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.SUPABASE_ANON_KEY!;
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

        return NextResponse.json(OrderBookService.mapFillResultToDTO(result));
    } catch (error: any) {
        console.error('Error placing order:', error);
        return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
    }
}

/**
 * DELETE /api/orders
 * Advanced Order Cancellation with Soft/Hard Cancel support
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const userId = searchParams.get('userId');
        const cancelType = searchParams.get('type') || 'INFLIGHT'; // SOFT, HARD, INFLIGHT, BATCH
        
        // Batch cancellation support
        if (cancelType === 'BATCH') {
            const body = await request.json();
            const { orderIds, userId: batchUserId } = body;
            
            if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !batchUserId) {
                return NextResponse.json({ error: 'Missing required fields for batch cancel' }, { status: 400 });
            }

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const results = await Promise.all(
                orderIds.map(async (id: string) => {
                    const { data, error } = await supabase.rpc('cancel_with_inflight_handling', {
                        p_order_id: id,
                        p_user_id: batchUserId,
                    });
                    return {
                        orderId: id,
                        success: !error && data?.[0]?.success,
                        result: data?.[0],
                        error: error?.message,
                    };
                })
            );

            return NextResponse.json({
                type: 'BATCH',
                results,
                summary: {
                    total: orderIds.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                }
            });
        }

        // Single order cancellation
        if (!orderId || !userId) {
            return NextResponse.json({ error: 'Missing orderId or userId' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        let result;
        const startTime = performance.now();

        switch (cancelType) {
            case 'SOFT':
                // Soft cancel only - marks as CANCELLING, prevents new matches
                const { data: softData, error: softError } = await supabase
                    .rpc('soft_cancel_order', {
                        p_order_id: orderId,
                        p_user_id: userId,
                    });
                
                if (softError) throw softError;
                
                result = {
                    type: 'SOFT',
                    ...softData?.[0],
                    latencyMs: Math.round(performance.now() - startTime),
                };
                break;

            case 'HARD':
                // Hard cancel only - requires order to be in CANCELLING state
                const { data: hardData, error: hardError } = await supabase
                    .rpc('hard_cancel_order', {
                        p_order_id: orderId,
                        p_user_id: userId,
                        p_is_system: false,
                    });
                
                if (hardError) throw hardError;
                
                result = {
                    type: 'HARD',
                    ...hardData?.[0],
                    latencyMs: Math.round(performance.now() - startTime),
                };
                break;

            case 'INFLIGHT':
            default:
                // Full in-flight handling - soft cancel + wait + hard cancel
                const { data: inflightData, error: inflightError } = await supabase
                    .rpc('cancel_with_inflight_handling', {
                        p_order_id: orderId,
                        p_user_id: userId,
                    });
                
                if (inflightError) throw inflightError;
                
                result = {
                    type: 'INFLIGHT',
                    ...inflightData?.[0],
                    latencyMs: Math.round(performance.now() - startTime),
                };
                break;
        }

        return NextResponse.json({
            success: result?.success || false,
            ...result,
        });

    } catch (error: any) {
        console.error('Error cancelling order:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to cancel order' },
            { status: 500 }
        );
    }
}
