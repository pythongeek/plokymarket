/**
 * Centralized Admin Auth Utility
 * Validates JWT from cookie OR Authorization header using local jose
 * Works in both server component and API route contexts
 */
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { pool } from '@/lib/admin/local-db';

const JWT_SECRET = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
  is_super_admin: boolean;
}

/**
 * Extract and validate JWT from request (cookie or Authorization header)
 * Returns decoded user claims if valid, null if invalid
 */
export async function validateAdminToken(req: NextRequest): Promise<AdminUser | null> {
  // Try cookie first (browser requests)
  let token = req.cookies.get('sb-access-token')?.value;
  
  // Fall back to Authorization header (direct API calls)
  if (!token) {
    const authHeader = req.headers.get('authorization');
    token = authHeader?.replace('Bearer ', '');
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const isAdmin = payload.is_admin as boolean;
    const isSuperAdmin = payload.is_super_admin as boolean;
    if (!isAdmin && !isSuperAdmin) return null;

    return {
      id: payload.sub as string,
      email: payload.email as string,
      is_admin: isAdmin,
      is_super_admin: isSuperAdmin,
    };
  } catch {
    return null;
  }
}

/**
 * Validate token and verify admin status against local DB
 * Returns admin user profile from DB
 */
export async function requireAdminUser(req: NextRequest): Promise<{ user: AdminUser; pool: typeof pool } | { error: Response }> {
  const user = await validateAdminToken(req);
  if (!user) {
    return { error: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
  }

  // Verify admin status in local DB
  const { rows } = await pool.query<{ id: string; email: string; full_name: string; is_admin: boolean; is_super_admin: boolean }>(
    `SELECT id, email, full_name, is_admin, is_super_admin 
     FROM user_profiles WHERE id = $1 AND (is_admin = true OR is_super_admin = true)`,
    [user.id]
  );

  if (!rows[0]) {
    return { error: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403, headers: { 'Content-Type': 'application/json' } }) };
  }

  const profile = rows[0];
  return {
    user: {
      id: profile.id,
      email: profile.email,
      is_admin: profile.is_admin,
      is_super_admin: profile.is_super_admin,
    },
    pool,
  };
}
