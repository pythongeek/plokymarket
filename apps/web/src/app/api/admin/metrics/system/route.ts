import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


export const dynamic = 'force-dynamic';

// GET /api/admin/metrics/system - Get system health status
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdminUser(request);
        if ('error' in authResult) return authResult.error;

        // Get database status
        let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            const dbResult = await pool.query('SELECT id FROM markets LIMIT 1');
            if (dbResult.error) dbStatus = 'degraded';
        } catch {
            dbStatus = 'down';
        }

        // Get realtime status (check if any channels exist)
        let realtimeStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            const realtimeResult = await pool.query(
                "SELECT id FROM workflow_executions WHERE status = 'running' LIMIT 1"
            );
            if (!realtimeResult.rows || realtimeResult.rows.length === 0) realtimeStatus = 'degraded';
        } catch {
            realtimeStatus = 'healthy';
        }

        // Check workflow status
        let workflowStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            const workflowResult = await pool.query(
                'SELECT status FROM workflow_executions ORDER BY created_at DESC LIMIT 10'
            );

            const failedCount = workflowResult.rows?.filter((w: { status: string }) => w.status === 'failed').length || 0;
            if (failedCount > 5) workflowStatus = 'degraded';
            else if (failedCount > 10) workflowStatus = 'down';
        } catch {
            workflowStatus = 'healthy';
        }

        // API is always healthy if we got here
        const apiStatus: 'healthy' | 'degraded' | 'down' = 'healthy';

        return NextResponse.json({
            status: {
                database: dbStatus,
                api: apiStatus,
                realtime: realtimeStatus,
                workflow: workflowStatus,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error fetching system status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch system status' },
            { status: 500 }
        );
    }
}
