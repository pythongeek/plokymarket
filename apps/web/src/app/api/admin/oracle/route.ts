import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OracleService } from '@/lib/oracle/service';

const oracleService = new OracleService();

/**
 * GET /api/admin/oracle - List oracle requests
 * Query params: ?market_id=...&status=...
 */
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('market_id');
        const status = searchParams.get('status');
        const pending = searchParams.get('pending') === 'true';

        if (pending) {
            // Fetch markets that have closed but have no oracle requests yet
            const now = new Date().toISOString();

            // Subquery to find market_ids that already have requests
            const { data: existingRequests } = await (supabase
                .from('oracle_requests')
                .select('market_id') as any);

            const excludedIds = (existingRequests as any[])?.map((r: any) => r.market_id) || [];

            let pendingQuery = (supabase
                .from('markets')
                .select('id, question, category, status, trading_closes_at') as any)
                .lt('trading_closes_at', now)
                .not('status', 'in', '("resolved","cancelled")');

            if (excludedIds.length > 0) {
                pendingQuery = pendingQuery.not('id', 'in', `(${excludedIds.map((id: string) => `"${id}"`).join(',')})`);
            }

            const { data: pendingMarkets, error: pendingError } = await pendingQuery.limit(20);
            if (pendingError) throw pendingError;

            return NextResponse.json({ data: pendingMarkets });
        }

        let query = (supabase
            .from('oracle_requests')
            .select('*, markets!inner(question, status, category)') as any)
            .order('created_at', { ascending: false });

        if (marketId) query = query.eq('market_id', marketId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query.limit(50);
        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/oracle - Propose outcome for a market
 * Body: { market_id: string, context?: any }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Admin check
        const { data: profile } = await (supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single() as any);
        if (!(profile as any)?.is_admin && !(profile as any)?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { market_id, context } = body;

        if (!market_id) {
            return NextResponse.json({ error: 'market_id is required' }, { status: 400 });
        }

        // Update market status to AWAITING_RESOLUTION
        await (supabase
            .from('markets')
            .update({ status: 'awaiting_resolution' } as any)
            .eq('id', market_id) as any);

        const proposal = await oracleService.proposeOutcome(market_id, context);

        return NextResponse.json({ data: proposal });
    } catch (error: any) {
        console.error('Oracle proposal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
