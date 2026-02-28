import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const service = await createServiceClient(); // RLS বাইপাস করার জন্য

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Session expired or invalid' }, { status: 401 });
    }

    // এডমিন ইমেইল চেক
    if (user.email !== 'admin@plokymarket.bd') {
      return NextResponse.json({ error: 'Forbidden', message: 'Not authorized admin email' }, { status: 403 });
    }

    // Service client ব্যবহার করে ডাটা চেক করা (নিরাপদ উপায়)
    const { data: existing, error: existingErr } = await service
      .from('user_profiles')
      .select('id, is_admin, is_super_admin, full_name, email, can_create_events')
      .eq('id', user.id)
      .maybeSingle();

    if (existingErr) {
      console.error('Error fetching admin profile:', existingErr);
    }

    if (existing) {
      // যদি প্রোফাইল থাকে কিন্তু এডমিন ফ্ল্যাগ না থাকে, তবে আপডেট করে দিন (Auto-fix)
      if (!existing.is_admin || !existing.is_super_admin) {
        await service
          .from('user_profiles')
          .update({ is_admin: true, is_super_admin: true, can_create_events: true })
          .eq('id', user.id);

        existing.is_admin = true;
        existing.is_super_admin = true;
      }
      return NextResponse.json(existing);
    }

    // প্রোফাইল না থাকলে নতুন এডমিন প্রোফাইল তৈরি করা
    const { data: created, error: createErr } = await service
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email,
        is_admin: true,
        is_super_admin: true,
        can_create_events: true
      })
      .select()
      .maybeSingle();

    if (createErr) {
      console.error('Service insert error:', createErr);
      return NextResponse.json({ error: 'Failed to create admin profile', details: createErr.message }, { status: 500 });
    }

    return NextResponse.json(created || {});
  } catch (err: any) {
    console.error('Ensure-admin critical error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}