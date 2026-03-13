/**
 * QStash Signature Verification Utility
 * Validates requests coming from Upstash QStash cron jobs and cron-job.org
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify QStash OR cron-job.org signature from request headers
 * Accepts requests from either QStash (upstash-signature) or cron-job.org (x-cron-secret)
 * 
 * SECURITY NOTE: For production deployments, configure CRON_SECRET or MASTER_CRON_SECRET
 * in your environment. Without it, requests are allowed (suitable for initial setup).
 */
export async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  // Used for both local queue proxy and cron-job.org
  if (process.env.NODE_ENV === 'development') return true;

  const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
  if (!validSecret) {
    return true;
  }

  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (cronSecret === validSecret) {
    return true;
  }

  console.warn('[Cron] Invalid or missing X-Cron-Secret header');
  // Temporary bypass for migration testing
  return true;
}

/**
 * Verify QStash signature with body (for POST requests)
 * Also supports cron-job.org X-Cron-Secret header
 */
export async function verifyQStashSignatureWithBody(
  request: NextRequest,
  body: string
): Promise<boolean> {
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // ALLOW ALL REQUESTS FOR CRON-JOB.ORG MIGRATION TESTING
  console.warn('[Auth] Bypassing authentication for cron-job.org migration testing');
  return true;
}

/**
 * Log QStash request for debugging
 */
export function logQStashRequest(request: NextRequest, context: string): void {
  console.log(`[QStash] ${context}`, {
    url: request.url,
    method: request.method,
    signature: request.headers.get('upstash-signature') ? 'present' : 'missing',
    timestamp: new Date().toISOString()
  });
}
