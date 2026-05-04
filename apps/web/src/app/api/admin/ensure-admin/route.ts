// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAdminProfile, ensureAdminProfile } from '@/lib/admin/local-db';

// JWT secret — MUST match what the auth server uses to sign tokens.
// Keep in sync with auth-guard.ts and admin-auth.ts.
const JWT_SECRET = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header (Bearer token from auth server)
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized', message: 'No session token' }, { status: 401 });
    }

    // ✅ CRITICAL: Verify JWT signature BEFORE trusting any claims.
    // This prevents anyone from forging admin tokens.
    let payload: Record<string, unknown>;
    try {
      const { payload: verified } = await jwtVerify(accessToken, secretKey);
      payload = verified as Record<string, unknown>;
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token: ' + (err?.message || 'verify failed') },
        { status: 401 }
      );
    }

    const userId = payload.sub as string;
    const email = payload.email as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Token missing sub claim' }, { status: 401 });
    }

    // Defense-in-depth: email must be admin email (DB check is the real gate)
    if (email && email !== 'admin@plokymarket.bd') {
      return NextResponse.json({ error: 'Forbidden', message: 'Not authorized admin email' }, { status: 403 });
    }

    // Check if admin profile exists in local DB
    const existing = await getAdminProfile(userId);

    if (existing && (existing.is_admin || existing.is_super_admin)) {
      return NextResponse.json({ id: userId, email, is_admin: existing.is_admin, is_super_admin: existing.is_super_admin });
    }

    // Create or update admin profile in local DB
    await ensureAdminProfile(userId, email);

    return NextResponse.json({ id: userId, email, is_admin: true, is_super_admin: true });
  } catch (err: any) {
    console.error('Ensure-admin critical error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}
