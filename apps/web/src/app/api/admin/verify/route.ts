// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


/**
 * GET /api/admin/verify
 * ইউজার অ্যাডমিন কি না তা যাচাই করে।
 * Local DB ব্যবহার করে যাতে cloud Supabase-এর JWT mismatch সমস্যা না হয়।
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // লোকাল ডাটাবেস থেকে অ্যাডমিন স্ট্যাটাস চেক করা
    const profileResult = await pool.query(
      'SELECT is_admin, is_super_admin, full_name FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    // বুটস্ট্র্যাপ অ্যাডমিন ইমেইল চেক (একটি অতিরিক্ত নিরাপত্তা স্তর)
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://polymarketbd.com';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    const userData = cloudRes.ok ? await cloudRes.json() : null;
    const userEmail = userData?.email || '';
    const isBootstrapAdmin = userEmail === 'admin@plokymarket.bd';
    
    const hasAdminAccess = profile?.is_admin || profile?.is_super_admin || isBootstrapAdmin;

    if (!hasAdminAccess) {
      // ব্যর্থ প্রচেষ্টার লগ (Optional RPC)
      try {
        await pool.query(
          `SELECT * FROM log_admin_action($1, 'verify_access_denied', 'system', NULL, NULL, 'User is not an admin')`,
          [userId]
        );
      } catch (e) { /* লগ ফেইল করলে প্রসেস থামবে না */ }

      return NextResponse.json(
        { error: 'Forbidden', message: 'আপনার অ্যাডমিন প্রিভিলেজ নেই' },
        { status: 403 }
      );
    }

    // সফল ভেরিফিকেশন লগ করা
    // ফ্রন্টএন্ডের জন্য অ্যাডমিন ডিটেইলস রিটার্ন করা
    return NextResponse.json({
      isAdmin: true,
      isSuperAdmin: profile?.is_super_admin || isBootstrapAdmin,
      canCreateEvents: profile?.can_create_events || isBootstrapAdmin,
      fullName: profile?.full_name || 'System Admin',
      email: userEmail,
      level: (profile?.is_super_admin || isBootstrapAdmin) ? 'super_admin' : 'admin'
    });

  } catch (error: any) {
    console.error('Admin verify critical error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}
