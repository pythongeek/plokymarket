/**
 * Reject AI Suggestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabase();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user?.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { suggestion_id } = body;

    const { error } = await supabase
      .from('ai_daily_topics')
      .update({ status: 'rejected' })
      .eq('id', suggestion_id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
