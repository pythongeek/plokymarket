import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { orderBookService } from '@/lib/services/orderBookService';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createPublicClient();
        const user = await getUserFromRequest(request);

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
