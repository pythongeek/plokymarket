// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Admin auth
        const authResult = await requireAdminUser(request as unknown as import('next/server').NextRequest);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;
        void userId;

        // Try events table first (events created via the event creation flow)
        const eventResult = await pool.query(
            'SELECT * FROM events WHERE id = $1',
            [id]
        );

        if (eventResult.rows.length > 0) {
            const eventData = eventResult.rows[0];
            
            // Also fetch associated markets
            const marketsResult = await pool.query(
                `SELECT id, question, name, status, slug, category, created_at, trading_closes_at, liquidity, initial_liquidity
                 FROM markets WHERE event_id = $1`,
                [id]
            );

            return NextResponse.json({
                data: {
                    ...eventData,
                    title: eventData.name || eventData.question || eventData.title,
                    markets: marketsResult.rows || []
                }
            });
        }

        // Fallback: try markets table directly (standalone markets)
        const marketResult = await pool.query(
            `SELECT id, question, name, description, slug, status, category, image_url, created_at, trading_closes_at, liquidity, initial_liquidity, is_featured, tags, answer1, answer2
             FROM markets WHERE id = $1`,
            [id]
        );

        if (marketResult.rows.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const market = marketResult.rows[0];

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
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Admin auth
    const authResult = await requireAdminUser(request as unknown as import('next/server').NextRequest);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

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

        // events is a VIEW over event_definitions+markets
        // For event updates, use event_definitions (the base table)
        const eventExistsResult = await pool.query(
            'SELECT id FROM event_definitions WHERE id = $1',
            [id]
        );

        if (eventExistsResult.rows.length > 0) {
            // Update event_definitions (base table), not events (VIEW)
            const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
            const values = [...Object.values(updates), id];

            const result = await pool.query(
                `UPDATE event_definitions SET ${setClause} WHERE id = $${values.length} RETURNING *`,
                values
            );

            if (result.error) {
                console.error('Error updating event:', result.error);
                return NextResponse.json({ error: result.error.message }, { status: 500 });
            }
            return NextResponse.json({ data: result.rows[0] });
        }

        // Fallback: markets table
        const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = [...Object.values(updates), id];
        
        const result = await pool.query(
            `UPDATE markets SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (result.error) {
            console.error('Error updating market:', result.error);
            return NextResponse.json({ error: result.error.message }, { status: 500 });
        }

        return NextResponse.json({ data: result.rows[0] });
    } catch (error) {
        console.error('PATCH error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Admin auth
    const authResult = await requireAdminUser(request as unknown as import('next/server').NextRequest);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    try {
        // events is a VIEW over event_definitions+markets
        // Check event_definitions first
        const eventExistsResult = await pool.query(
            'SELECT id FROM event_definitions WHERE id = $1',
            [id]
        );

        if (eventExistsResult.rows.length > 0) {
            // Delete associated markets first (ON DELETE CASCADE should handle this, but be explicit)
            await pool.query('DELETE FROM markets WHERE event_id = $1', [id]);
            // Delete from event_definitions (base table), not events (VIEW)
            const result = await pool.query('DELETE FROM event_definitions WHERE id = $1', [id]);
            if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
            return NextResponse.json({ success: true });
        }

        // Fallback: markets table
        const result = await pool.query('DELETE FROM markets WHERE id = $1', [id]);
        if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
