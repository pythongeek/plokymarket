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

// GET /api/admin/kyc/settings - Get platform KYC settings
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const settings = await KycService.getSettings();
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Error getting KYC settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get KYC settings' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/kyc/settings - Update platform KYC settings
export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const allowedFields = [
            'withdrawal_threshold',
            'required_documents',
            'auto_approve_enabled',
            'auto_approve_max_risk_score',
            'kyc_globally_required',
        ];

        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Validate threshold
        if (updates.withdrawal_threshold !== undefined && updates.withdrawal_threshold < 0) {
            return NextResponse.json(
                { error: 'Withdrawal threshold must be non-negative' },
                { status: 400 }
            );
        }

        const settings = await KycService.updateSettings(user.id, updates);
        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Error updating KYC settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update KYC settings' },
            { status: 500 }
        );
    }
}
