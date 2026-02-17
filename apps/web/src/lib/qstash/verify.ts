/**
 * QStash Signature Verification Utility
 * Validates requests coming from Upstash QStash cron jobs
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify QStash signature from request headers
 * In production, this should validate the JWT signature from QStash
 * For now, we check the upstash-signature header or allow in development
 */
export async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  // Allow in development without signature
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const signature = request.headers.get('upstash-signature');
  
  if (!signature) {
    console.warn('[QStash] Missing signature header');
    return false;
  }

  // In production, you should verify the JWT signature
  // using QSTASH_CURRENT_SIGNING_KEY from environment
  // This is a simplified check - implement full JWT verification for production
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  
  if (!signingKey) {
    console.warn('[QStash] QSTASH_CURRENT_SIGNING_KEY not set');
    // Allow if no signing key configured (fallback for dev)
    return process.env.NODE_ENV !== 'production';
  }

  // TODO: Implement proper JWT verification
  // For now, we accept the signature if it matches our expected format
  // In production, use a library like `jose` to verify the JWT
  return signature.length > 0;
}

/**
 * Verify QStash signature with body (for POST requests)
 */
export async function verifyQStashSignatureWithBody(
  request: NextRequest,
  body: string
): Promise<boolean> {
  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const signature = request.headers.get('upstash-signature');
  
  if (!signature) {
    console.warn('[QStash] Missing signature header');
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
