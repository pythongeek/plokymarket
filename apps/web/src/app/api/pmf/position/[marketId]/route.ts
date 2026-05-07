// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { pmfService } from '@/lib/services/pmfService';

/**
 * PMF Position API - Get margin details for a specific market/position
 */

// GET /api/pmf/position/[marketId] - Get margin for a specific position
export async function GET(
    request: Request,
    { params }: { params: Promise<{ marketId: string }> }
) {
    try {
        const supabase = await createPublicClient();

        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { marketId } = await params;
        const position = await pmfService.getPositionMargin(user.id, marketId);

        if (!position) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        return NextResponse.json({ position });
    } catch (error) {
        console.error('[PMF Position API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
