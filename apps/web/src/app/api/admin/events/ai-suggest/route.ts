import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { suggestEventWithGemini } from '@/lib/market-creation/ai-suggestion';

/**
 * POST /api/admin/events/ai-suggest
 * Use Gemini AI to suggest a complete event listing with markets.
 * Body: { prompt: string, category?: string, region?: string, numMarkets?: number }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Admin check
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();
        if (!profile?.is_admin && !profile?.is_super_admin) {
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
