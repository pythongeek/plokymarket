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
     * 1. PROPOSE: An Agent (AI) or User proposes an outcome and stakes a bond.
     */
    async proposeOutcome(marketId: string, context?: any) {
        const supabase = await createClient();

        // Fetch Market
        const { data: market, error } = await supabase
            .from('markets')
            .select('*')
            .eq('id', marketId)
            .single();

        if (error || !market) throw new Error('Market not found');

        const strategyType = (market.resolution_source_type as ResolutionStrategyType) || 'MANUAL';
        const strategy = this.strategies[strategyType];

        if (!strategy) throw new Error(`No strategy for type: ${strategyType}`);

        // Execute Strategy (to get the proposed outcome)
        // Note: If strategy is MANUAL, we expect passed-in context to have the outcome.
        // If AI, it calculates it.
        const executionContext = { ...market.resolution_data, ...context };
        const result = await strategy.resolve(market.id, market.question, executionContext);

        // Calculate Bond
        const bondAmount = result.bondAmount || MIN_BOND_AMOUNT;

        // TODO: Verify Proposer has funds (if user).
        // For System/AI, we assume the "House" puts up the bond or it's virtual.

        const challengeWindowEnd = new Date();
        challengeWindowEnd.setHours(challengeWindowEnd.getHours() + DEFAULT_CHALLENGE_WINDOW_HOURS);

        // Create Request / Proposal
        const { data: request, error: reqError } = await supabase
            .from('oracle_requests')
            .insert({
                market_id: marketId,
                request_type: 'initial',
                status: 'proposed', // Optimistic State

                proposed_outcome: result.outcome,
                confidence_score: result.evidence.confidence,
                evidence_text: result.evidence.summary,
                evidence_urls: result.evidence.urls,
                ai_analysis: result.evidence.aiAnalysis,

                bond_amount: bondAmount,
                bond_currency: 'BDT',
                challenge_window_ends_at: challengeWindowEnd.toISOString(),
            })
            .select()
            .single();

        if (reqError) {
            console.error('Failed to create proposal', reqError);
            throw new Error('Database error creating proposal');
        }

        return request;
    }

    /**
     * 2. CHALLENGE: A User challenges the proposed outcome, matching the bond.
     */
    async challengeOutcome(requestId: string, challengerId: string, reason: string) {
        const supabase = await createClient();

        // Fetch Request
        const { data: request } = await supabase.from('oracle_requests').select('*').eq('id', requestId).single();
        if (!request) throw new Error('Request not found');

        if (request.status !== 'proposed') throw new Error('Can only challenge proposed requests');

        if (new Date() > new Date(request.challenge_window_ends_at)) {
            throw new Error('Challenge window has expired');
        }

        // Lock Challenger Funds (Logic placeholder)
        // await this.walletService.lockFunds(challengerId, request.bond_amount);

        // Create Dispute
        const { error: disputeError } = await supabase
            .from('oracle_disputes')
            .insert({
                request_id: requestId,
                disputer_id: challengerId,
                bond_amount: request.bond_amount, // Match the bond
                reason: reason,
                status: 'open'
            });

        if (disputeError) throw disputeError;

        // Update Request Status
        await supabase
            .from('oracle_requests')
            .update({ status: 'disputed' })
            .eq('id', requestId);

        return { success: true };
    }

    /**
     * 3. FINALIZE: If window passed and no challenge, resolve market.
     * Or if Disputed and Admin solved it.
     */
    async finalizeRequest(requestId: string) {
        const supabase = await createClient();

        const { data: request } = await supabase.from('oracle_requests').select('*').eq('id', requestId).single();
        if (!request) throw new Error('Request not found');

        // Case A: Optimistic Success (No Dispute)
        if (request.status === 'proposed') {
            if (new Date() < new Date(request.challenge_window_ends_at)) {
                throw new Error('Challenge window active');
            }

            // Auto-Resolve Market
            await this.resolveMarketInDb(supabase, request.market_id, request.proposed_outcome);

            // Update Request
            await supabase
                .from('oracle_requests')
                .update({ status: 'finalized', finalized_at: new Date().toISOString() })
                .eq('id', requestId);

            // TODO: Return Bond to Proposer + Reward?
        }
    }

    private async resolveMarketInDb(supabase: any, marketId: string, outcome: string) {
        const { error } = await supabase
            .from('markets')
            .update({
                status: 'resolved',
                winning_outcome: outcome,
                resolved_at: new Date().toISOString()
            })
            .eq('id', marketId);

        if (error) throw error;
    }

    // Alias for backward compatibility / API triggering
    async requestResolution(marketId: string, context?: any) {
        return this.proposeOutcome(marketId, context);
    }
}
