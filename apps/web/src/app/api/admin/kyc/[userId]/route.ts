import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';

// Helper to check admin
async function checkAdmin(supabase: any, userId: string): Promise<boolean> {
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin')
        .eq('id', userId)
        .single();
    return profile?.is_admin || profile?.is_super_admin || false;
}

// GET /api/admin/kyc/[userId] - Get specific user's KYC details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { userId } = await params;
        const result = await KycService.adminGetUserKyc(userId);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error getting user KYC:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get user KYC' },
            { status: 500 }
        );
    }
}

// POST /api/admin/kyc/[userId] - Perform KYC action (approve/reject/force/waive)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { userId } = await params;
        const body = await req.json();
        const { action, reason, rejection_reason } = body;

        const validActions = ['approve', 'reject', 'force_kyc', 'waive_kyc', 'revoke_override'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        if (action === 'reject' && !rejection_reason) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        const result = await KycService.adminKycAction(
            user.id,
            userId,
            action,
            reason,
            rejection_reason
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error performing KYC action:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to perform KYC action' },
            { status: 500 }
        );
    }
}
