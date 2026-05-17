/**
 * Admin API for AI Daily Topics Management
 * List, approve, reject, and delete topics
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool, query, insert, update, remove } from '@/lib/admin/local-db';

export const runtime = 'nodejs';

import { requireAdminUser } from '@/lib/admin/admin-auth';

/**
 * GET /api/admin/daily-topics
 * List all AI daily topics with filtering
 */
export async function GET(request: Request) {
    const authResult = await requireAdminUser(request as any);
    if ('error' in authResult) return authResult.error;
    const adminUserId = authResult.user.id;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let sql = 'SELECT * FROM ai_daily_topics WHERE 1=1';
        const params: any[] = [];
        let paramIdx = 1;

        if (status) {
            sql += ` AND status = $${paramIdx++}`;
            params.push(status);
        }
        if (category) {
            sql += ` AND category = $${paramIdx++}`;
            params.push(category);
        }

        sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        params.push(limit, offset);

        const rows = await query(sql, params);

        let countSql = 'SELECT COUNT(*) as count FROM ai_daily_topics WHERE 1=1';
        const countParams: any[] = [];
        let countIdx = 1;
        if (status) {
            countSql += ` AND status = $${countIdx++}`;
            countParams.push(status);
        }
        if (category) {
            countSql += ` AND category = $${countIdx++}`;
            countParams.push(category);
        }
        const countResult = await query<{ count: string }>(countSql, countParams);

        return NextResponse.json({
            success: true,
            topics: rows,
            total: parseInt(countResult[0]?.count || '0'),
            limit,
            offset
        });

    } catch (error: any) {
        console.error('[Admin DailyTopics] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/daily-topics
 * Approve a topic and create market, or reject it
 */
export async function POST(request: Request) {
    const authResult = await requireAdminUser(request as any);
    if ('error' in authResult) return authResult.error;
    const adminUserId = authResult.user.id;

    const client = await pool.connect();

    try {
        const body = await request.json();
        const { topic_id, action, market_data, rejection_reason } = body;

        if (!topic_id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await client.query('BEGIN');

        if (action === 'approve') {
            // Get topic details
            const topics = await query(
                'SELECT * FROM ai_daily_topics WHERE id = $1',
                [topic_id]
            );
            const topic = topics[0];

            if (!topic) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
            }

            // Create market from topic
            const markets = await insert('markets', {
                question: topic.suggested_title || topic.title,
                description: topic.suggested_description || topic.description || topic.title,
                category: topic.suggested_category || topic.category,
                trading_closes_at: market_data?.trading_closes_at || topic.trading_end_date,
                event_date: market_data?.event_date || topic.trading_end_date,
                status: 'active',
                creator_id: adminUserId,
                resolution_source_type: 'AI',
                created_at: new Date().toISOString()
            });
            const market = markets[0];

            // Update topic status
            await update('ai_daily_topics',
                {
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: adminUserId,
                    market_id: market?.id
                },
                { id: topic_id }
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Topic approved and market created',
                market
            });

        } else if (action === 'reject') {
            await update('ai_daily_topics',
                {
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    rejected_by: adminUserId,
                    rejection_reason: rejection_reason || null
                },
                { id: topic_id }
            );

            await client.query('COMMIT');

            return NextResponse.json({
                success: true,
                message: 'Topic rejected'
            });
        }

        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Admin DailyTopics] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

/**
 * DELETE /api/admin/daily-topics
 * Delete a topic
 */
export async function DELETE(request: Request) {
    const authResult = await requireAdminUser(request as any);
    if ('error' in authResult) return authResult.error;

    try {
        const { searchParams } = new URL(request.url);
        const topic_id = searchParams.get('id');

        if (!topic_id) {
            return NextResponse.json({ error: 'Missing topic ID' }, { status: 400 });
        }

        await remove('ai_daily_topics', { id: topic_id });

        return NextResponse.json({
            success: true,
            message: 'Topic deleted'
        });

    } catch (error: any) {
        console.error('[Admin DailyTopics] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
