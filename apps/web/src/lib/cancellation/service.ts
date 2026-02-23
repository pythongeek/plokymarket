/**
 * Advanced Order Cancellation Service
 * 
 * Features:
 * - Soft Cancel vs Hard Cancel distinction
 * - In-flight order handling with optimistic concurrency
 * - Race condition resolution
 * - State reconciliation protocol
 * - Cryptographic confirmation
 */

import { supabase } from '@/lib/supabase';
import type {
  CancelResult,
  CancelType,
  CancellationConfirmation,
  ReconcileOrderState,
  BatchCancelResult,
  Order,
  OrderStatus,
} from '@/types';

// ============================================
// CONFIGURATION
// ============================================

const CANCELLATION_CONFIG = {
  // Timing
  SOFT_CANCEL_ACK_TIMEOUT_MS: 10,
  HARD_CANCEL_CONFIRM_TIMEOUT_MS: 50,
  INFLIGHT_WAIT_TIMEOUT_MS: 5000,
  RECONCILIATION_TIMEOUT_MS: 500,

  // Retry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 100,

  // State reconciliation
  MAX_RECONCILIATION_BATCH_SIZE: 100,
};

// ============================================
// TYPES
// ============================================

interface InflightOrderState {
  orderId: string;
  status: OrderStatus;
  filled: number;
  lastUpdateTime: number;
}

interface CancellationState {
  pendingCancellations: Map<string, {
    promise: Promise<CancelResult>;
    startTime: number;
    clientRequestId: string;
  }>;
  sequenceNumber: number;
  lastReconciliationTime: number;
}

// ============================================
// STATE MANAGEMENT
// ============================================

const cancellationState: CancellationState = {
  pendingCancellations: new Map(),
  sequenceNumber: 0,
  lastReconciliationTime: 0,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateClientRequestId(): string {
  return `cancel_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate Ed25519-compatible signature payload
 * Note: Actual Ed25519 signing would require a crypto library
 * This generates the payload that would be signed
 */
function generateSignaturePayload(
  orderId: string,
  timestamp: number,
  filledQty: number,
  remainingQty: number,
  avgPrice: number,
  releasedCollateral: number,
  sequenceNumber: number
): string {
  const payload = `${orderId}:${timestamp}:${filledQty}:${remainingQty}:${avgPrice}:${releasedCollateral}:${sequenceNumber}`;

  // In production, this would be: return ed25519Sign(payload, privateKey)
  // For demo, we return a hash-like string
  return btoa(payload).substring(0, 128);
}

// ============================================
// CORE CANCELLATION FUNCTIONS
// ============================================

/**
 * Soft Cancel - Request accepted, order marked pending cancellation
 * Prevents new matches but allows in-flight matches to complete
 * 
 * Latency: < 10ms acknowledgment
 */
export async function softCancel(
  orderId: string,
  userId: string
): Promise<CancelResult> {
  const startTime = performance.now();
  const clientRequestId = generateClientRequestId();

  try {
    if (!supabase) {
      return {
        success: false,
        sequenceNumber: 0,
        message: 'Supabase not initialized',
      };
    }

    // Call the database soft cancel function
    const { data, error } = await supabase
      .rpc('soft_cancel_order', {
        p_order_id: orderId,
        p_user_id: userId,
        p_client_request_id: clientRequestId,
      });

    if (error) {
      console.error('Soft cancel error:', error);
      return {
        success: false,
        sequenceNumber: 0,
        message: `Database error: ${error.message}`,
      };
    }

    const elapsed = performance.now() - startTime;

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        cancelRecordId: result.cancel_record_id,
        sequenceNumber: result.sequence_number,
        message: `${result.message} (ack: ${elapsed.toFixed(2)}ms)`,
        currentStatus: result.current_status as OrderStatus,
      };
    }

    return {
      success: false,
      sequenceNumber: 0,
      message: 'No response from cancellation service',
    };
  } catch (error: any) {
    const elapsed = performance.now() - startTime;
    return {
      success: false,
      sequenceNumber: 0,
      message: `Exception after ${elapsed.toFixed(2)}ms: ${error?.message}`,
    };
  }
}

/**
 * Hard Cancel - Definitive removal from book, balance released
 * 
 * Latency: < 50ms confirmation
 */
export async function hardCancel(
  orderId: string,
  userId: string
): Promise<CancelResult> {
  const startTime = performance.now();

  try {
    if (!supabase) {
      return {
        success: false,
        sequenceNumber: 0,
        message: 'Supabase not initialized',
      };
    }

    const { data, error } = await supabase
      .rpc('hard_cancel_order', {
        p_order_id: orderId,
        p_user_id: userId,
        p_is_system: false,
      });

    if (error) {
      console.error('Hard cancel error:', error);
      return {
        success: false,
        sequenceNumber: 0,
        message: `Database error: ${error.message}`,
      };
    }

    const elapsed = performance.now() - startTime;

    if (data && data.length > 0) {
      const result = data[0];
      return {
        success: result.success,
        cancelRecordId: result.cancel_record_id,
        sequenceNumber: result.sequence_number,
        message: `${result.message} (confirm: ${elapsed.toFixed(2)}ms)`,
        releasedCollateral: parseFloat(result.released_collateral || '0'),
        finalStatus: result.final_status as OrderStatus,
        filledDuringCancel: parseFloat(result.filled_during_cancel || '0'),
      };
    }

    return {
      success: false,
      sequenceNumber: 0,
      message: 'No response from cancellation service',
    };
  } catch (error: any) {
    const elapsed = performance.now() - startTime;
    return {
      success: false,
      sequenceNumber: 0,
      message: `Exception after ${elapsed.toFixed(2)}ms: ${error?.message}`,
    };
  }
}

/**
 * Cancel with In-Flight Handling
 * 
 * Implements optimistic concurrency control for orders in matching pipeline.
 * Handles race conditions between cancellation and fill events.
 * 
 * State Machine:
 * ACTIVE → CANCELLING (soft cancel requested)
 *        → [matching completes] → PARTIAL + CANCELLING
 *        → [hard cancel confirmed] → CANCELLED
 *        → [fill occurs first] → FILLED (cancel rejected)
 */
export async function cancelWithInflightHandling(
  orderId: string,
  userId: string
): Promise<CancelResult> {
  const overallStartTime = performance.now();

  // Step 1: Attempt optimistic soft cancel
  const softResult = await softCancel(orderId, userId);

  if (!softResult.success) {
    // Soft cancel failed - order might already be filled or in invalid state
    return softResult;
  }

  // Check if we got the lock and order is now CANCELLING
  if (softResult.currentStatus?.toLowerCase() !== 'cancelling') {
    // Order state changed during soft cancel attempt
    return {
      ...softResult,
      message: `Order state changed to ${softResult.currentStatus}, cancellation may have been rejected`,
    };
  }

  // Step 2: Wait for any in-flight matching to complete
  const waitStartTime = performance.now();
  const waitResult = await waitForMatchingComplete(
    orderId,
    CANCELLATION_CONFIG.INFLIGHT_WAIT_TIMEOUT_MS
  );
  const waitElapsed = performance.now() - waitStartTime;

  if (!waitResult.complete) {
    // Timeout waiting for matching
    return {
      success: false,
      sequenceNumber: softResult.sequenceNumber,
      message: `Timeout waiting for in-flight matching (${waitElapsed.toFixed(2)}ms)`,
    };
  }

  // Step 3: Execute hard cancel
  const hardResult = await hardCancel(orderId, userId);

  const overallElapsed = performance.now() - overallStartTime;

  return {
    ...hardResult,
    message: `${hardResult.message} | Total: ${overallElapsed.toFixed(2)}ms (wait: ${waitElapsed.toFixed(2)}ms)`,
  };
}

/**
 * Wait for matching to complete on an order
 */
async function waitForMatchingComplete(
  orderId: string,
  timeoutMs: number
): Promise<{ complete: boolean; order?: Order; fillOccurred: boolean }> {
  const startTime = Date.now();
  let lastFilled: number | null = null;
  let stableCount = 0;
  const STABILITY_THRESHOLD = 3; // Number of consecutive stable checks
  const CHECK_INTERVAL_MS = 50;

  while (Date.now() - startTime < timeoutMs) {
    if (!supabase) {
      return { complete: false, fillOccurred: false };
    }

    // Fetch current order state
    const { data: order, error } = await supabase
      .from('order_book')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return { complete: false, fillOccurred: false };
    }

    // Check if order is in terminal state
    const normalizedStatus = order.status?.toLowerCase();
    const terminalStatuses = ['filled', 'cancelled', 'expired'];

    if (terminalStatuses.includes(normalizedStatus)) {
      return {
        complete: true,
        order,
        fillOccurred: order.filled > (lastFilled || 0)
      };
    }

    // Check for stability (no new fills)
    if (lastFilled === null || order.filled === lastFilled) {
      stableCount++;
      if (stableCount >= STABILITY_THRESHOLD) {
        // Order appears stable, safe to proceed
        return {
          complete: true,
          order,
          fillOccurred: order.filled > 0
        };
      }
    } else {
      // Fill occurred, reset stability counter
      stableCount = 0;
      lastFilled = order.filled;
    }

    await sleep(CHECK_INTERVAL_MS);
  }

  // Timeout
  return { complete: false, fillOccurred: false };
}

// ============================================
// BATCH CANCELLATION
// ============================================

/**
 * Batch cancel multiple orders
 */
export async function batchCancelOrders(
  orderIds: string[],
  userId: string
): Promise<BatchCancelResult[]> {
  if (!supabase) {
    return orderIds.map(orderId => ({
      orderId,
      success: false,
      message: 'Supabase not initialized',
      sequenceNumber: 0,
    }));
  }

  const { data, error } = await supabase
    .rpc('batch_cancel_orders', {
      p_order_ids: orderIds,
      p_user_id: userId,
    });

  if (error) {
    console.error('Batch cancel error:', error);
    return orderIds.map(orderId => ({
      orderId,
      success: false,
      message: error.message,
      sequenceNumber: 0,
    }));
  }

  return (data || []).map((result: any) => ({
    orderId: result.order_id,
    success: result.success,
    message: result.message,
    sequenceNumber: result.sequence_number,
  }));
}

// ============================================
// STATE RECONCILIATION PROTOCOL
// ============================================

/**
 * Reconcile order states after disconnection
 * 
 * Clients request current state for all pending orders.
 * Server returns definitive state including any fills/cancellations during disconnection.
 * Client applies updates with conflict resolution.
 * 
 * Target: Reconciliation completes within 500ms with visual progress indication.
 */
export async function reconcileOrderStates(
  orderIds: string[],
  clientLastSequence: number = 0
): Promise<ReconcileOrderState[]> {
  const startTime = performance.now();

  if (!supabase) {
    return [];
  }

  // Limit batch size
  const batch = orderIds.slice(0, CANCELLATION_CONFIG.MAX_RECONCILIATION_BATCH_SIZE);

  const { data, error } = await supabase
    .rpc('reconcile_order_state', {
      p_order_ids: batch,
      p_client_last_sequence: clientLastSequence,
    });

  if (error) {
    console.error('Reconciliation error:', error);
    return [];
  }

  const elapsed = performance.now() - startTime;

  if (elapsed > CANCELLATION_CONFIG.RECONCILIATION_TIMEOUT_MS) {
    console.warn(`Reconciliation took ${elapsed.toFixed(2)}ms, exceeding target of ${CANCELLATION_CONFIG.RECONCILIATION_TIMEOUT_MS}ms`);
  }

  return (data || []).map((item: any) => ({
    orderId: item.order_id,
    currentStatus: item.current_status as OrderStatus,
    filledQuantity: parseFloat(item.filled_quantity || '0'),
    cancelledQuantity: parseFloat(item.cancelled_quantity || '0'),
    sequenceNumber: item.sequence_number,
    changesSinceSequence: item.changes_since_sequence || [],
  }));
}

/**
 * Apply reconciliation results with conflict resolution
 */
export function applyReconciliation(
  currentOrders: Map<string, Order>,
  reconciliationResults: ReconcileOrderState[]
): {
  updatedOrders: Order[];
  conflicts: Array<{ orderId: string; localState: Order; serverState: ReconcileOrderState }>;
} {
  const updatedOrders: Order[] = [];
  const conflicts: Array<{ orderId: string; localState: Order; serverState: ReconcileOrderState }> = [];

  for (const serverState of reconciliationResults) {
    const localOrder = currentOrders.get(serverState.orderId);

    if (!localOrder) {
      // Order not found locally, might be new or was removed
      continue;
    }

    // Check for conflicts
    const hasConflict =
      localOrder.status !== serverState.currentStatus ||
      localOrder.filled_quantity !== serverState.filledQuantity;

    if (hasConflict) {
      conflicts.push({
        orderId: serverState.orderId,
        localState: localOrder,
        serverState,
      });

      // Apply server state (server wins)
      updatedOrders.push({
        ...localOrder,
        status: serverState.currentStatus,
        filled_quantity: serverState.filledQuantity,
      });
    }
  }

  return { updatedOrders, conflicts };
}

// ============================================
// CANCELLATION CONFIRMATION
// ============================================

/**
 * Get cryptographic cancellation confirmation
 */
export async function getCancellationConfirmation(
  cancelRecordId: string
): Promise<{ confirmation: CancellationConfirmation | null; signature: string }> {
  if (!supabase) {
    return { confirmation: null, signature: '' };
  }

  const { data, error } = await supabase
    .rpc('generate_cancellation_confirmation', {
      p_cancel_record_id: cancelRecordId,
    });

  if (error || !data || data.length === 0) {
    console.error('Confirmation generation error:', error);
    return { confirmation: null, signature: '' };
  }

  const result = data[0];
  const confirmationData: CancellationConfirmation = result.confirmation_data;

  // Generate signature payload
  const signature = generateSignaturePayload(
    confirmationData.orderId,
    confirmationData.cancellationTimestamp,
    parseFloat(confirmationData.filledQuantity),
    parseFloat(confirmationData.remainingQuantity),
    parseFloat(confirmationData.averageFillPrice),
    parseFloat(confirmationData.releasedCollateral),
    confirmationData.sequenceNumber
  );

  return { confirmation: confirmationData, signature };
}

// ============================================
// EXPIRY HANDLING
// ============================================

/**
 * Expire an order (for GTD - Good Till Date orders)
 */
export async function expireOrder(
  orderId: string,
  reason: string = 'GTD_EXPIRED'
): Promise<{ success: boolean; releasedCollateral?: number; message: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase not initialized' };
  }

  const { data, error } = await supabase
    .rpc('expire_order', {
      p_order_id: orderId,
      p_expiry_reason: reason,
    });

  if (error) {
    return { success: false, message: error.message };
  }

  if (data && data.length > 0) {
    return {
      success: data[0].success,
      releasedCollateral: parseFloat(data[0].released_collateral || '0'),
      message: data[0].success ? 'Order expired' : 'Failed to expire order',
    };
  }

  return { success: false, message: 'No response' };
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to cancellation events for an order
 */
export function subscribeToCancellationEvents(
  orderId: string,
  onUpdate: (update: { status: OrderStatus; filled: number; sequenceNumber: number }) => void
) {
  if (!supabase) {
    return { unsubscribe: () => { } };
  }

  const channel = supabase
    .channel(`order-cancellations:${orderId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'order_book',
        filter: `id=eq.${orderId}`,
      },
      (payload: any) => {
        onUpdate({
          status: payload.new.status,
          filled: payload.new.filled,
          sequenceNumber: payload.new.sequence_number || 0,
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase?.removeChannel(channel);
    },
  };
}

// ============================================
// METRICS & MONITORING
// ============================================

interface CancellationMetrics {
  totalCancellations: number;
  softCancelLatencies: number[];
  hardCancelLatencies: number[];
  raceConditions: number;
  reconciliationTimes: number[];
}

const metrics: CancellationMetrics = {
  totalCancellations: 0,
  softCancelLatencies: [],
  hardCancelLatencies: [],
  raceConditions: 0,
  reconciliationTimes: [],
};

export function recordCancellationMetrics(
  type: 'SOFT' | 'HARD' | 'RECONCILE',
  latencyMs: number,
  raceCondition?: boolean
) {
  metrics.totalCancellations++;

  if (type === 'SOFT') {
    metrics.softCancelLatencies.push(latencyMs);
  } else if (type === 'HARD') {
    metrics.hardCancelLatencies.push(latencyMs);
  } else if (type === 'RECONCILE') {
    metrics.reconciliationTimes.push(latencyMs);
  }

  if (raceCondition) {
    metrics.raceConditions++;
  }
}

export function getCancellationMetrics(): CancellationMetrics {
  return { ...metrics };
}

// ============================================
// EXPORTS
// ============================================

export {
  CANCELLATION_CONFIG,
  generateClientRequestId,
  generateSignaturePayload,
};
