import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/verify
 * * ইউজার অ্যাডমিন কি না তা যাচাই করে।
 * RLS সমস্যা এড়াতে এখানে Service Client ব্যবহার করা হয়েছে।
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = await createServiceClient(); // RLS বাইপাস করার জন্য

    // ১. বর্তমান ইউজার সেশন চেক করা
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'দয়া করে অ্যাডমিন অ্যাক্সেসের জন্য লগইন করুন' },
        { status: 401 }
      );
    }

    // ২. ডাটাবেজ থেকে অ্যাডমিন স্ট্যাটাস চেক করা (Service Client ব্যবহার করে)
    const { data: profile, error: profileError } = await service
      .from('user_profiles')
      .select('is_admin, is_super_admin, can_create_events, full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching admin status:', profileError);
      return NextResponse.json(
        { error: 'Server error', message: 'অ্যাডমিন স্ট্যাটাস যাচাই করা সম্ভব হয়নি' },
        { status: 500 }
      );
    }

    // ৩. বুটস্ট্র্যাপ অ্যাডমিন ইমেইল চেক (একটি অতিরিক্ত নিরাপত্তা স্তর)
    const isBootstrapAdmin = user.email === 'admin@plokymarket.bd';
    const hasAdminAccess = profile?.is_admin || profile?.is_super_admin || isBootstrapAdmin;

    if (!hasAdminAccess) {
      // ব্যর্থ প্রচেষ্টার লগ (Optional RPC)
      try {
        await service.rpc('log_admin_action', {
          p_admin_id: user.id,
          p_action_type: 'verify_access_denied',
          p_resource_type: 'system',
          p_reason: 'User is not an admin'
        });
      } catch (e) { /* লগ ফেইল করলে প্রসেস থামবে না */ }

      return NextResponse.json(
        { error: 'Forbidden', message: 'আপনার অ্যাডমিন প্রিভিলেজ নেই' },
        { status: 403 }
      );
    }

    // ৪. সফল ভেরিফিকেশন লগ করা
    try {
      await service.rpc('log_admin_action', {
        p_admin_id: user.id,
        p_action_type: 'login_success',
        p_resource_type: 'system',
        p_resource_id: user.id
      });
    } catch (e) { /* logging error handled silently */ }

    // ৫. ফ্রন্টএন্ডের জন্য অ্যাডমিন ডিটেইলস রিটার্ন করা
    return NextResponse.json({
      isAdmin: true,
      isSuperAdmin: profile?.is_super_admin || isBootstrapAdmin,
      canCreateEvents: profile?.can_create_events || isBootstrapAdmin,
      fullName: profile?.full_name || 'System Admin',
      email: user.email,
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