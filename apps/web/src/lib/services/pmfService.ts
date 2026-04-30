// @ts-nocheck
import { createClient } from '@/lib/supabase/server';

// PMF Types - Position Margin Feed for prediction markets
export type MarginStatus = 'healthy' | 'warning' | 'critical' | 'liquidated';

export interface PositionMargin {
  id: string;
  user_id: string;
  market_id: string;
  outcome: 'YES' | 'NO';
  position_size: number;
  entry_price: number;
  current_price: number;
  notional_value: number;
  margin_required: number;
  margin_available: number;
  margin_used_pct: number;
  unrealized_pnl: number;
  realized_pnl: number;
  funding_accrued: number;
  margin_status: MarginStatus;
  last_margin_check: string;
  created_at: string;
  updated_at: string;
}

export interface MarginOrder {
  id: string;
  user_id: string;
  market_id: string;
  order_id: string;
  side: 'buy' | 'sell';
  outcome: 'YES' | 'NO';
  price: number;
  quantity: number;
  margin_required: number;
  margin_status: MarginStatus;
  created_at: string;
}

export interface MarginSummary {
  total_margin_required: number;
  total_margin_available: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  margin_utilization_pct: number;
  positions_at_risk: number;
  margin_calls: number;
  liquidation_count_24h: number;
  account_margin_status: MarginStatus;
}

export interface MarginHistory {
  id: string;
  user_id: string;
  market_id: string;
  event_type: 'margin_check' | 'margin_call' | 'liquidation' | 'margin_deposit' | 'position_closed';
  margin_before: number;
  margin_after: number;
  pnl_realized: number;
  notes: string;
  created_at: string;
}

export interface LiquidationCandidate {
  user_id: string;
  market_id: string;
  position_size: number;
  entry_price: number;
  current_price: number;
  margin_remaining: number;
  margin_required: number;
  deficit: number;
  estimated_liquidation_price: number;
}

export class PMFService {
  private readonly DEFAULT_MARGIN_RATIO = 0.1; // 10% margin requirement
  private readonly WARNING_THRESHOLD = 0.75;   // 75% margin utilization
  private readonly CRITICAL_THRESHOLD = 0.9;    // 90% margin utilization

  /**
   * Get margin summary for a user across all positions
   */
  async getMarginSummary(userId: string): Promise<MarginSummary> {
    const supabase = await createClient();

    // Get all positions with market data
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        market:markets!market_id(id, question, current_yes_price, current_no_price, trading_closes_at)
      `)
      .eq('user_id', userId)
      .gt('quantity', 0);

    if (error) {
      console.error('[PMFService] getMarginSummary error:', error.message);
      return this.emptyMarginSummary();
    }

    if (!positions || positions.length === 0) {
      return this.emptyMarginSummary();
    }

    // Get user's wallet balance for margin available
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, locked_balance')
      .eq('user_id', userId)
      .single();

    const marginAvailable = wallet?.balance || 0;

    let totalMarginRequired = 0;
    let totalUnrealizedPnl = 0;
    let totalRealizedPnl = 0;
    let positionsAtRisk = 0;

    for (const position of positions) {
      const market = position.market;
      const currentPrice = position.outcome === 'YES'
        ? (market.current_yes_price || 0)
        : (market.current_no_price || 0);
      
      const notionalValue = position.quantity * currentPrice;
      const marginRequired = notionalValue * this.DEFAULT_MARGIN_RATIO;
      const entryCost = position.quantity * (position.average_price || 0);
      const unrealizedPnl = position.quantity * (currentPrice - (position.average_price || 0));

      totalMarginRequired += marginRequired;
      totalUnrealizedPnl += unrealizedPnl;
      totalRealizedPnl += position.realized_pnl || 0;

      // Check if position is at risk
      const marginUsedPct = marginRequired / marginAvailable;
      if (marginUsedPct >= this.CRITICAL_THRESHOLD) {
        positionsAtRisk++;
      }
    }

    const marginUtilizationPct = marginAvailable > 0 
      ? totalMarginRequired / marginAvailable 
      : 0;

    let accountMarginStatus: MarginStatus = 'healthy';
    if (marginUtilizationPct >= this.CRITICAL_THRESHOLD) {
      accountMarginStatus = 'critical';
    } else if (marginUtilizationPct >= this.WARNING_THRESHOLD) {
      accountMarginStatus = 'warning';
    }

    // Get recent margin calls and liquidations
    const { count: marginCalls } = await supabase
      .from('margin_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('event_type', 'margin_call')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: liquidations } = await supabase
      .from('margin_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('event_type', 'liquidation')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      total_margin_required: totalMarginRequired,
      total_margin_available: marginAvailable,
      total_unrealized_pnl: totalUnrealizedPnl,
      total_realized_pnl: totalRealizedPnl,
      margin_utilization_pct: marginUtilizationPct,
      positions_at_risk: positionsAtRisk,
      margin_calls: marginCalls || 0,
      liquidation_count_24h: liquidations || 0,
      account_margin_status: accountMarginStatus
    };
  }

  /**
   * Get margin details for a specific position
   */
  async getPositionMargin(userId: string, marketId: string): Promise<PositionMargin | null> {
    const supabase = await createClient();

    const { data: position, error } = await supabase
      .from('positions')
      .select(`
        *,
        market:markets!market_id(id, question, current_yes_price, current_no_price, trading_closes_at)
      `)
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[PMFService] getPositionMargin error:', error.message);
      }
      return null;
    }

    if (!position) {
      return null;
    }

    const market = position.market;
    const currentPrice = position.outcome === 'YES'
      ? (market.current_yes_price || 0)
      : (market.current_no_price || 0);
    const notionalValue = position.quantity * currentPrice;
    const marginRequired = notionalValue * this.DEFAULT_MARGIN_RATIO;
    const entryCost = position.quantity * (position.average_price || 0);
    const unrealizedPnl = position.quantity * (currentPrice - (position.average_price || 0));

    // Get wallet for available margin
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const marginAvailable = wallet?.balance || 0;
    const marginUsedPct = marginRequired > 0 ? marginRequired / marginAvailable : 0;

    let marginStatus: MarginStatus = 'healthy';
    if (marginUsedPct >= this.CRITICAL_THRESHOLD) {
      marginStatus = 'critical';
    } else if (marginUsedPct >= this.WARNING_THRESHOLD) {
      marginStatus = 'warning';
    }

    return {
      id: position.id,
      user_id: position.user_id,
      market_id: position.market_id,
      outcome: position.outcome,
      position_size: position.quantity,
      entry_price: position.average_price || 0,
      current_price: currentPrice,
      notional_value: notionalValue,
      margin_required: marginRequired,
      margin_available: marginAvailable,
      margin_used_pct: marginUsedPct,
      unrealized_pnl: unrealizedPnl,
      realized_pnl: position.realized_pnl || 0,
      funding_accrued: 0,
      margin_status: marginStatus,
      last_margin_check: new Date().toISOString(),
      created_at: position.created_at,
      updated_at: position.updated_at
    };
  }

  /**
   * Get all positions with margin details for a user
   */
  async getAllPositionsMargin(userId: string): Promise<PositionMargin[]> {
    const supabase = await createClient();

    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        market:markets!market_id(id, question, current_yes_price, current_no_price, trading_closes_at)
      `)
      .eq('user_id', userId)
      .gt('quantity', 0);

    if (error) {
      console.error('[PMFService] getAllPositionsMargin error:', error.message);
      return [];
    }

    if (!positions || positions.length === 0) {
      return [];
    }

    // Get wallet for available margin
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const marginAvailable = wallet?.balance || 0;

    return positions.map(position => {
      const market = position.market;
      const currentPrice = position.outcome === 'YES'
        ? (market.current_yes_price || 0)
        : (market.current_no_price || 0);
      const notionalValue = position.quantity * currentPrice;
      const marginRequired = notionalValue * this.DEFAULT_MARGIN_RATIO;
      const unrealizedPnl = position.quantity * (currentPrice - (position.average_price || 0));
      const marginUsedPct = marginRequired > 0 ? marginRequired / marginAvailable : 0;

      let marginStatus: MarginStatus = 'healthy';
      if (marginUsedPct >= this.CRITICAL_THRESHOLD) {
        marginStatus = 'critical';
      } else if (marginUsedPct >= this.WARNING_THRESHOLD) {
        marginStatus = 'warning';
      }

      return {
        id: position.id,
        user_id: position.user_id,
        market_id: position.market_id,
        outcome: position.outcome,
        position_size: position.quantity,
        entry_price: position.average_price || 0,
        current_price: currentPrice,
        notional_value: notionalValue,
        margin_required: marginRequired,
        margin_available: marginAvailable,
        margin_used_pct: marginUsedPct,
        unrealized_pnl: unrealizedPnl,
        realized_pnl: position.realized_pnl || 0,
        funding_accrued: 0,
        margin_status: marginStatus,
        last_margin_check: new Date().toISOString(),
        created_at: position.created_at,
        updated_at: position.updated_at
      };
    });
  }

  /**
   * Calculate margin required for a new order
   */
  async calculateOrderMargin(
    userId: string,
    marketId: string,
    side: 'buy' | 'sell',
    price: number,
    quantity: number
  ): Promise<{ margin_required: number; has_sufficient_margin: boolean; current_utilization: number }> {
    const supabase = await createClient();

    // Get current margin summary
    const summary = await this.getMarginSummary(userId);

    // Calculate notional value and margin for the new order
    const notionalValue = price * quantity;
    const marginRequired = notionalValue * this.DEFAULT_MARGIN_RATIO;

    // For sell orders, margin is locked immediately
    const additionalMargin = side === 'sell' ? marginRequired : 0;
    const newTotalMargin = summary.total_margin_required + additionalMargin;
    const newUtilization = summary.total_margin_available > 0
      ? newTotalMargin / summary.total_margin_available
      : 0;

    return {
      margin_required: marginRequired,
      has_sufficient_margin: newUtilization <= 1.0,
      current_utilization: summary.margin_utilization_pct
    };
  }

  /**
   * Get margin history for a user
   */
  async getMarginHistory(
    userId: string,
    limit = 50
  ): Promise<MarginHistory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('margin_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PMFService] getMarginHistory error:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Get positions at risk of liquidation
   */
  async getLiquidationCandidates(): Promise<LiquidationCandidate[]> {
    const supabase = await createClient();

    // Get all positions with margin requirements exceeding threshold
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        market:markets!market_id(id, question, current_yes_price, current_no_price)
      `)
      .gt('quantity', 0);

    if (error) {
      console.error('[PMFService] getLiquidationCandidates error:', error.message);
      return [];
    }

    if (!positions || positions.length === 0) {
      return [];
    }

    const candidates: LiquidationCandidate[] = [];

    for (const position of positions) {
      const market = position.market;
      const currentPrice = position.outcome === 'YES'
        ? (market.current_yes_price || 0)
        : (market.current_no_price || 0);
      
      const notionalValue = position.quantity * currentPrice;
      const marginRequired = notionalValue * this.DEFAULT_MARGIN_RATIO;

      // Get user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('user_id', position.user_id)
        .single();

      const marginRemaining = (wallet?.balance || 0) - (wallet?.locked_balance || 0);

      if (marginRequired > marginRemaining) {
        const deficit = marginRequired - marginRemaining;
        
        // Calculate estimated liquidation price
        // Liquidation occurs when loss equals remaining margin
        const entryPrice = position.average_price || 0;
        const lossPerUnit = entryPrice - currentPrice;
        const estimatedLiquidationPrice = lossPerUnit > 0
          ? currentPrice - (marginRemaining / position.quantity)
          : currentPrice + (marginRemaining / position.quantity);

        candidates.push({
          user_id: position.user_id,
          market_id: position.market_id,
          position_size: position.quantity,
          entry_price: entryPrice,
          current_price: currentPrice,
          margin_remaining: marginRemaining,
          margin_required: marginRequired,
          deficit,
          estimated_liquidation_price: Math.max(0, Math.min(1, estimatedLiquidationPrice))
        });
      }
    }

    return candidates;
  }

  /**
   * Lock margin for a pending order
   */
  async lockMarginForOrder(
    userId: string,
    orderId: string,
    marketId: string,
    marginAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
      const { error } = await supabase.rpc('lock_margin_for_order', {
        p_user_id: userId,
        p_order_id: orderId,
        p_market_id: marketId,
        p_margin_amount: marginAmount
      });

      if (error) {
        console.error('[PMFService] lockMarginForOrder error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[PMFService] lockMarginForOrder exception:', err);
      return { success: false, error: err.message || 'Failed to lock margin' };
    }
  }

  /**
   * Release margin after order is filled or cancelled
   */
  async releaseMarginForOrder(
    userId: string,
    orderId: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
      const { error } = await supabase.rpc('release_margin_for_order', {
        p_user_id: userId,
        p_order_id: orderId
      });

      if (error) {
        console.error('[PMFService] releaseMarginForOrder error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[PMFService] releaseMarginForOrder exception:', err);
      return { success: false, error: err.message || 'Failed to release margin' };
    }
  }

  /**
   * Add margin (deposit) to user's account
   */
  async depositMargin(
    userId: string,
    amount: number,
    source: 'deposit' | 'realized_pnl' | 'rebate' = 'deposit'
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    try {
      const { error } = await supabase.rpc('deposit_margin', {
        p_user_id: userId,
        p_amount: amount,
        p_source: source
      });

      if (error) {
        console.error('[PMFService] depositMargin error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[PMFService] depositMargin exception:', err);
      return { success: false, error: err.message || 'Failed to deposit margin' };
    }
  }

  /**
   * Perform margin check and trigger margin calls if needed
   */
  async performMarginCheck(userId: string): Promise<{
    status: MarginStatus;
    margin_required: number;
    margin_available: number;
    margin_deficit: number;
    margin_calls_triggered: boolean;
  }> {
    const summary = await this.getMarginSummary(userId);

    if (summary.total_margin_required > summary.total_margin_available) {
      const deficit = summary.total_margin_required - summary.total_margin_available;
      
      // Log margin call
      await this.logMarginEvent(
        userId,
        'margin_call',
        summary.total_margin_available,
        summary.total_margin_required - deficit,
        deficit,
        `Margin call triggered: deficit of ${deficit}`
      );

      return {
        status: 'critical',
        margin_required: summary.total_margin_required,
        margin_available: summary.total_margin_available,
        margin_deficit: deficit,
        margin_calls_triggered: true
      };
    }

    return {
      status: summary.account_margin_status,
      margin_required: summary.total_margin_required,
      margin_available: summary.total_margin_available,
      margin_deficit: 0,
      margin_calls_triggered: false
    };
  }

  /**
   * Log a margin event to history
   */
  private async logMarginEvent(
    userId: string,
    eventType: MarginHistory['event_type'],
    marginBefore: number,
    marginAfter: number,
    pnlRealized: number,
    notes: string,
    marketId?: string
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from('margin_history').insert({
      user_id: userId,
      market_id: marketId || null,
      event_type: eventType,
      margin_before: marginBefore,
      margin_after: marginAfter,
      pnl_realized: pnlRealized,
      notes
    });
  }

  /**
   * Get empty margin summary for initialization
   */
  private emptyMarginSummary(): MarginSummary {
    return {
      total_margin_required: 0,
      total_margin_available: 0,
      total_unrealized_pnl: 0,
      total_realized_pnl: 0,
      margin_utilization_pct: 0,
      positions_at_risk: 0,
      margin_calls: 0,
      liquidation_count_24h: 0,
      account_margin_status: 'healthy'
    };
  }
}

export const pmfService = new PMFService();
