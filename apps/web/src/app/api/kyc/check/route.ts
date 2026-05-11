import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { KycService } from '@/lib/kyc/service';
import { jwtVerify } from 'jose';

// GET /api/kyc/check - Check if user needs KYC for withdrawal
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


export async function GET() {
    try {
        const user = await getUserFromRequest(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const gate = await KycService.checkWithdrawalGate(user.id);
        return NextResponse.json(gate);
    } catch (error: any) {
        console.error('Error checking KYC gate:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check KYC gate' },
            { status: 500 }
        );
    }
}
