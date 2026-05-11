/**
 * API Route: /api/conditional-orders/execute
 * 
 * Checks and executes triggered conditional orders for a market
 * This should be called by a cron job when market prices change
 * 
 * POST: Check and execute conditional orders for a market
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

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


export async function POST(request: NextRequest) {
    try {
        const supabase = createPublicClient();
        const user = await getUserFromRequest(request);

        // This endpoint should be secured - only allow service role or cron
        // For now, we'll check for a secret header
        const cronSecret = request.headers.get('x-cron-secret');
        const expectedSecret = process.env.MASTER_CRON_SECRET;

        if (!expectedSecret || cronSecret !== expectedSecret) {
            // Check if it's an admin or service role user
            if (!user || !user.app_metadata?.roles?.includes('service_role')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const body = await request.json();
        const { marketId, currentPrice } = body;

        if (!marketId || currentPrice === undefined) {
            return NextResponse.json(
                { error: 'marketId and currentPrice are required' },
                { status: 400 }
            );
        }

        // Call the database function to check and execute conditional orders
        const { data, error } = await supabase.rpc('check_conditional_orders', {
            p_market_id: marketId,
            p_current_price: currentPrice,
        });

        if (error) {
            console.error('Error checking conditional orders:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            triggeredCount: data?.triggered_count || 0,
            triggeredOrders: data?.triggered_orders || [],
        });
    } catch (err) {
        console.error('Error executing conditional orders:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
