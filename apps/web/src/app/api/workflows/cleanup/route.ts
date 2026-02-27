/**
 * Workflow - Cleanup Tasks
 * Periodic cleanup of expired data
 * Called by group-daily workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'sin1';

async function processCleanup(supabase: any) {
  const results: any = {};

  // Cleanup expired batches
  const { data: batchResult, error: batchError } = await supabase.rpc('cleanup_expired_batches');
  if (batchError) {
    console.error('[Cleanup] Batch cleanup error:', batchError);
    results.batchError = batchError.message;
  } else {
    results.batchCleanup = batchResult;
  }

  // Cleanup old notifications
  const { data: notifyResult, error: notifyError } = await supabase.rpc('cleanup_old_notifications', {
    p_days: 30,
  });
  if (notifyError) {
    console.error('[Cleanup] Notification cleanup error:', notifyError);
    results.notificationError = notifyError.message;
  } else {
    results.notificationCleanup = notifyResult;
  }

  return {
    status: 'ok',
    results,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const result = await processCleanup(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'cleanup',
    description: 'Daily cleanup of expired data',
    timestamp: new Date().toISOString(),
  });
}
