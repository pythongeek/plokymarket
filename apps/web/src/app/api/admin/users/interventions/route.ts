import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/users/interventions - Perform position intervention
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

    const { 
      user_id, 
      position_id, 
      intervention_type, 
      reason, 
      position_value,
      pnl,
      liquidation_price,
      exit_price,
      risk_level,
      send_notification 
    } = body;

    if (!user_id || !intervention_type || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Perform intervention
    const { data: interventionId, error } = await supabase.rpc(
      'perform_position_intervention',
      {
        p_admin_id: user.id,
        p_user_id: user_id,
        p_position_id: position_id,
        p_intervention_type: intervention_type,
        p_reason: reason,
        p_send_notification: send_notification !== false
      }
    );

    if (error) throw error;

    // Update with additional details if provided
    if (position_value !== undefined) {
      await supabase
        .from('position_interventions')
        .update({
          position_value,
          pnl,
          liquidation_price,
          exit_price,
          risk_level_at_time: risk_level
        })
        .eq('id', interventionId);
    }

    // Send real-time notification to user
    if (send_notification !== false) {
      await supabase.from('notifications').insert({
        user_id: user_id,
        type: 'position_intervention',
        title: `Position ${intervention_type === 'liquidation' ? 'Liquidated' : 'Closed'}`,
        body: `Your position has been ${intervention_type} by admin. Reason: ${reason}`,
        data: { intervention_id: interventionId, intervention_type }
      });
    }

    return NextResponse.json({ 
      success: true, 
      intervention_id: interventionId 
    });
  } catch (error: any) {
    console.error('Error performing intervention:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform intervention' },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/interventions - List interventions
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
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('position_interventions')
      .select(`
        *,
        user:user_id(email, full_name),
        performed_by:performed_by(full_name)
      `)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}
