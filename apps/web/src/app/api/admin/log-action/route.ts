/**
 * Admin Log Action API
 * Server-side endpoint for logging admin actions with IP tracking
 * Writes to admin_audit_log (single source of truth)
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

        // Ensure schema has IP/user_agent columns (idempotent)
        try {
            await pool.query(`
                ALTER TABLE admin_audit_log 
                ADD COLUMN IF NOT EXISTS ip_address text,
                ADD COLUMN IF NOT EXISTS user_agent text
            `);
        } catch (schemaErr) {
            // Columns already exist or table lock — safe to ignore
            console.warn('[Admin Log Action] Schema check:', schemaErr);
        }

        // Get IP and User-Agent from request headers
        const headers = request.headers;
        const ip_address = headers.get('x-forwarded-for') ||
                           headers.get('x-real-ip') ||
                           'unknown';
        const user_agent = headers.get('user-agent') || 'unknown';

        // Insert log into admin_audit_log (single source of truth)
        const result = await pool.query(`
            INSERT INTO admin_audit_log
                (admin_id, action, entity_type, entity_id, old_value, new_value, reason, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
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
            user_agent
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
 * GET: Fetch admin logs with filters (parameterized — no SQL injection)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const adminId = searchParams.get('adminId');
    const actionType = searchParams.get('actionType');
    const resourceType = searchParams.get('resourceType');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));

    try {
        let sql = 'SELECT * FROM admin_audit_log WHERE 1=1';
        const params: any[] = [];
        let i = 1;

        if (adminId) {
            sql += ` AND admin_id = $${i++}`;
            params.push(adminId);
        }
        if (actionType) {
            sql += ` AND action = $${i++}`;
            params.push(actionType);
        }
        if (resourceType) {
            sql += ` AND entity_type = $${i++}`;
            params.push(resourceType);
        }

        sql += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`;
        params.push(limit, offset);

        const rows = await query(sql, params);

        // Count query (also parameterized)
        let countSql = 'SELECT COUNT(*) as count FROM admin_audit_log WHERE 1=1';
        const countParams: any[] = [];
        let ci = 1;

        if (adminId) {
            countSql += ` AND admin_id = $${ci++}`;
            countParams.push(adminId);
        }
        if (actionType) {
            countSql += ` AND action = $${ci++}`;
            countParams.push(actionType);
        }
        if (resourceType) {
            countSql += ` AND entity_type = $${ci++}`;
            countParams.push(resourceType);
        }

        const countResult = await query<{ count: string }>(countSql, countParams);

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
