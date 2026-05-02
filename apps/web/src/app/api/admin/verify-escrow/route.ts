import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { OrderBookService } from '@/lib/clob/service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const authKey = request.headers.get('x-verify-key') || searchParams.get('key');

    if (authKey !== 'polymarket-bangladesh-verify-99') {
        return NextResponse.json({ error: 'Unauthorized. Please provide ?key=polymarket-bangladesh-verify-99' }, { status: 401 });
    }

    const TEST_USER_ID = '51bedd0f-3476-4350-88d5-428c9794f448';
    const TEST_MARKET_ID = '3574357a-0b1e-40c3-bb8d-614bf33b4224';

    const client = await pool.connect();

    try {
        // 1. Force Setup Wallet (direct pg — bypasses RLS)
        await client.query(`
            INSERT INTO wallets (user_id, balance, locked_balance, created_at, updated_at)
            VALUES ($1, 1000, 0, NOW(), NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                balance = 1000,
                locked_balance = 0,
                updated_at = NOW()
        `, [TEST_USER_ID]);

        // 2. Baseline
        const beforeResult = await client.query(
            'SELECT balance, locked_balance FROM wallets WHERE user_id = $1',
            [TEST_USER_ID]
        );
        const before = beforeResult.rows[0];

        // 3. Place Order ($10 BUY) — OrderBookService expects a Supabase-like client
        // We provide a minimal adapter that uses the pg pool
        const dbAdapter = {
            from: (table: string) => ({
                upsert: async (data: Record<string, any>) => {
                    const keys = Object.keys(data);
                    const values = Object.values(data);
                    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                    const cols = keys.join(', ');
                    const updateCols = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
                    await client.query(
                        `INSERT INTO ${table} (${cols}) VALUES (${placeholders})
                         ON CONFLICT (user_id) DO UPDATE SET ${updateCols}`,
                        values
                    );
                },
                select: (cols: string) => ({
                    eq: (field: string, val: any) => ({
                        single: async () => {
                            const r = await client.query(
                                `SELECT ${cols === '*' ? '*' : cols} FROM ${table} WHERE ${field} = $1`,
                                [val]
                            );
                            return { data: r.rows[0], error: null };
                        }
                    })
                })
            })
        };

        const result = await OrderBookService.executeOrder(dbAdapter as any, TEST_MARKET_ID, {
            userId: TEST_USER_ID,
            side: 'buy',
            price: 1,
            size: 10
        });

        // 4. Post-Trade
        const afterResult = await client.query(
            'SELECT balance, locked_balance FROM wallets WHERE user_id = $1',
            [TEST_USER_ID]
        );
        const after = afterResult.rows[0];

        return NextResponse.json({
            success: true,
            before: { balance: before?.balance, locked: before?.locked_balance },
            after: { balance: after?.balance, locked: after?.locked_balance },
            diff: {
                balance: Number(before?.balance || 0) - Number(after?.balance || 0),
                locked: Number(after?.locked_balance || 0) - Number(before?.locked_balance || 0)
            },
            orderResult: JSON.parse(JSON.stringify(result, (key: string, value: any) =>
                key === '_node' ? undefined : value
            ))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
