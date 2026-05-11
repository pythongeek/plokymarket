/**
 * API Route: /api/rebates
 * Maker rebate endpoints for viewing and claiming rebates
 */
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { rebateService } from '@/lib/services/rebateService';
import { jwtVerify } from 'jose';

// GET /api/rebates - Get rebate summary and status
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

        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const rebateId = searchParams.get('id');

        // GET /api/rebates?action=summary - Full rebate summary
        if (action === 'summary') {
            const summary = await rebateService.getRebateSummary(user.id);
            return NextResponse.json(summary);
        }

        // GET /api/rebates?action=volume - Volume history
        if (action === 'volume') {
            const volumes = await rebateService.getVolumeHistory(user.id);
            return NextResponse.json({ volumes });
        }

        // GET /api/rebates?action=claimable - Claimable rebates
        if (action === 'claimable') {
            const claimable = await rebateService.getClaimableRebates(user.id);
            return NextResponse.json({ claimable });
        }

        // GET /api/rebates?action=history - Historical rebates
        if (action === 'history') {
            const history = await rebateService.getHistoricalRebates(user.id);
            return NextResponse.json({ history });
        }

        // GET /api/rebates?action=tiers - All rebate tiers
        if (action === 'tiers') {
            const tiers = await rebateService.getRebateTiers();
            return NextResponse.json({ tiers });
        }

        // GET /api/rebates?id=<rebate_id> - Get specific rebate
        if (action === 'rebate' && rebateId) {
            const rebate = await rebateService.getRebateById(rebateId, user.id);
            if (!rebate) {
                return NextResponse.json({ error: 'Rebate not found' }, { status: 404 });
            }
            return NextResponse.json(rebate);
        }

        // Default: Get full summary
        const summary = await rebateService.getRebateSummary(user.id);
        return NextResponse.json(summary);

    } catch (error) {
        console.error('[Rebates API] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/rebates - Claim a rebate
export async function POST(request: Request) {
    try {

        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { rebate_id, payment_method } = body;

        if (!rebate_id) {
            return NextResponse.json(
                { error: 'Rebate ID is required' },
                { status: 400 }
            );
        }

        // Validate payment method
        const validPaymentMethods = ['USDC', 'PLATFORM'];
        const paymentMethod = payment_method || 'PLATFORM';
        if (!validPaymentMethods.includes(paymentMethod)) {
            return NextResponse.json(
                { error: 'Invalid payment method. Must be USDC or PLATFORM' },
                { status: 400 }
            );
        }

        // Verify the rebate belongs to this user and is claimable
        const rebate = await rebateService.getRebateById(rebate_id, user.id);
        if (!rebate) {
            return NextResponse.json({ error: 'Rebate not found' }, { status: 404 });
        }

        if (rebate.claim_status !== 'pending') {
            return NextResponse.json(
                { error: 'Rebate is not claimable. Current status: ' + rebate.claim_status },
                { status: 400 }
            );
        }

        // Claim the rebate
        const result = await rebateService.claimRebate(rebate_id, user.id, paymentMethod);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to claim rebate' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Rebate claimed successfully',
            rebate_id
        });

    } catch (error) {
        console.error('[Rebates API] POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
