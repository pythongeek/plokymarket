// @ts-nocheck
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { pmfService } from '@/lib/services/pmfService';

/**
 * PMF Summary API - Quick margin status overview
 */

// GET /api/pmf/summary - Get user's margin summary
export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const summary = await pmfService.getMarginSummary(user.id);
        return NextResponse.json({ summary });
    } catch (error) {
        console.error('[PMF Summary API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
