import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Admin client with service role key
const getAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

// POST /api/admin/markets/seed - Seed orderbook for existing markets
export async function POST(req: NextRequest) {
    try {
        // Check admin authorization
        const serverClient = await createServerClient();
        const { data: { user } } = await serverClient.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get admin profile - use explicit any to avoid type issues
        const { data: profile } = await serverClient
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .maybeSingle() as any;

        const isAdmin = profile?.is_admin === true || profile?.is_super_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = getAdminClient();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { marketId, initialLiquidity } = body;

        // If specific marketId provided, seed only that market
        if (marketId) {
            const result = await seedMarketOrderbook(supabase, marketId, user.id, initialLiquidity || 10000);
            return NextResponse.json(result);
        }

        // Otherwise, seed all markets without orders
        const { data: markets, error: marketsError } = await supabase
            .from('markets')
            .select('id, name, initial_liquidity, liquidity')
            .eq('status', 'active');

        if (marketsError) {
            return NextResponse.json({ error: marketsError.message }, { status: 500 });
        }

        const results = [];
        for (const market of markets || []) {
            // Check if orders already exist
            const { data: existing } = await supabase
                .from('orders')
                .select('id')
                .eq('market_id', market.id)
                .limit(1);

            if (existing && existing.length > 0) {
                results.push({ marketId: market.id, status: 'skipped', reason: 'orders_exist' });
                continue;
            }

            const result = await seedMarketOrderbook(
                supabase,
                market.id,
                user.id,
                market.initial_liquidity || market.liquidity || 10000
            );
            results.push(result);
        }

        return NextResponse.json({
            success: true,
            seeded: results.filter(r => r.status === 'success').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            results
        });

    } catch (error: any) {
        console.error('[admin/markets/seed] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function seedMarketOrderbook(
    supabase: ReturnType<typeof getAdminClient>,
    marketId: string,
    adminId: string,
    liquidity: number
) {
    // Check if orders already exist
    const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('market_id', marketId)
        .limit(1);

    if (existing && existing.length > 0) {
        return { marketId, status: 'skipped', reason: 'orders_exist' };
    }

    const seedPrice = 0.48;
    const quantity = Math.floor(liquidity / 2 / seedPrice);

    // Ensure uppercase outcome values
    const ensureUpperCase = (val: string): 'YES' | 'NO' => val.toUpperCase() as 'YES' | 'NO';

    const seedOrders = [
        {
            market_id: marketId,
            user_id: adminId,
            order_type: 'limit',
            side: 'buy',
            outcome: ensureUpperCase('YES'),
            price: seedPrice,
            quantity: quantity,
            filled_quantity: 0,
            status: 'open'
        },
        {
            market_id: marketId,
            user_id: adminId,
            order_type: 'limit',
            side: 'buy',
            outcome: ensureUpperCase('NO'),
            price: seedPrice,
            quantity: quantity,
            filled_quantity: 0,
            status: 'open'
        }
    ];

    const { error } = await supabase.from('orders').insert(seedOrders);

    if (error) {
        console.error(`[seedMarketOrderbook] Error for market ${marketId}:`, error);
        return { marketId, status: 'error', error: error.message };
    }

    return {
        marketId,
        status: 'success',
        ordersCreated: 2,
        liquidity: liquidity,
        seedPrice,
        quantityPerSide: quantity
    };
}
