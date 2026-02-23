import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/resolution/markets
 * Fetches events that are eligible for resolution based on Sections 2.3.1
 * (trading_status = 'active' AND ends_at passed AND resolution_delay passed)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Authenticate and Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const service = await createServiceClient();

        // 2. Fetch resolvable events from the new view
        const { data, error } = await service
            .from('view_resolvable_events')
            .select('*')
            .order('ends_at', { ascending: true });

        if (error) {
            console.error('[Resolution API] Fetch error:', error);
            throw error;
        }

        // 3. Enrich with UMA/Oracle status if available
        // We'll fetch from oracle_requests to see if a proposal exists
        const marketIds = data?.map(e => e.id) || [];

        if (marketIds.length > 0) {
            const { data: oracleReqs } = await service
                .from('oracle_requests')
                .select('market_id, status, proposed_outcome, confidence_score')
                .in('market_id', marketIds);

            const oracleMap = new Map();
            oracleReqs?.forEach(req => {
                oracleMap.set(req.market_id, req);
            });

            const enrichedData = data.map(e => ({
                ...e,
                oracle: oracleMap.get(e.id) || { status: 'none' }
            }));

            return NextResponse.json({ data: enrichedData });
        }

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
