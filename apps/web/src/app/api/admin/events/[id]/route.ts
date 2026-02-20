import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const id = params.id;

    try {
        // Try events table first (events created via the event creation flow)
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (eventData && !eventError) {
            // Found in events table — also fetch associated markets
            const { data: markets } = await supabase
                .from('markets')
                .select('id, question, name, status, slug, category, created_at, trading_closes_at, liquidity, initial_liquidity')
                .eq('event_id', id);

            return NextResponse.json({
                data: {
                    ...eventData,
                    title: eventData.name || eventData.question || eventData.title,
                    markets: markets || []
                }
            });
        }

        // Fallback: try markets table directly (standalone markets)
        const { data: market, error: marketError } = await supabase
            .from('markets')
            .select('id, question, name, description, slug, status, category, image_url, created_at, trading_closes_at, liquidity, initial_liquidity, is_featured, tags, answer1, answer2')
            .eq('id', id)
            .single();

        if (marketError || !market) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Map for frontend compatibility
        return NextResponse.json({
            data: {
                ...market,
                title: market.question || market.name,
                markets: [] // standalone market, no nested markets
            }
        });
    } catch (error) {
        console.error('Error fetching event:', error);
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
        // Map is_active to status
        if ('is_active' in updates) {
            updates.status = updates.is_active ? 'active' : 'pending';
            delete updates.is_active;
        }

        // Try events table first
        const { data: eventExists } = await supabase
            .from('events')
            .select('id')
            .eq('id', id)
            .single();

        if (eventExists) {
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                console.error('Error updating event:', error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
            return NextResponse.json({ data });
        }

        // Fallback: markets table
        const { data, error } = await supabase
            .from('markets')
            .update(updates)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating market:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('PATCH error:', error);
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
        // Try events table first
        const { data: eventExists } = await supabase
            .from('events')
            .select('id')
            .eq('id', id)
            .single();

        if (eventExists) {
            // Delete associated markets first
            await supabase.from('markets').delete().eq('event_id', id);
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ success: true });
        }

        // Fallback: markets table
        const { error } = await supabase.from('markets').delete().eq('id', id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
