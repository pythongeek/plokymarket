import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { jwtVerify } from 'jose';

// Validation schema for batch orders
const OrderSchema = z.object({
  marketId: z.string().uuid(),
  outcome: z.enum(['YES', 'NO']).or(z.string()), // Allow custom outcomes for multi-outcome
  side: z.enum(['buy', 'sell']).default('buy'),
  orderType: z.enum(['limit', 'market']).default('limit'),
  price: z.number().min(0.01).max(0.99),
  quantity: z.number().int().min(1).max(100000),
  idempotency_key: z.string().optional(),
});

const BatchOrderSchema = z.object({
  orders: z.array(OrderSchema).min(1).max(20),
});

/**
 * POST /api/orders/batch
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET'
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
    const supabase = createPublicClient();
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = BatchOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { orders } = validation.data;

    // Calculate total cost theoretically needed
    const totalCost = orders.reduce(
      (sum, o) => sum + o.price * o.quantity,
      0
    );

    // Step 1: Create batch record first
    const { data: batch, error: batchError } = await supabase
      .from('order_batches')
      .insert({
        user_id: user.id,
        total_cost: totalCost,
        order_count: orders.length,
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Failed to create batch' },
        { status: 500 }
      );
    }

    // Step 2: Insert orders using the new atomic RPC
    const results = await Promise.allSettled(
      orders.map(async (o, index) => {
        const itemKey = o.idempotency_key || `batch-${batch.id}-index-${index}`;

        // Single atomic execution for balance check + fund lock
        const { data: rawResult, error: atomicError } = await supabase.rpc('place_order_atomic', {
          p_user_id: user.id,
          p_market_id: o.marketId,
          p_side: o.side,
          p_outcome: o.outcome,
          p_price: o.price,
          p_quantity: o.quantity,
          p_order_type: o.orderType,
          p_idempotency_key: itemKey,
        });

        const result = rawResult as { error?: string, order_id?: string } | null;

        if (atomicError || result?.error) {
          throw new Error(result?.error || atomicError?.message || 'Atomic Placement Failed');
        }

        const orderId = result?.order_id;
        if (!orderId) {
          throw new Error('Order placement failed (no ID returned)');
        }

        // Let the order associate with the batch, but place_order_atomic doesn't accept batch_id atm.
        // It's manually recorded or linked asynchronously, for now we will just execute match.
        // Call matching engine RPC
        const { error: matchError } = await supabase.rpc('match_order', {
          p_order_id: orderId,
        });

        if (matchError) {
          console.error('[Batch Order] Match Error:', matchError);
        }

        return { orderId };
      })
    );

    const filled = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - filled;

    // Link successful orders to batch
    const successfulOrderIds = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<{orderId: string}>).value.orderId)
      .filter(Boolean);

    if (successfulOrderIds.length > 0) {
      await supabase
        .from('orders')
        .update({ batch_id: batch.id })
        .in('id', successfulOrderIds);
    }

    // Step 3: Update batch status
    const finalStatus =
      filled === orders.length ? 'completed' :
        failed === orders.length ? 'failed' :
          'partial';

    await supabase
      .from('order_batches')
      .update({
        status: finalStatus,
        filled_count: filled,
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);

    return NextResponse.json({
      batchId: batch.id,
      total: orders.length,
      filled,
      failed,
      status: finalStatus,
    });
  } catch (error) {
    console.error('[Batch Order] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/batch
 * Get user's batch orders
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createPublicClient();
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('order_batches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('[Batch Orders List] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
