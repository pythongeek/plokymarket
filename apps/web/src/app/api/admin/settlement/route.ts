import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SettlementEngine } from '@/lib/settlement/SettlementEngine';

const settlementEngine = new SettlementEngine();

/**
 * GET /api/admin/settlement - List settlement claims and batches
 * Query: ?market_id=... or list all recent
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('market_id');

        // Fetch claims
        let claimsQuery = supabase
            .from('settlement_claims')
            .select('*, markets(question, status)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (marketId) claimsQuery = claimsQuery.eq('market_id', marketId);
        const { data: claims, error: claimsError } = await claimsQuery;

        // Fetch batches
        let batchesQuery = supabase
            .from('settlement_batches')
            .select('*, markets(question, status)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (marketId) batchesQuery = batchesQuery.eq('market_id', marketId);
        const { data: batches, error: batchesError } = await batchesQuery;

        // Fetch stats
        const { data: claimStats } = await supabase
            .from('settlement_statistics')
            .select('*')
            .single();

        return NextResponse.json({
            data: {
                claims: claims || [],
                batches: batches || [],
                stats: claimStats || null,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/settlement - Trigger settlement for a resolved market
 * Body: { market_id: string }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Admin check
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { market_id } = body;

        if (!market_id) {
            return NextResponse.json({ error: 'market_id is required' }, { status: 400 });
        }

        // Verify market is resolved
        const { data: market } = await supabase
            .from('markets')
            .select('status, winning_outcome')
            .eq('id', market_id)
            .single();

        if (!market) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        if (market.status !== 'resolved') {
            return NextResponse.json(
                { error: `Market must be resolved before settlement. Current status: ${market.status}` },
                { status: 400 }
            );
        }

        // Trigger settlement
        const result = await settlementEngine.processMarket(market_id, market.winning_outcome);

        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error('Settlement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
