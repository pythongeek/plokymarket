/**
 * Loser Token Burn Mechanics
 * Logical and physical burn with transparency and recovery
 */

import { createClient } from '@/lib/supabase/server';

export type BurnType = 'logical' | 'physical';
export type BurnStatus = 'pending' | 'completed' | 'failed';

export interface BurnEvent {
  id: string;
  marketId: string;
  outcome: string;
  quantity: number;
  burnType: BurnType;
  status: BurnStatus;
  
  // Blockchain details (for physical burn)
  transactionHash?: string;
  blockNumber?: number;
  burnAddress?: string;
  
  // Metadata
  triggeredBy: 'market_resolution' | 'expiration_sweep' | 'admin';
  createdAt: string;
  completedAt?: string;
  
  // For expiration sweeps
  sweepFee?: number;
  treasuryAllocation?: number;
}

export interface ExpirationSweepConfig {
  // 90-day grace period before sweep
  GRACE_PERIOD_DAYS: number;
  
  // Sweep fee: 0.5% to treasury
  TREASURY_FEE_PERCENT: number;
  
  // Remainder burned
  BURN_PERCENT: number;
}

export const DEFAULT_SWEEP_CONFIG: ExpirationSweepConfig = {
  GRACE_PERIOD_DAYS: 90,
  TREASURY_FEE_PERCENT: 0.005, // 0.5%
  BURN_PERCENT: 0.995          // 99.5%
};

export class TokenBurnManager {
  private sweepConfig: ExpirationSweepConfig;
  private burnEvents: Map<string, BurnEvent> = new Map();
  
  // Known burn addresses
  private readonly BURN_ADDRESSES = {
    ethereum: '0x000000000000000000000000000000000000dEaD',
    binance: '0x000000000000000000000000000000000000dEaD',
    polygon: '0x000000000000000000000000000000000000dEaD',
    // Bangladesh local chain (if applicable)
    bangladesh: '0x000000000000000000000000000000000000dEaD'
  };

  constructor(config: Partial<ExpirationSweepConfig> = {}) {
    this.sweepConfig = { ...DEFAULT_SWEEP_CONFIG, ...config };
  }

  /**
   * Logical burn: Mark tokens invalid in contract state
   * Purpose: Prevent confusion, reclaim storage
   */
  async logicalBurn(
    marketId: string,
    outcome: string,
    quantity: number,
    triggeredBy: BurnEvent['triggeredBy']
  ): Promise<BurnEvent> {
    const supabase = await createClient();
    
    const burnEvent: BurnEvent = {
      id: `burn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      marketId,
      outcome,
      quantity,
      burnType: 'logical',
      status: 'pending',
      triggeredBy,
      createdAt: new Date().toISOString()
    };
    
    try {
      // Mark positions as burned
      await supabase
        .from('positions')
        .update({
          status: 'burned',
          burned_at: new Date().toISOString(),
          burn_event_id: burnEvent.id
        })
        .eq('market_id', marketId)
        .eq('outcome', outcome)
        .neq('status', 'burned');
      
      // Update market state
      await supabase
        .from('markets')
        .update({
          [`${outcome}_shares_burned`]: quantity
        })
        .eq('id', marketId);
      
      burnEvent.status = 'completed';
      burnEvent.completedAt = new Date().toISOString();
      
      // Store event
      this.burnEvents.set(burnEvent.id, burnEvent);
      await this.storeBurnEvent(burnEvent);
      
      // Emit event for indexing
      await this.emitBurnEvent(burnEvent);
      
      console.log(`[TokenBurn] Logical burn completed: ${quantity} ${outcome} shares from market ${marketId}`);
      
      return burnEvent;
      
    } catch (error) {
      burnEvent.status = 'failed';
      console.error(`[TokenBurn] Logical burn failed:`, error);
      throw error;
    }
  }

  /**
   * Physical burn: Transfer to burn address
   * Purpose: Public transparency, supply tracking
   */
  async physicalBurn(
    marketId: string,
    outcome: string,
    quantity: number,
    chain: keyof typeof this.BURN_ADDRESSES = 'ethereum',
    triggeredBy: BurnEvent['triggeredBy']
  ): Promise<BurnEvent> {
    const supabase = await createClient();
    
    const burnAddress = this.BURN_ADDRESSES[chain];
    
    const burnEvent: BurnEvent = {
      id: `burn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      marketId,
      outcome,
      quantity,
      burnType: 'physical',
      status: 'pending',
      burnAddress,
      triggeredBy,
      createdAt: new Date().toISOString()
    };
    
    try {
      // In production: Execute blockchain transaction
      // const tx = await blockchain.transfer(burnAddress, quantity);
      
      // Mock transaction for demo
      const mockTxHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const mockBlockNumber = Math.floor(Date.now() / 1000);
      
      burnEvent.transactionHash = mockTxHash;
      burnEvent.blockNumber = mockBlockNumber;
      
      // Update positions
      await supabase
        .from('positions')
        .update({
          status: 'burned',
          burned_at: new Date().toISOString(),
          burn_event_id: burnEvent.id,
          burn_tx_hash: mockTxHash
        })
        .eq('market_id', marketId)
        .eq('outcome', outcome)
        .neq('status', 'burned');
      
      burnEvent.status = 'completed';
      burnEvent.completedAt = new Date().toISOString();
      
      // Store event
      this.burnEvents.set(burnEvent.id, burnEvent);
      await this.storeBurnEvent(burnEvent);
      
      // Emit event
      await this.emitBurnEvent(burnEvent);
      
      console.log(`[TokenBurn] Physical burn completed: ${quantity} ${outcome} shares`);
      console.log(`[TokenBurn] Transaction: ${mockTxHash}`);
      
      return burnEvent;
      
    } catch (error) {
      burnEvent.status = 'failed';
      console.error(`[TokenBurn] Physical burn failed:`, error);
      throw error;
    }
  }

  /**
   * Expiration sweep: Burn unredeemed tokens after 90 days
   * 0.5% to treasury, remainder burned
   */
  async expirationSweep(marketId: string): Promise<{
    totalBurned: number;
    treasuryFee: number;
    burnEvents: BurnEvent[];
  }> {
    const supabase = await createClient();
    
    // Get market
    const { data: market } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();
    
    if (!market) {
      throw new Error('Market not found');
    }
    
    // Check if 90 days since resolution
    const resolvedAt = new Date(market.resolved_at);
    const daysSinceResolution = (Date.now() - resolvedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceResolution < this.sweepConfig.GRACE_PERIOD_DAYS) {
      throw new Error(`Grace period not expired. ${Math.ceil(this.sweepConfig.GRACE_PERIOD_DAYS - daysSinceResolution)} days remaining`);
    }
    
    // Get unredeemed positions (losing outcome)
    const { data: unredeemed } = await supabase
      .from('positions')
      .select('*')
      .eq('market_id', marketId)
      .neq('outcome', market.winning_outcome)
      .neq('status', 'burned')
      .neq('status', 'redeemed');
    
    if (!unredeemed || unredeemed.length === 0) {
      return { totalBurned: 0, treasuryFee: 0, burnEvents: [] };
    }
    
    const totalQuantity = unredeemed.reduce((sum, p) => sum + p.shares, 0);
    const treasuryFee = totalQuantity * this.sweepConfig.TREASURY_FEE_PERCENT;
    const burnQuantity = totalQuantity * this.sweepConfig.BURN_PERCENT;
    
    const burnEvents: BurnEvent[] = [];
    
    // Transfer fee to treasury
    await this.transferToTreasury(marketId, treasuryFee);
    
    // Burn remaining tokens
    const burnEvent = await this.logicalBurn(
      marketId,
      'losing_outcomes',
      burnQuantity,
      'expiration_sweep'
    );
    
    burnEvent.sweepFee = treasuryFee;
    burnEvent.treasuryAllocation = treasuryFee;
    
    burnEvents.push(burnEvent);
    
    console.log(`[TokenBurn] Expiration sweep for market ${marketId}:`);
    console.log(`  Total: ${totalQuantity}, Treasury: ${treasuryFee}, Burned: ${burnQuantity}`);
    
    return {
      totalBurned: burnQuantity,
      treasuryFee,
      burnEvents
    };
  }

  /**
   * Burn all losing tokens for a resolved market
   */
  async burnLosingTokens(marketId: string, winningOutcome: string): Promise<BurnEvent[]> {
    const supabase = await createClient();
    
    const { data: market } = await supabase
      .from('markets')
      .select('outcomes')
      .eq('id', marketId)
      .single();
    
    if (!market) {
      throw new Error('Market not found');
    }
    
    const losingOutcomes = market.outcomes.filter((o: string) => o !== winningOutcome);
    const burnEvents: BurnEvent[] = [];
    
    for (const outcome of losingOutcomes) {
      // Get total shares for this outcome
      const { data: positions } = await supabase
        .from('positions')
        .select('shares')
        .eq('market_id', marketId)
        .eq('outcome', outcome)
        .neq('status', 'burned');
      
      const totalShares = positions?.reduce((sum, p) => sum + p.shares, 0) || 0;
      
      if (totalShares > 0) {
        const burnEvent = await this.logicalBurn(
          marketId,
          outcome,
          totalShares,
          'market_resolution'
        );
        burnEvents.push(burnEvent);
      }
    }
    
    return burnEvents;
  }

  /**
   * Store burn event in database
   */
  private async storeBurnEvent(event: BurnEvent): Promise<void> {
    const supabase = await createClient();
    
    await supabase.from('burn_events').insert({
      event_id: event.id,
      market_id: event.marketId,
      outcome: event.outcome,
      quantity: event.quantity,
      burn_type: event.burnType,
      status: event.status,
      transaction_hash: event.transactionHash,
      block_number: event.blockNumber,
      burn_address: event.burnAddress,
      triggered_by: event.triggeredBy,
      sweep_fee: event.sweepFee,
      treasury_allocation: event.treasuryAllocation,
      created_at: event.createdAt,
      completed_at: event.completedAt
    });
  }

  /**
   * Emit burn event for indexing/analytics
   */
  private async emitBurnEvent(event: BurnEvent): Promise<void> {
    // In production: Emit to event bus, websocket, etc.
    console.log(`[TokenBurn:Event] Burn(${event.marketId}, ${event.outcome}, ${event.quantity})`);
    
    // Could also send to analytics pipeline
    // await analytics.track('token_burn', event);
  }

  /**
   * Transfer sweep fee to treasury
   */
  private async transferToTreasury(marketId: string, amount: number): Promise<void> {
    const supabase = await createClient();
    
    await supabase.from('treasury_transfers').insert({
      market_id: marketId,
      amount,
      currency: 'BDT',
      reason: 'expiration_sweep_fee',
      transferred_at: new Date().toISOString()
    });
    
    console.log(`[TokenBurn] Transferred ${amount} to treasury from market ${marketId}`);
  }

  /**
   * Get burn statistics
   */
  async getBurnStats(): Promise<{
    totalBurned: number;
    byType: Record<BurnType, number>;
    byTrigger: Record<string, number>;
    treasuryFees: number;
  }> {
    const supabase = await createClient();
    
    const { data: events } = await supabase
      .from('burn_events')
      .select('*');
    
    const stats = {
      totalBurned: 0,
      byType: { logical: 0, physical: 0 },
      byTrigger: {} as Record<string, number>,
      treasuryFees: 0
    };
    
    for (const event of events || []) {
      stats.totalBurned += event.quantity;
      stats.byType[event.burn_type] += event.quantity;
      stats.byTrigger[event.triggered_by] = (stats.byTrigger[event.triggered_by] || 0) + event.quantity;
      stats.treasuryFees += event.treasury_allocation || 0;
    }
    
    return stats;
  }

  /**
   * Schedule automatic expiration sweeps
   */
  startAutomaticSweeps(): void {
    // Run daily
    setInterval(async () => {
      await this.runDailySweeps();
    }, 24 * 60 * 60 * 1000);
    
    console.log('[TokenBurn] Automatic expiration sweeps scheduled');
  }

  /**
   * Run daily expiration sweeps
   */
  private async runDailySweeps(): Promise<void> {
    const supabase = await createClient();
    
    // Find markets ready for sweep (90+ days since resolution)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.sweepConfig.GRACE_PERIOD_DAYS);
    
    const { data: markets } = await supabase
      .from('markets')
      .select('id')
      .eq('status', 'resolved')
      .lt('resolved_at', cutoffDate.toISOString())
      .eq('sweep_completed', false);
    
    for (const market of markets || []) {
      try {
        await this.expirationSweep(market.id);
        
        // Mark as swept
        await supabase
          .from('markets')
          .update({ sweep_completed: true })
          .eq('id', market.id);
          
      } catch (error) {
        console.error(`[TokenBurn] Sweep failed for market ${market.id}:`, error);
      }
    }
  }
}

// Singleton instance
let globalTokenBurnManager: TokenBurnManager | null = null;

export function getGlobalTokenBurnManager(
  config?: Partial<ExpirationSweepConfig>
): TokenBurnManager {
  if (!globalTokenBurnManager) {
    globalTokenBurnManager = new TokenBurnManager(config);
  }
  return globalTokenBurnManager;
}
