import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminProfile } from '@/lib/admin/local-db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Verify the session with cloud Supabase Auth first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query local database for admin status
    const profile = await getAdminProfile(userId);

    return NextResponse.json({
      is_admin: profile?.is_admin ?? false,
      is_super_admin: profile?.is_super_admin ?? false,
    });
  } catch (err) {
    console.error('Admin check exception:', err);
    return NextResponse.json({ is_admin: false, is_super_admin: false });
  }
}
