import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

/**
 * MASTER AUTOMATION WORKFLOW
 * 
 * This is a single intelligent entry point for all scheduled tasks.
 * It uses a single Upstash QStash schedule to manage multiple tasks
 * with different frequencies, staying within free tier limits.
 * 
 * Frequency: Every 5 minutes (standard interval)
 */
export async function POST(request: Request) {
    try {
        // 1. Security Verification
        const signature = request.headers.get('upstash-signature') || '';
        const bodyText = await request.text();
        const isValid = verifyQStashSignature(signature, bodyText);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const supabase = await createClient();
        const now = new Date();
        // Use Asia/Dhaka time for consistency
        const bdTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
        const minutes = bdTime.getMinutes();
        const hours = bdTime.getHours();

        const results: Record<string, any> = {
            timestamp: now.toISOString(),
            bdTime: bdTime.toISOString(),
            tasks: [],
            errors: []
        };

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;

        /**
         * Helper to execute a sub-task via internal API
         */
        const runTask = async (name: string, endpoint: string, method: 'GET' | 'POST' = 'POST') => {
            try {
                console.log(`🚀 Executing Master Task: ${name} -> ${endpoint}`);
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.QSTASH_TOKEN}` // Pass token as secret if needed
                    }
                });
                const data = await response.json();
                results.tasks.push({ name, status: 'success', data });
            } catch (error) {
                console.error(`❌ Task Failed: ${name}`, error);
                results.errors.push(`${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };

        // --- TASK DISPATCHER LOGIC ---

        // A. FAST TRACK (Every 5 minutes - always runs in this cron)
        await runTask('Crypto Market Data', '/api/workflows/execute-crypto');
        await runTask('USDT Exchange Rate', '/api/workflows/update-exchange-rate');
        await runTask('Support Escalations', '/api/workflows/check-escalations');
        await runTask('Market Close Check', '/api/workflows/market-close-check');

        // B. MEDIUM TRACK (Every 10 minutes)
        if (minutes % 10 === 0) {
            await runTask('Sports Market Data', '/api/workflows/execute-sports');
            await runTask('Auto-Verification', '/api/workflows/auto-verify');
        }

        // C. SYSTEM TRACK (Hourly)
        if (minutes === 0) {
            await runTask('Daily Analytics', '/api/workflows/analytics/daily');
            await runTask('Tick Adjustment', '/api/cron/tick-adjustment', 'GET');
            await runTask('Batch Market Processing', '/api/cron/batch-markets', 'GET');
            await runTask('Price Snapshot', '/api/workflows/price-snapshot');
        }

        // D. MANAGEMENT TRACK (Every 6 hours)
        if (hours % 6 === 0 && minutes === 0) {
            await runTask('Dispute Workflow', '/api/dispute-workflow');
        }

        // E. DAILY TRACK (Midnight BD Time)
        if (hours === 0 && minutes === 0) {
            await runTask('News Market Fetch', '/api/workflows/execute-news');
            await runTask('Leaderboard Refresh', '/api/leaderboard/cron');
            await runTask('Daily AI Topics', '/api/cron/daily-ai-topics');
            await runTask('Cleanup Expired Deposits', '/api/workflows/cleanup-expired');
            await runTask('Daily Platform Report', '/api/workflows/daily-report');
            await runTask('Phase2 Daily Cleanup', '/api/workflows/cleanup');
        }

        // Log the master execution
        await supabase.from('workflow_executions').insert({
            workflow_name: 'master-automation',
            status: results.errors.length === 0 ? 'success' : 'partial',
            results,
            created_at: now.toISOString()
        });

        return NextResponse.json({
            success: results.errors.length === 0,
            message: `Master automation completed. Executed ${results.tasks.length} tasks.`,
            results
        });

    } catch (error) {
        console.error('Master automation fatal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
