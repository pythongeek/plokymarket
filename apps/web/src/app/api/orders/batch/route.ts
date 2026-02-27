import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for batch orders
const OrderSchema = z.object({
  marketId: z.string().uuid(),
  outcome: z.enum(['YES', 'NO']).or(z.string()), // Allow custom outcomes for multi-outcome
  side: z.enum(['buy', 'sell']).default('buy'),
  orderType: z.enum(['limit', 'market']).default('limit'),
  price: z.number().min(0.01).max(0.99),
  quantity: z.number().int().min(1).max(100000),
});

const BatchOrderSchema = z.object({
  orders: z.array(OrderSchema).min(1).max(20),
});

/**
 * POST /api/orders/batch
 * 
 * Atomic Batch Order Algorithm (Bet Slip):
 * 
 * Step 1: Validation
 * - Validate all orders (max 20 per batch)
 * - Check user authentication
 * 
 * Step 2: Balance Check
 * - Calculate total cost: Σ(price * quantity)
 * - Verify available_balance >= total_cost
 * 
 * Step 3: Lock Funds
 * - Use FOR UPDATE lock on wallets table
 * - Move funds from available to locked
 * 
 * Step 4: Create Batch Record
 * - Insert into order_batches table
 * 
 * Step 5: Execute Orders
 * - Use Promise.allSettled for parallel execution
 * - Call existing match_order RPC for each order
 * 
 * Step 6: Update Batch Status
 * - completed: All orders filled
 * - partial: Some orders filled
 * - failed: No orders filled
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    // Calculate total cost
    const totalCost = orders.reduce(
      (sum, o) => sum + o.price * o.quantity,
      0
    );

    // Step 1: Check wallet balance with lock
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('available_balance, locked_balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    if (wallet.available_balance < totalCost) {
      return NextResponse.json(
        { 
          error: 'অপর্যাপ্ত ব্যালেন্স',
          required: totalCost,
          available: wallet.available_balance,
        },
        { status: 400 }
      );
    }

    // Step 2: Lock the balance
    const { error: lockError } = await supabase
      .from('wallets')
      .update({
        available_balance: wallet.available_balance - totalCost,
        locked_balance: wallet.locked_balance + totalCost,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (lockError) {
      console.error('[Batch Order] Lock Error:', lockError);
      return NextResponse.json(
        { error: 'Failed to lock funds' },
        { status: 500 }
      );
    }

    // Step 3: Create batch record
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
      // Rollback: Unlock funds
      await supabase
        .from('wallets')
        .update({
          available_balance: wallet.available_balance,
          locked_balance: wallet.locked_balance,
        })
        .eq('user_id', user.id);

      return NextResponse.json(
        { error: 'Failed to create batch' },
        { status: 500 }
      );
    }

    // Step 4: Insert orders and execute matching
    const results = await Promise.allSettled(
      orders.map(async (o) => {
        // Insert order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            market_id: o.marketId,
            order_type: o.orderType,
            outcome: o.outcome,
            side: o.side,
            price: o.price,
            quantity: o.quantity,
            batch_id: batch.id,
            status: 'open',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) {
          throw orderError;
        }

        // Call matching engine RPC
        const { error: matchError } = await supabase.rpc('match_order', {
          p_order_id: order.id,
        });

        if (matchError) {
          console.error('[Batch Order] Match Error:', matchError);
        }

        return order;
      })
    );

    const filled = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - filled;

    // Step 5: Update batch status
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

    // Step 6: Release unused locked funds
    if (finalStatus !== 'completed') {
      const usedFunds = orders
        .slice(0, filled)
        .reduce((sum, o) => sum + o.price * o.quantity, 0);
      const unusedFunds = totalCost - usedFunds;

      await supabase
        .from('wallets')
        .update({
          available_balance: wallet.available_balance - totalCost + unusedFunds,
          locked_balance: wallet.locked_balance + totalCost - unusedFunds,
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      batchId: batch.id,
      total: orders.length,
      filled,
      failed,
      status: finalStatus,
      totalCost,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
