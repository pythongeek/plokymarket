import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.LOCAL_JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';

export async function GET() {
  try {
    const token = (await import('next/headers')).cookies().then(c => c.get('sb-access-token')?.value);

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
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
