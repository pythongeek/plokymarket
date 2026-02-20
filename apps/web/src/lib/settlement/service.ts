/**
 * Settlement Queue Management Service
 * 
 * Features:
 * - Priority-based blockchain submission (P0-P3)
 * - Gas optimization
 * - Settlement tracking
 * - Batch processing
 */

import { supabase } from '@/lib/supabase';
import type {
  SettlementQueue,
  SettlementPriority,
  SettlementStatus,
  SettlementStats,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const SETTLEMENT_CONFIG = {
  // Priority thresholds
  P0_VALUE_THRESHOLD: 10000, // $10k

  // Latency targets
  P0_TARGET_SECONDS: 30,
  P1_TARGET_SECONDS: 300, // 5 minutes
  P2_TARGET_SECONDS: 3600, // 1 hour
  P3_TARGET_SECONDS: 86400, // 24 hours

  // Batch settings
  P1_BATCH_INTERVAL_MS: 2000, // 2 seconds
  P1_BATCH_SIZE: 50,

  // Gas settings
  DEFAULT_GAS_PRICE_GWEI: 20,
  MAX_GAS_PRICE_GWEI: 200,
  GAS_LIMIT: 100000,
};

// ============================================
// SETTLEMENT QUEUE OPERATIONS
// ============================================

/**
 * Add trade to settlement queue
 */
export async function addToSettlementQueue(
  tradeId: string,
  ledgerId: string,
  tradeValue: number,
  isMarketClosing: boolean = false,
  hasUserWithdrawal: boolean = false
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('add_to_settlement_queue', {
      p_trade_id: tradeId,
      p_ledger_id: ledgerId,
      p_trade_value: tradeValue,
      p_is_market_closing: isMarketClosing,
      p_has_user_withdrawal: hasUserWithdrawal,
    });

    if (error) {
      console.error('Add to settlement queue error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Add to settlement exception:', error);
    return null;
  }
}

/**
 * Get settlement queue entries
 */
export async function getSettlementQueue(
  status?: SettlementStatus[],
  priority?: SettlementPriority[]
): Promise<SettlementQueue[]> {
  if (!supabase) return [];

  let query = supabase
    .from('settlement_queue')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  if (priority && priority.length > 0) {
    query = query.in('priority', priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get settlement queue error:', error);
    return [];
  }

  return (data || []).map(mapSettlementFromDB);
}

/**
 * Get settlement stats
 */
export async function getSettlementStats(): Promise<SettlementStats> {
  if (!supabase) {
    return {
      totalPending: 0,
      p0Pending: 0,
      p1Pending: 0,
      p2Pending: 0,
      p3Pending: 0,
      avgConfirmationTime: 0,
      totalGasUsed: 0,
    };
  }

  try {
    const { data, error } = await supabase
      .from('settlement_queue')
      .select('priority, status, gas_used, confirmed_at, submitted_at')
      .in('status', ['pending', 'processing', 'submitted']);

    if (error) {
      console.error('Settlement stats error:', error);
      return {
        totalPending: 0,
        p0Pending: 0,
        p1Pending: 0,
        p2Pending: 0,
        p3Pending: 0,
        avgConfirmationTime: 0,
        totalGasUsed: 0,
      };
    }

    const pending = data || [];

    return {
      totalPending: pending.length,
      p0Pending: pending.filter(p => p.priority === 'P0').length,
      p1Pending: pending.filter(p => p.priority === 'P1').length,
      p2Pending: pending.filter(p => p.priority === 'P2').length,
      p3Pending: pending.filter(p => p.priority === 'P3').length,
      avgConfirmationTime: calculateAvgConfirmationTime(pending),
      totalGasUsed: pending.reduce((sum, p) => sum + (p.gas_used || 0), 0),
    };
  } catch (error) {
    console.error('Settlement stats exception:', error);
    return {
      totalPending: 0,
      p0Pending: 0,
      p1Pending: 0,
      p2Pending: 0,
      p3Pending: 0,
      avgConfirmationTime: 0,
      totalGasUsed: 0,
    };
  }
}

/**
 * Get user's settlement queue
 */
export async function getUserSettlementQueue(
  userId: string,
  status?: SettlementStatus[]
): Promise<SettlementQueue[]> {
  if (!supabase) return [];

  let query = supabase
    .from('settlement_queue')
    .select(`
      *,
      trades!inner(
        maker_id,
        taker_id
      )
    `)
    .or(`trades.maker_id.eq.${userId},trades.taker_id.eq.${userId}`)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get user settlement queue error:', error);
    return [];
  }

  return (data || []).map(mapSettlementFromDB);
}

// ============================================
// GAS OPTIMIZATION
// ============================================

/**
 * Calculate optimal gas price using EIP-1559
 */
export async function calculateOptimalGasPrice(
  priority: SettlementPriority
): Promise<number> {
  // In production, this would call an external gas price oracle
  // For demo, return priority-based pricing

  switch (priority) {
    case 'P0':
      return SETTLEMENT_CONFIG.MAX_GAS_PRICE_GWEI; // Urgent
    case 'P1':
      return SETTLEMENT_CONFIG.DEFAULT_GAS_PRICE_GWEI * 1.5;
    case 'P2':
      return SETTLEMENT_CONFIG.DEFAULT_GAS_PRICE_GWEI;
    case 'P3':
      return SETTLEMENT_CONFIG.DEFAULT_GAS_PRICE_GWEI * 0.5; // Low fee
    default:
      return SETTLEMENT_CONFIG.DEFAULT_GAS_PRICE_GWEI;
  }
}

/**
 * Speed up transaction with higher gas
 */
export async function speedUpSettlement(
  queueId: string,
  newGasPriceGwei: number
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('settlement_queue')
      .update({
        gas_price_gwei: newGasPriceGwei,
        retry_count: supabase.rpc('increment_retry_count', { p_queue_id: queueId }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    if (error) {
      console.error('Speed up settlement error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Speed up settlement exception:', error);
    return false;
  }
}

// ============================================
// UTILITIES
// ============================================

function mapSettlementFromDB(data: any): SettlementQueue {
  return {
    id: data.id,
    tradeId: data.trade_id,
    ledgerId: data.ledger_id,
    priority: data.priority,
    status: data.status,
    tradeValue: parseFloat(data.trade_value),
    isMarketClosing: data.is_market_closing,
    hasUserWithdrawal: data.has_user_withdrawal,
    isRetry: data.is_retry,
    retryCount: data.retry_count,
    blockchainNetwork: data.blockchain_network,
    txHash: data.tx_hash,
    txNonce: data.tx_nonce,
    gasPriceGwei: data.gas_price_gwei,
    gasUsed: data.gas_used,
    blockNumber: data.block_number,
    blockTimestamp: data.block_timestamp,
    submittedAt: data.submitted_at,
    confirmedAt: data.confirmed_at,
    failedAt: data.failed_at,
    failureReason: data.failure_reason,
    batchId: data.batch_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function calculateAvgConfirmationTime(pending: any[]): number {
  const confirmed = pending.filter(p => p.confirmed_at && p.submitted_at);
  if (confirmed.length === 0) return 0;

  const totalTime = confirmed.reduce((sum, p) => {
    const submitted = new Date(p.submitted_at).getTime();
    const confirmed_time = new Date(p.confirmed_at).getTime();
    return sum + (confirmed_time - submitted);
  }, 0);

  return Math.round(totalTime / confirmed.length / 1000); // seconds
}

// ============================================
// EXPORTS
// ============================================

export { SETTLEMENT_CONFIG };
