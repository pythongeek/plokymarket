import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { orderBookService } from '@/lib/services/orderBookService';
import { ActivityService } from '@/lib/activity';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Authenticate — all order operations require a logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { market_id, side, outcome, price, quantity, order_type = 'limit' } = body;

        // Field-level validation — all five core fields are required
        if (!market_id || !side || !outcome || !price || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        /*
          Price must be a probability between 0.01 and 0.99.
          Prices of exactly 0 or 1 are not allowed as they represent
          certainty and would break the matching logic.
        */
        if (price < 0.01 || price > 0.99) {
            return NextResponse.json(
                { error: 'Price must be between 0.01 and 0.99' },
                { status: 400 }
            );
        }

        /*
          Minimum order size is ৳10 (BDT).
          This prevents dust orders that would clog the order book.
        */
        if (quantity < 10) {
            return NextResponse.json(
                { error: 'Minimum order size is ৳10' },
                { status: 400 }
            );
        }

        // Total cost for buyer = price * quantity
        const requiredFunds = price * quantity;

        // Check the user's wallet has enough available (unlocked) balance
        const { data: wallet } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!wallet || wallet.balance < requiredFunds) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            );
        }

        /*
          For BUY orders, lock the required funds immediately so they
          cannot be double-spent while the order is open.
          Sell orders do not require upfront funds — they deliver shares.
          The `freeze_funds` RPC must exist in Supabase and must:
            1. Deduct `p_amount` from `balance`
            2. Add `p_amount` to `locked_balance`
            It should be atomic (run inside a transaction).
        */
        if (side === 'buy') {
            const { error: lockError } = await supabase.rpc('freeze_funds', {
                p_user_id: user.id,
                p_amount: requiredFunds
            });

            if (lockError) {
                return NextResponse.json(
                    { error: 'Failed to lock funds' },
                    { status: 500 }
                );
            }
        }

        // Insert the order record into the `orders` table
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                market_id,
                side,
                outcome,
                order_type,       // 'limit' by default; 'market' if specified
                price,
                quantity,
                filled_quantity: 0,   // starts unfilled
                status: 'open'    // initial status
            })
            .select()
            .single();

        if (orderError) {
            /*
              If order insertion fails, reverse the fund lock so the
              user's balance is restored. This prevents locked funds
              from being stranded on a failed order.
              The `unfreeze_funds` RPC must do the exact inverse of `freeze_funds`.
            */
            if (side === 'buy') {
                await supabase.rpc('unfreeze_funds', {
                    p_user_id: user.id,
                    p_amount: requiredFunds
                });
            }
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            );
        }

        /*
          Trigger the matching engine via a Supabase RPC.
          The `match_order` function must:
            1. Find counterpart orders at compatible prices
            2. Fill them in price-time priority
            3. Create trade records in a `trades` table
            4. Update filled_size and status on matched orders
            5. Transfer funds between wallets atomically
          This call is fire-and-forget from the API's perspective;
          errors here do NOT roll back the order — it stays open for future matching.
        */
        await supabase.rpc('match_order', { p_order_id: order.id });

        // Invalidate order book cache so next reader gets fresh data
        await orderBookService.invalidateCache(market_id);

        // Log Activity
        try {
            const activityService = new ActivityService();
            await activityService.logActivity({
                userId: user.id,
                type: 'TRADE',
                data: {
                    marketId: market_id,
                    side: side,
                    outcome: outcome,
                    price: price,
                    quantity: quantity,
                    total: price * quantity
                }
            });
        } catch (actError) {
            console.warn('[Order API] Failed to log activity:', actError);
        }

        return NextResponse.json({ success: true, order });

    } catch (error) {
        console.error('Order placement error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Authenticate
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('market_id');   // optional filter
        const status = searchParams.get('status');         // optional filter

        /*
          Fetch orders belonging to this user only.
          Users must never be able to see other users' orders via this endpoint.
          Default sort: newest first.
        */
        let query = supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        // Conditionally apply filters — only if the query param was provided
        if (marketId) {
            query = query.eq('market_id', marketId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: orders, error } = await query;

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch orders' },
                { status: 500 }
            );
        }

        return NextResponse.json({ orders });

    } catch (error) {
        console.error('Get orders error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
