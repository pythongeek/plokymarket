/**
 * Automated Settlement Pipeline
 * 5-stage settlement process with gas optimization
 * Bangladesh-context with BDT settlement
 */

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type SettlementStage =
  | 'validation'
  | 'outcome_finalization'
  | 'redemption_activation'
  | 'auto_settle'
  | 'confirmation_tracking';

export interface SettlementStageConfig {
  stage: SettlementStage;
  action: string;
  targetLatencyMs: number;
  failureHandling: string;
}

export const SETTLEMENT_STAGES: Record<SettlementStage, SettlementStageConfig> = {
  validation: {
    stage: 'validation',
    action: 'Verify oracle signature, timestamp, market match',
    targetLatencyMs: 1,
    failureHandling: 'Reject, alert operations'
  },
  outcome_finalization: {
    stage: 'outcome_finalization',
    action: 'Set winning outcome = 1.00, losing = 0.00',
    targetLatencyMs: 10,
    failureHandling: 'Rollback, manual review'
  },
  redemption_activation: {
    stage: 'redemption_activation',
    action: 'Enable user-initiated claims',
    targetLatencyMs: 100,
    failureHandling: 'Queue for retry'
  },
  auto_settle: {
    stage: 'auto_settle',
    action: 'Execute pre-approved redemptions',
    targetLatencyMs: 2000,
    failureHandling: 'Individual retry'
  },
  confirmation_tracking: {
    stage: 'confirmation_tracking',
    action: 'Monitor blockchain, notify completion',
    targetLatencyMs: 60000,
    failureHandling: 'Escalation after 1 hour'
  }
};

export interface SettlementRequest {
  marketId: string;
  oracleConfirmation: {
    outcome: string;
    signature: string;
    timestamp: string;
    oracleType: string;
  };
  winningOutcome: string;
  settlementTrigger: 'oracle_auto' | 'admin_manual' | 'dispute_resolved';
}

export interface SettlementBatch {
  id: string;
  marketId: string;
  claims: SettlementClaim[];
  totalAmount: number;
  gasEstimate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
}

export interface SettlementClaim {
  id: string;
  userId: string;
  marketId: string;
  outcome: string;
  shares: number;
  payoutAmount: number;
  status: 'pending' | 'claimed' | 'auto_settled' | 'failed';
  optInAutoSettle: boolean;
  createdAt: string;
  claimedAt?: string;
}

export interface GasOptimizationConfig {
  // Meta-transaction settings
  relayerEnabled: boolean;
  relayerSurchargePercent: number;

  // Batch settings
  batchSize: number;
  batchIntervalMs: number;

  // Priority fee (EIP-1559 style)
  basePriorityFee: number;
  maxPriorityFee: number;
}

export const DEFAULT_GAS_CONFIG: GasOptimizationConfig = {
  relayerEnabled: true,
  relayerSurchargePercent: 0.1, // 0.1% fee
  batchSize: 100,
  batchIntervalMs: 2000,
  basePriorityFee: 1,
  maxPriorityFee: 10
};

export class SettlementPipeline {
  private gasConfig: GasOptimizationConfig;
  private pendingBatches: Map<string, SettlementBatch> = new Map();
  private activeSettlements: Map<string, SettlementRequest> = new Map();

  constructor(config: Partial<GasOptimizationConfig> = {}) {
    this.gasConfig = { ...DEFAULT_GAS_CONFIG, ...config };
    this.startBatchProcessor();
  }

  /**
   * Execute 5-stage settlement pipeline
   */
  async executeSettlement(request: SettlementRequest): Promise<{
    success: boolean;
    stageResults: Record<SettlementStage, { success: boolean; latencyMs: number; error?: string }>;
    batchId?: string;
  }> {
    console.log(`[SettlementPipeline] Starting settlement for market ${request.marketId}`);

    const stageResults: Record<SettlementStage, { success: boolean; latencyMs: number; error?: string }> = {
      validation: { success: false, latencyMs: 0 },
      outcome_finalization: { success: false, latencyMs: 0 },
      redemption_activation: { success: false, latencyMs: 0 },
      auto_settle: { success: false, latencyMs: 0 },
      confirmation_tracking: { success: false, latencyMs: 0 }
    };

    try {
      // Stage 1: Validation
      const validationStart = Date.now();
      await this.validateOracleConfirmation(request);
      stageResults.validation = { success: true, latencyMs: Date.now() - validationStart };

      // Stage 2: Outcome Finalization
      const finalizationStart = Date.now();
      await this.finalizeOutcome(request);
      stageResults.outcome_finalization = { success: true, latencyMs: Date.now() - finalizationStart };

      // Stage 3: Redemption Activation
      const activationStart = Date.now();
      await this.activateRedemptions(request);
      stageResults.redemption_activation = { success: true, latencyMs: Date.now() - activationStart };

      // Stage 4: Auto-Settle (batch processing)
      const autoSettleStart = Date.now();
      const batch = await this.processAutoSettlements(request.marketId);
      stageResults.auto_settle = { success: true, latencyMs: Date.now() - autoSettleStart };

      // Stage 5: Confirmation Tracking
      const trackingStart = Date.now();
      await this.startConfirmationTracking(request.marketId, batch?.id);
      stageResults.confirmation_tracking = { success: true, latencyMs: Date.now() - trackingStart };

      this.activeSettlements.set(request.marketId, request);

      console.log(`[SettlementPipeline] Settlement completed for market ${request.marketId}`);

      return {
        success: true,
        stageResults,
        batchId: batch?.id
      };

    } catch (error) {
      console.error(`[SettlementPipeline] Settlement failed for market ${request.marketId}:`, error);

      return {
        success: false,
        stageResults
      };
    }
  }

  /**
   * Stage 1: Validate oracle confirmation
   */
  private async validateOracleConfirmation(request: SettlementRequest): Promise<void> {
    const { oracleConfirmation } = request;

    // Verify signature (mock implementation)
    const isSignatureValid = oracleConfirmation.signature.length > 0;
    if (!isSignatureValid) {
      throw new Error('Invalid oracle signature');
    }

    // Verify timestamp is recent (within 1 hour)
    const confirmationTime = new Date(oracleConfirmation.timestamp).getTime();
    const now = Date.now();
    if (now - confirmationTime > 3600000) {
      throw new Error('Oracle confirmation timestamp too old');
    }

    // Verify market exists and is resolved
    const supabase = await createClient() as any;
    const { data: market, error } = await (supabase as any)
      .from('markets')
      .select('status, winning_outcome')
      .eq('id', request.marketId)
      .single();

    if (error || !market) {
      throw new Error('Market not found');
    }

    if ((market as any).status !== 'resolved') {
      throw new Error('Market not yet resolved');
    }

    if ((market as any).winning_outcome !== request.winningOutcome) {
      throw new Error('Winning outcome mismatch');
    }

    console.log(`[SettlementPipeline] Validation passed for market ${request.marketId}`);
  }

  /**
   * Stage 2: Finalize outcome
   */
  private async finalizeOutcome(request: SettlementRequest): Promise<void> {
    const supabase = await createClient() as any;

    // Update market settlement status
    const { error } = await (supabase as any)
      .from('markets')
      .update({
        status: 'resolved', // Use status instead of settlement_status
        resolved_at: new Date().toISOString()
      })
      .eq('id', request.marketId);

    if (error) {
      throw new Error(`Failed to finalize outcome: ${error.message}`);
    }

    console.log(`[SettlementPipeline] Outcome finalized for market ${request.marketId}`);
  }

  /**
   * Stage 3: Activate redemptions
   */
  private async activateRedemptions(request: SettlementRequest): Promise<void> {
    const supabase = await createClient() as any;

    // Get all winning positions
    const { data: positions, error } = await (supabase as any)
      .from('positions')
      .select('*')
      .eq('market_id', request.marketId)
      .eq('outcome', request.winningOutcome);

    if (error) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }

    // Create settlement claims
    const claims: SettlementClaim[] = (positions || []).map((pos: any) => ({
      id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: pos.user_id || '',
      marketId: request.marketId,
      outcome: pos.outcome,
      shares: pos.quantity || 0,
      payoutAmount: (pos.quantity || 0) * 1.00, // $1 per winning share
      status: 'pending',
      optInAutoSettle: (pos as any).auto_settle_opt_in || false,
      createdAt: new Date().toISOString()
    }));

    // Store claims in database
    if (claims.length > 0) {
      const { error: insertError } = await (supabase as any)
        .from('settlement_claims')
        .insert(claims.map(c => ({
          user_id: c.userId,
          market_id: c.marketId,
          outcome: c.outcome,
          shares: c.shares,
          payout_amount: c.payoutAmount,
          status: c.status,
          opt_in_auto_settle: c.optInAutoSettle,
          created_at: c.createdAt
        })));

      if (insertError) {
        throw new Error(`Failed to create claims: ${insertError.message}`);
      }
    }

    console.log(`[SettlementPipeline] Activated ${claims.length} redemption claims for market ${request.marketId}`);
  }

  /**
   * Stage 4: Process auto-settlements in batches
   */
  private async processAutoSettlements(marketId: string): Promise<SettlementBatch | undefined> {
    const supabase = await createClient() as any;

    // Get auto-settle opt-in claims
    const { data: autoSettleClaims, error } = await supabase
      .from('settlement_claims')
      .select('*')
      .eq('market_id', marketId)
      .eq('status', 'pending')
      .eq('opt_in_auto_settle', true)
      .limit(this.gasConfig.batchSize);

    if (error || !autoSettleClaims || autoSettleClaims.length === 0) {
      return undefined;
    }

    // Create batch
    const batch: SettlementBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      marketId,
      claims: (autoSettleClaims || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        marketId: c.market_id,
        outcome: c.outcome,
        shares: c.shares,
        payoutAmount: c.payout_amount,
        status: (c.status as any) || 'pending',
        optInAutoSettle: c.opt_in_auto_settle || false,
        createdAt: c.created_at || new Date().toISOString(),
        claimedAt: c.claimed_at || undefined
      })),
      totalAmount: (autoSettleClaims || []).reduce((sum: number, c: any) => sum + (c.payout_amount || 0), 0),
      gasEstimate: this.estimateBatchGas(autoSettleClaims.length),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.pendingBatches.set(batch.id, batch);

    console.log(`[SettlementPipeline] Created batch ${batch.id} with ${batch.claims.length} claims, total: ${batch.totalAmount} BDT`);

    return batch;
  }

  /**
   * Stage 5: Start confirmation tracking
   */
  private async startConfirmationTracking(marketId: string, batchId?: string): Promise<void> {
    // In production, this would:
    // 1. Monitor blockchain for transaction confirmations
    // 2. Update database when confirmed
    // 3. Send notifications to users
    // 4. Escalate if no confirmation after timeout

    console.log(`[SettlementPipeline] Started confirmation tracking for market ${marketId}, batch ${batchId}`);

    // Schedule escalation check
    setTimeout(() => {
      this.checkSettlementConfirmation(marketId, batchId);
    }, 3600000); // 1 hour
  }

  /**
   * Check settlement confirmation and escalate if needed
   */
  private async checkSettlementConfirmation(marketId: string, batchId?: string): Promise<void> {
    const supabase = await createClient() as any;

    // Check if settlement is confirmed
    const { data: market } = await supabase
      .from('markets')
      .select('status') // Use standard status column
      .eq('id', marketId)
      .single();

    if ((market as any)?.status !== 'resolved') { // Use resolved as the 'confirmed' equivalent in standard status
      console.warn(`[SettlementPipeline] Settlement not confirmed for market ${marketId}, escalating...`);

      // Escalate to operations team
      await this.escalateSettlement(marketId, batchId);
    }
  }

  /**
   * Escalate settlement issue to operations
   */
  private async escalateSettlement(marketId: string, batchId?: string): Promise<void> {
    const supabase = await createClient() as any;

    await supabase
      .from('settlement_escalations')
      .insert({
        market_id: marketId,
        batch_id: batchId,
        reason: 'Confirmation timeout',
        status: 'open',
        created_at: new Date().toISOString()
      });

    // Send alert (in production)
    console.error(`[SettlementPipeline] ESCALATION: Market ${marketId} settlement confirmation timeout`);
  }

  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    setInterval(async () => {
      await this.processPendingBatches();
    }, this.gasConfig.batchIntervalMs);
  }

  /**
   * Process pending settlement batches
   */
  private async processPendingBatches(): Promise<void> {
    for (const [batchId, batch] of this.pendingBatches) {
      if (batch.status !== 'pending') continue;

      batch.status = 'processing';

      try {
        // Execute batch settlement
        await this.executeBatchSettlement(batch);

        batch.status = 'completed';
        batch.processedAt = new Date().toISOString();

        console.log(`[SettlementPipeline] Batch ${batchId} completed`);
      } catch (error) {
        batch.status = 'failed';
        console.error(`[SettlementPipeline] Batch ${batchId} failed:`, error);
      }
    }
  }

  /**
   * Execute batch settlement
   */
  private async executeBatchSettlement(batch: SettlementBatch): Promise<void> {
    const supabase = await createClient() as any;

    // Calculate fees
    const relayerFee = this.gasConfig.relayerEnabled
      ? batch.totalAmount * (this.gasConfig.relayerSurchargePercent / 100)
      : 0;

    const netPayout = batch.totalAmount - relayerFee;

    // Update claims as settled
    const claimIds = batch.claims.map(c => c.id);

    await supabase
      .from('settlement_claims')
      .update({
        status: 'auto_settled',
        claimed_at: new Date().toISOString(),
        relayer_fee: relayerFee
      })
      .in('id', claimIds);

    // Credit user wallets
    for (const claim of batch.claims) {
      await supabase.rpc('credit_wallet', {
        p_user_id: claim.userId,
        p_amount: claim.payoutAmount - (relayerFee / batch.claims.length)
      });
    }

    console.log(`[SettlementPipeline] Executed batch ${batch.id}: ${batch.claims.length} claims, ${netPayout} BDT net payout`);
  }

  /**
   * Estimate gas for batch
   */
  private estimateBatchGas(claimCount: number): number {
    // Base gas + per-claim gas
    // Batch settlement achieves ~10x gas reduction
    const baseGas = 21000;
    const perClaimGas = 5000; // Optimized for batch
    return baseGas + (perClaimGas * claimCount);
  }

  /**
   * User-initiated redemption
   */
  async claimRedemption(userId: string, marketId: string): Promise<{
    success: boolean;
    claimId?: string;
    amount?: number;
    fee?: number;
    error?: string;
  }> {
    const supabase = await createClient() as any;

    // Get claim
    const { data: claim, error } = await supabase
      .from('settlement_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .eq('status', 'pending')
      .single();

    if (error || !claim) {
      return { success: false, error: 'No pending claim found' };
    }

    // Calculate fee
    const relayerFee = this.gasConfig.relayerEnabled
      ? (claim as any).payout_amount * (this.gasConfig.relayerSurchargePercent / 100)
      : 0;

    const netAmount = (claim as any).payout_amount - relayerFee;

    // Update claim
    await supabase
      .from('settlement_claims')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        relayer_fee: relayerFee
      })
      .eq('id', (claim as any).id);

    // Credit wallet
    await supabase.rpc('credit_wallet', {
      p_user_id: userId,
      p_amount: netAmount
    });

    return {
      success: true,
      claimId: claim.id,
      amount: netAmount,
      fee: relayerFee
    };
  }

  /**
   * Get settlement stats
   */
  async getStats(): Promise<{
    totalSettlements: number;
    totalClaims: number;
    totalPayout: number;
    avgGasCost: number;
    batchEfficiency: number;
  }> {
    const supabase = await createClient() as any;

    const { data: claims } = await supabase
      .from('settlement_claims')
      .select('*');

    const totalClaims = (claims as any)?.length || 0;
    const totalPayout = (claims as any)?.reduce((sum: number, c: any) => sum + (c.payout_amount || 0), 0) || 0;
    const settledClaims = (claims as any)?.filter((c: any) => c.status === 'claimed' || c.status === 'auto_settled').length || 0;

    return {
      totalSettlements: settledClaims,
      totalClaims,
      totalPayout,
      avgGasCost: this.gasConfig.relayerEnabled ? this.gasConfig.relayerSurchargePercent : 0,
      batchEfficiency: this.gasConfig.batchSize
    };
  }
}

// Singleton instance
let globalSettlementPipeline: SettlementPipeline | null = null;

export function getGlobalSettlementPipeline(
  config?: Partial<GasOptimizationConfig>
): SettlementPipeline {
  if (!globalSettlementPipeline) {
    globalSettlementPipeline = new SettlementPipeline(config);
  }
  return globalSettlementPipeline;
}
