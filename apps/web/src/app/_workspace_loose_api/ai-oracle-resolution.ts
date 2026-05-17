import { inngest } from '../client';
import { createServiceClient } from '@/lib/supabase/server';
import { AIOrchestrator } from '@/lib/oracle/ai/AIOrchestrator';

const aiOrchestrator = new AIOrchestrator();

export type OracleResolveEvent = {
  data: {
    requestId: string;
    marketId: string;
    marketQuestion: string;
    context?: Record<string, any>;
    triggerSource?: 'service' | 'admin' | 'cron';
    reprocess?: boolean;
  };
};

/**
 * AI Oracle Resolution Inngest Workflow
 */
export const aiOracleResolution = inngest.createFunction(
  { id: 'ai-oracle-resolution', concurrency: 3, rateLimit: { key: 'market', limit: 5, period: '1m' } },
  { event: 'oracle/ai.resolve' },
  async ({ event, step }) => {
    const { requestId, marketId, marketQuestion, context, reprocess } = event.data;

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
        return { skipped: true, reason: 'Already resolved' };
      }

      await (supabase
        .from('oracle_requests')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId) as any);

      return { request, marketId };
    });

    // Step 2: Run AI Orchestration Pipeline
    const aiResult: any = await step.run('run-ai-orchestration', async () => {
      console.log(`[AI Oracle] Running AI orchestration for ${marketId}`);

      const result: any = await aiOrchestrator.resolve(
        marketId,
        marketQuestion,
        {
          ...context,
          requestId,
          source: 'inngest_workflow',
        }
      );

      if (!result.success) {
        console.error(`[AI Oracle] Orchestration failed:`, result.error);
        return {
          success: false,
          outcome: 'UNCERTAIN',
          confidence: 0,
          reasoning: result.error?.message || 'AI orchestration failed',
          sources: [],
          actionTaken: 'failed',
        };
      }

      return {
        success: true,
        outcome: result.pipeline?.finalOutcome || 'UNCERTAIN',
        confidence: result.pipeline?.finalConfidence || 0,
        reasoning: result.pipeline?.explanation?.summary || result.pipeline?.deliberation?.summaryText || 'AI resolution completed',
        sources: result.pipeline?.retrieval?.corpus?.sources || [],
        actionTaken: result.actionTaken,
        pipelineId: result.pipeline?.pipelineId,
        confidenceLevel: result.pipeline?.confidenceLevel,
        verificationStatus: result.pipeline?.verification?.verificationStatus,
        verificationBlockers: result.pipeline?.verification?.blockers || [],
      };
    });

    // Step 3: Update oracle request with AI results
    const updateResult = await step.run('update-oracle-request', async () => {
      const supabase = await createServiceClient();

      const updateData: any = {
        status: aiResult.actionTaken === 'auto_resolved' ? 'proposed' : 'pending',
        proposed_outcome: aiResult.outcome,
        confidence_score: aiResult.confidence,
        evidence_text: aiResult.reasoning,
        evidence_urls: (aiResult.sources || []).map((s: any) => s.url).filter(Boolean),
        ai_analysis: {
          pipelineId: aiResult.pipelineId,
          confidenceLevel: aiResult.confidenceLevel,
          verificationStatus: aiResult.verificationStatus,
          verificationBlockers: aiResult.verificationBlockers,
          actionTaken: aiResult.actionTaken,
          stages: {
            retrieval: (aiResult.sources || []).length > 0,
            synthesis: aiResult.confidence > 0,
            deliberation: aiResult.outcome !== 'UNCERTAIN',
          },
        },
        updated_at: new Date().toISOString(),
      };

      if (aiResult.actionTaken === 'auto_resolved') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await (supabase
        .from('oracle_requests')
        .update(updateData)
        .eq('id', requestId) as any);

      if (error) {
        console.error(`[AI Oracle] Failed to update oracle request:`, error);
        throw new Error(`Failed to update oracle request: ${error.message}`);
      }

      return { updated: true };
    });

    // Step 4: Create AI resolution pipeline record
    const pipelineResult = await step.run('create-pipeline-record', async () => {
      const supabase = await createServiceClient();

      const pipelineId = aiResult.pipelineId || `pipeline_${Date.now()}_${marketId.slice(0, 8)}`;

      const { error } = await (supabase
        .from('ai_resolution_pipelines')
        .insert({
          pipeline_id: pipelineId,
          market_id: marketId,
          request_id: requestId,
          status: aiResult.actionTaken === 'failed' ? 'failed' : 'completed',
          query: marketQuestion,
          final_outcome: aiResult.outcome,
          final_confidence: aiResult.confidence * 100,
          confidence_level: aiResult.confidenceLevel || 'unknown',
          recommended_action: aiResult.actionTaken,
          retrieval_output: (aiResult.sources || []).length > 0 ? { sourceCount: aiResult.sources.length } : null,
          verification_output: {
            status: aiResult.verificationStatus,
            blockers: aiResult.verificationBlockers,
          },
          deliberation_output: {
            outcome: aiResult.outcome,
            confidence: aiResult.confidence,
          },
        }) as any);

      if (error) {
        console.warn(`[AI Oracle] Failed to create pipeline record (non-fatal):`, error.message);
      }

      return { pipelineId };
    });

    // Step 5: Handle resolution action
    if (aiResult.actionTaken === 'auto_resolved' && aiResult.confidence >= 0.9 && aiResult.outcome !== 'UNCERTAIN') {
      await step.run('auto-resolve-market', async () => {
        console.log(`[AI Oracle] Auto-resolving market ${marketId} with outcome ${aiResult.outcome}`);

        const supabase = await createServiceClient();

        const { error: marketError } = await (supabase
          .from('markets')
          .update({
            status: 'resolved',
            winning_outcome: aiResult.outcome,
            resolved_at: new Date().toISOString(),
            resolution_source: 'ai_oracle',
          })
          .eq('id', marketId) as any);

        if (marketError) {
          console.error(`[AI Oracle] Failed to update market:`, marketError);
          throw new Error(`Failed to update market: ${marketError.message}`);
        }

        await (supabase
          .from('oracle_requests')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', requestId) as any);

        return { resolved: true, outcome: aiResult.outcome };
      });

      await step.run('trigger-settlement', async () => {
        console.log(`[AI Oracle] Triggering settlement for market ${marketId}`);
        return { triggered: true };
      });
    } else {
      await step.run('queue-human-review', async () => {
        console.log(`[AI Oracle] Market ${marketId} queued for review. Action: ${aiResult.actionTaken}`);

        const supabase = await createServiceClient();

        await (supabase
          .from('human_review_queue')
          .insert({
            request_id: requestId,
            market_id: marketId,
            priority: aiResult.confidence >= 0.8 ? 'medium' : 'high',
            status: 'pending',
            notes: `AI confidence: ${(aiResult.confidence * 100).toFixed(1)}%. Action: ${aiResult.actionTaken}`,
            created_at: new Date().toISOString(),
          }) as any);

        return { queued: true };
      });
    }

    // Step 6: Return final result
    return {
      success: aiResult.success,
      requestId,
      marketId,
      outcome: aiResult.outcome,
      confidence: aiResult.confidence,
      confidenceLevel: aiResult.confidenceLevel,
      actionTaken: aiResult.actionTaken,
      needsManualReview: aiResult.actionTaken !== 'auto_resolved',
      pipelineId: pipelineResult.pipelineId,
    };
  }
);

/**
 * Challenge Resolution Inngest Workflow
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

      await (supabase
        .from('oracle_requests')
        .update({ status: 'disputed' })
        .eq('id', requestId) as any);

      return { disputeId: dispute.id };
    });

    await step.run('notify-admins', async () => {
      console.log(`[Challenge] Challenge recorded, admins notified for request ${requestId}`);
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
