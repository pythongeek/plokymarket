import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/users/audit-log - Get audit logs
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
    const targetUserId = searchParams.get('user_id');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (targetUserId) {
      query = query.eq('target_user_id', targetUserId);
    }

    if (category) {
      query = query.eq('action_category', category);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      data: data || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/audit-log/dual-auth - Approve with dual authorization
export async function POST(req: NextRequest) {
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

    const { log_id, action } = body;

    if (!log_id) {
      return NextResponse.json(
        { error: 'Log ID required' },
        { status: 400 }
      );
    }

    // Get the pending log
    const { data: log, error: logError } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('id', log_id)
      .single();

    if (logError || !log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    // Verify this log requires dual auth and hasn't been approved yet
    if (!log.requires_dual_auth || log.dual_auth_admin_id) {
      return NextResponse.json(
        { error: 'This action does not require or already has dual authorization' },
        { status: 400 }
      );
    }

    // Ensure different admin is providing dual auth
    if (log.admin_id === user.id) {
      return NextResponse.json(
        { error: 'Dual authorization must be performed by a different admin' },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Update log with dual auth
      await supabase
        .from('admin_audit_log')
        .update({
          dual_auth_admin_id: user.id,
          dual_auth_at: new Date().toISOString()
        })
        .eq('id', log_id);

      // Apply the pending action
      await supabase.rpc('update_user_status', {
        p_admin_id: log.admin_id,
        p_user_id: log.target_user_id,
        p_status_changes: log.new_value,
        p_reason: log.reason,
        p_dual_auth_admin_id: user.id
      });

      return NextResponse.json({ success: true, action: 'approved' });
    } else if (action === 'reject') {
      // Mark as rejected
      await supabase
        .from('admin_audit_log')
        .update({
          new_value: { ...log.new_value, rejected: true, rejected_by: user.id }
        })
        .eq('id', log_id);

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing dual auth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process dual authorization' },
      { status: 500 }
    );
  }
}
