import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/users - List/search users
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const kyc = searchParams.get('kyc');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await supabase.rpc('search_users', {
      p_query: query,
      p_status_filter: status,
      p_kyc_filter: kyc,
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;

    return NextResponse.json({ 
      data: data || [],
      total: data?.[0]?.total_matches || 0
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/:id/status - Update user status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { user_id, status_changes, reason, dual_auth_admin_id } = body;

    if (!user_id || !status_changes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('update_user_status', {
      p_admin_id: user.id,
      p_user_id: user_id,
      p_status_changes: status_changes,
      p_reason: reason,
      p_dual_auth_admin_id: dual_auth_admin_id
    });

    if (error) {
      // Check if it's a dual auth required error
      if (error.message.includes('Dual authorization required')) {
        return NextResponse.json(
          { error: error.message, requires_dual_auth: true },
          { status: 403 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
