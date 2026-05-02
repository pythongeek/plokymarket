import { NextResponse } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://127.0.0.1:8080';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Call our local auth server
    const authResponse = await fetch(`${AUTH_SERVER_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await authResponse.json();

    if (!authResponse.ok) {
      return NextResponse.json({ error: data.error || 'Invalid credentials' }, { status: 401 });
    }

    // Set Supabase-compatible session cookies
    const response = NextResponse.json({
      user: data.user,
      session: { access_token: data.token }
    });

    const maxAge = 7 * 24 * 60 * 60; // 7 days
    response.cookies.set('sb-access-token', data.token, {
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
