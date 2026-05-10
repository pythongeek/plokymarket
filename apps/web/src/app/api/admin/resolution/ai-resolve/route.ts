import { NextRequest, NextResponse } from 'next/server';
import { runSearchThenReasonPipeline } from '@/lib/oracle/pipeline/SearchThenReasonPipeline';
import { requireAdminUser } from '@/lib/admin/admin-auth';

/**
 * POST /api/admin/resolution/ai-resolve
 * Admin-only endpoint to run Gemini+MiniMax resolution pipeline
 * Body: { marketId, marketQuestion, category?, resolutionDate? }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) return authResult.error;

    const body = await request.json();
    const { marketId, marketQuestion, category, resolutionDate } = body;

    if (!marketId || !marketQuestion) {
      return NextResponse.json(
        { success: false, error: 'marketId and marketQuestion required' },
        { status: 400 }
      );
    }

    console.log(`[Admin API] ai-resolve for market ${marketId}`);

    const result = await runSearchThenReasonPipeline(
      marketId,
      marketQuestion,
      category || 'general',
      resolutionDate
    );

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('[Admin API] ai-resolve error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
