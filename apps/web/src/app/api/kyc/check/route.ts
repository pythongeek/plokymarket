import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';

// GET /api/kyc/check - Check if user needs KYC for withdrawal
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const gate = await KycService.checkWithdrawalGate(user.id);
        return NextResponse.json(gate);
    } catch (error: any) {
        console.error('Error checking KYC gate:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check KYC gate' },
            { status: 500 }
        );
    }
}
