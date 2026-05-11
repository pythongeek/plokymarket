// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { pmfService } from '@/lib/services/pmfService';
import { jwtVerify } from 'jose';

/**
 * PMF Admin API - Liquidation management and risk control
 * Requires admin authentication
 */

// GET /api/pmf/admin/liquidations - Get liquidation candidates
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function GET(request: Request) {
    try {
        const supabase = await createPublicClient();

        // Authenticate admin user
        const user = await getUserFromRequest(request);
        if (!profile) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin status
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!userProfile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'candidates';

        switch (action) {
            case 'candidates': {
                const candidates = await pmfService.getLiquidationCandidates();
                return NextResponse.json({ candidates });
            }

            case 'summary': {
                // Get aggregate margin risk metrics
                const { data: positions } = await supabase
                    .from('positions')
                    .select('user_id, quantity, average_price')
                    .gt('quantity', 0);

                const { data: wallets } = await supabase
                    .from('wallets')
                    .select('user_id, balance, locked_balance');

                const uniqueUsers = new Set(positions?.map(p => p.user_id) || []);
                
                const totalExposure = positions?.reduce((sum, p) => {
                    return sum + (p.quantity * (p.average_price || 0));
                }, 0) || 0;

                const totalMarginAvailable = wallets?.reduce((sum, w) => {
                    return sum + ((w.balance || 0) - (w.locked_balance || 0));
                }, 0) || 0;

                return NextResponse.json({
                    metrics: {
                        total_users_with_positions: uniqueUsers.size,
                        total_exposure: totalExposure,
                        total_margin_available: totalMarginAvailable,
                        risk_ratio: totalExposure > 0 ? totalMarginAvailable / totalExposure : 0
                    }
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[PMF Admin API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/pmf/admin/liquidations - Execute liquidation actions
export async function POST(request: Request) {
    try {
        const supabase = await createPublicClient();

        // Authenticate admin user
        const user = await getUserFromRequest(request);
        if (!profile) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin status
        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!userProfile?.is_admin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { action, user_id, market_id } = body;

        switch (action) {
            case 'liquidate_position': {
                if (!user_id || !market_id) {
                    return NextResponse.json(
                        { error: 'user_id and market_id are required' },
                        { status: 400 }
                    );
                }

                // Execute liquidation via RPC
                const { data, error } = await supabase.rpc('liquidate_position', {
                    p_user_id: user_id,
                    p_market_id: market_id,
                    p_admin_id: user.id
                });

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 400 });
                }

                return NextResponse.json({ success: true, result: data });
            }

            case 'force_margin_check': {
                if (!user_id) {
                    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
                }

                const checkResult = await pmfService.performMarginCheck(user_id);
                return NextResponse.json({ margin_check: checkResult });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[PMF Admin API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
