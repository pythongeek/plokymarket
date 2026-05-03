/**
 * Admin Auth Guard Utility
 * Standardized auth verification for admin API routes
 *
 * Auth flow: Custom JWT cookie (from local auth server) → verified locally → local PostgreSQL pool used
 */
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { pool } from '@/lib/admin/local-db';

const JWT_SECRET = process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';
// Encode for jose
const secretKey = new TextEncoder().encode(JWT_SECRET);

export type AdminLevel = 'super' | 'admin' | null;

export interface AdminProfile {
  id: string;
  email: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  full_name: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  profile: AdminProfile;
  level: AdminLevel;
}

export interface AdminResult {
  pool: typeof pool;
  error: null;
}

/**
 * Verify admin and return local PostgreSQL pool for direct DB access.
 * Uses local JWT validation with jose (Edge/Node compatible).
 */
export async function admin(): Promise<AdminResult | { pool: null; error: NextResponse }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return { pool: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    let decoded: any;
    try {
      const { payload } = await jwtVerify(token, secretKey);
      decoded = payload;
    } catch {
      return { pool: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const userId = decoded.sub as string;
    const isAdmin = decoded.is_admin as boolean;
    const isSuperAdmin = decoded.is_super_admin as boolean;

    if (!isAdmin && !isSuperAdmin) {
      return { pool: null, error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
    }

    return { pool, error: null };
  } catch (err) {
    console.error('[admin] Auth guard error:', err);
    return { pool: null, error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }) };
  }
}

/**
 * Get the current authenticated admin user
 * Returns null if not authenticated
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) return null;

    let decoded: any;
    try {
      const { payload } = await jwtVerify(token, secretKey);
      decoded = payload;
    } catch {
      return null;
    }

    if (!decoded?.sub) return null;

    const { rows } = await pool.query(
      `SELECT id, email, full_name, is_admin, is_super_admin
       FROM user_profiles WHERE id = $1 AND (is_admin = true OR is_super_admin = true)`,
      [decoded.sub]
    );

    if (!rows || rows.length === 0) return null;

    const profile = rows[0] as AdminProfile;
    return {
      id: profile.id,
      email: profile.email || (decoded.email as string) || '',
      profile,
      level: profile.is_super_admin ? 'super' : 'admin',
    };
  } catch (err) {
    console.error('[getAdminUser] error:', err);
    return null;
  }
}

export async function verifyAdmin(): Promise<AdminUser | NextResponse> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }
  return adminUser;
}

export async function verifySuperAdmin(): Promise<AdminUser | NextResponse> {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
  }
  if (adminUser.level !== 'super') {
    return NextResponse.json({ error: 'Forbidden - Super admin access required' }, { status: 403 });
  }
  return adminUser;
}

export function hasAdminLevel(adminUser: AdminUser, requiredLevel: 'admin' | 'super'): boolean {
  if (requiredLevel === 'super') return adminUser.level === 'super';
  return adminUser.level !== null;
}

export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  return verifyAdmin();
}

export async function requireSuperAdmin(): Promise<AdminUser | NextResponse> {
  return verifySuperAdmin();
}
