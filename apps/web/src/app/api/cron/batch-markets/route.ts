/**
 * Batch Market Processing Cron Job
 * Processes markets ready for resolution using n8n workflow
 *
 * SCHEDULE SETUP (cron-job.org):
 * - Target URL: https://your-app.vercel.app/api/cron/batch-markets
 * - Method: GET
 * - Headers: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Verify cron-job.org secret
async function verifyCronSecret(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('cron-secret');

  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET || process.env.CRONJOB_API_TOKEN;

  if (!validSecret) {
    return true; // Skip validation if no secret configured
  }

  if (authHeader && (authHeader === `Bearer ${validSecret}` || authHeader === validSecret)) {
    return true;
  }

  if (cronSecret && cronSecret === validSecret) {
    return true;
  }

  console.warn('[Cron] Missing valid authorization');
  return false;
}

// Fire and Forget - Process markets in background to avoid Vercel timeout
async function processBatchMarkets() {
  const supabase = await createServiceClient();
  const results = {
    processed: 0,
    sentToWorkflow: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  try {
    // Find markets ready for resolution (batch of 5)
    const now = new Date().toISOString();
    const { data: markets, error: marketError } = await supabase
      .from('markets')
      .select('id, question, category, trading_closes_at, status, resolution_source')
      .eq('status', 'closed')
      .eq('resolution_source_type', 'AI')
      .not('resolution_source', 'is', null)
      .order('trading_closes_at', { ascending: true })
      .limit(5);

    if (marketError) throw marketError;

    if (!markets || markets.length === 0) {
      console.log('[Cron] No markets to process');
      return results;
    }

    // Call n8n batch resolution workflow
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/webhook/plokymarket-batch-resolution`;

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-api-key': process.env.N8N_API_KEY || ''
      }
    });

    if (n8nResponse.ok) {
      const n8nResult = await n8nResponse.json();
      results.sentToWorkflow = n8nResult.total_processed || markets.length;
      console.log(`[Cron] Sent ${results.sentToWorkflow} markets to n8n batch workflow`);
    } else {
      throw new Error(`n8n workflow trigger failed: ${n8nResponse.status}`);
    }

    results.processed = markets.length;

  } catch (error: any) {
    console.error('[Cron] Batch processing error:', error);
  }

  return results;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const isValid = await verifyCronSecret(request);
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fire and Forget - Return 200 immediately, process in background
  const response = NextResponse.json({
    success: true,
    message: 'Batch job started in background',
    timestamp: new Date().toISOString()
  });

  // Use global waitUntil to run in background (Next.js Edge runtime)
  if (typeof globalThis.waitUntil === 'function') {
    globalThis.waitUntil(processBatchMarkets());
  } else {
    // Fallback for non-Edge environments
    console.warn('[Cron] waitUntil not available, running synchronously');
    processBatchMarkets();
  }

  return response;
}
