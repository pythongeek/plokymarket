/**
 * Market Resolution API - Vercel Edge Function
 * Receives resolution results from n8n workflow
 * Implements idempotency with Redis caching
 * Edge Runtime optimized for speed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { setLock, checkLock } from '@/lib/upstash/redis';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Verify API key for n8n calls
function verifyAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.N8N_API_KEY || process.env.RESOLUTION_API_KEY;

  if (!expectedKey) {
    console.warn('[Resolve] API key not configured, allowing in dev mode');
    return process.env.NODE_ENV === 'development';
  }

  return apiKey === expectedKey;
}

interface ResolutionPayload {
  eventId: string;
  result: 'YES' | 'NO' | 'UNKNOWN';
  confidence: number;
  sourceUrl?: string;
  summary?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authentication
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const payload: ResolutionPayload = await request.json();

    // Validate required fields
    if (!payload.eventId || !payload.result) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, result' },
        { status: 400 }
      );
    }

    const { eventId, result, confidence, sourceUrl, summary } = payload;

    // 3. Check confidence threshold
    if (confidence < 0.9) {
      return NextResponse.json(
        {
          status: 'disputed',
          reason: 'confidence_too_low',
          confidence,
          message: 'Confidence must be >= 90% for auto-resolution'
        },
        { status: 400 }
      );
    }

    // 4. Double-spending prevention - Check Redis cache
    const cacheKey = `processed:${eventId}`;
    const isProcessed = await checkLock(cacheKey);

    if (isProcessed) {
      return NextResponse.json(
        {
          status: 'already_processed',
          eventId,
          message: 'This event has already been resolved'
        },
        { status: 200 }
      );
    }

    const supabase = await createServiceClient();

    // 6. Atomic transaction - Update market
    const now = new Date().toISOString();
    const outcomeValue = result === 'YES' ? 1 : result === 'NO' ? 2 : null;

    // Update markets table
    const { error: marketError } = await supabase
      .from('markets')
      .update({
        status: 'resolved',
        outcome: outcomeValue,
        resolved_at: now,
        updated_at: now
      })
      .eq('id', eventId)
      .eq('status', 'closed'); // Only resolve if market is closed

    if (marketError) {
      console.error('[Resolve] Market update error:', marketError);
      return NextResponse.json(
        { error: 'Failed to update market', details: marketError.message },
        { status: 500 }
      );
    }

    // 7. Update resolution_systems table
    const { error: resolutionError } = await supabase
      .from('resolution_systems')
      .update({
        resolution_status: 'resolved',
        proposed_outcome: outcomeValue,
        confidence_level: confidence * 100,
        resolved_at: now,
        updated_at: now,
        evidence: [
          {
            type: 'ai_resolution',
            outcome: result,
            confidence: confidence,
            source_url: sourceUrl,
            summary: summary,
            timestamp: now
          }
        ]
      })
      .eq('event_id', eventId);

    if (resolutionError) {
      console.error('[Resolve] Resolution system update error:', resolutionError);
      // Don't fail - market is already updated
    }

    // 8. Set Redis cache to prevent double processing (24 hours)
    await setLock(cacheKey, JSON.stringify({
      result,
      confidence,
      resolved_at: now
    }), 86400);

    // 9. Log activity
    console.log(`[Resolve] Market ${eventId} resolved: ${result} (${(confidence * 100).toFixed(1)}%)`);

    return NextResponse.json({
      success: true,
      eventId,
      result,
      confidence,
      status: 'resolved',
      executionTimeMs: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('[Resolve] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Health check endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'market-resolution',
    runtime: 'edge',
    timestamp: new Date().toISOString()
  });
}
