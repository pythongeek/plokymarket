import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Initialize Supabase with service role for administrative tasks
const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * POST /api/upstash-workflow/settlement
 * Handles automated payouts and settlement (Section 2.3.3)
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const payload = await request.json();
        const { eventId, winner, step, data } = payload;

        const supabase = getSupabase();

        // Step 1: Validate and fetch event details
        if (step === 'validate' || !step) {
            if (!eventId || !winner) {
                throw new Error('Missing eventId or winner in payload');
            }

            const { data: event, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (error || !event) throw new Error('Event not found');
            if (event.trading_status !== 'resolved') {
                throw new Error(`Event is not resolved. Current status: ${event.trading_status}`);
            }

            return NextResponse.json({
                step: 'validate',
                status: 'success',
                event,
                nextStep: 'transfer-locked-balances'
            });
        }

        // Step 2: Transfer locked balances to winning users
        // In a high-volume scenario, we might batch this.
        if (step === 'transfer-locked-balances') {
            const { event } = data;

            // Call the optimized SQL function for bulk settlement
            // We reuse settle_market_v2 logic but triggered from the workflow for observability
            const { data: settlementResult, error } = await supabase.rpc('settle_market_v2', {
                p_market_id: eventId, // Assuming 1:1 event to market for simplicity in this workflow
                p_winning_outcome: winner === 1 ? 'YES' : 'NO'
            });

            if (error) {
                console.error('[Settlement Workflow] SQL Error:', error);
                throw error;
            }

            return NextResponse.json({
                step: 'transfer-locked-balances',
                status: 'success',
                result: settlementResult,
                nextStep: 'finalize-settlement'
            });
        }

        // Step 3: Finalize and log
        if (step === 'finalize-settlement') {
            await supabase
                .from('admin_activity_logs')
                .insert({
                    action_type: 'workflow_completed',
                    resource_type: 'settlement',
                    resource_id: eventId,
                    change_summary: `Upstash Workflow completed settlement for event ${eventId}`
                });

            return NextResponse.json({
                step: 'finalize-settlement',
                status: 'completed',
                executionTimeMs: Date.now() - startTime
            });
        }

        return NextResponse.json(
            { error: 'Unknown workflow step', step },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[Settlement Workflow] Error:', error);
        return NextResponse.json(
            {
                error: 'Workflow failed',
                details: error.message,
                executionTimeMs: Date.now() - startTime
            },
            { status: 500 }
        );
    }
}
