/**
 * Admin API for AI Topic Configurations
 * Manage news sources, prompts, and generation settings
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool, query, insert, update, remove } from '@/lib/admin/local-db';

export const runtime = 'nodejs';

import { requireAdminUser } from '@/lib/admin/admin-auth';

/**
 * GET /api/admin/ai-topic-configs
 * List all configurations
 */
export async function GET(request: Request) {
    const authResult = await requireAdminUser(request as any);
    if ('error' in authResult) return authResult.error;

    try {
        const { searchParams } = new URL(request.url);
        const contextType = searchParams.get('context_type');
        const isActive = searchParams.get('is_active');

        let sql = 'SELECT * FROM ai_topic_configs WHERE 1=1';
        const params: any[] = [];
        let i = 1;

        if (contextType) {
            sql += ` AND context_type = $${i++}`;
            params.push(contextType);
        }
        if (isActive !== null) {
            sql += ` AND is_active = $${i++}`;
            params.push(isActive === 'true');
        }

        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);

        return NextResponse.json({
            success: true,
            configs: rows
        });

    } catch (error: any) {
        console.error('[AI Topic Configs] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/ai-topic-configs
 * Create or update configuration
 */
export async function POST(request: Request) {
    const authResult = await requireAdminUser(request as any);
    if ('error' in authResult) return authResult.error;
    const adminUserId = authResult.user.id;

    try {
        const body = await request.json();
        const { id, ...configData } = body;

        let result;

        if (id) {
            // Update existing
            const updated = await update('ai_topic_configs',
                { ...configData, updated_at: new Date().toISOString() },
                { id },
                '*'
            );
            result = updated[0];
        } else {
            // Create new
            const inserted = await insert('ai_topic_configs', {
                ...configData,
                created_by: adminUserId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, '*');
            result = inserted[0];
        }

        return NextResponse.json({
            success: true,
            config: result
        });

    } catch (error: any) {
        console.error('[AI Topic Configs] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/ai-topic-configs
 * Delete a configuration
 */
export async function DELETE(request: Request) {
    const authResult = await requireAdminUser(request as any);
    if ('error' in authResult) return authResult.error;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing config ID' }, { status: 400 });
        }

        await remove('ai_topic_configs', { id });

        return NextResponse.json({
            success: true,
            message: 'Configuration deleted'
        });

    } catch (error: any) {
        console.error('[AI Topic Configs] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
