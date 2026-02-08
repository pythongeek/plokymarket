/**
 * Self-Trade Prevention (STP) Service
 * 
 * Features:
 * - User-level STP configuration
 * - Cross-market STP
 * - Organizational STP
 * - Wash trading detection
 */

import { supabase } from '@/lib/supabase';
import type {
  UserSTPConfig,
  STPViolation,
  STPCheckResult,
  STPMode,
  WashTradingScore,
  CrossMarketRelationship,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const STP_CONFIG = {
  // Detection thresholds
  WASH_TRADE_CONFIDENCE_THRESHOLD: 0.7,
  TEMPORAL_CORRELATION_MS: 100, // 100ms buy-sell correlation
  
  // ML weights
  TEMPORAL_WEIGHT: 0.25,
  SIZE_WEIGHT: 0.20,
  PRICE_IMPACT_WEIGHT: 0.20,
  NETWORK_WEIGHT: 0.20,
  BEHAVIORAL_WEIGHT: 0.15,
};

// ============================================
// STP CONFIGURATION
// ============================================

/**
 * Get user STP configuration
 */
export async function getUserSTPConfig(userId: string): Promise<UserSTPConfig | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_stp_config')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Get STP config error:', error);
    return null;
  }

  if (!data) {
    // Create default config
    return createDefaultSTPConfig(userId);
  }

  return mapSTPConfigFromDB(data);
}

/**
 * Create default STP config
 */
async function createDefaultSTPConfig(userId: string): Promise<UserSTPConfig | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_stp_config')
    .insert({
      user_id: userId,
      stp_mode: 'prevent',
      cross_market_stp_enabled: true,
      organizational_stp_enabled: false,
      is_wash_trading_monitored: false,
      wash_trade_alert_threshold: 0.7,
    })
    .select()
    .single();

  if (error) {
    console.error('Create STP config error:', error);
    return null;
  }

  return mapSTPConfigFromDB(data);
}

/**
 * Update user STP configuration
 */
export async function updateUserSTPConfig(
  userId: string,
  updates: Partial<Omit<UserSTPConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<UserSTPConfig | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_stp_config')
    .update({
      stp_mode: updates.stpMode,
      cross_market_stp_enabled: updates.crossMarketStpEnabled,
      organizational_stp_enabled: updates.organizationalStpEnabled,
      is_wash_trading_monitored: updates.isWashTradingMonitored,
      wash_trade_alert_threshold: updates.washTradeAlertThreshold,
      beneficial_owner_id: updates.beneficialOwnerId,
      organization_id: updates.organizationId,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update STP config error:', error);
    return null;
  }

  return mapSTPConfigFromDB(data);
}

// ============================================
// STP CHECK
// ============================================

/**
 * Check for self-trade
 */
export async function checkSelfTrade(
  orderId: string,
  userId: string,
  marketId: string,
  side: 'buy' | 'sell',
  price: number,
  size: number
): Promise<STPCheckResult> {
  if (!supabase) {
    return { isViolation: false };
  }

  try {
    const { data, error } = await supabase.rpc('check_self_trade', {
      p_order_id: orderId,
      p_user_id: userId,
      p_market_id: marketId,
      p_side: side.toUpperCase(),
      p_price: price,
      p_size: size,
    });

    if (error) {
      console.error('STP check error:', error);
      return { isViolation: false };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        isViolation: result.is_violation,
        violationType: result.violation_type,
        actionTaken: result.action_taken,
        matchedOrderId: result.matched_order_id,
        reason: result.reason,
      };
    }

    return { isViolation: false };
  } catch (error) {
    console.error('STP check exception:', error);
    return { isViolation: false };
  }
}

// ============================================
// STP VIOLATIONS
// ============================================

/**
 * Get user's STP violations
 */
export async function getUserSTPViolations(userId: string): Promise<STPViolation[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('stp_violations')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('Get STP violations error:', error);
    return [];
  }

  return (data || []).map(mapViolationFromDB);
}

/**
 * Get recent violations (admin only)
 */
export async function getRecentSTPViolations(
  limit: number = 50
): Promise<STPViolation[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('stp_violations')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get recent violations error:', error);
    return [];
  }

  return (data || []).map(mapViolationFromDB);
}

// ============================================
// WASH TRADING DETECTION
// ============================================

/**
 * Calculate wash trading score
 */
export async function calculateWashTradingScore(
  userId: string,
  windowHours: number = 24
): Promise<number> {
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.rpc('calculate_wash_trading_score', {
      p_user_id: userId,
      p_window_hours: windowHours,
    });

    if (error) {
      console.error('Wash trading score error:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Wash trading score exception:', error);
    return 0;
  }
}

/**
 * Get user's wash trading scores
 */
export async function getUserWashTradingScores(
  userId: string,
  limit: number = 10
): Promise<WashTradingScore[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('wash_trading_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get wash trading scores error:', error);
    return [];
  }

  return (data || []).map(mapWashScoreFromDB);
}

/**
 * Get high-risk users (admin only)
 */
export async function getHighRiskUsers(
  confidenceThreshold: number = 0.7
): Promise<Array<{ userId: string; confidence: number; alertLevel: string }>> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('wash_trading_scores')
    .select('user_id, overall_confidence, alert_level')
    .gte('overall_confidence', confidenceThreshold)
    .in('alert_level', ['high', 'critical'])
    .order('overall_confidence', { ascending: false });

  if (error) {
    console.error('Get high risk users error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    userId: d.user_id,
    confidence: d.overall_confidence,
    alertLevel: d.alert_level,
  }));
}

// ============================================
// CROSS-MARKET STP
// ============================================

/**
 * Get related markets for cross-market STP
 */
export async function getRelatedMarkets(
  marketId: string
): Promise<CrossMarketRelationship[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('related_markets')
    .select('*')
    .or(`market_a_id.eq.${marketId},market_b_id.eq.${marketId}`);

  if (error) {
    console.error('Get related markets error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    marketAId: d.market_a_id,
    marketBId: d.market_b_id,
    relationshipType: d.relationship_type,
    correlationCoefficient: d.correlation_coefficient,
    createdAt: d.created_at,
  }));
}

// ============================================
// UTILITIES
// ============================================

function mapSTPConfigFromDB(data: any): UserSTPConfig {
  return {
    id: data.id,
    userId: data.user_id,
    stpMode: data.stp_mode,
    crossMarketStpEnabled: data.cross_market_stp_enabled,
    organizationalStpEnabled: data.organizational_stp_enabled,
    isWashTradingMonitored: data.is_wash_trading_monitored,
    washTradeAlertThreshold: data.wash_trade_alert_threshold,
    beneficialOwnerId: data.beneficial_owner_id,
    organizationId: data.organization_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapViolationFromDB(data: any): STPViolation {
  return {
    id: data.id,
    orderAId: data.order_a_id,
    orderBId: data.order_b_id,
    userId: data.user_id,
    beneficialOwnerId: data.beneficial_owner_id,
    violationType: data.violation_type,
    detectionMethod: data.detection_method,
    actionTaken: data.action_taken,
    mlConfidence: data.ml_confidence,
    mlFeatures: data.ml_features,
    detectedAt: data.detected_at,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
    notes: data.notes,
  };
}

function mapWashScoreFromDB(data: any): WashTradingScore {
  return {
    id: data.id,
    userId: data.user_id,
    detectionWindowStart: data.detection_window_start,
    detectionWindowEnd: data.detection_window_end,
    temporalCorrelationScore: data.temporal_correlation_score,
    sizeRelationshipScore: data.size_relationship_score,
    priceImpactScore: data.price_impact_score,
    networkAnalysisScore: data.network_analysis_score,
    behavioralScore: data.behavioral_score,
    overallConfidence: data.overall_confidence,
    suspiciousTrades: data.suspicious_trades || [],
    featureBreakdown: data.feature_breakdown || {},
    alertLevel: data.alert_level,
    actionTaken: data.action_taken,
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at,
    reviewedBy: data.reviewed_by,
  };
}

// ============================================
// EXPORTS
// ============================================

export { STP_CONFIG };
