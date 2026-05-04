// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { SettlementEngine } from '@/lib/settlement/SettlementEngine';

const settlementEngine = new SettlementEngine();

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

/**
 * GET /api/admin/settlement - List settlement claims and batches
 * Query: ?market_id=... or list all recent
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        # getUserFromToken removed
    if (false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('market_id');

        // Fetch claims
        let claimsQuery = `
            SELECT sc.*, 
                   m.question as markets_question, 
                   m.status as markets_status
            FROM settlement_claims sc
            LEFT JOIN markets m ON m.id = sc.market_id
            ORDER BY sc.created_at DESC
            LIMIT 100
        `;
        
        if (marketId) {
            claimsQuery = `
                SELECT sc.*, 
                       m.question as markets_question, 
                       m.status as markets_status
                FROM settlement_claims sc
                LEFT JOIN markets m ON m.id = sc.market_id
                WHERE sc.market_id = $1
                ORDER BY sc.created_at DESC
                LIMIT 100
            `;
        }

        const claimsResult = await pool.query(
            marketId ? claimsQuery : claimsQuery.replace('$1', 'NULL'),
            marketId ? [marketId] : []
        );

        // Fetch batches
        let batchesQuery = `
            SELECT sb.*, 
                   m.question as markets_question, 
                   m.status as markets_status
            FROM settlement_batches sb
            LEFT JOIN markets m ON m.id = sb.market_id
            ORDER BY sb.created_at DESC
            LIMIT 50
        `;
        
        if (marketId) {
            batchesQuery = `
                SELECT sb.*, 
                       m.question as markets_question, 
                       m.status as markets_status
                FROM settlement_batches sb
                LEFT JOIN markets m ON m.id = sb.market_id
                WHERE sb.market_id = $1
                ORDER BY sb.created_at DESC
                LIMIT 50
            `;
        }

        const batchesResult = await pool.query(
            marketId ? batchesQuery : batchesQuery.replace('$1', 'NULL'),
            marketId ? [marketId] : []
        );

        // Fetch stats
        const statsResult = await pool.query(
            'SELECT * FROM settlement_statistics LIMIT 1'
        );

        return NextResponse.json({
            data: {
                claims: claimsResult.rows || [],
                batches: batchesResult.rows || [],
                stats: statsResult.rows[0] || null,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/settlement - Trigger settlement for a resolved market
 * Body: { market_id: string }
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        # getUserFromToken removed
    if (false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { market_id } = body;

        if (!market_id) {
            return NextResponse.json({ error: 'market_id is required' }, { status: 400 });
        }

        // Verify market is resolved
        const marketResult = await pool.query(
            'SELECT status, winning_outcome FROM markets WHERE id = $1',
            [market_id]
        );
        const market = marketResult.rows[0];

        if (!market) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        if (market.status !== 'resolved') {
            return NextResponse.json(
                { error: `Market must be resolved before settlement. Current status: ${market.status}` },
                { status: 400 }
            );
        }

        // Trigger settlement
        const result = await settlementEngine.processMarket(market_id, market.winning_outcome);

        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error('Settlement error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
