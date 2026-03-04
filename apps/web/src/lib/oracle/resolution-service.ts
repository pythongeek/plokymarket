/**
 * Oracle Guardian Resolution Service
 *
 * Admin-level integration for the Oracle Guardian BD Prime Agent.
 * Provides the `resolveMarket()` function that:
 *   1. Calls the Oracle Guardian agent for evidence-backed resolution
 *   2. Auto-resolves if confidence > 95% (political) or > 90% (sports)
 *   3. Sends to manual admin review if below threshold
 *   4. Notifies users with Bengali resolution summary
 *
 * Usage in admin panel:
 *   import { resolveMarket } from '@/lib/oracle/resolution-service';
 *   await resolveMarket(marketId, eventTitle, 'Sports');
 */

import {
    runOracleGuardianAgent,
    meetsAutoResolutionThreshold,
    type OracleGuardianResult,
} from './ai/agents/VertexOracleGuardianAgent';

// ── Types ──────────────────────────────────────────────────────────────────────

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
    oracleResult: OracleGuardianResult;
    summaryBn: string;
}

// ── Main resolution function ────────────────────────────────────────────────

/**
 * Resolve a prediction market using the Oracle Guardian BD Prime.
 *
 * Automatically settles if confidence is high enough; otherwise sends
 * to manual admin review queue.
 *
 * @param marketId - UUID of the market to resolve
 * @param eventTitle - The market question / event title
 * @param category - Market category (Sports, Politics, Crypto, etc.)
 * @param resolutionCriteria - Optional specific resolution criteria
 * @param existingEvidence - Optional existing evidence URLs
 */
export async function resolveMarket(
    marketId: string,
    eventTitle: string,
    category?: string,
    resolutionCriteria?: string,
    existingEvidence?: string[]
): Promise<ResolutionResult> {
    console.log(
        `[Resolution] Starting resolution for market ${marketId}: "${eventTitle}"`
    );

    try {
        // Step 1: Call Oracle Guardian for evidence-backed decision
        const oracleResult = await runOracleGuardianAgent(
            eventTitle,
            resolutionCriteria,
            existingEvidence
        );

        // Step 2: Check if auto-resolution threshold is met
        const canAutoResolve = meetsAutoResolutionThreshold(
            oracleResult,
            category
        );

        // Lazy-load Supabase to avoid import issues
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        if (canAutoResolve) {
            // ───── AUTO-RESOLUTION (Admin approval NOT required) ─────────────
            console.log(
                `[Resolution] ✅ Auto-resolving market ${marketId} — outcome: ${oracleResult.oracle_decision.outcome}, confidence: ${oracleResult.oracle_decision.confidence_score}`
            );

            // Update market status
            await (supabase.from('markets') as any).update({
                status: 'resolved',
                resolution_outcome: oracleResult.oracle_decision.outcome,
                resolution_details: JSON.stringify({
                    agent: 'Oracle_Guardian_BD_Prime',
                    confidence: oracleResult.oracle_decision.confidence_score,
                    primary_source: oracleResult.evidence_vault.primary_source,
                    supporting_sources: oracleResult.evidence_vault.supporting_sources,
                    summary_bn: oracleResult.resolution_summary_bn,
                    source_consistency: oracleResult.metadata.source_consistency,
                    auto_resolved: true,
                    resolved_at: new Date().toISOString(),
                }),
                resolved_at: new Date().toISOString(),
            }).eq('id', marketId);

            // Log oracle verification entry
            await (supabase.from('oracle_verifications') as any).insert({
                market_id: marketId,
                verification_type: 'oracle_guardian_auto',
                confidence_score: oracleResult.oracle_decision.confidence_score,
                outcome: oracleResult.oracle_decision.outcome,
                reasoning: oracleResult.resolution_summary_bn,
                evidence: JSON.stringify(oracleResult.evidence_vault),
                status: 'verified',
                created_at: new Date().toISOString(),
            });

            return {
                status: 'RESOLVED',
                outcome: oracleResult.oracle_decision.outcome,
                confidence: oracleResult.oracle_decision.confidence_score,
                autoResolved: true,
                oracleResult,
                summaryBn: oracleResult.resolution_summary_bn,
            };
        } else {
            // ───── MANUAL REVIEW (Send to admin queue) ───────────────────────
            console.log(
                `[Resolution] ⏳ Sending market ${marketId} to manual review — confidence: ${oracleResult.oracle_decision.confidence_score}`
            );

            // Update market status to awaiting review
            await (supabase.from('markets') as any).update({
                status: 'awaiting_review',
                resolution_details: JSON.stringify({
                    agent: 'Oracle_Guardian_BD_Prime',
                    confidence: oracleResult.oracle_decision.confidence_score,
                    outcome_suggestion: oracleResult.oracle_decision.outcome,
                    primary_source: oracleResult.evidence_vault.primary_source,
                    supporting_sources: oracleResult.evidence_vault.supporting_sources,
                    summary_bn: oracleResult.resolution_summary_bn,
                    source_consistency: oracleResult.metadata.source_consistency,
                    auto_resolved: false,
                    reviewed_at: new Date().toISOString(),
                }),
            }).eq('id', marketId);

            // Log oracle verification as pending
            await (supabase.from('oracle_verifications') as any).insert({
                market_id: marketId,
                verification_type: 'oracle_guardian_pending',
                confidence_score: oracleResult.oracle_decision.confidence_score,
                outcome: oracleResult.oracle_decision.outcome,
                reasoning: oracleResult.resolution_summary_bn,
                evidence: JSON.stringify(oracleResult.evidence_vault),
                status: 'pending',
                created_at: new Date().toISOString(),
            });

            return {
                status: 'AWAITING_REVIEW',
                outcome: oracleResult.oracle_decision.outcome,
                confidence: oracleResult.oracle_decision.confidence_score,
                autoResolved: false,
                oracleResult,
                summaryBn: oracleResult.resolution_summary_bn,
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
                oracle_decision: {
                    outcome: 'UNRESOLVED',
                    confidence_score: 0,
                    certainty_level_bn: 'ত্রুটির কারণে নির্ধারণ করা সম্ভব হয়নি',
                },
                evidence_vault: {
                    primary_source: '',
                    supporting_sources: [],
                    extracted_quote_bn: '',
                },
                resolution_summary_bn:
                    'ওরাকল এজেন্ট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। অ্যাডমিন ম্যানুয়ালি রিভিউ করুন।',
                metadata: {
                    processed_at: new Date().toISOString(),
                    source_consistency: 'CONFLICTING',
                },
            },
            summaryBn:
                'ওরাকল এজেন্ট প্রক্রিয়াকরণে ত্রুটি ঘটেছে। অ্যাডমিন ম্যানুয়ালি রিভিউ করুন।',
        };
    }
}

// Re-export types
export type { OracleGuardianResult } from './ai/agents/VertexOracleGuardianAgent';
