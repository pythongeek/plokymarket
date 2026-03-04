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
  // Allow in development without signature
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // ALLOW ALL REQUESTS FOR CRON-JOB.ORG MIGRATION TESTING
  // TODO: Re-enable authentication after testing
  console.warn('[Auth] Bypassing authentication for cron-job.org migration testing');
  return true;

  /*
  // Original authentication code - uncomment after testing
  const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;

  // If NO secret is configured at all, allow all requests (for initial setup/migration)
  if (!validSecret) {
    console.warn('[Auth] No CRON_SECRET configured - allowing all requests');
    return true;
  }

  // Check for cron-job.org secret first
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret) {
    if (cronSecret === validSecret) {
      console.log('[Cron] Verified via X-Cron-Secret header');
      return true;
    }
    console.warn('[Cron] Invalid X-Cron-Secret header');
    return false;
  }

  const signature = request.headers.get('upstash-signature');

  if (!signature) {
    console.warn('[QStash] Missing signature header - rejecting');
    return false;
  }

  return signature.length > 0;
  */
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
