import { NextRequest, NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';
import { eventService } from '@/lib/services/EventService';

export const maxDuration = 60;

import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    try {
        const signature = request.headers.get('upstash-signature') || '';
        const bodyText = await request.text();

        if (process.env.NODE_ENV === 'production' && !verifyQStashSignature(signature, bodyText)) {
            console.warn('[Resolution Trigger] Invalid QStash signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { eventId, marketId, manualOverride, workflowId } = JSON.parse(bodyText);

        if (!eventId || !marketId) {
            console.error('[Resolution Trigger] Missing eventId or marketId');
            return NextResponse.json({ error: 'Missing req fields' }, { status: 400 });
        }

        const supabase = await createServiceClient();

        // 1. Fetch event and market
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*, markets!inner(*)')
            .eq('id', eventId)
            .eq('markets.id', marketId)
            .single();

        if (eventError || !event) {
            console.error('[Resolution Trigger] Event/Market not found:', eventError);
            return NextResponse.json({ error: 'Event/Market not found' }, { status: 404 });
        }

        // 2. Check if trading is actually closed or if it's a manual override
        if (!manualOverride && new Date(event.trading_closes_at) > new Date()) {
            console.log(`[Resolution Trigger] Trading for event ${eventId} has not closed yet.`);
            return NextResponse.json({ message: 'Trading not yet closed', status: 'skipped' });
        }

        if (event.status === 'resolved' || event.markets[0].status === 'resolved') {
            console.log(`[Resolution Trigger] Event ${eventId} is already resolved.`);
            return NextResponse.json({ message: 'Already resolved', status: 'skipped' });
        }

        console.log(`[Resolution Trigger] Executing verification for event: ${eventId}`);

        // Create a new run record
        const { data: runRecord } = await supabase.from('upstash_workflow_runs').insert({
            event_id: eventId,
            workflow_type: 'resolution',
            status: 'running',
        }).select('id').single();

        // 3. Execute Verification Workflow
        // In a fully integrated system, workflowId would come from DB. 
        // For now, we stub it to trigger the generic UpstashOrchestrator.
        const wId = workflowId || 'default-ai-workflow';

        let result;
        try {
            result = await executeVerificationWorkflow(eventId, wId, {
                question: event.question,
                description: event.description,
                category: event.category,
                tradingEnds: event.trading_closes_at
            });
        } catch (execError: any) {
            console.error('[Resolution Trigger] Orchestrator execution failed:', execError);

            // Fallback: If executeVerificationWorkflow fails (e.g., config not found, endpoints missing),
            // we mark it as uncertain so human admin can step in.
            result = {
                outcome: 'uncertain',
                confidence: 0,
                reasoning: `Orchestrator failed: ${execError.message}`,
                totalExecutionTime: Date.now() - startTime
            };
        }

        // 4. Update the run record
        await supabase.from('upstash_workflow_runs').update({
            status: result.outcome === 'uncertain' || result.outcome === 'escalated' ? 'failed' : 'completed',
            result: result,
            completed_at: new Date().toISOString()
        }).eq('id', runRecord?.id);

        // 5. If successful and confident, settle the market
        if ((result.outcome === 'yes' || result.outcome === 'no') && result.confidence >= 80) {
            // Usually 1 = YES, 2 = NO in binary CLOB systems
            const outcomeNumber = result.outcome === 'yes' ? 1 : 2;

            await eventService.resolveEvent(eventId, outcomeNumber, 'system_resolution', `AI Confidence: ${result.confidence}%`);

            return NextResponse.json({
                success: true,
                resolution: result.outcome,
                confidence: result.confidence,
                status: 'settled'
            });
        } else {
            console.log(`[Resolution Trigger] Low confidence or uncertain (${result.confidence}%). Escalating for manual review.`);

            // Mark event as in dispute/manual review
            await supabase.from('events').update({ status: 'in_dispute' }).eq('id', eventId);
            await supabase.from('markets').update({ status: 'in_dispute' }).eq('id', marketId);

            return NextResponse.json({
                success: true,
                resolution: 'escalated',
                confidence: result.confidence,
                status: 'escalated'
            });
        }

    } catch (error: any) {
        console.error('[Resolution Trigger] Fatal error:', error);

        // Attempt to log to DLQ
        try {
            const supabase = await createServiceClient();
            await supabase.from('workflow_dlq').insert({
                workflow_type: 'resolution-trigger',
                error: error.message,
            });
        } catch (dlqError) {
            console.error('[Resolution Trigger] Failed to log to DLQ:', dlqError);
        }

        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
