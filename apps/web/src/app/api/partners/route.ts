import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/admin/local-db';

/**
 * GET /api/partners
 * যাচাইকৃত পার্টনার তালিকা দেখুন
 * Query: ?status=verified|all&limit=50
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'verified';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

        let sql = `SELECT * FROM partner_exchangers`;
        const params: any[] = [];

        if (status !== 'all') {
            sql += ` WHERE status = $1`;
            params.push(status);
        }

        sql += ` ORDER BY trust_score DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const partners = await query(sql, params);

        return NextResponse.json({
            success: true,
            data: partners || [],
            count: partners?.length || 0,
        });

    } catch (err: any) {
        console.error('Partners list error:', err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
