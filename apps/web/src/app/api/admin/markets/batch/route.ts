import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/markets/batch
 * Batch create markets from events
 * Body: {
 *   markets: Array<{
 *     event_id: string,
 *     name: string,
 *     name_bn: string,
 *     category: string,
 *     question: string,
 *     question_bn: string,
 *     outcomes: string[],
 *     trading_closes_at: string
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await (supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single() as any);

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const { markets } = await req.json();

        if (!Array.isArray(markets) || markets.length === 0) {
            return NextResponse.json({ error: 'No markets provided' }, { status: 400 });
        }

        console.log(`[Batch Market] Creating ${markets.length} markets...`);

        // We can't easily do atomic inserts across tables with standard Supabase client 
        // without an RPC, but we can do a batch insert to 'markets' table.
        // Note: This won't create 'outcomes' for each market if they are multi-outcome.
        // For now, let's process them in parallel or a loop for simplicity, 
        // or use a transaction-like approach if possible.

        const results = [];
        const errors = [];

        for (const marketData of markets) {
            try {
                const { data, error } = await supabase
                    .from('markets')
                    .insert({
                        event_id: marketData.event_id,
                        name: marketData.name,
                        name_bn: marketData.name_bn,
                        category: marketData.category,
                        question: marketData.question,
                        question_bn: marketData.question_bn,
                        trading_closes_at: marketData.trading_closes_at,
                        status: 'active',
                        market_type: marketData.outcomes?.length > 2 ? 'multi_outcome' : 'binary'
                    })
                    .select()
                    .single();

                if (error) throw error;

                // If categorical, we'd need to insert outcomes here too.
                // For a true "Phase 2" batch creation, we should have a dedicated RPC.

                results.push(data);
            } catch (err: any) {
                errors.push({ event_id: marketData.event_id, error: err.message });
            }
        }

        return NextResponse.json({
            success: errors.length === 0,
            count: results.length,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[Batch Market] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
