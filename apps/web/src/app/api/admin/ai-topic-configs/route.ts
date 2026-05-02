/**
 * Admin API for AI Topic Configurations
 * Manage news sources, prompts, and generation settings
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool, query, insert, update, remove } from '@/lib/admin/local-db';

export const runtime = 'nodejs';

// Verify admin authentication
async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return { isAdmin: false, error: 'Missing authorization header' };
    }

    const token = authHeader.split(' ')[1];

    // Validate token against cloud Supabase
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });

    if (!cloudRes.ok) {
        return { isAdmin: false, error: 'Invalid token' };
    }

    const userData = await cloudRes.json();
    const userId = userData?.id;

    if (!userId) {
        return { isAdmin: false, error: 'Invalid token payload' };
    }

    const profiles = await query<{ is_admin: boolean }>(
        'SELECT is_admin FROM user_profiles WHERE id = $1',
        [userId]
    );

    if (!profiles[0]?.is_admin) {
        return { isAdmin: false, error: 'Not an admin' };
    }

    return { isAdmin: true, userId };
}

/**
 * GET /api/admin/ai-topic-configs
 * List all configurations
 */
export async function GET(request: Request) {
    const adminCheck = await verifyAdmin(request);

    if (!adminCheck.isAdmin) {
        return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
    }

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
    const adminCheck = await verifyAdmin(request);

    if (!adminCheck.isAdmin || !adminCheck.userId) {
        return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
    }

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
                created_by: adminCheck.userId,
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
    const adminCheck = await verifyAdmin(request);

    if (!adminCheck.isAdmin) {
        return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
    }

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
