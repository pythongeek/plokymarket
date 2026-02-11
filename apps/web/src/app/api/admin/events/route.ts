import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
        let query = supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            if (status === 'active') query = query.eq('is_active', true);
            else if (status === 'inactive') query = query.eq('is_active', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching events:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role (assuming you have a way to check, usually via rls or profiles table)
    /* 
    const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    */

    try {
        const body = await request.json();
        const { title, slug, description, category, image_url, start_date, end_date } = body;

        // Basic validation
        if (!title || !category) {
            return NextResponse.json({ error: 'Title and Category are required' }, { status: 400 });
        }

        // Auto-generate slug if not provided
        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const { data, error } = await supabase
            .from('events')
            .insert({
                title,
                slug: finalSlug,
                description,
                category,
                image_url,
                start_date: start_date || new Date().toISOString(),
                end_date,
                created_by: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating event:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error in event creation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
