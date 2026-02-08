/**
 * Payout Calculation Engine
 * Handles binary, categorical, and scalar markets with tax compliance
 */

import { Decimal } from 'decimal.js';
import { createClient } from '@/lib/supabase/server';

// Market types
export type MarketType = 'binary' | 'categorical' | 'scalar';

// Distribution options for winners
export type DistributionOption = 'immediate' | 'reinvest' | 'hold';

// Position types
export interface Position {
  userId: string;
  marketId: string;
  outcome: string;
  shares: Decimal;
  entryPrice: Decimal;
  costBasis: Decimal;
  acquiredAt: Date;
}

// Resolution data
export interface ResolutionData {
  outcome: string;
  resolvedValue?: number; // For scalar markets
  lowerBound?: number;    // For scalar markets
  upperBound?: number;    // For scalar markets
  resolvedAt: Date;
}

// Payout calculation result
export interface PayoutCalculation {
  // Core amounts
  grossPayout: Decimal;
  platformFee: Decimal;
  withholdingTax: Decimal;
  netPayout: Decimal;
  
  // Tax documentation
  costBasis: Decimal;
  holdingPeriod: number; // days
  taxableGain: Decimal;
  taxFormRequired: boolean;
  
  // Bangladesh-specific
  vatAmount?: Decimal;
  nbrReporting?: boolean;
}

// Platform fee structure
interface FeeStructure {
  platformFeePercent: Decimal;
  maxPlatformFee: Decimal;
  creatorFeePercent: Decimal;
}

const DEFAULT_FEES: FeeStructure = {
  platformFeePercent: new Decimal(0.02),  // 2%
  maxPlatformFee: new Decimal(100),       // $100 cap
  creatorFeePercent: new Decimal(0.005)   // 0.5% to creator
};

export class PayoutEngine {
  private fees: FeeStructure;
  
  // Tax thresholds
  private readonly TAX_FORM_THRESHOLD = new Decimal(600); // $600 annual
  private readonly NBR_REPORTING_THRESHOLD = new Decimal(50000); // BDT 50,000
  private readonly VAT_RATE = new Decimal(0.05); // 5% VAT

  constructor(fees: Partial<FeeStructure> = {}) {
    this.fees = { ...DEFAULT_FEES, ...fees };
  }

  /**
   * Calculate payout for any market type
   */
  calculatePayout(params: {
    marketType: MarketType;
    position: Position;
    resolution: ResolutionData;
    distributionOption: DistributionOption;
    userCountry?: string;
  }): PayoutCalculation {
    switch (params.marketType) {
      case 'binary':
        return this.calculateBinaryPayout(params);
      case 'categorical':
        return this.calculateCategoricalPayout(params);
      case 'scalar':
        return this.calculateScalarPayout(params);
      default:
        throw new Error(`Unknown market type: ${params.marketType}`);
    }
  }

  /**
   * Binary payout: winningShares × $1.00
   */
  private calculateBinaryPayout(params: {
    position: Position;
    resolution: ResolutionData;
    distributionOption: DistributionOption;
    userCountry?: string;
  }): PayoutCalculation {
    const { position, resolution } = params;
    
    // Check if position is winner
    if (position.outcome !== resolution.outcome) {
      return this.createZeroPayout(position);
    }
    
    // Winner payout: shares × $1.00
    const grossPayout = position.shares; // $1 per share
    
    return this.applyFeesAndTaxes(grossPayout, position, params.userCountry);
  }

  /**
   * Categorical payout: shares × $1.00 (winner-take-all)
   */
  private calculateCategoricalPayout(params: {
    position: Position;
    resolution: ResolutionData;
    distributionOption: DistributionOption;
    userCountry?: string;
  }): PayoutCalculation {
    const { position, resolution } = params;
    
    // Check if position is winner
    if (position.outcome !== resolution.outcome) {
      return this.createZeroPayout(position);
    }
    
    // Winner payout: shares × $1.00
    const grossPayout = position.shares;
    
    return this.applyFeesAndTaxes(grossPayout, position, params.userCountry);
  }

  /**
   * Scalar payout: positionShares × $1.00 × normalized_value
   * 
   * Formula: Long Value = (resolved - lower) / (upper - lower)
   *          Short Value = 1 - Long Value
   */
  private calculateScalarPayout(params: {
    position: Position;
    resolution: ResolutionData;
    distributionOption: DistributionOption;
    userCountry?: string;
  }): PayoutCalculation {
    const { position, resolution } = params;
    
    if (!resolution.resolvedValue || 
        !resolution.lowerBound || 
        !resolution.upperBound) {
      throw new Error('Scalar resolution requires bounds and resolved value');
    }
    
    const { resolvedValue, lowerBound, upperBound } = resolution;
    
    // Calculate normalized value
    let normalizedValue: Decimal;
    
    if (resolvedValue < lowerBound) {
      normalizedValue = new Decimal(0);
    } else if (resolvedValue > upperBound) {
      normalizedValue = new Decimal(1);
    } else {
      const range = upperBound - lowerBound;
      const position = resolvedValue - lowerBound;
      normalizedValue = new Decimal(position).div(range);
    }
    
    // Apply position type
    let payoutValue: Decimal;
    if (position.outcome === 'long') {
      // Long: payout based on how high resolved value is
      payoutValue = normalizedValue;
    } else if (position.outcome === 'short') {
      // Short: payout based on how low resolved value is
      payoutValue = new Decimal(1).minus(normalizedValue);
    } else {
      throw new Error(`Invalid scalar position type: ${position.outcome}`);
    }
    
    // Gross payout: shares × $1.00 × normalized_value
    const grossPayout = position.shares.times(payoutValue);
    
    return this.applyFeesAndTaxes(grossPayout, position, params.userCountry);
  }

  /**
   * Apply platform fees and taxes
   */
  private applyFeesAndTaxes(
    grossPayout: Decimal,
    position: Position,
    userCountry?: string
  ): PayoutCalculation {
    // Platform fee (capped)
    let platformFee = grossPayout.times(this.fees.platformFeePercent);
    if (platformFee.greaterThan(this.fees.maxPlatformFee)) {
      platformFee = this.fees.maxPlatformFee;
    }
    
    // Calculate after platform fee
    const afterPlatformFee = grossPayout.minus(platformFee);
    
    // Calculate holding period (days)
    const holdingPeriod = Math.floor(
      (Date.now() - position.acquiredAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Taxable gain
    const taxableGain = afterPlatformFee.minus(position.costBasis);
    
    // Withholding tax (if applicable)
    let withholdingTax = new Decimal(0);
    let vatAmount: Decimal | undefined;
    let nbrReporting = false;
    
    // Bangladesh tax considerations
    if (userCountry === 'BD' || userCountry === 'Bangladesh') {
      // NBR reporting threshold
      if (grossPayout.greaterThanOrEqualTo(this.NBR_REPORTING_THRESHOLD)) {
        nbrReporting = true;
      }
      
      // VAT on platform fees
      vatAmount = platformFee.times(this.VAT_RATE);
    }
    
    // US tax considerations (if applicable)
    if (!userCountry || userCountry === 'US') {
      // Withholding only if no tax treaty
      withholdingTax = new Decimal(0);
    }
    
    // Net payout
    const netPayout = afterPlatformFee.minus(withholdingTax).minus(vatAmount || 0);
    
    // Tax form required if annual payouts > $600
    const taxFormRequired = grossPayout.greaterThanOrEqualTo(this.TAX_FORM_THRESHOLD);
    
    return {
      grossPayout,
      platformFee,
      withholdingTax,
      netPayout,
      costBasis: position.costBasis,
      holdingPeriod,
      taxableGain,
      taxFormRequired,
      vatAmount,
      nbrReporting
    };
  }

  /**
   * Create zero payout for losing positions
   */
  private createZeroPayout(position: Position): PayoutCalculation {
    return {
      grossPayout: new Decimal(0),
      platformFee: new Decimal(0),
      withholdingTax: new Decimal(0),
      netPayout: new Decimal(0),
      costBasis: position.costBasis,
      holdingPeriod: 0,
      taxableGain: new Decimal(0).minus(position.costBasis),
      taxFormRequired: false
    };
  }

  /**
   * Execute payout based on distribution option
   */
  async executePayout(
    calculation: PayoutCalculation,
    params: {
      userId: string;
      marketId: string;
      distributionOption: DistributionOption;
      bankAccount?: string; // For Bangladesh BDT payouts
    }
  ): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    const supabase = await createClient();
    
    try {
      switch (params.distributionOption) {
        case 'immediate':
          return this.executeImmediateTransfer(calculation, params);
          
        case 'reinvest':
          return this.executeReinvestment(calculation, params);
          
        case 'hold':
          return this.executeHold(calculation, params);
          
        default:
          throw new Error(`Unknown distribution option: ${params.distributionOption}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  /**
   * Execute immediate USDC/BDT transfer
   */
  private async executeImmediateTransfer(
    calculation: PayoutCalculation,
    params: {
      userId: string;
      marketId: string;
      bankAccount?: string;
    }
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    const supabase = await createClient();
    
    // Record payout calculation
    const { data: payout, error } = await supabase
      .from('payout_calculations')
      .insert({
        user_id: params.userId,
        market_id: params.marketId,
        gross_payout: calculation.grossPayout.toNumber(),
        platform_fee: calculation.platformFee.toNumber(),
        withholding_tax: calculation.withholdingTax.toNumber(),
        net_payout: calculation.netPayout.toNumber(),
        cost_basis: calculation.costBasis.toNumber(),
        holding_period: calculation.holdingPeriod,
        distribution_method: 'immediate',
        tax_form_generated: calculation.taxFormRequired,
        nbr_reporting: calculation.nbrReporting,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // In production: Execute blockchain transfer or bank transfer
    // For demo: Simulate success
    
    // Update to completed
    await supabase
      .from('payout_calculations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', payout.id);
    
    return {
      success: true,
      transactionId: payout.id
    };
  }

  /**
   * Execute auto-reinvestment into new markets
   */
  private async executeReinvestment(
    calculation: PayoutCalculation,
    params: {
      userId: string;
      marketId: string;
    }
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    const supabase = await createClient();
    
    // Record as platform credit
    const { data: credit, error } = await supabase
      .from('payout_calculations')
      .insert({
        user_id: params.userId,
        market_id: params.marketId,
        gross_payout: calculation.grossPayout.toNumber(),
        platform_fee: calculation.platformFee.toNumber(),
        withholding_tax: calculation.withholdingTax.toNumber(),
        net_payout: calculation.netPayout.toNumber(),
        cost_basis: calculation.costBasis.toNumber(),
        holding_period: calculation.holdingPeriod,
        distribution_method: 'reinvest',
        status: 'reinvested',
        reinvested_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Add to user's platform balance
    await supabase.rpc('credit_user_balance', {
      p_user: params.userId,
      p_amount: calculation.netPayout.toNumber()
    });
    
    return {
      success: true,
      transactionId: credit.id
    };
  }

  /**
   * Execute hold (user-initiated redemption later)
   */
  private async executeHold(
    calculation: PayoutCalculation,
    params: {
      userId: string;
      marketId: string;
    }
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    const supabase = await createClient();
    
    // Record held payout
    const { data: held, error } = await supabase
      .from('payout_calculations')
      .insert({
        user_id: params.userId,
        market_id: params.marketId,
        gross_payout: calculation.grossPayout.toNumber(),
        platform_fee: calculation.platformFee.toNumber(),
        withholding_tax: calculation.withholdingTax.toNumber(),
        net_payout: calculation.netPayout.toNumber(),
        cost_basis: calculation.costBasis.toNumber(),
        holding_period: calculation.holdingPeriod,
        distribution_method: 'hold',
        status: 'held',
        held_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      transactionId: held.id
    };
  }

  /**
   * Generate tax form data
   */
  async generateTaxFormData(
    userId: string,
    year: number
  ): Promise<{
    totalPayouts: Decimal;
    totalFees: Decimal;
    totalTaxes: Decimal;
    costBasis: Decimal;
    taxableGains: Decimal;
    transactions: any[];
  }> {
    const supabase = await createClient();
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data: payouts } = await supabase
      .from('payout_calculations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('status', ['completed', 'reinvested']);
    
    let totalPayouts = new Decimal(0);
    let totalFees = new Decimal(0);
    let totalTaxes = new Decimal(0);
    let totalCostBasis = new Decimal(0);
    
    for (const payout of payouts || []) {
      totalPayouts = totalPayouts.plus(payout.gross_payout);
      totalFees = totalFees.plus(payout.platform_fee);
      totalTaxes = totalTaxes.plus(payout.withholding_tax);
      totalCostBasis = totalCostBasis.plus(payout.cost_basis);
    }
    
    return {
      totalPayouts,
      totalFees,
      totalTaxes,
      costBasis: totalCostBasis,
      taxableGains: totalPayouts.minus(totalCostBasis).minus(totalFees),
      transactions: payouts || []
    };
  }

  /**
   * Process batch payouts for gas efficiency
   */
  async processBatchPayouts(
    payouts: Array<{
      userId: string;
      marketId: string;
      calculation: PayoutCalculation;
    }>
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    
    // Group by distribution method for batch processing
    const grouped = this.groupByDistributionMethod(payouts);
    
    // Process each group
    for (const [method, group] of Object.entries(grouped)) {
      // In production: Create Merkle tree for batch claims
      console.log(`[PayoutEngine] Processing batch of ${group.length} ${method} payouts`);
      
      for (const payout of group) {
        try {
          const result = await this.executePayout(payout.calculation, {
            userId: payout.userId,
            marketId: payout.marketId,
            distributionOption: method as DistributionOption
          });
          
          if (result.success) {
            successful.push(result.transactionId!);
          } else {
            failed.push({ id: payout.userId, error: result.error! });
          }
        } catch (error) {
          failed.push({
            id: payout.userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
    
    return { successful, failed };
  }

  /**
   * Group payouts by distribution method
   */
  private groupByDistributionMethod(
    payouts: Array<{ calculation: PayoutCalculation; userId: string; marketId: string }>
  ): Record<DistributionOption, typeof payouts> {
    return payouts.reduce((acc, payout) => {
      // Default to immediate if not specified
      const method: DistributionOption = 'immediate';
      if (!acc[method]) acc[method] = [];
      acc[method].push(payout);
      return acc;
    }, {} as Record<DistributionOption, typeof payouts>);
  }
}

// Singleton instance
let globalPayoutEngine: PayoutEngine | null = null;

export function getGlobalPayoutEngine(fees?: Partial<FeeStructure>): PayoutEngine {
  if (!globalPayoutEngine) {
    globalPayoutEngine = new PayoutEngine(fees);
  }
  return globalPayoutEngine;
}
