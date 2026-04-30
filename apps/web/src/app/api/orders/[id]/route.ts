import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { orderBookService } from '@/lib/services/orderBookService';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: orderId } = await params;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        // Cancel via atomic RPC (unfreezes funds)
        const { data, error } = await supabase.rpc('cancel_order_atomic', {
            p_order_id: orderId,
            p_user_id: user.id
        });

        if (error || !data) {
            return NextResponse.json(
                { error: 'Cancel failed — order may already be filled or cancelled' },
                { status: 400 }
            );
        }

        // Get market_id from order for cache invalidation
        const { data: order } = await supabase
            .from('orders')
            .select('market_id')
            .eq('id', orderId)
            .single();

        if (order?.market_id) {
            await orderBookService.invalidateCache(order.market_id);
        }

        return NextResponse.json({ success: true, orderId });

    } catch (error) {
        console.error('Order cancel error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
