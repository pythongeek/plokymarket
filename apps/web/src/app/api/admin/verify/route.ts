import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/verify
 * 
 * Verifies if the current user has admin access.
 * Returns 200 with admin details if authorized,
 * Returns 401/403 if not authenticated or not admin.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please login to access admin' },
        { status: 401 }
      );
    }
    
    // Check admin status from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_senior_counsel, full_name, email')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching admin status:', profileError);
      return NextResponse.json(
        { error: 'Server error', message: 'Could not verify admin status' },
        { status: 500 }
      );
    }
    
    if (!profile?.is_admin) {
      // Log failed admin access attempt
      await supabase.rpc('log_admin_access', {
        p_admin_id: user.id,
        p_action: 'verify_access_denied',
        p_success: false,
        p_failure_reason: 'User is not an admin'
      });
      
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Log successful admin verification
    await supabase.rpc('log_admin_access', {
      p_admin_id: user.id,
      p_action: 'verify_access',
      p_success: true
    });
    
    // Return admin details (safe to expose)
    return NextResponse.json({
      isAdmin: true,
      isSeniorCounsel: profile.is_senior_counsel,
      fullName: profile.full_name,
      email: profile.email
    });
    
  } catch (error: any) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: 'Server error', message: error.message },
      { status: 500 }
    );
  }
}
