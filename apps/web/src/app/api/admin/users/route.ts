import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pgPool = new Pool({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  database: process.env.LOCAL_DB_NAME || 'polymarket',
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
});

const JWT_SECRET = process.env.LOCAL_JWT_SECRET || process.env.SUPABASE_JWT_SECRET || '';

export async function GET(req: Request) {
  console.log('[Users API] Request received');
  
  const authHeader = req.headers.get('authorization');
  console.log('[Users API] Auth header present:', !!authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized - no Bearer token' }, { status: 401 });
  }
  
  const token = authHeader.slice(7);
  console.log('[Users API] Token length:', token.length);
  console.log('[Users API] JWT_SECRET length:', JWT_SECRET.length);
  
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
    console.log('[Users API] JWT valid, sub:', decoded.sub, 'role:', decoded.role);
  } catch (e: any) {
    console.error('[Users API] JWT verification failed:', e.message);
    return NextResponse.json({ error: 'Unauthorized - invalid token', detail: e.message }, { status: 401 });
  }
  
  const isSuperAdmin = decoded.is_super_admin === true || decoded.role === 'service_role';
  if (!isSuperAdmin && !decoded.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');

    let query = 'SELECT u.id, u.email, p.is_super_admin, p.status, p.full_name, p.avatar_url, p.created_at FROM auth.users u LEFT JOIN user_profiles p ON u.id = p.id';
    let params: any[] = [];

    if (filter === 'suspended') {
      query += ' WHERE p.status = $1';
      params.push('suspended');
    } else if (filter === 'super_admins') {
      query += ' WHERE p.is_super_admin = true';
    } else if (filter === 'active') {
      query += ' WHERE p.status = $1';
      params.push('active');
    }

    query += ' ORDER BY p.created_at DESC LIMIT 100';

    const { rows } = await pgPool.query(query, params);

    return NextResponse.json({
      users: rows,
      count: rows.length,
      filter: filter || 'all',
    });
  } catch (error) {
    console.error('[Users API] DB Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
