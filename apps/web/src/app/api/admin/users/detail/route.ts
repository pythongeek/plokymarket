import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/users/detail?id=xxx - Get user full profile
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
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Log admin view action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action: 'view_profile',
      p_action_category: 'kyc',
      p_target_user_id: userId,
      p_reason: 'Admin viewing user profile'
    });

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase.rpc(
      'get_user_admin_profile',
      { p_user_id: userId }
    );

    if (profileError) throw profileError;

    // Get KYC details
    const { data: kycData } = await supabase
      .from('user_kyc_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get status details
    const { data: statusData } = await supabase
      .from('user_status')
      .select('*')
      .eq('id', userId)
      .single();

    // Get internal notes
    const { data: notes } = await supabase
      .from('user_internal_notes')
      .select(`
        *,
        created_by:created_by(full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get recent interventions
    const { data: interventions } = await supabase
      .from('position_interventions')
      .select('*')
      .eq('user_id', userId)
      .order('performed_at', { ascending: false })
      .limit(10);

    // Get support tickets
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select(`
        *,
        assigned_to:assigned_to(full_name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile: userProfile?.[0] || null,
      kyc: kycData,
      status: statusData,
      notes: notes || [],
      interventions: interventions || [],
      tickets: tickets || []
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/detail/notes - Add internal note
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

    const { user_id, note, note_type, is_escalation, escalated_to, escalation_reason } = body;

    if (!user_id || !note) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_internal_notes')
      .insert({
        user_id,
        created_by: user.id,
        note,
        note_type: note_type || 'general',
        is_escalation: is_escalation || false,
        escalated_to,
        escalation_reason
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action: 'add_internal_note',
      p_action_category: 'support',
      p_target_user_id: user_id,
      p_new_value: { note_id: data.id, note_type },
      p_reason: is_escalation ? `Escalation: ${escalation_reason}` : 'Internal note added'
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add note' },
      { status: 500 }
    );
  }
}
