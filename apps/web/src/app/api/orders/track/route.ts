import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

// POST /api/orders/track - Track resting order for maker rebates
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


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, action, marketId, side, price, quantity } = body;
    
    const supabase = createPublicClient();
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    switch (action) {
      case 'start': {
        // Start tracking resting order
        const { data, error } = await supabase.rpc('start_resting_order_tracking', {
          p_order_id: orderId,
          p_user_id: user.id,
          p_market_id: marketId,
          p_side: side,
          p_price: price,
          p_quantity: quantity
        });
        
        if (error) throw error;
        return NextResponse.json({ data: { trackingId: data } });
      }
      
      case 'stop': {
        // Stop tracking resting order
        const { error } = await supabase.rpc('stop_resting_order_tracking', {
          p_order_id: orderId
        });
        
        if (error) throw error;
        return NextResponse.json({ data: { success: true } });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track order' },
      { status: 500 }
    );
  }
}
