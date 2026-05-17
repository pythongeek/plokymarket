/**
 * Oracle Guardian Resolution Service
 *
 * Uses MiniMax m2.7 (Hermes) as primary oracle with Vertex AI fallback.
 * Unified confidence threshold: 85%.
 * Below threshold → Human Review Queue (Expert Panel/Tribunal).
 */

import {
    resolveWithMiniMaxOracle,
    meetsAutoResolutionThreshold,
    determineResolutionAction,
    type OracleResolutionResult,
    MIN_CONFIDENCE_THRESHOLD,
} from '../ai/minimax-oracle';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ResolutionStatus =
    | 'RESOLVED'
    | 'AWAITING_REVIEW'
    | 'FAILED'
    | 'UNRESOLVED';

export interface ResolutionResult {
    status: ResolutionStatus;
    outcome: string;
    confidence: number;
    autoResolved: boolean;
    oracleResult: OracleResolutionResult;
    summaryBn: string;
}

// ── Main resolution function ──────────────────────────────────────────────────────────────────────────

export async function resolveMarket(
    marketId: string,
    eventTitle: string,
    _category?: string,
    resolutionCriteria?: string,
    existingEvidence?: string[]
): Promise<ResolutionResult> {
    console.log(
        `[Resolution] Starting resolution for market ${marketId}: "${eventTitle}"`
    );

    try {
        // Step 1: Call MiniMax Oracle (primary) with Vertex fallback
        const oracleResult = await resolveWithMiniMaxOracle(
            marketId,
            eventTitle,
            resolutionCriteria,
            existingEvidence
        );

        // Step 2: Determine action based on unified threshold
        const action = determineResolutionAction(oracleResult);
        const canAutoResolve = action === 'auto_resolve';

        // Lazy-load Supabase
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        if (canAutoResolve) {
            console.log(
                `[Resolution] ⏳ AI high confidence (${oracleResult.confidence_score}%) — holding for admin approval: ${marketId}`
            );

            // SECURITY FIX: Never auto-resolve. Always queue for admin approval.
            await (supabase.from('markets') as any).update({
                status: 'awaiting_admin_approval',
                proposed_outcome: oracleResult.resolution,
                proposed_confidence: oracleResult.confidence_score,
                resolution_details: JSON.stringify({
                    agent: 'MiniMax_M2.7_Oracle',
                    confidence: oracleResult.confidence_score,
                    reasoning: oracleResult.reasoning,
                    sources: oracleResult.sources,
                    provider: oracleResult.provider,
                    fallback_triggered: oracleResult.fallback_triggered,
                    audit_log_id: oracleResult.audit_log_id,
                    auto_resolved: false,
                    proposed_at: new Date().toISOString(),
                }),
                resolved_at: null,
            }).eq('id', marketId);

            await (supabase.from('oracle_verifications') as any).insert({
                market_id: marketId,
                verification_type: oracleResult.fallback_triggered ? 'minimax_vertex_proposed' : 'minimax_proposed',
                confidence_score: oracleResult.confidence_score,
                outcome: oracleResult.resolution,
                reasoning: oracleResult.reasoning,
                evidence: JSON.stringify({ sources: oracleResult.sources }),
                status: 'proposed',
                created_at: new Date().toISOString(),
            });

            return {
                status: 'AWAITING_REVIEW',
                outcome: oracleResult.resolution,
                confidence: oracleResult.confidence_score,
                autoResolved: false,
                oracleResult,
                summaryBn: oracleResult.reasoning,
            };
        } else {
            console.log(
                `[Resolution] ⏳ Sending market ${marketId} to Human Tribunal — confidence: ${oracleResult.confidence_score}% (< ${MIN_CONFIDENCE_THRESHOLD}%)`
            );

            await (supabase.from('markets') as any).update({
                status: 'awaiting_review',
                resolution_details: JSON.stringify({
                    agent: 'MiniMax_M2.7_Oracle',
                    confidence: oracleResult.confidence_score,
                    outcome_suggestion: oracleResult.resolution,
                    reasoning: oracleResult.reasoning,
                    sources: oracleResult.sources,
                    provider: oracleResult.provider,
                    fallback_triggered: oracleResult.fallback_triggered,
                    audit_log_id: oracleResult.audit_log_id,
                    auto_resolved: false,
                    reviewed_at: new Date().toISOString(),
                }),
            }).eq('id', marketId);

            // Insert into human review queue
            await (supabase.from('human_review_queue') as any).insert({
                market_id: marketId,
                priority: oracleResult.confidence_score >= 70 ? 'medium' : 'high',
                status: 'pending',
                notes: `AI confidence: ${oracleResult.confidence_score}%. Resolution: ${oracleResult.resolution}. Reasoning: ${oracleResult.reasoning.slice(0, 500)}`,
                created_at: new Date().toISOString(),
            });

            await (supabase.from('oracle_verifications') as any).insert({
                market_id: marketId,
                verification_type: oracleResult.fallback_triggered ? 'minimax_vertex_pending' : 'minimax_pending',
                confidence_score: oracleResult.confidence_score,
                outcome: oracleResult.resolution,
                reasoning: oracleResult.reasoning,
                evidence: JSON.stringify({ sources: oracleResult.sources }),
                status: 'pending',
                created_at: new Date().toISOString(),
            });

            return {
                status: 'AWAITING_REVIEW',
                outcome: oracleResult.resolution,
                confidence: oracleResult.confidence_score,
                autoResolved: false,
                oracleResult,
                summaryBn: oracleResult.reasoning,
            };
        }
    } catch (err) {
        console.error(
            `[Resolution] ❌ Failed to resolve market ${marketId}:`,
            err
        );

        return {
            status: 'FAILED',
            outcome: 'UNRESOLVED',
            confidence: 0,
            autoResolved: false,
            oracleResult: {
                resolution: 'UNKNOWN',
                confidence_score: 0,
                reasoning: 'ওরাকল এজেন্ট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। অ্যাডমিন ম্যানুয়ালি রিভিউ করুন।',
                sources: [],
                provider: 'minimax',
            },
            summaryBn: 'ওরাকল এজেন্ট প্রক্রিয়াকরণে ত্রুটি ঘটেছে।',
        };
    }
}

// Re-export types
export type { OracleResolutionResult } from '../ai/minimax-oracle';
