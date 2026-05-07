// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAdminProfile, ensureAdminProfile } from '@/lib/admin/local-db';

function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeJWTWithoutVerify(token: string): { sub: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header (Bearer token from cloud Supabase)
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized', message: 'No session token' }, { status: 401 });
    }

    // Decode JWT to get user info (without verification since cloud Supabase already validated it)
    const payload = decodeJWTWithoutVerify(accessToken);
    if (!payload?.sub) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.sub;
    const email = payload.email;

    // Only allow admin email
    if (email !== 'admin@plokymarket.bd') {
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
