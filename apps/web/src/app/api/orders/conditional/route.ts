import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function createConditionalOrder(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      marketId,
      type,
      triggerPrice,
      orderSide,
      orderOutcome,
      quantity,
      slippageTolerance = 0.5,
    } = body;

    // Validate required fields
    if (!marketId || !type || !triggerPrice || !orderSide || !orderOutcome || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate order type
    if (!['stop_loss', 'stop_win', 'take_profit'].includes(type)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    // Validate trigger price range
    const price = parseFloat(triggerPrice);
    if (isNaN(price) || price <= 0 || price >= 1) {
      return NextResponse.json({ error: 'Trigger price must be between 0 and 1' }, { status: 400 });
    }

    // Validate quantity
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
    }

    // Check market exists and is active
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('id, status, question')
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    if (market.status !== 'active') {
      return NextResponse.json(
        { error: 'Market is not active — conditional orders only on active markets' },
        { status: 400 }
      );
    }

    // Check user has sufficient balance (for buy orders)
    if (orderSide === 'buy') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      const requiredBalance = qty * price;
      if (!wallet || parseFloat(wallet.balance) < requiredBalance) {
        return NextResponse.json(
          { error: 'Insufficient balance for this order' },
          { status: 400 }
        );
      }
    }

    // Create conditional order
    const { data: conditionalOrder, error: insertError } = await supabase
      .from('conditional_orders')
      .insert({
        user_id: user.id,
        market_id: marketId,
        type,
        trigger_price: price,
        order_side: orderSide,
        order_outcome: orderOutcome,
        quantity: qty,
        slippage_tolerance: slippageTolerance,
        status: 'active',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (insertError) {
      console.error('Conditional order insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create conditional order' },
        { status: 500 }
      );
    }

    // Log to activity feed
    await supabase.from('activity_feed').insert({
      user_id: user.id,
      activity_type: 'conditional_order_created',
      metadata: {
        order_id: conditionalOrder.id,
        market_id: marketId,
        market_question: market.question,
        type,
        trigger_price: price,
        quantity: qty,
      },
    });

    return NextResponse.json({
      success: true,
      order: conditionalOrder,
    });
  } catch (err) {
    console.error('Conditional order error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = createConditionalOrder;
