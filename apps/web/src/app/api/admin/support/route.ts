import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/support - List support tickets
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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigned = searchParams.get('assigned');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:user_id(email, full_name),
        assigned_to:assigned_to(full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assigned === 'me') {
      query = query.eq('assigned_to', user.id);
    } else if (assigned === 'unassigned') {
      query = query.is('assigned_to', null);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      data: data || [],
      total: count || 0
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/support - Update ticket
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

    const { ticket_id, status, assigned_to, priority } = body;

    if (!ticket_id) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to;
      updates.assigned_at = assigned_to ? new Date().toISOString() : null;
    }
    if (priority) updates.priority = priority;

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticket_id)
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action: 'update_support_ticket',
      p_action_category: 'support',
      p_target_user_id: data.user_id,
      p_new_value: { ticket_id, updates }
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
