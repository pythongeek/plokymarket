import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

// POST /api/workflows/group-fast
// Every 5 minutes: Crypto, Exchange Rate, Escalations
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

        await runTask('Crypto Market Data', '/api/workflows/execute-crypto');
        await runTask('USDT Exchange Rate', '/api/workflows/update-exchange-rate');
        await runTask('Support Escalations', '/api/workflows/check-escalations');

        await supabase.from('workflow_executions').insert({
            workflow_name: 'group-fast',
            status: results.errors.length === 0 ? 'success' : 'partial',
            results,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: results.errors.length === 0, results });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
