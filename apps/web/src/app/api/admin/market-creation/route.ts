import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketCreationService } from '@/lib/market-creation/service';

// GET /api/admin/market-creation - List drafts or get single draft
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');
    const status = searchParams.get('status');

    if (draftId) {
      const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).single();
      const draft = await MarketCreationService.getDraft(supabase, user.id, draftId, profile?.is_admin);
      return NextResponse.json({ data: draft });
    }

    const drafts = await MarketCreationService.getDrafts(supabase, user.id, status || undefined);
    return NextResponse.json({ data: drafts });
  } catch (error: any) {
    console.error('Error fetching market drafts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/market-creation - Create new draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { market_type, template_id, event_id } = body;

    const draftId = await MarketCreationService.createDraft(supabase, {
      user_id: user.id,
      market_type,
      template_id,
      event_id
    });

    return NextResponse.json({ data: draftId });
  } catch (error: any) {
    console.error('Error creating market draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create draft' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/market-creation - Update draft stage
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, stage, stage_data } = body;

    if (!draft_id || !stage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await MarketCreationService.updateDraftStage(supabase, {
      draft_id,
      stage,
      stage_data
    });

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error updating draft stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update draft' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/market-creation - Delete draft
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).single();

    const success = await MarketCreationService.deleteDraft(supabase, draftId, user.id, profile?.is_admin);

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
