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

  const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;

  // If NO secret is configured at all, allow all requests (for initial setup/migration)
  if (!validSecret) {
    console.warn('[Auth] No CRON_SECRET configured - allowing all requests (not secure for production)');
    return true;
  }

  // Check for cron-job.org secret first
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret) {
    if (cronSecret === validSecret) {
      console.log('[Cron] Verified via X-Cron-Secret header');
      return true;
    }
    // Secret configured but doesn't match
    console.warn('[Cron] Invalid X-Cron-Secret header');
    return false;
  }

  // Check for QStash signature
  const signature = request.headers.get('upstash-signature');

  if (!signature) {
    console.warn('[QStash] Missing signature header - rejecting');
    return false;
  }

  // In production, you should verify the JWT signature
  // using QSTASH_CURRENT_SIGNING_KEY from environment
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;

  if (!signingKey) {
    console.warn('[QStash] QSTASH_CURRENT_SIGNING_KEY not set - allowing request');
    return true;
  }

  // TODO: Implement proper JWT verification
  // For now, we accept the signature if it matches our expected format
  return signature.length > 0;
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

  const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;

  // If NO secret is configured at all, allow all requests
  if (!validSecret) {
    console.warn('[Auth] No CRON_SECRET configured - allowing all requests');
    return true;
  }

  // Check for cron-job.org secret first
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret) {
    if (cronSecret === validSecret) {
      console.log('[Cron] Verified via X-Cron-Secret header (with body)');
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

  // Production should verify JWT signature properly
  return signature.length > 0;
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
