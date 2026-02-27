import { NextRequest, NextResponse } from 'next/server';
import { aiRouter, generateOutcomesWithAI, analyzePriceTrend } from '@/lib/ai-agents/intelligent-router';

export const maxDuration = 120;

/**
 * POST /api/ai/intelligent-router
 * Route AI requests through the intelligent router
 * Body: {
 *   prompt: string,
 *   mode?: 'combine' | 'race' | 'vertex' | 'kimi' | 'auto',
 *   timeoutMs?: number,
 *   useBanglaContext?: boolean
 * }
 * Returns: ProviderResponse
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      mode = 'auto',
      timeoutMs = 30000,
      useBanglaContext = true,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await aiRouter.route(prompt, {
      mode,
      timeoutMs,
      useBanglaContext,
      minConfidence: 60,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Intelligent Router] Error:', error);
    return NextResponse.json(
      { error: 'All AI providers failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/intelligent-router/outcomes
 * Generate market outcomes using AI
 * Body: {
 *   eventName: string,
 *   category: string,
 *   context?: string
 * }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, category, context } = body;

    if (!eventName || !category) {
      return NextResponse.json(
        { error: 'eventName and category are required' },
        { status: 400 }
      );
    }

    const result = await generateOutcomesWithAI(eventName, category, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Intelligent Router Outcomes] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate outcomes', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/intelligent-router/trend
 * Analyze price trend using AI
 * Body: {
 *   marketId: string,
 *   priceHistory: Array<{ price: number, recordedAt: string }>
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketId, priceHistory } = body;

    if (!marketId || !priceHistory || !Array.isArray(priceHistory)) {
      return NextResponse.json(
        { error: 'marketId and priceHistory array are required' },
        { status: 400 }
      );
    }

    const result = await analyzePriceTrend(marketId, priceHistory);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Intelligent Router Trend] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trend', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/intelligent-router/health
 * Get health status of all AI providers
 */
export async function GET(req: NextRequest) {
  const health = aiRouter.getHealthStatus();

  return NextResponse.json({
    ...health,
    timestamp: new Date().toISOString(),
  });
}
