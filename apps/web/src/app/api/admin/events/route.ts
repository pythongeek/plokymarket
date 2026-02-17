import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    try {
        let query = supabase
            .from('markets')
            .select('id, question, description, slug, status, category, image_url, created_at, updated_at, trading_closes_at')
            .order('created_at', { ascending: false });

        // Map question to title for frontend compatibility
        if (data) {
            data.forEach((event: any) => {
                event.title = event.question;
            });
        }

        if (status) {
            if (status === 'active') query = query.eq('status', 'active');
            else if (status === 'closed') query = query.eq('status', 'closed');
            else if (status === 'resolved') query = query.eq('status', 'resolved');
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

    try {
        const body = await request.json();
        const { title, slug, description, category, image_url, trading_closes_at } = body;

        // Basic validation
        if (!title || !category) {
            return NextResponse.json({ error: 'Title and Category are required' }, { status: 400 });
        }

        // Auto-generate slug if not provided
        const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const { data, error } = await supabase
            .from('markets')
            .insert({
                question: title,
                slug: finalSlug,
                description,
                category,
                image_url,
                status: 'active',
                trading_closes_at: trading_closes_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select('id, question, description, slug, status, category, image_url, created_at, updated_at, trading_closes_at')
            .single();

        // Map question to title for frontend compatibility
        if (data) {
            data.title = data.question;
        }

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
