import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// MUST match middleware.ts and login/route.ts exactly
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function GET() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let decoded: any;
    try {
      const { payload } = await jwtVerify(token, secretKey);
      decoded = payload;
    } catch {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: decoded.sub,
        email: decoded.email,
        is_admin: decoded.is_admin,
        is_super_admin: decoded.is_super_admin,
      }
    });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
