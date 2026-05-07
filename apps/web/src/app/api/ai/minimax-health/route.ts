import { NextResponse } from 'next/server';
import { checkMiniMaxHealth } from '@/lib/ai/minimax-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await checkMiniMaxHealth();

    return NextResponse.json({
      healthy: result.healthy,
      latencyMs: result.latencyMs,
      provider: 'minimax',
      error: result.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        healthy: false,
        error: error.message,
        provider: 'minimax',
        latencyMs: 0,
      },
      { status: 500 }
    );
  }
}
