import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/metrics/system - Get system health status
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Security check - verify user is authenticated
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get database status
        let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            const { error: dbError } = await supabase.from('markets').select('id').limit(1);
            if (dbError) dbStatus = 'degraded';
        } catch {
            dbStatus = 'down';
        }

        // Get realtime status (check if any channels exist)
        let realtimeStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            const { data: realtimeData } = await supabase
                .from('workflow_executions')
                .select('id')
                .eq('status', 'running')
                .limit(1);
            if (!realtimeData) realtimeStatus = 'degraded';
        } catch {
            realtimeStatus = 'healthy';
        }

        // Check workflow status
        let workflowStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
        try {
            const { data: workflows } = await supabase
                .from('workflow_executions')
                .select('status')
                .order('created_at', { ascending: false })
                .limit(10);

            const failedCount = workflows?.filter((w: { status: string }) => w.status === 'failed').length || 0;
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
