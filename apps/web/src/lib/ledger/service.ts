/**
 * Trade Ledger Immutability Service
 * 
 * Features:
 * - Cryptographic chaining (SHA-256)
 * - Merkle tree verification
 * - Blockchain anchoring
 * - Ledger integrity verification
 */

import { supabase } from '@/lib/supabase';
import type {
  TradeLedger,
  LedgerCheckpoint,
  LedgerVerificationResult,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const LEDGER_CONFIG = {
  CHECKPOINT_INTERVAL: 1000, // Trades per checkpoint
  ANCHOR_INTERVAL_MS: 60000, // 1 minute
  HASH_ALGORITHM: 'SHA-256',
};

// ============================================
// CRYPTOGRAPHIC FUNCTIONS
// ============================================

/**
 * Calculate SHA-256 hash
 */
export async function calculateSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate trade data hash
 */
export async function calculateTradeHash(
  tradeId: string,
  marketId: string,
  buyerId: string,
  sellerId: string,
  price: number,
  quantity: number,
  executedAtNs: number
): Promise<string> {
  const data = `${tradeId}${marketId}${buyerId}${sellerId}${price}${quantity}${executedAtNs}`;
  return calculateSHA256(data);
}

/**
 * Calculate combined hash (previous + current)
 */
export async function calculateCombinedHash(
  previousHash: string,
  tradeDataHash: string
): Promise<string> {
  return calculateSHA256(previousHash + tradeDataHash);
}

/**
 * Calculate Merkle root for array of hashes
 */
export async function calculateMerkleRoot(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];

  let level = hashes;

  while (level.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        // Combine two hashes
        const combined = await calculateSHA256(level[i] + level[i + 1]);
        nextLevel.push(combined);
      } else {
        // Odd one out - duplicate and hash
        const combined = await calculateSHA256(level[i] + level[i]);
        nextLevel.push(combined);
      }
    }

    level = nextLevel;
  }

  return level[0];
}

// ============================================
// LEDGER OPERATIONS
// ============================================

/**
 * Get trade ledger entry by trade ID
 */
export async function getLedgerEntry(tradeId: string): Promise<TradeLedger | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('trade_ledger')
    .select('*')
    .eq('trade_id', tradeId)
    .single();

  if (error || !data) {
    console.error('Error fetching ledger entry:', error);
    return null;
  }

  return mapLedgerFromDB(data);
}

/**
 * Get ledger entries for a range
 */
export async function getLedgerRange(
  startSequence: number,
  endSequence: number
): Promise<TradeLedger[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('trade_ledger')
    .select('*')
    .gte('ledger_sequence', startSequence)
    .lte('ledger_sequence', endSequence)
    .order('ledger_sequence', { ascending: true });

  if (error) {
    console.error('Error fetching ledger range:', error);
    return [];
  }

  return (data || []).map(mapLedgerFromDB);
}

/**
 * Verify ledger chain integrity
 */
export async function verifyLedgerChain(
  startSequence: number = 1,
  endSequence?: number
): Promise<LedgerVerificationResult> {
  if (!supabase) {
    return { isValid: false, reason: 'Supabase not initialized' } as LedgerVerificationResult;
  }

  try {
    const { data, error } = await supabase.rpc('verify_ledger_chain', {
      p_start_sequence: startSequence,
      p_end_sequence: endSequence,
    });

    if (error) {
      console.error('Ledger verification error:', error);
      return { isValid: false, reason: error.message } as LedgerVerificationResult;
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        isValid: result.is_valid,
        corruptedAtSequence: result.corrupted_at_sequence,
        corruptedTradeId: result.corrupted_trade_id,
        expectedHash: result.expected_hash,
        actualHash: result.actual_hash,
      };
    }

    return { isValid: false, reason: 'No verification result' } as LedgerVerificationResult;
  } catch (error: any) {
    return { isValid: false, reason: error?.message } as LedgerVerificationResult;
  }
}

/**
 * Get checkpoint by sequence
 */
export async function getCheckpoint(sequence: number): Promise<LedgerCheckpoint | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('ledger_checkpoints')
    .select('*')
    .eq('checkpoint_sequence', sequence)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    checkpointSequence: data.checkpoint_sequence,
    startTradeSequence: data.start_trade_sequence,
    endTradeSequence: data.end_trade_sequence,
    startHash: data.start_hash,
    endHash: data.end_hash,
    merkleRoot: data.merkle_root,
    blockchainTxHash: data.blockchain_tx_hash,
    anchorTimestamp: data.anchor_timestamp,
    verifiedAt: data.verified_at,
    verificationStatus: data.verification_status,
    corruptionDetectedAt: data.corruption_detected_at,
    createdAt: data.created_at,
  };
}

/**
 * Verify checkpoint Merkle root
 */
export async function verifyCheckpoint(checkpointId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const checkpoint = await getCheckpoint(parseInt(checkpointId));
    if (!checkpoint) return false;

    // Get all hashes in range
    const entries = await getLedgerRange(
      checkpoint.startTradeSequence,
      checkpoint.endTradeSequence
    );

    const hashes = entries.map(e => e.combinedHash);
    const calculatedRoot = await calculateMerkleRoot(hashes);

    return calculatedRoot === checkpoint.merkleRoot;
  } catch (error) {
    console.error('Checkpoint verification error:', error);
    return false;
  }
}

// ============================================
// BLOCKCHAIN ANCHORING
// ============================================

/**
 * Get latest anchored checkpoint
 */
export async function getLatestAnchor(): Promise<LedgerCheckpoint | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('ledger_checkpoints')
    .select('*')
    .not('blockchain_tx_hash', 'is', null)
    .order('checkpoint_sequence', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    checkpointSequence: data.checkpoint_sequence,
    startTradeSequence: data.start_trade_sequence,
    endTradeSequence: data.end_trade_sequence,
    startHash: data.start_hash,
    endHash: data.end_hash,
    merkleRoot: data.merkle_root,
    blockchainTxHash: data.blockchain_tx_hash,
    anchorTimestamp: data.anchor_timestamp,
    verifiedAt: data.verified_at,
    verificationStatus: data.verification_status,
    corruptionDetectedAt: data.corruption_detected_at,
    createdAt: data.created_at,
  };
}

// ============================================
// UTILITIES
// ============================================

function mapLedgerFromDB(data: any): TradeLedger {
  return {
    id: data.id,
    tradeId: data.trade_id,
    marketId: data.market_id,
    buyerId: data.buyer_id,
    sellerId: data.seller_id,
    makerId: data.maker_id, // Added maker_id mapping
    takerId: data.taker_id, // Added taker_id mapping
    price: parseFloat(data.price),
    quantity: parseFloat(data.quantity),
    totalValue: parseFloat(data.total_value),
    previousHash: data.previous_hash,
    tradeDataHash: data.trade_data_hash,
    combinedHash: data.combined_hash,
    merkleLeafHash: data.merkle_leaf_hash,
    merkleRootHash: data.merkle_root_hash,
    merkleTreeLevel: data.merkle_tree_level,
    merkleSiblingHash: data.merkle_sibling_hash,
    blockchainTxHash: data.blockchain_tx_hash,
    blockchainAnchorHeight: data.blockchain_anchor_height,
    anchoredAt: data.anchored_at,
    sequenceNumber: data.sequence_number,
    ledgerSequence: data.ledger_sequence,
    checkpointId: data.checkpoint_id,
    executedAtNs: data.executed_at_ns,
    recordedAt: data.recorded_at,
    isSealed: data.is_sealed,
    sealedAt: data.sealed_at,
  };
}

// ============================================
// EXPORTS
// ============================================

export { LEDGER_CONFIG };
