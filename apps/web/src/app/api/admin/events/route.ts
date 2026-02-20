import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        // Query events table (reimplemented)
        let query = supabase
            .from('events')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }
        if (category) {
            query = query.eq('category', category);
        }
        if (search) {
            query = query.or(`title.ilike.%${search}%,question.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching events:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map for frontend compatibility
        const events = (data || []).map((event: any) => ({
            ...event,
            name: event.title || event.name,
            volume: event.total_volume || 0,
        }));

        return NextResponse.json({
            data: events,
            count: count || 0,
            pagination: {
                limit,
                offset,
                total: count || 0
            }
        });
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

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { title, slug, description, category, image_url, trading_closes_at, question } = body;

        // Basic validation
        if (!title && !question) {
            return NextResponse.json({ error: 'Title or question is required' }, { status: 400 });
        }
        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        // Auto-generate slug if not provided
        const finalSlug = slug ||
            (title || question).toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '')
                .substring(0, 80) + '-' + Date.now().toString(36);

        const { data, error } = await supabase
            .from('events')
            .insert({
                title: title || question,
                question: question || title,
                slug: finalSlug,
                description,
                category,
                image_url,
                status: 'active',
                trading_closes_at: trading_closes_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
