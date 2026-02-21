import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketCreationService } from '@/lib/market-creation/service';

// GET /api/admin/market-creation/legal-review - Get review queue
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const data = await MarketCreationService.getLegalReviewQueue(supabase, user.id);
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

    const success = await MarketCreationService.submitForLegalReview(supabase, draft_id, notes);
    return NextResponse.json({ success });
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

    const success = await MarketCreationService.completeLegalReview(supabase, user.id, {
      draft_id,
      status,
      notes,
      is_senior_counsel: !!profile.is_senior_counsel
    });

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error completing review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete review' },
      { status: 500 }
    );
  }
}
