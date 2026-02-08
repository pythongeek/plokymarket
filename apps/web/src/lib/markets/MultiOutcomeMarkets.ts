/**
 * Multi-Outcome Markets
 * Categorical (2-20 outcomes) and Scalar (continuous range) markets
 * CTF (Conditional Tokens Framework) implementation
 */

import { createClient } from '@/lib/supabase/server';

// ============================================
// CATEGORICAL MARKETS
// ============================================

export interface CategoricalMarketConfig {
  type: 'categorical';
  outcomes: string[]; // 2-20 outcomes
  minLiquidity: number;
  creatorAddress: string;
}

export interface CategoricalMarketValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CategoricalMarketManager {
  private readonly MIN_OUTCOMES = 2;
  private readonly MAX_OUTCOMES = 20;
  private readonly MIN_LIQUIDITY = 1000; // BDT

  /**
   * Validate categorical market creation
   */
  validate(config: CategoricalMarketConfig): CategoricalMarketValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check outcome count
    if (config.outcomes.length < this.MIN_OUTCOMES) {
      errors.push(`Minimum ${this.MIN_OUTCOMES} outcomes required`);
    }
    if (config.outcomes.length > this.MAX_OUTCOMES) {
      errors.push(`Maximum ${this.MAX_OUTCOMES} outcomes allowed`);
    }

    // Check for duplicates
    const uniqueOutcomes = new Set(config.outcomes);
    if (uniqueOutcomes.size !== config.outcomes.length) {
      errors.push('Outcomes must be unique');
    }

    // Check mutually exclusive
    const overlapping = this.detectOverlappingOutcomes(config.outcomes);
    if (overlapping.length > 0) {
      errors.push(`Overlapping outcomes detected: ${overlapping.join(', ')}`);
    }

    // Check exhaustive
    if (!this.isExhaustive(config.outcomes)) {
      warnings.push('Outcomes may not be exhaustive (missing "Other"?)');
    }

    // Check liquidity
    if (config.minLiquidity < this.MIN_LIQUIDITY) {
      errors.push(`Minimum liquidity commitment: ${this.MIN_LIQUIDITY} BDT`);
    }

    // Check objective resolution criteria
    if (!this.hasObjectiveCriteria(config.outcomes)) {
      warnings.push('Ensure objective resolution criteria for each outcome');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Detect overlapping outcomes
   */
  private detectOverlappingOutcomes(outcomes: string[]): string[] {
    const overlapping: string[] = [];
    
    for (let i = 0; i < outcomes.length; i++) {
      for (let j = i + 1; j < outcomes.length; j++) {
        if (this.areOverlapping(outcomes[i], outcomes[j])) {
          overlapping.push(`${outcomes[i]} vs ${outcomes[j]}`);
        }
      }
    }
    
    return overlapping;
  }

  /**
   * Check if two outcomes overlap semantically
   */
  private areOverlapping(a: string, b: string): boolean {
    const a_lower = a.toLowerCase();
    const b_lower = b.toLowerCase();
    
    // Check for containment
    if (a_lower.includes(b_lower) || b_lower.includes(a_lower)) {
      return true;
    }
    
    // Check for Bangladesh-specific overlaps
    const politicalParties = ['awami league', 'bnp', 'jamaat'];
    const hasPoliticalOverlap = politicalParties.some(p => 
      (a_lower.includes(p) && b_lower.includes(p))
    );
    
    return hasPoliticalOverlap;
  }

  /**
   * Check if outcomes are exhaustive
   */
  private isExhaustive(outcomes: string[]): boolean {
    const hasOther = outcomes.some(o => 
      o.toLowerCase().includes('other') || 
      o.toLowerCase().includes('none of the above')
    );
    return hasOther;
  }

  /**
   * Check for objective resolution criteria
   */
  private hasObjectiveCriteria(outcomes: string[]): boolean {
    // In production, this would check resolution criteria in metadata
    return true;
  }

  /**
   * Normalize prices to sum to $1.00
   */
  normalizePrices(prices: number[]): number[] {
    const sum = prices.reduce((a, b) => a + b, 0);
    if (sum === 0) return prices.map(() => 1 / prices.length);
    return prices.map(p => p / sum);
  }

  /**
   * Create categorical market
   */
  async createMarket(config: CategoricalMarketConfig): Promise<{
    success: boolean;
    marketId?: string;
    error?: string;
  }> {
    const validation = this.validate(config);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    const supabase = await createClient();
    
    try {
      // Create market
      const { data: market, error } = await supabase
        .from('markets')
        .insert({
          type: 'categorical',
          question: config.outcomes.join(' vs '),
          outcomes: config.outcomes,
          outcome_prices: config.outcomes.map(() => 1 / config.outcomes.length),
          total_price: 1.0,
          min_liquidity: config.minLiquidity,
          creator_address: config.creatorAddress,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Lock creator liquidity
      await supabase.rpc('lock_creator_liquidity', {
        p_creator: config.creatorAddress,
        p_amount: config.minLiquidity,
        p_market: market.id
      });
      
      return { success: true, marketId: market.id };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Creation failed' 
      };
    }
  }
}

// ============================================
// SCALAR MARKETS
// ============================================

export interface ScalarMarketConfig {
  type: 'scalar';
  lowerBound: number;
  upperBound: number;
  unit: string; // '%', 'BDT', 'runs', etc.
  creatorAddress: string;
}

export interface ScalarPosition {
  userId: string;
  marketId: string;
  positionType: 'long' | 'short';
  shares: number;
  entryPrice: number;
}

export class ScalarMarketManager {
  /**
   * Calculate long token value
   */
  calculateLongValue(resolvedValue: number, lowerBound: number, upperBound: number): number {
    if (resolvedValue < lowerBound) return 0;
    if (resolvedValue > upperBound) return 1;
    return (resolvedValue - lowerBound) / (upperBound - lowerBound);
  }

  /**
   * Calculate short token value
   */
  calculateShortValue(resolvedValue: number, lowerBound: number, upperBound: number): number {
    return 1 - this.calculateLongValue(resolvedValue, lowerBound, upperBound);
  }

  /**
   * Create scalar market
   */
  async createMarket(config: ScalarMarketConfig): Promise<{
    success: boolean;
    marketId?: string;
    error?: string;
  }> {
    if (config.lowerBound >= config.upperBound) {
      return { success: false, error: 'Lower bound must be less than upper bound' };
    }

    const supabase = await createClient();
    
    try {
      const { data: market, error } = await supabase
        .from('markets')
        .insert({
          type: 'scalar',
          lower_bound: config.lowerBound,
          upper_bound: config.upperBound,
          unit: config.unit,
          creator_address: config.creatorAddress,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, marketId: market.id };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Creation failed' 
      };
    }
  }

  /**
   * Adjust bounds pre-trading
   */
  async adjustBoundsPreTrading(
    marketId: string,
    newLower: number,
    newUpper: number,
    creatorAddress: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    
    // Verify creator
    const { data: market } = await supabase
      .from('markets')
      .select('creator_address, status, trading_started')
      .eq('id', marketId)
      .single();
    
    if (!market) return { success: false, error: 'Market not found' };
    if (market.creator_address !== creatorAddress) {
      return { success: false, error: 'Only creator can adjust bounds' };
    }
    if (market.trading_started) {
      return { success: false, error: 'Cannot adjust bounds after trading starts' };
    }
    
    // Notify all position holders (none yet, but for future)
    await this.notifyBoundChange(marketId, newLower, newUpper);
    
    // Update bounds
    await supabase
      .from('markets')
      .update({
        lower_bound: newLower,
        upper_bound: newUpper,
        bounds_adjusted_at: new Date().toISOString()
      })
      .eq('id', marketId);
    
    return { success: true };
  }

  /**
   * Adjust bounds post-trading (requires 67% approval)
   */
  async proposeBoundsChange(
    marketId: string,
    newLower: number,
    newUpper: number,
    proposerAddress: string
  ): Promise<{ success: boolean; proposalId?: string; error?: string }> {
    const supabase = await createClient();
    
    // Create proposal
    const { data: proposal, error } = await supabase
      .from('bounds_proposals')
      .insert({
        market_id: marketId,
        proposer: proposerAddress,
        new_lower: newLower,
        new_upper: newUpper,
        status: 'voting',
        votes_for: 0,
        votes_against: 0,
        created_at: new Date().toISOString(),
        deadline_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, proposalId: proposal.id };
  }

  /**
   * Vote on bounds change
   */
  async voteOnBoundsChange(
    proposalId: string,
    voterAddress: string,
    vote: 'for' | 'against',
    shares: number
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    
    // Record vote
    await supabase.from('bounds_votes').insert({
      proposal_id: proposalId,
      voter: voterAddress,
      vote,
      shares,
      voted_at: new Date().toISOString()
    });
    
    // Update proposal vote counts
    await supabase.rpc('update_bounds_votes', {
      p_proposal: proposalId,
      p_shares: shares,
      p_vote: vote
    });
    
    // Check if threshold reached
    const { data: proposal } = await supabase
      .from('bounds_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();
    
    if (proposal) {
      const { data: totalShares } = await supabase
        .rpc('get_market_total_shares', { p_market: proposal.market_id });
      
      const forPercent = proposal.votes_for / totalShares;
      
      if (forPercent >= 0.67) {
        // Apply bounds change
        await this.applyBoundsChange(proposalId);
      }
    }
    
    return { success: true };
  }

  /**
   * Apply approved bounds change
   */
  private async applyBoundsChange(proposalId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: proposal } = await supabase
      .from('bounds_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();
    
    if (!proposal) return;
    
    // Update market bounds
    await supabase
      .from('markets')
      .update({
        lower_bound: proposal.new_lower,
        upper_bound: proposal.new_upper,
        bounds_changed_via_vote: true
      })
      .eq('id', proposal.market_id);
    
    // Mark proposal as executed
    await supabase
      .from('bounds_proposals')
      .update({ status: 'executed' })
      .eq('id', proposalId);
  }

  /**
   * Calculate liquidity concentration incentive
   */
  calculateLiquidityIncentive(
    currentPrice: number,
    providedPrice: number,
    depth: number
  ): number {
    // Reward LPs more for providing depth near current trading price
    const distance = Math.abs(currentPrice - providedPrice);
    const maxDistance = 0.5; // Max relevant distance
    
    if (distance > maxDistance) return 0;
    
    // Linear decay: closer to price = higher reward
    const proximityFactor = 1 - (distance / maxDistance);
    return depth * proximityFactor * 1.5; // 1.5x boost for concentrated liquidity
  }

  /**
   * Notify users of bound changes
   */
  private async notifyBoundChange(
    marketId: string,
    newLower: number,
    newUpper: number
  ): Promise<void> {
    const supabase = await createClient();
    
    // Get position holders
    const { data: holders } = await supabase
      .from('positions')
      .select('user_id')
      .eq('market_id', marketId)
      .group('user_id');
    
    // Create notifications
    const notifications = (holders || []).map(h => ({
      user_id: h.user_id,
      type: 'bounds_change',
      market_id: marketId,
      message: `Market bounds adjusted to ${newLower}-${newUpper}`,
      created_at: new Date().toISOString()
    }));
    
    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  }
}

// ============================================
// FACTORY & EXPORTS
// ============================================

export class MultiOutcomeMarketFactory {
  categorical = new CategoricalMarketManager();
  scalar = new ScalarMarketManager();

  /**
   * Create market based on type
   */
  async createMarket(
    type: 'categorical' | 'scalar',
    config: CategoricalMarketConfig | ScalarMarketConfig
  ): Promise<{ success: boolean; marketId?: string; error?: string }> {
    if (type === 'categorical') {
      return this.categorical.createMarket(config as CategoricalMarketConfig);
    } else {
      return this.scalar.createMarket(config as ScalarMarketConfig);
    }
  }
}

// Singleton instance
let globalMultiOutcomeFactory: MultiOutcomeMarketFactory | null = null;

export function getGlobalMultiOutcomeFactory(): MultiOutcomeMarketFactory {
  if (!globalMultiOutcomeFactory) {
    globalMultiOutcomeFactory = new MultiOutcomeMarketFactory();
  }
  return globalMultiOutcomeFactory;
}
