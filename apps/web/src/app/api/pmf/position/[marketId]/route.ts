// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { pmfService } from '@/lib/services/pmfService';
import { jwtVerify } from 'jose';

/**
 * PMF Position API - Get margin details for a specific market/position
 */

// GET /api/pmf/position/[marketId] - Get margin for a specific position
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


export async function GET(
    request: Request,
    { params }: { params: Promise<{ marketId: string }> }
) {
    try {
        const supabase = await createPublicClient();

        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { marketId } = await params;
        const position = await pmfService.getPositionMargin(user.id, marketId);

        if (!position) {
            return NextResponse.json({ error: 'Position not found' }, { status: 404 });
        }

        return NextResponse.json({ position });
    } catch (error) {
        console.error('[PMF Position API] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
