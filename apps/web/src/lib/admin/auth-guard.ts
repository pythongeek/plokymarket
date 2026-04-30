/**
 * Admin Auth Guard Utility
 * Standardized auth verification for admin API routes
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

// Admin level types
export type AdminLevel = 'super' | 'admin' | null;

// Admin user profile from database
export interface AdminProfile {
  id: string;
  email: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  full_name: string | null;
}

// Result of admin verification
export interface AdminUser {
  user: User;
  profile: AdminProfile;
  level: AdminLevel;
}

/**
 * Get the current authenticated admin user
 * Returns null if not authenticated
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, is_admin, is_super_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // User is admin if either flag is true
  const isAdmin = profile.is_admin || profile.is_super_admin;
  if (!isAdmin) {
    return null;
  }

  const level: AdminLevel = profile.is_super_admin ? 'super' : 'admin';

  return { user, profile, level };
}

/**
 * Verify the current user is an admin (or super admin)
 * Returns 401/403 response if not authorized, or the AdminUser if authorized
 */
export async function verifyAdmin(): Promise<AdminUser | NextResponse> {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  return adminUser;
}

/**
 * Verify the current user is a SUPER admin specifically
 * Returns 401/403 response if not authorized
 */
export async function verifySuperAdmin(): Promise<AdminUser | NextResponse> {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json(
      { error: 'Unauthorized - Admin access required' },
      { status: 401 }
    );
  }

  if (adminUser.level !== 'super') {
    return NextResponse.json(
      { error: 'Forbidden - Super admin access required' },
      { status: 403 }
    );
  }

  return adminUser;
}

/**
 * Check if user has specific admin level or higher
 * Super admins pass all level checks
 */
export function hasAdminLevel(adminUser: AdminUser, requiredLevel: 'admin' | 'super'): boolean {
  if (requiredLevel === 'super') {
    return adminUser.level === 'super';
  }
  // requiredLevel === 'admin' - both admin and super pass
  return adminUser.level !== null;
}

/**
 * Convenience wrapper for API route handlers
 * Use this instead of manually checking auth in every route
 *
 * @example
 * export async function GET(req: NextRequest) {
 *   const admin = await requireAdmin();
 *   if (admin instanceof NextResponse) return admin;
 *
 *   // admin.user - the Supabase user
 *   // admin.profile - the admin profile
 *   // admin.level - 'admin' or 'super'
 *
 *   // Your logic here...
 * }
 */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  return verifyAdmin();
}

export async function requireSuperAdmin(): Promise<AdminUser | NextResponse> {
  return verifySuperAdmin();
}
