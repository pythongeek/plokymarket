import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/market-creation/legal-review - Get review queue
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, is_senior_counsel')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get review queue
    const { data, error } = await supabase.rpc('get_legal_review_queue', {
      p_assignee_id: user.id
    });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching legal review queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}

// POST /api/admin/market-creation/legal-review - Submit for review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, notes } = body;

    if (!draft_id) {
      return NextResponse.json(
        { error: 'Draft ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('submit_for_legal_review', {
      p_draft_id: draft_id,
      p_submitter_notes: notes
    });

    if (error) throw error;

    return NextResponse.json({ success: data });
  } catch (error: any) {
    console.error('Error submitting for review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit for review' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/market-creation/legal-review - Complete review
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
      .select('is_admin, is_senior_counsel')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { draft_id, status, notes } = body;

    if (!draft_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['approved', 'rejected', 'escalated'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // If escalating, check if user is senior counsel
    if (status === 'escalated' && !profile.is_senior_counsel) {
      return NextResponse.json(
        { error: 'Senior counsel required for escalation' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase.rpc('complete_legal_review', {
      p_draft_id: draft_id,
      p_reviewer_id: user.id,
      p_status: status,
      p_notes: notes
    });

    if (error) throw error;

    return NextResponse.json({ success: data });
  } catch (error: any) {
    console.error('Error completing review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete review' },
      { status: 500 }
    );
  }
}
