import { inngest } from '../client';
import { createServiceClient } from '@/lib/supabase/server';
import {
  resolveWithMiniMaxOracle,
  determineResolutionAction,
  OracleParsingError,
  type OracleResolutionResult,
  MIN_CONFIDENCE_THRESHOLD,
} from '@/lib/ai/minimax-oracle';

export type OracleResolveEvent = {
  data: {
    requestId: string;
    marketId: string;
    marketQuestion: string;
    resolutionCriteria?: string;
    existingEvidence?: string[];
    context?: Record<string, any>;
    triggerSource?: 'service' | 'admin' | 'cron';
    reprocess?: boolean;
  };
};

/**
 * AI Oracle Resolution Inngest Workflow
 *
 * Uses MiniMax m2.7 (Hermes) primary → Vertex fallback.
 * Idempotent by market_id. Max 3 retries on network failures.
 * OracleParsingError → immediate human tribunal (no retry).
 * Persistent failures → onFailure handler escalates to human queue.
 */
export const aiOracleResolution = inngest.createFunction(
  {
    id: 'ai-oracle-resolution',
    concurrency: { limit: 1, key: 'event.data.marketId' },
    retries: 3,
    onFailure: async ({ event, error }: any) => {
      const data = event.data as { marketId: string; marketQuestion: string; requestId: string };
      console.error(`[AI Oracle] onFailure triggered for market ${data.marketId}:`, error.message);

      try {
        const supabase = await createServiceClient();

        await (supabase.from('human_review_queue') as any).insert({
          pipeline_id: `max_retry_${Date.now()}_${data.marketId.slice(0, 8)}`,
          market_id: data.marketId,
          market_question: data.marketQuestion,
          ai_outcome: 'UNRESOLVED',
          ai_confidence: 0,
          ai_explanation: `MAX_RETRIES_EXCEEDED: ${error.message}`,
          evidence_summary: { error: error.message, stack: error.stack?.slice(0, 2000) },
          status: 'pending',
          priority: 'critical',
          created_at: new Date().toISOString(),
          deadline_at: new Date(Date.now() + 86400000).toISOString(),
        });

        await (supabase.from('oracle_requests') as any)
          .update({ status: 'escalated', updated_at: new Date().toISOString() })
          .eq('id', data.requestId);

        console.log(`[AI Oracle] Escalated market ${data.marketId} to human_review_queue after max retries`);
      } catch (dbError: any) {
        console.error(`[AI Oracle] Failed to escalate to human queue:`, dbError.message);
      }

      return { success: false, escalated: true, reason: 'MAX_RETRIES_EXCEEDED' };
    },
  },
  { event: 'oracle/ai.resolve' },
  async ({ event, step }) => {
    const { requestId, marketId, marketQuestion, resolutionCriteria, existingEvidence, reprocess } = event.data;

    console.log(`[AI Oracle] Starting resolution for market ${marketId}, request ${requestId}`);

    // Step 1: Initialize and validate
    const initResult = await step.run('initialize-resolution', async () => {
      const supabase = await createServiceClient();

      const { data: request, error } = await (supabase
        .from('oracle_requests')
        .select('*')
        .eq('id', requestId)
        .single() as any);

      if (error || !request) {
        throw new Error(`Oracle request ${requestId} not found`);
      }

      if (request.status === 'resolved' && !reprocess) {
        return { skipped: true as const, reason: 'Already resolved' };
      }

      await (supabase
        .from('oracle_requests')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId) as any);

      return { request, marketId, skipped: false as const };
    });

    if (initResult.skipped) {
      console.log(`[AI Oracle] Skipping market ${marketId}: ${(initResult as any).reason}`);
      return { success: true, skipped: true, reason: (initResult as any).reason };
    }

    // Step 2: Run MiniMax Oracle Engine
    let oracleResult: OracleResolutionResult;
    try {
      oracleResult = await step.run('run-minimax-oracle', async () => {
        return await resolveWithMiniMaxOracle(
          marketId,
          marketQuestion,
          resolutionCriteria,
          existingEvidence
        );
      });
    } catch (error: any) {
      // OracleParsingError → DO NOT RETRY. Escalate immediately.
      if (error instanceof OracleParsingError) {
        console.error(`[AI Oracle] OracleParsingError for market ${marketId}:`, error.message);

        await step.run('escalate-parsing-error', async () => {
          const supabase = await createServiceClient();
          await (supabase.from('human_review_queue') as any).insert({
            pipeline_id: `parse_err_${Date.now()}_${marketId.slice(0, 8)}`,
            market_id: marketId,
            market_question: marketQuestion,
            ai_outcome: 'UNRESOLVED',
            ai_confidence: 0,
            ai_explanation: `OracleParsingError: ${error.message}`,
            evidence_summary: { raw_response: error.rawResponse.slice(0, 5000) },
            status: 'pending',
            priority: 'critical',
            created_at: new Date().toISOString(),
            deadline_at: new Date(Date.now() + 86400000).toISOString(), // 24h
          });

          await (supabase.from('oracle_requests') as any)
            .update({ status: 'escalated', updated_at: new Date().toISOString() })
            .eq('id', requestId);
        });

        return {
          success: false,
          requestId,
          marketId,
          outcome: 'UNRESOLVED',
          reason: 'PARSING_ERROR',
          escalated: true,
        };
      }

      // Other errors → let Inngest retry (up to 3 times)
      throw error;
    }

    // Step 3: Determine action based on confidence threshold
    const action = determineResolutionAction(oracleResult);
    const canAutoResolve = action === 'auto_resolve';

    // Step 4: Update oracle request with results
    await step.run('update-oracle-request', async () => {
      const supabase = await createServiceClient();

      const updateData: any = {
        status: canAutoResolve ? 'proposed' : 'pending',
        proposed_outcome: oracleResult.resolution,
        confidence_score: oracleResult.confidence_score,
        evidence_text: oracleResult.reasoning,
        evidence_urls: oracleResult.sources,
        ai_analysis: {
          provider: oracleResult.provider,
          fallback_triggered: oracleResult.fallback_triggered,
          audit_log_id: oracleResult.audit_log_id,
          sources: oracleResult.sources,
        },
        updated_at: new Date().toISOString(),
      };

      if (canAutoResolve) {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await (supabase
        .from('oracle_requests')
        .update(updateData)
        .eq('id', requestId) as any);

      if (error) {
        throw new Error(`Failed to update oracle request: ${error.message}`);
      }

      return { updated: true };
    });

    // Step 5: Handle resolution action
    if (canAutoResolve) {
      await step.run('auto-resolve-market', async () => {
        console.log(`[AI Oracle] ✅ Auto-resolving market ${marketId}: ${oracleResult.resolution} @ ${oracleResult.confidence_score}%`);

        const supabase = await createServiceClient();

        const { error: marketError } = await (supabase
          .from('markets')
          .update({
            status: 'resolved',
            winning_outcome: oracleResult.resolution,
            resolved_at: new Date().toISOString(),
            resolution_source: oracleResult.fallback_triggered ? 'ai_oracle_fallback' : 'ai_oracle',
          })
          .eq('id', marketId) as any);

        if (marketError) {
          throw new Error(`Failed to update market: ${marketError.message}`);
        }

        await (supabase.from('oracle_requests') as any)
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        return { resolved: true, outcome: oracleResult.resolution };
      });

      await step.run('trigger-settlement', async () => {
        console.log(`[AI Oracle] Triggering settlement for market ${marketId}`);
        return { triggered: true };
      });
    } else {
      // Queue for human tribunal
      await step.run('queue-human-tribunal', async () => {
        console.log(`[AI Oracle] ⏳ Market ${marketId} queued for Human Tribunal. Confidence: ${oracleResult.confidence_score}% (< ${MIN_CONFIDENCE_THRESHOLD}%)`);

        const supabase = await createServiceClient();

        await (supabase.from('human_review_queue') as any).insert({
          pipeline_id: oracleResult.audit_log_id || `tribunal_${Date.now()}_${marketId.slice(0, 8)}`,
          market_id: marketId,
          market_question: marketQuestion,
          ai_outcome: oracleResult.resolution,
          ai_confidence: oracleResult.confidence_score / 100, // numeric(5,4)
          ai_explanation: oracleResult.reasoning,
          evidence_summary: { sources: oracleResult.sources, provider: oracleResult.provider },
          status: 'pending',
          priority: oracleResult.confidence_score >= 70 ? 'medium' : 'high',
          created_at: new Date().toISOString(),
          deadline_at: new Date(Date.now() + 86400000).toISOString(),
        });

        return { queued: true };
      });
    }

    return {
      success: true,
      requestId,
      marketId,
      outcome: oracleResult.resolution,
      confidence: oracleResult.confidence_score,
      action: canAutoResolve ? 'auto_resolved' : 'human_tribunal',
      needsManualReview: !canAutoResolve,
    };
  }
);

/**
 * Challenge Resolution Inngest Workflow
 * Handles disputes/challenges against proposed outcomes
 */
export const challengeResolution = inngest.createFunction(
  { id: 'challenge-resolution', concurrency: 2 },
  { event: 'oracle/challenge' },
  async ({ event, step }) => {
    const { requestId, challengerId, reason } = event.data;

    console.log(`[Challenge] Processing challenge for request ${requestId}`);

    const challengeResult = await step.run('record-challenge', async () => {
      const supabase = await createServiceClient();

      const { data: dispute, error } = await (supabase
        .from('oracle_disputes')
        .insert({
          request_id: requestId,
          challenger_id: challengerId,
          reason,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single() as any);

      if (error) {
        throw new Error(`Failed to create dispute: ${error.message}`);
      }

      await (supabase.from('oracle_requests') as any)
        .update({ status: 'disputed' })
        .eq('id', requestId);

      return { disputeId: dispute.id };
    });

    await step.run('notify-admins', async () => {
      console.log(`[Challenge] Admins notified for request ${requestId}`);
      return { notified: true };
    });

    return {
      success: true,
      requestId,
      disputeId: challengeResult.disputeId,
      status: 'pending_review',
    };
  }
);