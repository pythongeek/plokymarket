// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { pmfService, MarginSummary, PositionMargin, MarginHistory } from '@/lib/services/pmfService';
import { jwtVerify } from 'jose';

/**
 * PMF API - Position Margin Feed
 * Handles margin tracking, calculations, and margin calls for prediction market positions
 */

// GET /api/pmf - Get margin summary and positions
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

        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'summary';
        const marketId = searchParams.get('market_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        switch (action) {
            case 'summary': {
                const summary = await pmfService.getMarginSummary(user.id);
                return NextResponse.json({ summary });
            }

            case 'positions': {
                const positions = await pmfService.getAllPositionsMargin(user.id);
                return NextResponse.json({ positions });
            }

            case 'position': {
                if (!marketId) {
                    return NextResponse.json({ error: 'market_id is required' }, { status: 400 });
                }
                const position = await pmfService.getPositionMargin(user.id, marketId);
                if (!position) {
                    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
                }
                return NextResponse.json({ position });
            }

            case 'history': {
                const history = await pmfService.getMarginHistory(user.id, limit);
                return NextResponse.json({ history });
            }

            case 'check': {
                const checkResult = await pmfService.performMarginCheck(user.id);
                return NextResponse.json({ margin_check: checkResult });
            }

            case 'calculate': {
                // Calculate margin for a potential order
                const price = parseFloat(searchParams.get('price') || '0');
                const quantity = parseFloat(searchParams.get('quantity') || '0');
                const side = searchParams.get('side') as 'buy' | 'sell';
                const calcMarketId = searchParams.get('market_id');

                if (!calcMarketId || !price || !quantity || !side) {
                    return NextResponse.json(
                        { error: 'market_id, price, quantity, and side are required' },
                        { status: 400 }
                    );
                }

                const calcResult = await pmfService.calculateOrderMargin(
                    user.id,
                    calcMarketId,
                    side,
                    price,
                    quantity
                );
                return NextResponse.json({ calculation: calcResult });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[PMF API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/pmf - Perform margin operations
export async function POST(request: Request) {
    try {
        const supabase = await createPublicClient();

        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, ...params } = body;

        switch (action) {
            case 'margin_check': {
                const checkResult = await pmfService.performMarginCheck(user.id);
                return NextResponse.json({ margin_check: checkResult });
            }

            case 'deposit': {
                const { amount, source } = params;
                if (!amount || amount <= 0) {
                    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
                }
                const result = await pmfService.depositMargin(user.id, amount, source);
                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: 400 });
                }
                return NextResponse.json({ success: true, message: 'Margin deposited successfully' });
            }

            case 'lock_margin': {
                const { order_id, market_id, margin_amount } = params;
                if (!order_id || !market_id || !margin_amount) {
                    return NextResponse.json(
                        { error: 'order_id, market_id, and margin_amount are required' },
                        { status: 400 }
                    );
                }
                const result = await pmfService.lockMarginForOrder(
                    user.id,
                    order_id,
                    market_id,
                    margin_amount
                );
                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: 400 });
                }
                return NextResponse.json({ success: true, message: 'Margin locked for order' });
            }

            case 'release_margin': {
                const { order_id } = params;
                if (!order_id) {
                    return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
                }
                const result = await pmfService.releaseMarginForOrder(user.id, order_id);
                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: 400 });
                }
                return NextResponse.json({ success: true, message: 'Margin released' });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[PMF API] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
