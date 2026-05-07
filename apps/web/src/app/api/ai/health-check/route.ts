/**
 * AI Health Check API
 * Checks health status of all AI providers: Vertex AI and MiniMax
 */

import { NextResponse } from 'next/server';
import { checkMiniMaxHealth } from '@/lib/ai/minimax-client';

export const dynamic = 'force-dynamic';

async function checkVertexHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { healthy: false, latencyMs: 0, error: 'GEMINI_API_KEY not configured' };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET', signal: AbortSignal.timeout(5000) }
    );

    if (res.ok) {
      return { healthy: true, latencyMs: Date.now() - start };
    }
    return { healthy: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` };
  } catch (error: any) {
    return { healthy: false, latencyMs: Date.now() - start, error: error.message };
  }
}

export async function GET() {
  const [vertex, minimax] = await Promise.all([
    checkVertexHealth(),
    checkMiniMaxHealth().catch(e => ({ healthy: false, latencyMs: 0, error: e.message })),
  ]);

  const allHealthy = vertex.healthy || minimax.healthy;

  return NextResponse.json({
    healthy: allHealthy,
    providers: { vertex, minimax },
    timestamp: new Date().toISOString(),
  });
}
