import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

/**
 * POST /api/admin/resolution/resolve
 * Executes the atomic resolve_market SQL function (Section 2.3.2)
 * Body: { eventId: string, winner: number }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Authenticate and Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // 2. Parse Body
        const { eventId, winner } = await request.json();

        if (!eventId || !winner) {
            return NextResponse.json({ error: 'Missing eventId or winner' }, { status: 400 });
        }

        const service = await createServiceClient();

        // 3. Call RPC function resolve_market
        // Function signature: resolve_market(p_event_id UUID, p_winner INTEGER, p_resolver_id UUID)
        const { error } = await service.rpc('resolve_market', {
            p_event_id: eventId,
            p_winner: winner,
            p_resolver_id: profile.id
        });

        if (error) {
            console.error('[Resolution API] Resolution error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 4. Trigger Inngest Settlement Workflow (Section 2.3.3)
        try {
            await inngest.send({
                name: 'market/resolve',
                data: {
                    marketId: eventId,
                    resolutionSource: 'MANUAL_ADMIN'
                }
            });

            console.log(`[Resolution API] Triggered Inngest settlement workflow for event ${eventId}`);
        } catch (workflowErr) {
            console.error('[Resolution API] Failed to initiate Inngest workflow:', workflowErr);
            // We don't return error here because the market is already resolved in DB
        }

        return NextResponse.json({
            success: true,
            message: 'Market resolved successfully. Inngest payout workflow triggered.',
            eventId,
            winner
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
