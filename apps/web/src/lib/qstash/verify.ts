/**
 * QStash Signature Verification Utility
 * Validates requests coming from Upstash QStash cron jobs and cron-job.org
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify QStash OR cron-job.org signature from request headers
 * Accepts requests from either QStash (upstash-signature) or cron-job.org (x-cron-secret)
 */
export async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  // Allow in development without signature
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for cron-job.org secret first
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret) {
    const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
    if (validSecret && cronSecret === validSecret) {
      console.log('[Cron] Verified via X-Cron-Secret header');
      return true;
    }
    // If secret configured but doesn't match, reject
    if (validSecret) {
      console.warn('[Cron] Invalid X-Cron-Secret header');
      return false;
    }
  }

  // Check for QStash signature
  const signature = request.headers.get('upstash-signature');

  if (!signature) {
    console.warn('[QStash] Missing signature header');
    // If no secret configured, allow the request (for backward compatibility)
    const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
    if (!validSecret && !process.env.QSTASH_CURRENT_SIGNING_KEY) {
      console.warn('[Auth] No authentication configured, allowing request');
      return true;
    }
    return false;
  }

  // In production, you should verify the JWT signature
  // using QSTASH_CURRENT_SIGNING_KEY from environment
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;

  if (!signingKey) {
    console.warn('[QStash] QSTASH_CURRENT_SIGNING_KEY not set');
    // Allow if no signing key configured
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

  // Check for cron-job.org secret first
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret) {
    const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
    if (validSecret && cronSecret === validSecret) {
      console.log('[Cron] Verified via X-Cron-Secret header (with body)');
      return true;
    }
    if (validSecret) {
      console.warn('[Cron] Invalid X-Cron-Secret header');
      return false;
    }
  }

  const signature = request.headers.get('upstash-signature');

  if (!signature) {
    console.warn('[QStash] Missing signature header');
    // If no secret configured, allow the request
    const validSecret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
    if (!validSecret && !process.env.QSTASH_CURRENT_SIGNING_KEY) {
      return true;
    }
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
