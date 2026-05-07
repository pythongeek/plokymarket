import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { suggestEventWithGemini } from '@/lib/market-creation/ai-suggestion';


/**
 * POST /api/admin/events/ai-suggest
 * Use Gemini AI to suggest a complete event listing with markets.
 * Body: { prompt: string, category?: string, region?: string, numMarkets?: number }
 */
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { prompt, category, region, numMarkets } = body;

        if (!prompt || prompt.trim().length < 3) {
            return NextResponse.json(
                { error: 'Please provide a topic or headline (at least 3 characters)' },
                { status: 400 }
            );
        }

        const suggestion = await suggestEventWithGemini(prompt, {
            category,
            region,
            numMarkets,
        });

        return NextResponse.json({ data: suggestion });
    } catch (error: any) {
        console.error('AI suggestion error:', error);
        return NextResponse.json(
            { error: error.message || 'AI suggestion failed' },
            { status: 500 }
        );
    }
}
