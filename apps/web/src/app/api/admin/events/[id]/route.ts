import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const id = params.id;

    try {
        // Fetch market by ID
        const { data: event, error } = await supabase
            .from('markets')
            .select('id, question, description, slug, status, category, image_url, created_at, updated_at, trading_closes_at')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Map question to title for frontend compatibility
        if (event) {
            event.title = event.question;
        }

        return NextResponse.json({ data: event });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const id = params.id;

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();

        // Map title to question if needed
        const updates: Record<string, any> = { ...body };
        if (body.title && !body.question) {
            updates.question = body.title;
            delete updates.title;
        }

        const { data, error } = await supabase
            .from('markets')
            .update(updates)
            .eq('id', id)
            .select('id, question, description, slug, status, category, image_url, created_at, updated_at, trading_closes_at')
            .single();

        if (error) {
            console.error('Error updating event:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map question to title for frontend compatibility
        if (data) {
            data.title = data.question;
        }

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const id = params.id;

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { error } = await supabase
            .from('markets')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
