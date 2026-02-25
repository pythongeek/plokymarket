import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OracleService } from '@/lib/oracle/service';

const oracleService = new OracleService();

/**
 * GET /api/admin/oracle/[requestId] - Get single oracle request
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { requestId } = await params;

        const { data, error } = await (supabase
            .from('oracle_requests')
            .select('*, markets(question, status, category, winning_outcome)')
            .eq('id', requestId)
            .single() as any);

        if (error) throw error;

        // Also fetch related disputes
        const { data: disputes } = await (supabase
            .from('oracle_disputes')
            .select('*')
            .eq('request_id', requestId)
            .order('created_at', { ascending: false }) as any);

        return NextResponse.json({ data: { ...data, disputes: disputes || [] } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/oracle/[requestId] - Actions on a request
 * Body: { action: 'finalize' | 'challenge', ...params }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { requestId } = await params;

        const { data: profile } = await (supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single() as any);
        if (!(profile as any)?.is_admin && !(profile as any)?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        switch (action) {
            case 'finalize': {
                await oracleService.finalizeRequest(requestId);
                return NextResponse.json({ data: { success: true, message: 'Request finalized and market resolved' } });
            }

            case 'challenge': {
                const { reason } = body;
                if (!reason) return NextResponse.json({ error: 'Challenge reason is required' }, { status: 400 });

                const result = await oracleService.challengeOutcome(requestId, user.id, reason);
                return NextResponse.json({ data: result });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Oracle action error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
