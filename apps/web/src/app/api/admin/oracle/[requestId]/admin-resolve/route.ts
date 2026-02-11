import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/oracle/[requestId]/admin-resolve
 * Admin "God Mode" - directly resolve a market with admin's chosen outcome.
 * Body: { winning_outcome: string, reason: string }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { requestId: string } }
) {
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
            return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { winning_outcome, reason } = body;
        const requestId = params.requestId;

        if (!winning_outcome || !reason) {
            return NextResponse.json({ error: 'winning_outcome and reason are required' }, { status: 400 });
        }

        // Get the request to find market_id
        const { data: oracleRequest, error: reqError } = await supabase
            .from('oracle_requests')
            .select('market_id')
            .eq('id', requestId)
            .single();

        if (reqError || !oracleRequest) {
            return NextResponse.json({ error: 'Oracle request not found' }, { status: 404 });
        }

        // Admin Override: directly resolve
        const now = new Date().toISOString();

        // 1) Update oracle request
        await supabase
            .from('oracle_requests')
            .update({
                status: 'finalized',
                proposed_outcome: winning_outcome,
                confidence_score: 1.0,
                evidence_text: `Admin Override by ${user.email}: ${reason}`,
                finalized_at: now,
            })
            .eq('id', requestId);

        // 2) Resolve market
        await supabase
            .from('markets')
            .update({
                status: 'resolved',
                winning_outcome,
                resolved_at: now,
                resolution_source: 'ADMIN_OVERRIDE',
            })
            .eq('id', oracleRequest.market_id);

        return NextResponse.json({
            data: {
                success: true,
                message: `Market resolved via Admin Override. Outcome: ${winning_outcome}`,
                market_id: oracleRequest.market_id,
            },
        });
    } catch (error: any) {
        console.error('Admin resolve error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
