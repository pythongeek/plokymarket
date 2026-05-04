import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

// POST /api/admin/markets/seed - Seed orderbook for existing markets
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        # getUserFromToken removed
    if (false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        const isAdmin = profile?.is_admin === true || profile?.is_super_admin === true;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { marketId, initialLiquidity } = body;

        // If specific marketId provided, seed only that market
        if (marketId) {
            const result = await seedMarketOrderbook(pool, marketId, userId, initialLiquidity || 10000);
            return NextResponse.json(result);
        }

        // Otherwise, seed all markets without orders
        const marketsResult = await pool.query(
            'SELECT id, name, initial_liquidity, liquidity FROM markets WHERE status = $1',
            ['active']
        );

        const results = [];
        for (const market of marketsResult.rows || []) {
            // Check if orders already exist
            const existingResult = await pool.query(
                'SELECT id FROM orders WHERE market_id = $1 LIMIT 1',
                [market.id]
            );

            if (existingResult.rows.length > 0) {
                results.push({ marketId: market.id, status: 'skipped', reason: 'orders_exist' });
                continue;
            }

            const liquidity = market.initial_liquidity || market.liquidity || 10000;
            const result = await seedMarketOrderbook(pool, market.id, userId, liquidity);
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
    pgPool: any,
    marketId: string,
    adminId: string,
    liquidity: number
) {
    // Check if orders already exist
    const existingResult = await pgPool.query(
        'SELECT id FROM orders WHERE market_id = $1 LIMIT 1',
        [marketId]
    );

    if (existingResult.rows.length > 0) {
        return { marketId, status: 'skipped', reason: 'orders_exist' };
    }

    const seedPrice = 0.48;
    const quantity = Math.floor(liquidity / 2 / seedPrice);

    const seedOrders = [
        {
            market_id: marketId,
            user_id: adminId,
            order_type: 'limit',
            side: 'buy',
            outcome: 'YES',
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
            outcome: 'NO',
            price: seedPrice,
            quantity: quantity,
            filled_quantity: 0,
            status: 'open'
        }
    ];

    const error = await pgPool.query(
        `INSERT INTO orders (market_id, user_id, order_type, side, outcome, price, quantity, filled_quantity, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9), ($10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
            seedOrders[0].market_id, seedOrders[0].user_id, seedOrders[0].order_type, seedOrders[0].side, seedOrders[0].outcome,
            seedOrders[0].price, seedOrders[0].quantity, seedOrders[0].filled_quantity, seedOrders[0].status,
            seedOrders[1].market_id, seedOrders[1].user_id, seedOrders[1].order_type, seedOrders[1].side, seedOrders[1].outcome,
            seedOrders[1].price, seedOrders[1].quantity, seedOrders[1].filled_quantity, seedOrders[1].status
        ]
    );

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
