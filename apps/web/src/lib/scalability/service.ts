/**
 * Scalability & Sharding Service
 * 
 * Features:
 * - Market sharding (activity/correlation/geographic/hybrid)
 * - Shard assignment and rebalancing
 * - Storage layer management
 * - Recovery operations
 * - Hot standby monitoring
 */

import { supabase } from '@/lib/supabase';
import type {
  MarketShard,
  MarketShardAssignment,
  ShardDistribution,
  StorageLayerConfig,
  StorageLayerType,
  OrderBookCheckpoint,
  RecoveryOperation,
  HotStandbyNode,
  ShardStrategy,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const SCALABILITY_CONFIG = {
  // Checkpointing
  CHECKPOINT_INTERVAL_MS: 10000, // 10 seconds
  
  // Recovery
  MAX_RECOVERY_TIME_SECONDS: 5,
  
  // Hot standby
  MAX_REPLICATION_LAG_MS: 1000, // 1 second
  FAILOVER_TIMEOUT_MS: 1000, // 1 second
  
  // Sharding
  DEFAULT_STRATEGY: 'activity_based' as ShardStrategy,
};

// ============================================
// MARKET SHARDS
// ============================================

/**
 * Get all market shards
 */
export async function getMarketShards(
  activeOnly: boolean = true
): Promise<MarketShard[]> {
  if (!supabase) return [];

  let query = supabase
    .from('market_shards')
    .select('*')
    .order('shard_number');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get market shards error:', error);
    return [];
  }

  return (data || []).map(mapShardFromDB);
}

/**
 * Get shard distribution
 */
export async function getShardDistribution(): Promise<ShardDistribution[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('shard_distribution')
    .select('*');

  if (error) {
    console.error('Get shard distribution error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    shardNumber: d.shard_number,
    shardName: d.shard_name,
    strategy: d.strategy,
    primaryNode: d.primary_node,
    isActive: d.is_active,
    assignedMarkets: d.assigned_markets,
    totalOrders: d.total_orders,
    avgLatencyMs: d.avg_latency_ms,
  }));
}

/**
 * Assign market to shard
 */
export async function assignMarketToShard(
  marketId: string,
  strategy: ShardStrategy = SCALABILITY_CONFIG.DEFAULT_STRATEGY
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.rpc('assign_market_to_shard', {
      p_market_id: marketId,
      p_strategy: strategy,
    });

    if (error) {
      console.error('Assign market to shard error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Assign market to shard exception:', error);
    return null;
  }
}

/**
 * Get market's shard assignment
 */
export async function getMarketShardAssignment(
  marketId: string
): Promise<MarketShardAssignment | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('market_shard_assignments')
    .select('*')
    .eq('market_id', marketId)
    .single();

  if (error) return null;

  return {
    id: data.id,
    marketId: data.market_id,
    shardId: data.shard_id,
    assignedAt: data.assigned_at,
  };
}

// ============================================
// STORAGE LAYERS
// ============================================

/**
 * Get storage layer configuration
 */
export async function getStorageLayerConfig(
  layer?: StorageLayerType
): Promise<StorageLayerConfig[]> {
  if (!supabase) return [];

  let query = supabase
    .from('storage_layer_config')
    .select('*')
    .order('target_latency_ms');

  if (layer) {
    query = query.eq('layer', layer);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get storage layer config error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    layer: d.layer,
    technology: d.technology,
    storageFormat: d.storage_format,
    durabilityDescription: d.durability_description,
    maxDataLossMs: d.max_data_loss_ms,
    recoveryTimeSla: d.recovery_time_sla,
    recoveryProcedure: d.recovery_procedure,
    replicationFactor: d.replication_factor,
    replicationRegions: d.replication_regions,
    targetLatencyMs: d.target_latency_ms,
    maxThroughputOps: d.max_throughput_ops,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

// ============================================
// CHECKPOINTS
// ============================================

/**
 * Get checkpoints for a shard
 */
export async function getShardCheckpoints(
  shardId: string,
  limit: number = 10
): Promise<OrderBookCheckpoint[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('order_book_checkpoints')
    .select('*')
    .eq('shard_id', shardId)
    .order('checkpoint_sequence', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get shard checkpoints error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    shardId: d.shard_id,
    checkpointSequence: d.checkpoint_sequence,
    stateHash: d.state_hash,
    orderCount: d.order_count,
    totalVolume: parseFloat(d.total_volume),
    hotStorageReference: d.hot_storage_reference,
    warmStoragePath: d.warm_storage_path,
    verifiedAt: d.verified_at,
    verificationHash: d.verification_hash,
    createdAt: d.created_at,
  }));
}

/**
 * Get latest checkpoint
 */
export async function getLatestCheckpoint(
  shardId: string
): Promise<OrderBookCheckpoint | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('order_book_checkpoints')
    .select('*')
    .eq('shard_id', shardId)
    .order('checkpoint_sequence', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;

  return {
    id: data.id,
    shardId: data.shard_id,
    checkpointSequence: data.checkpoint_sequence,
    stateHash: data.state_hash,
    orderCount: data.order_count,
    totalVolume: parseFloat(data.total_volume),
    hotStorageReference: data.hot_storage_reference,
    warmStoragePath: data.warm_storage_path,
    verifiedAt: data.verified_at,
    verificationHash: data.verification_hash,
    createdAt: data.created_at,
  };
}

// ============================================
// RECOVERY OPERATIONS
// ============================================

/**
 * Get recovery operations
 */
export async function getRecoveryOperations(
  shardId?: string,
  status?: string
): Promise<RecoveryOperation[]> {
  if (!supabase) return [];

  let query = supabase
    .from('recovery_operations')
    .select('*')
    .order('created_at', { ascending: false });

  if (shardId) {
    query = query.eq('shard_id', shardId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get recovery operations error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    shardId: d.shard_id,
    recoveryType: d.recovery_type,
    sourceCheckpoint: d.source_checkpoint,
    status: d.status,
    totalOperations: d.total_operations,
    completedOperations: d.completed_operations,
    startedAt: d.started_at,
    completedAt: d.completed_at,
    estimatedCompletion: d.estimated_completion,
    consistencyVerified: d.consistency_verified,
    verificationResult: d.verification_result,
    createdAt: d.created_at,
  }));
}

/**
 * Start recovery operation
 */
export async function startRecovery(
  shardId: string,
  recoveryType: string,
  sourceCheckpoint?: string
): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('recovery_operations')
    .insert({
      shard_id: shardId,
      recovery_type: recoveryType,
      source_checkpoint: sourceCheckpoint,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Start recovery error:', error);
    return null;
  }

  return data?.id;
}

// ============================================
// HOT STANDBY
// ============================================

/**
 * Get hot standby nodes
 */
export async function getHotStandbyNodes(
  shardId?: string
): Promise<HotStandbyNode[]> {
  if (!supabase) return [];

  let query = supabase
    .from('hot_standby_nodes')
    .select('*, market_shards(shard_name)')
    .order('failover_priority');

  if (shardId) {
    query = query.eq('shard_id', shardId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get hot standby nodes error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    shardId: d.shard_id,
    nodeName: d.node_name,
    nodeAddress: d.node_address,
    isPrimary: d.is_primary,
    replicationLagMs: d.replication_lag_ms,
    lastSyncAt: d.last_sync_at,
    failoverPriority: d.failover_priority,
    autoFailoverEnabled: d.auto_failover_enabled,
    status: d.status,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
}

/**
 * Get hot standby status view
 */
export async function getHotStandbyStatus(): Promise<Array<HotStandbyNode & { shardName: string; shardActive: boolean }>> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('hot_standby_status')
    .select('*');

  if (error) {
    console.error('Get hot standby status error:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    shardId: d.shard_id,
    nodeName: d.node_name,
    nodeAddress: d.node_address,
    isPrimary: d.is_primary,
    replicationLagMs: d.replication_lag_ms,
    lastSyncAt: d.last_sync_at,
    failoverPriority: d.failover_priority,
    autoFailoverEnabled: d.auto_failover_enabled,
    status: d.status,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    shardName: d.shard_name,
    shardActive: d.shard_active,
  }));
}

// ============================================
// SCALABILITY STATS
// ============================================

export interface ScalabilityStats {
  totalShards: number;
  activeShards: number;
  totalMarkets: number;
  avgOrdersPerShard: number;
  hotStandbyNodes: number;
  syncingNodes: number;
  failedNodes: number;
  pendingRecoveries: number;
}

/**
 * Get scalability stats
 */
export async function getScalabilityStats(): Promise<ScalabilityStats> {
  if (!supabase) {
    return {
      totalShards: 0,
      activeShards: 0,
      totalMarkets: 0,
      avgOrdersPerShard: 0,
      hotStandbyNodes: 0,
      syncingNodes: 0,
      failedNodes: 0,
      pendingRecoveries: 0,
    };
  }

  try {
    const { data: shards, error: shardsError } = await supabase
      .from('market_shards')
      .select('is_active, total_orders');

    if (shardsError) throw shardsError;

    const { data: assignments, error: assignmentsError } = await supabase
      .from('market_shard_assignments')
      .select('id', { count: 'exact' });

    if (assignmentsError) throw assignmentsError;

    const { data: standbys, error: standbysError } = await supabase
      .from('hot_standby_nodes')
      .select('status');

    if (standbysError) throw standbysError;

    const { data: recoveries, error: recoveriesError } = await supabase
      .from('recovery_operations')
      .select('id')
      .in('status', ['pending', 'in_progress']);

    if (recoveriesError) throw recoveriesError;

    const activeShards = shards?.filter((s: any) => s.is_active) || [];
    const totalOrders = activeShards.reduce((sum: number, s: any) => sum + (s.total_orders || 0), 0);

    return {
      totalShards: shards?.length || 0,
      activeShards: activeShards.length,
      totalMarkets: assignments?.length || 0,
      avgOrdersPerShard: activeShards.length > 0 ? Math.round(totalOrders / activeShards.length) : 0,
      hotStandbyNodes: standbys?.filter((s: any) => s.status === 'synced').length || 0,
      syncingNodes: standbys?.filter((s: any) => s.status === 'syncing').length || 0,
      failedNodes: standbys?.filter((s: any) => s.status === 'failed').length || 0,
      pendingRecoveries: recoveries?.length || 0,
    };
  } catch (error) {
    console.error('Get scalability stats error:', error);
    return {
      totalShards: 0,
      activeShards: 0,
      totalMarkets: 0,
      avgOrdersPerShard: 0,
      hotStandbyNodes: 0,
      syncingNodes: 0,
      failedNodes: 0,
      pendingRecoveries: 0,
    };
  }
}

// ============================================
// UTILITIES
// ============================================

function mapShardFromDB(data: any): MarketShard {
  return {
    id: data.id,
    shardNumber: data.shard_number,
    shardName: data.shard_name,
    strategy: data.strategy,
    marketIdRangeStart: data.market_id_range_start,
    marketIdRangeEnd: data.market_id_range_end,
    marketCategoryFilter: data.market_category_filter,
    geographicRegion: data.geographic_region,
    primaryNode: data.primary_node,
    secondaryNode: data.secondary_node,
    databaseConnectionString: data.database_connection_string,
    isActive: data.is_active,
    isReadOnly: data.is_read_only,
    totalMarkets: data.total_markets,
    totalOrders: data.total_orders,
    avgLatencyMs: data.avg_latency_ms,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================
// EXPORTS
// ============================================

export { SCALABILITY_CONFIG };
