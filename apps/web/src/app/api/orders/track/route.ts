import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/orders/track - Track resting order for maker rebates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, action, marketId, side, price, quantity } = body;
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
