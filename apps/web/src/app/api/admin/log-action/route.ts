/**
 * Admin Log Action API
 * Server-side endpoint for logging admin actions with IP tracking
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const {
            admin_id,
            action_type,
            resource_type,
            resource_id,
            old_values,
            new_values,
            reason,
            workflow_id
        } = body;

        if (!admin_id || !action_type) {
            return NextResponse.json(
                { error: 'Missing required fields: admin_id, action_type' },
                { status: 400 }
            );
        }

        // Get IP and User-Agent from request headers
        const headers = request.headers;
        const ip_address = headers.get('x-forwarded-for') ||
                           headers.get('x-real-ip') ||
                           'unknown';
        const user_agent = headers.get('user-agent') || 'unknown';

        // Insert log directly into local DB using pg
        const result = await pool.query(`
            INSERT INTO admin_activity_logs
                (admin_id, action_type, resource_type, resource_id, old_values, new_values, reason, ip_address, user_agent, workflow_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING id
        `, [
            admin_id,
            action_type,
            resource_type || null,
            resource_id || null,
            old_values ? JSON.stringify(old_values) : null,
            new_values ? JSON.stringify(new_values) : null,
            reason || null,
            ip_address,
            user_agent,
            workflow_id || null
        ]);

        const logId = result.rows[0]?.id;

        return NextResponse.json({
            success: true,
            logId,
            executionTimeMs: Date.now() - startTime
        });

    } catch (error: any) {
        console.error('[Admin Log Action] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error.message,
                executionTimeMs: Date.now() - startTime
            },
            { status: 500 }
        );
    }
}

/**
 * GET: Fetch admin logs with filters
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const adminId = searchParams.get('adminId');
    const actionType = searchParams.get('actionType');
    const resourceType = searchParams.get('resourceType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        let sql = 'SELECT * FROM admin_activity_logs WHERE 1=1';
        const params: any[] = [];
        let i = 1;

        if (adminId) {
            sql += ` AND admin_id = $${i++}`;
            params.push(adminId);
        }
        if (actionType) {
            sql += ` AND action_type = $${i++}`;
            params.push(actionType);
        }
        if (resourceType) {
            sql += ` AND resource_type = $${i++}`;
            params.push(resourceType);
        }

        sql += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`;
        params.push(limit, offset);

        const rows = await query(sql, params);

        const countResult = await query<{ count: string }>(
            'SELECT COUNT(*) as count FROM admin_activity_logs WHERE 1=1' +
            (adminId ? ` AND admin_id = '${adminId}'` : '') +
            (actionType ? ` AND action_type = '${actionType}'` : '') +
            (resourceType ? ` AND resource_type = '${resourceType}'` : ''),
            []
        );

        return NextResponse.json({
            logs: rows,
            count: parseInt(countResult[0]?.count || '0'),
            limit,
            offset
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
