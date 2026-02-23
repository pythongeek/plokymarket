import { NextRequest, NextResponse } from 'next/server';
import { OracleService } from '@/lib/oracle/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Auth Check (Admins or System Key only)
        const authHeader = req.headers.get('Authorization');
        const systemKey = process.env.SYSTEM_ORACLE_KEY;

        const isSystemAuth = systemKey && authHeader === `Bearer ${systemKey}`;

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_pro')
            .eq('id', user?.id)
            .single();

        const isAdmin = profile?.is_pro === true;

        if (!isSystemAuth && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin or System Key required.' }, { status: 401 });
        }

        const body = await req.json();
        const { marketId, context } = body;

        if (!marketId) {
            return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });
        }

        console.log(`[Oracle API] Triggering resolution for market: ${marketId}`);
        const oracleService = new OracleService();
        const result = await oracleService.requestResolution(marketId, context);

        return NextResponse.json({
            success: true,
            message: 'Resolution pipeline initiated',
            result: {
                pipeline_id: result.pipeline_id,
                status: result.status,
                recommended_action: result.recommended_action
            }
        });

    } catch (error: any) {
        console.error('Oracle Resolution Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
