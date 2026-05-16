import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://127.0.0.1:8080';
// MUST match middleware.ts and session/route.ts exactly
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const authResponse = await fetch(`${AUTH_SERVER_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await authResponse.json();

    if (!authResponse.ok) {
      return NextResponse.json({ error: data.error || 'Invalid credentials' }, { status: 401 });
    }

    const token = data.access_token || data.token;
    if (!token) {
      return NextResponse.json({ error: 'No token returned' }, { status: 500 });
    }

    // Decode auth server token to extract claims
    let claims: any = {};
    try {
      const { payload } = await jwtVerify(token, secretKey, { clockTolerance: 60 });
      claims = payload;
    } catch {
      // Auth server used different secret — extract via unsafe decode
      const parts = token.split('.');
      if (parts.length === 3) {
        claims = JSON.parse(atob(parts[1]));
      }
    }

    // Re-sign with unified JWT_SECRET so middleware/session always validate
    const unifiedToken = await new SignJWT({
      sub: claims.sub || data.user?.id,
      email: claims.email || data.user?.email || email,
      is_admin: claims.is_admin ?? data.user?.is_admin ?? false,
      is_super_admin: claims.is_super_admin ?? data.user?.is_super_admin ?? false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    const response = NextResponse.json({
      user: data.user,
      session: { access_token: unifiedToken }
    });

    const maxAge = 7 * 24 * 60 * 60;
    response.cookies.set('sb-access-token', unifiedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
