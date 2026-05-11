import { createPublicClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkTradingRateLimit, addRateLimitHeaders } from '@/lib/upstash/rateLimit';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  // Fall back to cookie
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate — manual JWT validation for local auth
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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

    const supabase = createPublicClient();

    // Check market exists and is active
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('id, status, question')
      .eq('id', marketId)
      .maybeSingle();

    if (marketError || !market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    if (market.status !== 'active') {
      return NextResponse.json(
        { error: 'Market is not active — conditional orders only on active markets' },
        { status: 400 }
      );
    }

    // Apply trading rate limit
    let tradingResult;
    try {
      tradingResult = await checkTradingRateLimit(user.id, marketId);
    } catch {
      tradingResult = { allowed: true };
    }
    if (!tradingResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Trading rate limit exceeded. Please slow down.',
          code: 'TRADING_RATE_LIMITED',
          retryAfter: tradingResult.retryAfter,
        },
        { status: 429 }
      );
      return addRateLimitHeaders(response, tradingResult);
    }

    // Check user has sufficient balance (for buy orders)
    if (orderSide === 'buy') {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const requiredBalance = qty * price;
      if (!wallet || parseFloat(String(wallet.balance)) < requiredBalance) {
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
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Conditional order insert error:', insertError);
      // If table doesn't exist, return a graceful error
      if (insertError.message?.includes('relation') && insertError.message?.includes('conditional_orders')) {
        return NextResponse.json(
          { error: 'Conditional orders are not yet available. Please use regular orders instead.' },
          { status: 501 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create conditional order' },
        { status: 500 }
      );
    }

    // Log to activity feed (best-effort)
    try {
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
    } catch {
      // Ignore activity feed errors
    }

    const response = NextResponse.json({
      success: true,
      order: conditionalOrder,
    });
    return addRateLimitHeaders(response, tradingResult);
  } catch (err) {
    console.error('Conditional order error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
