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

// GET /api/admin/kyc - List all KYC submissions
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!(await checkAdmin(supabase, user.id))) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        const search = searchParams.get('search') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const result = await KycService.adminListKyc({ status, search, limit, offset });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error listing KYC:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list KYC submissions' },
            { status: 500 }
        );
    }
}
