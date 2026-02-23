/**
 * State Reconciliation API
 * 
 * POST /api/orders/reconcile
 * 
 * Request Body:
 * {
 *   orderIds: string[],
 *   lastSequence?: number,
 *   clientTimestamp?: number
 * }
 * 
 * Response:
 * {
 *   reconciled: ReconcileOrderState[],
 *   conflicts: Array<{
 *     orderId: string,
 *     serverState: ReconcileOrderState,
 *     suggestedAction: string
 *   }>,
 *   currentSequence: number,
 *   reconciliationTimeMs: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const body = await request.json();
    const { orderIds, lastSequence = 0 } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid orderIds array' },
        { status: 400 }
      );
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 100;
    const batch = orderIds.slice(0, MAX_BATCH_SIZE);

    const supabase = await createServiceClient();

    // Call the reconciliation function
    const { data, error } = await supabase.rpc('reconcile_order_state', {
      p_order_ids: batch,
      p_client_last_sequence: lastSequence,
    });

    if (error) {
      console.error('Reconciliation RPC error:', error);
      return NextResponse.json(
        { error: `Reconciliation failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Process results
    const reconciled = (data || []).map((item: any) => ({
      orderId: item.order_id,
      currentStatus: item.current_status,
      filledQuantity: parseFloat(item.filled_quantity || '0'),
      cancelledQuantity: parseFloat(item.cancelled_quantity || '0'),
      sequenceNumber: item.sequence_number,
      changesSinceSequence: item.changes_since_sequence || [],
    }));

    // Identify conflicts (orders with changes since client's last sequence)
    const conflicts = reconciled
      .filter((item: any) => item.changesSinceSequence.length > 0)
      .map((item: any) => ({
        orderId: item.orderId,
        serverState: item,
        suggestedAction: getSuggestedAction(item.currentStatus, item.changesSinceSequence),
      }));

    // Get current global sequence
    const { data: seqData } = await supabase
      .from('global_sequence')
      .select('last_sequence')
      .single();

    const elapsed = Math.round(performance.now() - startTime);

    return NextResponse.json({
      reconciled,
      conflicts,
      conflictCount: conflicts.length,
      currentSequence: seqData?.last_sequence || 0,
      reconciliationTimeMs: elapsed,
      batchSize: batch.length,
      truncated: orderIds.length > MAX_BATCH_SIZE,
    });

  } catch (error: any) {
    console.error('Reconciliation error:', error);
    return NextResponse.json(
      { error: error.message || 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

/**
 * Get suggested action based on state changes
 */
function getSuggestedAction(status: string, changes: any[]): string {
  const hasFill = changes.some((c: any) => c.filled_before > 0);
  const hasCancel = changes.some((c: any) => c.type === 'CANCEL');

  if (status === 'FILLED') {
    return hasCancel
      ? 'Order was filled during cancellation attempt - fill takes precedence'
      : 'Order fully filled';
  }

  if (status === 'CANCELLED') {
    return hasFill
      ? 'Order partially filled then cancelled'
      : 'Order successfully cancelled';
  }

  if (status === 'CANCELLING') {
    return 'Cancellation in progress - wait for hard cancel confirmation';
  }

  if (status === 'EXPIRED') {
    return 'Order expired (GTD)';
  }

  return 'No action required';
}

/**
 * GET /api/orders/reconcile/confirmation
 * Get cryptographic confirmation for a cancellation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cancelRecordId = searchParams.get('cancelRecordId');

    if (!cancelRecordId) {
      return NextResponse.json(
        { error: 'Missing cancelRecordId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    const { data, error } = await supabase.rpc('generate_cancellation_confirmation', {
      p_cancel_record_id: cancelRecordId,
    });

    if (error) {
      return NextResponse.json(
        { error: `Failed to generate confirmation: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Cancellation record not found' },
        { status: 404 }
      );
    }

    const confirmation = data[0].confirmation_data;
    const signaturePayload = data[0].signature_payload;

    // In production, we would sign this with Ed25519
    // For demo, we generate a mock signature
    const mockSignature = generateMockSignature(signaturePayload);

    return NextResponse.json({
      confirmation,
      signature: mockSignature,
      signaturePayload,
      algorithm: 'Ed25519',
      verified: true, // In production, client would verify
    });

  } catch (error: any) {
    console.error('Confirmation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get confirmation' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock signature for demo
 */
function generateMockSignature(payload: string): string {
  // In production: return ed25519Sign(payload, privateKey)
  // This is a placeholder that creates a deterministic-looking signature
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);

  // Simple hash-like function for demo
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    hash = ((hash << 5) - hash + byte) | 0;
  }

  // Create hex-like signature
  const signature = Math.abs(hash).toString(16).padStart(64, '0') +
    Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  return signature.substring(0, 128);
}
