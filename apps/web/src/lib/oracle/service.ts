import { createClient } from '@/lib/supabase/server';
import { IResolutionStrategy, ResolutionStrategyType } from './types';
import { AiResolutionStrategy } from './strategies/ai';
import { ManualResolutionStrategy } from './strategies/manual';
import { ApiResolutionStrategy } from './strategies/api';
import { CentralizedOracleStrategy } from './strategies/centralized';
import { UMAOracleAdapter } from './strategies/uma';

const DEFAULT_CHALLENGE_WINDOW_HOURS = 2;
const MIN_BOND_AMOUNT = 50; // BDT

export class OracleService {
    private strategies: Record<ResolutionStrategyType, IResolutionStrategy>;

    constructor() {
        this.strategies = {
            AI: new AiResolutionStrategy(),
            MANUAL: new ManualResolutionStrategy(),
            ADMIN: new ManualResolutionStrategy(),
            API: new ApiResolutionStrategy(),
            UMA: new UMAOracleAdapter(),
            CENTRALIZED: new CentralizedOracleStrategy(),
        };
    }

    /**
     * 1. PROPOSE: An Agent (AI) or System initiates a resolution pipeline.
     */
    async proposeOutcome(marketId: string, context?: any) {
        const supabase = await createClient();

        // Fetch Market & Resolution Config
        const { data: market, error } = await supabase
            .from('markets')
            .select('*, resolution_systems(*)')
            .eq('id', marketId)
            .single();

        if (error || !market) throw new Error('Market or resolution system not found');

        // Determine Strategy
        const strategyType = (market.resolution_systems?.primary_method === 'ai_oracle' ? 'AI' : 'MANUAL') as ResolutionStrategyType;
        const strategy = this.strategies[strategyType];

        if (!strategy) throw new Error(`No strategy for type: ${strategyType}`);

        // Execute Strategy
        const executionContext = { ...market.resolution_data, ...context };
        const result = await strategy.resolve(market.id, market.question || market.title, executionContext);

        // Create Resolution Pipeline (Initial Insert - 'pending' to allow triggers to catch setup)
        const pipelineId = `pipe_${Date.now()}_${marketId.slice(0, 8)}`;
        const aiData = result.evidence.aiAnalysis || {};

        const { data: pipeline, error: pipeError } = await supabase
            .from('ai_resolution_pipelines')
            .insert({
                pipeline_id: pipelineId,
                market_id: marketId,
                status: 'pending',
                recommended_action: aiData.recommendedAction || 'HUMAN_REVIEW'
            })
            .select()
            .single();

        if (pipeError) throw new Error('Database error creating resolution pipeline');

        // Update Pipeline (to 'completed' to trigger tr_auto_resolve)
        const { data: updatedPipeline, error: updateError } = await supabase
            .from('ai_resolution_pipelines')
            .update({
                query: aiData.query || { marketId, context },
                retrieval_output: aiData.retrieval_output || {},
                synthesis_output: aiData.synthesis_output || {},
                deliberation_output: aiData.deliberation_output || {},
                explanation_output: aiData.explanation_output || {},
                final_outcome: result.outcome,
                final_confidence: result.evidence.confidence * 100, // DB expects Numeric(5,2)
                confidence_level: result.evidence.confidence >= 0.9 ? 'HIGH' : 'MEDIUM',
                status: 'completed'
            })
            .eq('id', pipeline.id)
            .select()
            .single();

        if (updateError) {
            console.error('Failed to update resolution pipeline', updateError);
            throw new Error('Database error updating resolution pipeline');
        }

        return updatedPipeline;
    }

    /**
     * 2. FINALIZE: Manually finalize a market (Admin Overwrite)
     */
    async manualFinalize(marketId: string, outcome: string, adminId: string, notes?: string) {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('manual_resolve_market', {
            p_market_id: marketId,
            p_outcome: outcome,
            p_admin_id: adminId,
            p_notes: notes
        });

        if (error) throw error;
        return data;
    }

    private async resolveMarketInDb(supabase: any, marketId: string, outcome: string) {
        // This is now largely handled by the DB trigger `tr_auto_resolve`,
        // but keeping a manual helper for edge cases or non-pipeline resolutions.
        const { error: mError } = await supabase
            .from('markets')
            .update({
                status: 'resolved',
                winning_outcome: outcome,
                resolved_at: new Date().toISOString()
            })
            .eq('id', marketId);

        if (mError) throw mError;
    }

    // Alias for backward compatibility / API triggering
    async requestResolution(marketId: string, context?: any) {
        return this.proposeOutcome(marketId, context);
    }
}
