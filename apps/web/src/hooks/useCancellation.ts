/**
 * React Hook for Order Cancellation
 * 
 * Provides:
 * - Soft/Hard cancellation with in-flight handling
 * - State reconciliation on reconnect
 * - Cancellation progress tracking
 * - Race condition handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  cancelWithInflightHandling,
  softCancel,
  hardCancel,
  batchCancelOrders,
  reconcileOrderStates,
  getCancellationConfirmation,
  subscribeToCancellationEvents,
  CANCELLATION_CONFIG,
  recordCancellationMetrics,
} from '@/lib/cancellation/service';
import type {
  CancelResult,
  ReconcileOrderState,
  Order,
  OrderStatus,
} from '@/types';

// ============================================
// TYPES
// ============================================

interface CancellationState {
  isCancelling: boolean;
  progress: number;
  stage: 'idle' | 'soft-cancel' | 'waiting' | 'hard-cancel' | 'complete' | 'error';
  message: string;
  result?: CancelResult;
}

interface UseCancellationOptions {
  onSuccess?: (result: CancelResult) => void;
  onError?: (error: string) => void;
  onRaceCondition?: (result: CancelResult) => void;
}

interface UseCancellationReturn {
  // Single order cancellation
  cancelOrder: (orderId: string, userId: string) => Promise<CancelResult>;

  // Batch cancellation
  cancelMultipleOrders: (orderIds: string[], userId: string) => Promise<CancelResult[]>;

  // State reconciliation
  reconcileOrders: (orderIds: string[], lastSequence?: number) => Promise<ReconcileOrderState[]>;

  // Confirmation
  getConfirmation: (cancelRecordId: string) => Promise<any>;

  // State
  cancellationState: CancellationState;
  resetState: () => void;

  // Metrics
  getMetrics: () => any;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useCancellation(
  options: UseCancellationOptions = {}
): UseCancellationReturn {
  const { onSuccess, onError, onRaceCondition } = options;

  const [state, setState] = useState<CancellationState>({
    isCancelling: false,
    progress: 0,
    stage: 'idle',
    message: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const resetState = useCallback(() => {
    setState({
      isCancelling: false,
      progress: 0,
      stage: 'idle',
      message: '',
      result: undefined,
    });
  }, []);

  /**
   * Cancel a single order with full in-flight handling
   */
  const cancelOrder = useCallback(async (
    orderId: string,
    userId: string
  ): Promise<CancelResult> => {
    // Cancel any ongoing operation
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState({
      isCancelling: true,
      progress: 10,
      stage: 'soft-cancel',
      message: 'Requesting cancellation...',
    });

    try {
      // Subscribe to real-time updates
      subscriptionRef.current = subscribeToCancellationEvents(orderId, (update) => {
        setState(prev => ({
          ...prev,
          message: `Order status: ${update.status}, Filled: ${update.filled}`,
        }));
      });

      // Execute cancellation with in-flight handling
      const result = await cancelWithInflightHandling(orderId, userId);

      // Check for race condition
      const hasRaceCondition = (result.filledDuringCancel || 0) > 0;

      if (hasRaceCondition) {
        setState({
          isCancelling: false,
          progress: 100,
          stage: 'complete',
          message: `Race condition detected: ${result.filledDuringCancel} filled during cancellation`,
          result,
        });
        onRaceCondition?.(result);
      } else if (result.success) {
        setState({
          isCancelling: false,
          progress: 100,
          stage: 'complete',
          message: result.message,
          result,
        });
        onSuccess?.(result);
      } else {
        setState({
          isCancelling: false,
          progress: 0,
          stage: 'error',
          message: result.message,
          result,
        });
        onError?.(result.message);
      }

      // Record metrics
      const latency = parseFloat(result.message.match(/Total: ([\d.]+)ms/)?.[1] || '0');
      recordCancellationMetrics('HARD', latency, hasRaceCondition);

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Cancellation failed';
      setState({
        isCancelling: false,
        progress: 0,
        stage: 'error',
        message: errorMessage,
      });
      onError?.(errorMessage);

      return {
        success: false,
        sequenceNumber: 0,
        message: errorMessage,
      };
    } finally {
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;
    }
  }, [onSuccess, onError, onRaceCondition]);

  /**
   * Cancel multiple orders in batch
   */
  const cancelMultipleOrders = useCallback(async (
    orderIds: string[],
    userId: string
  ): Promise<CancelResult[]> => {
    setState({
      isCancelling: true,
      progress: 0,
      stage: 'soft-cancel',
      message: `Cancelling ${orderIds.length} orders...`,
    });

    const results: CancelResult[] = [];

    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const progress = Math.round(((i + 1) / orderIds.length) * 100);

      setState(prev => ({
        ...prev,
        progress,
        message: `Cancelling order ${i + 1} of ${orderIds.length}...`,
      }));

      const result = await cancelWithInflightHandling(orderId, userId);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;

    setState({
      isCancelling: false,
      progress: 100,
      stage: 'complete',
      message: `Cancelled ${successCount} of ${orderIds.length} orders`,
    });

    return results;
  }, []);

  /**
   * Reconcile order states after disconnection
   */
  const reconcileOrders = useCallback(async (
    orderIds: string[],
    lastSequence: number = 0
  ): Promise<ReconcileOrderState[]> => {
    setState({
      isCancelling: true,
      progress: 50,
      stage: 'waiting',
      message: 'Reconciling order states...',
    });

    const startTime = performance.now();
    const results = await reconcileOrderStates(orderIds, lastSequence);
    const elapsed = performance.now() - startTime;

    setState({
      isCancelling: false,
      progress: 100,
      stage: 'complete',
      message: `Reconciliation complete in ${elapsed.toFixed(0)}ms`,
    });

    recordCancellationMetrics('RECONCILE', elapsed);

    return results;
  }, []);

  /**
   * Get cryptographic confirmation for a cancellation
   */
  const getConfirmation = useCallback(async (cancelRecordId: string) => {
    return getCancellationConfirmation(cancelRecordId);
  }, []);

  /**
   * Get metrics
   */
  const getMetrics = useCallback(() => {
    // Import dynamically to avoid circular dependency
    const { getCancellationMetrics } = require('@/lib/cancellation/service');
    return getCancellationMetrics();
  }, []);

  return {
    cancelOrder,
    cancelMultipleOrders,
    reconcileOrders,
    getConfirmation,
    cancellationState: state,
    resetState,
    getMetrics,
  };
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook for real-time cancellation monitoring
 */
export function useCancellationMonitor(orderId: string | null) {
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [filled, setFilled] = useState<number>(0);
  const [sequenceNumber, setSequenceNumber] = useState<number>(0);

  useEffect(() => {
    if (!orderId) return;

    const subscription = subscribeToCancellationEvents(orderId, (update) => {
      setStatus(update.status);
      setFilled(update.filled);
      setSequenceNumber(update.sequenceNumber);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [orderId]);

  return { status, filled, sequenceNumber };
}

/**
 * Hook for batch cancellation with progress
 */
export function useBatchCancellation(maxConcurrent: number = 5) {
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CancelResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const cancelBatch = useCallback(async (
    orderIds: string[],
    userId: string
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const allResults: CancelResult[] = [];

    // Process in chunks
    for (let i = 0; i < orderIds.length; i += maxConcurrent) {
      const chunk = orderIds.slice(i, i + maxConcurrent);
      const chunkPromises = chunk.map(id => cancelWithInflightHandling(id, userId));

      const chunkResults = await Promise.all(chunkPromises);
      allResults.push(...chunkResults);

      setProgress(Math.round(((i + chunk.length) / orderIds.length) * 100));
      setResults([...allResults]);
    }

    setIsProcessing(false);
    return allResults;
  }, [maxConcurrent]);

  return { cancelBatch, progress, results, isProcessing };
}
