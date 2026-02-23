import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { OrderBookService } from '@/lib/clob/service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const authKey = request.headers.get('x-verify-key') || searchParams.get('key');

    if (authKey !== 'polymarket-bangladesh-verify-99') {
        return NextResponse.json({ error: 'Unauthorized. Please provide ?key=polymarket-bangladesh-verify-99' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    const TEST_USER_ID = '51bedd0f-3476-4350-88d5-428c9794f448'; // Valid production user
    const TEST_MARKET_ID = '3574357a-0b1e-40c3-bb8d-614bf33b4224';

    try {
        // 1. Force Setup Wallet (Bypassing RLS via Service Role)
        await supabase.from('wallets').upsert({
            user_id: TEST_USER_ID,
            balance: 1000,
            frozen_balance: 0
        });

        // 2. Baseline
        const { data: before } = await supabase.from('wallets').select('*').eq('user_id', TEST_USER_ID).single();

        // 3. Place Order ($10 BUY)
        const result = await OrderBookService.executeOrder(supabase, TEST_MARKET_ID, {
            userId: TEST_USER_ID,
            side: 'BUY',
            price: 1,
            size: 10
        });

        // 4. Post-Trade
        const { data: after } = await supabase.from('wallets').select('*').eq('user_id', TEST_USER_ID).single();

        return NextResponse.json({
            success: true,
            before: { balance: before.balance, locked: before.locked_balance },
            after: { balance: after.balance, locked: after.locked_balance },
            diff: {
                balance: Number(before.balance) - Number(after.balance),
                locked: Number(after.locked_balance) - Number(before.locked_balance)
            },
            // Strip circular _node refs before returning
            orderResult: JSON.parse(JSON.stringify(result, (key, value) =>
                key === '_node' ? undefined : value
            ))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
