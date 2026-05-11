/**
 * API Route: /api/conditional-orders
 * 
 * Handles conditional order operations:
 * - GET: List user's conditional orders
 * - POST: Create new conditional order
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


export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const marketId = searchParams.get('marketId');
        const status = searchParams.get('status');

        let query = supabase
            .from('conditional_orders')
            .select('*')
            .eq('user_id', user.id);

        if (marketId) {
            query = query.eq('market_id', marketId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: data || [] });
    } catch (err) {
        console.error('Error fetching conditional orders:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            marketId,
            conditionType,
            side,
            outcome,
            triggerPrice,
            limitPrice,
            quantity,
            trailAmount,
            trailType,
            expiresAt,
        } = body;

        // Validate required fields
        if (!marketId || !conditionType || !side || !outcome || !triggerPrice || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert the conditional order
        const { data, error } = await supabase
            .from('conditional_orders')
            .insert({
                user_id: user.id,
                market_id: marketId,
                condition_type: conditionType,
                side,
                outcome,
                trigger_price: triggerPrice,
                limit_price: limitPrice,
                quantity,
                trail_amount: trailAmount,
                trail_type: trailType,
                expires_at: expiresAt,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ order: data }, { status: 201 });
    } catch (err) {
        console.error('Error creating conditional order:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
