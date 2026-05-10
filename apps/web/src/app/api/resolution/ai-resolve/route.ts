import { NextRequest, NextResponse } from 'next/server';
import { runSearchThenReasonPipeline } from '@/lib/oracle/pipeline/SearchThenReasonPipeline';

/**
 * POST /api/resolution/ai-resolve
 * Body: { marketId, marketQuestion, category?, resolutionDate? }
 * Runs Gemini search → MiniMax resolution pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketId, marketQuestion, category, resolutionDate } = body;

    if (!marketId || !marketQuestion) {
      return NextResponse.json(
        { success: false, error: 'marketId and marketQuestion required' },
        { status: 400 }
      );
    }

    console.log(`[API] ai-resolve triggered for market ${marketId}`);

    const result = await runSearchThenReasonPipeline(
      marketId,
      marketQuestion,
      category || 'general',
      resolutionDate
    );

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('[API] ai-resolve error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resolution/ai-resolve?marketId=xxx&marketQuestion=xxx
 * Quick test endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId') || 'test-market';
  const marketQuestion = searchParams.get('marketQuestion') || 'Did Bangladesh win the last cricket match against India?';
  const category = searchParams.get('category') || 'Sports';

  try {
    const result = await runSearchThenReasonPipeline(marketId, marketQuestion, category);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
