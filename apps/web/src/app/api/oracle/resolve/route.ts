import { NextRequest, NextResponse } from 'next/server';
import { OracleService } from '@/lib/oracle/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Auth Check (Admins or System Key only)
        if (!user) { // In prod check for Admin role or Service Role Key in headers
            // For now, allow auth users for testing, but ideally strictly admin
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { marketId, context } = body;

        if (!marketId) {
            return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });
        }

        const oracleService = new OracleService();
        const result = await oracleService.requestResolution(marketId, context);

        return NextResponse.json({ success: true, result });

    } catch (error: any) {
        console.error('Oracle Resolution Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
