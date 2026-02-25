import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow the known admin bootstrap email here
    if (user.email !== 'admin@plokymarket.bd') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if profile already exists
    const { data: existing, error: existingErr } = await supabase
      .from('user_profiles')
      .select('id,is_admin,is_super_admin,full_name,email')
      .eq('id', user.id)
      .maybeSingle();

    if (existingErr) {
      console.error('Error checking existing profile:', existingErr);
      // continue to attempt create via service client
    }

    if (existing) {
      return NextResponse.json(existing);
    }

    // Use service role client to create the admin profile
    const service = await createServiceClient();
    const { data: created, error: createErr } = await service
      .from('user_profiles')
      .insert({ id: user.id, email: user.email, is_admin: true, is_super_admin: true } as any)
      .select()
      .maybeSingle();

    if (createErr) {
      console.error('Service insert error:', createErr);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json(created || {});
  } catch (err: any) {
    console.error('Ensure-admin error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
