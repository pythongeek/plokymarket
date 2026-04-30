/**
 * API Route: /api/admin/announcements
 * CRUD operations for site announcements
 */
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth-guard';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/announcements - Get all announcements (or active only for non-admin)
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = req.nextUrl.searchParams;
        const activeOnly = searchParams.get('active') === 'true';

        // Use any to break deep type instantiation on the query chain
        const baseQuery = (supabase as any)
            .from('site_announcements')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        let query = baseQuery;

        if (activeOnly) {
            query = query
                .eq('is_active', true)
                .lte('starts_at', new Date().toISOString())
                .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('[Announcements GET]', error);
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

// POST /api/admin/announcements - Create new announcement
export async function POST(req: NextRequest) {
    try {
        // Use auth guard utility
        const admin = await requireAdmin();
        if (admin instanceof NextResponse) return admin;

        const supabase = await createClient();

        const body = await req.json();
        const { title, message, type, is_active, is_global, action_text, action_url, starts_at, ends_at } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        const { data, error } = await (supabase as any)
            .from('site_announcements')
            .insert({
                title,
                message,
                type: type || 'info',
                is_active: is_active ?? true,
                is_global: is_global ?? true,
                action_text,
                action_url,
                starts_at: starts_at || new Date().toISOString(),
                ends_at,
                created_by: admin.user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Announcements POST]', error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}

// PUT /api/admin/announcements - Update announcement
export async function PUT(req: NextRequest) {
    try {
        // Use auth guard utility
        const admin = await requireAdmin();
        if (admin instanceof NextResponse) return admin;

        const body = await req.json();
        const { id, title, message, type, is_active, is_global, action_text, action_url, starts_at, ends_at } = body;

        if (!id) {
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data, error } = await (supabase as any)
            .from('site_announcements')
            .update({
                title,
                message,
                type,
                is_active,
                is_global,
                action_text,
                action_url,
                starts_at,
                ends_at
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Announcements PUT]', error);
        return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }
}

// DELETE /api/admin/announcements - Delete announcement
export async function DELETE(req: NextRequest) {
    try {
        // Use auth guard utility
        const admin = await requireAdmin();
        if (admin instanceof NextResponse) return admin;

        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { error } = await (supabase as any)
            .from('site_announcements')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Announcements DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
