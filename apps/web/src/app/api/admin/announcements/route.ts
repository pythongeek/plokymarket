/**
 * API Route: /api/admin/announcements
 * CRUD operations for site announcements
 */
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';


// GET /api/admin/announcements - Get all announcements (or active only for non-admin)
export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const activeOnly = searchParams.get('active') === 'true';

        let sql = 'SELECT * FROM site_announcements';
        let params: any[] = [];
        let conditions: string[] = [];

        if (activeOnly) {
            const now = new Date().toISOString();
            conditions.push('is_active = true');
            conditions.push('starts_at <= $1');
            params.push(now);
            conditions.push('(ends_at IS NULL OR ends_at > $1)');
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY created_at DESC';

        const result = await pool.query(sql, params);

        return NextResponse.json(result.rows || []);
    } catch (error) {
        console.error('[Announcements GET]', error);
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

// POST /api/admin/announcements - Create new announcement
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { title, message, type, is_active, is_global, action_text, action_url, starts_at, ends_at } = body;

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO site_announcements 
                (title, message, type, is_active, is_global, action_text, action_url, starts_at, ends_at, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                title,
                message,
                type || 'info',
                is_active ?? true,
                is_global ?? true,
                action_text || null,
                action_url || null,
                starts_at || new Date().toISOString(),
                ends_at || null,
                userId
            ]
        );

        if (result.error) throw result.error;

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('[Announcements POST]', error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}

// PUT /api/admin/announcements - Update announcement
export async function PUT(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { id, title, message, type, is_active, is_global, action_text, action_url, starts_at, ends_at } = body;

        if (!id) {
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
        }

        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (title !== undefined) { updates.push(`title = $${paramIndex++}`); values.push(title); }
        if (message !== undefined) { updates.push(`message = $${paramIndex++}`); values.push(message); }
        if (type !== undefined) { updates.push(`type = $${paramIndex++}`); values.push(type); }
        if (is_active !== undefined) { updates.push(`is_active = $${paramIndex++}`); values.push(is_active); }
        if (is_global !== undefined) { updates.push(`is_global = $${paramIndex++}`); values.push(is_global); }
        if (action_text !== undefined) { updates.push(`action_text = $${paramIndex++}`); values.push(action_text); }
        if (action_url !== undefined) { updates.push(`action_url = $${paramIndex++}`); values.push(action_url); }
        if (starts_at !== undefined) { updates.push(`starts_at = $${paramIndex++}`); values.push(starts_at); }
        if (ends_at !== undefined) { updates.push(`ends_at = $${paramIndex++}`); values.push(ends_at); }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE site_announcements SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.error) throw result.error;
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('[Announcements PUT]', error);
        return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
    }
}

// DELETE /api/admin/announcements - Delete announcement
export async function DELETE(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
        }

        const result = await pool.query(
            'DELETE FROM site_announcements WHERE id = $1',
            [id]
        );

        if (result.error) throw result.error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Announcements DELETE]', error);
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
