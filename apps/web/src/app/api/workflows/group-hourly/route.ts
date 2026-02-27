import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

// POST /api/workflows/group-hourly
// Every hour: Analytics Daily, Tick Adjustment, Batch Markets, Price Snapshot
export async function POST(request: Request) {
    try {
        const signature = request.headers.get('upstash-signature') || '';
        const bodyText = await request.text();
        const isValid = verifyQStashSignature(signature, bodyText);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const supabase = await createClient();
        const results: Record<string, any> = { timestamp: new Date().toISOString(), tasks: [], errors: [] };
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000';

        const runTask = async (name: string, endpoint: string, method: 'GET' | 'POST' = 'POST') => {
            try {
                const response = await fetch(`${baseUrl}${endpoint}`, { method, headers: { 'Content-Type': 'application/json' } });
                results.tasks.push({ name, status: 'success', data: await response.json() });
            } catch (error) {
                results.errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };

        await runTask('Daily Analytics', '/api/workflows/analytics/daily');
        await runTask('Tick Adjustment', '/api/cron/tick-adjustment', 'GET');
        await runTask('Batch Market Processing', '/api/cron/batch-markets', 'GET');
        await runTask('Price Snapshot', '/api/workflows/price-snapshot', 'POST'); // Phase 2: Hourly price snapshots

        await supabase.from('workflow_executions').insert({
            workflow_name: 'group-hourly',
            status: results.errors.length === 0 ? 'success' : 'partial',
            results,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: results.errors.length === 0, results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
