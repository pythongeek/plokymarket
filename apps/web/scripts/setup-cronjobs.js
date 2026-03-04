/**
 * Cron-job.org Setup Script
 * 
 * This script creates all the required cron jobs using the cron-job.org REST API.
 * 
 * Prerequisites:
 * 1. Create account at https://cron-job.org
 * 2. Get your API token from: https://cron-job.org/en/api/
 * 3. Run this script with your API token
 * 
 * Usage:
 *   CRONJOB_API_TOKEN=your_api_token node scripts/setup-cronjobs.js
 * 
 * Or manually create jobs using the configurations below.
 */

const API_TOKEN = process.env.CRONJOB_API_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://polymarket-bangladesh.vercel.app';
const CRON_SECRET = process.env.MASTER_CRON_SECRET;

// List of all cron jobs to create
const CRON_JOBS = [
    // Phase 1: Every 5 minutes
    {
        title: 'Crypto Market Verification (5 min)',
        url: `${BASE_URL}/api/workflows/execute-crypto`,
        method: 'POST',
        schedule: '*/5 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'USDT Exchange Rate Update (5 min)',
        url: `${BASE_URL}/api/workflows/update-exchange-rate`,
        method: 'POST',
        schedule: '*/5 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Support Escalation Check (5 min)',
        url: `${BASE_URL}/api/workflows/check-escalations`,
        method: 'POST',
        schedule: '*/5 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Market Close Check (5 min)',
        url: `${BASE_URL}/api/workflows/market-close-check`,
        method: 'POST',
        schedule: '*/5 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Batch Markets Processing (15 min)',
        url: `${BASE_URL}/api/cron/batch-markets`,
        method: 'GET',
        schedule: '*/15 * * * *',
        headers: {
            'X-Cron-Secret': CRON_SECRET
        }
    },

    // Phase 2: Every 10 minutes
    {
        title: 'Sports Market Verification (10 min)',
        url: `${BASE_URL}/api/workflows/execute-sports`,
        method: 'POST',
        schedule: '*/10 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Auto Verification (10 min)',
        url: `${BASE_URL}/api/workflows/auto-verify`,
        method: 'POST',
        schedule: '*/10 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },

    // Phase 3: Hourly
    {
        title: 'Daily Analytics (Hourly)',
        url: `${BASE_URL}/api/workflows/analytics/daily`,
        method: 'POST',
        schedule: '0 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Tick Adjustment (Hourly)',
        url: `${BASE_URL}/api/cron/tick-adjustment`,
        method: 'GET',
        schedule: '30 * * * *',
        headers: {
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Price Snapshot (Hourly)',
        url: `${BASE_URL}/api/workflows/price-snapshot`,
        method: 'POST',
        schedule: '15 * * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },

    // Phase 4: Daily (Midnight Bangladesh = 18:00 UTC)
    {
        title: 'News Market Fetch (Daily BD Midnight)',
        url: `${BASE_URL}/api/workflows/execute-news`,
        method: 'POST',
        schedule: '0 18 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Leaderboard Refresh (Daily BD Midnight)',
        url: `${BASE_URL}/api/leaderboard/cron`,
        method: 'POST',
        schedule: '0 18 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Daily AI Topics (Daily BD Midnight)',
        url: `${BASE_URL}/api/cron/daily-ai-topics`,
        method: 'POST',
        schedule: '0 18 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Cleanup Expired Deposits (Daily)',
        url: `${BASE_URL}/api/workflows/cleanup-expired`,
        method: 'POST',
        schedule: '0 18 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Daily Platform Report (9 AM UTC = 3 PM BD)',
        url: `${BASE_URL}/api/workflows/daily-report`,
        method: 'POST',
        schedule: '0 9 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Phase2 Daily Cleanup (1 AM UTC = 7 AM BD)',
        url: `${BASE_URL}/api/workflows/cleanup`,
        method: 'POST',
        schedule: '0 1 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },

    // Phase 5: Every 6 hours
    {
        title: 'Dispute Workflow (Every 6 hours)',
        url: `${BASE_URL}/api/dispute-workflow`,
        method: 'POST',
        schedule: '0 */6 * * *',
        headers: {
            'Content-Type': 'application/json',
            'X-Cron-Secret': CRON_SECRET
        }
    },
    {
        title: 'Sync Orphaned Events (Every 6 hours)',
        url: `${BASE_URL}/api/cron/sync-orphaned-events`,
        method: 'GET',
        schedule: '30 */6 * * *',
        headers: {
            'X-Cron-Secret': CRON_SECRET
        }
    }
];

async function createCronJob(job) {
    console.log(`Creating job: ${job.title}...`);
    console.log(`  URL: ${job.url}`);
    console.log(`  Method: ${job.method}`);
    console.log(`  Schedule: ${job.schedule}`);

    const response = await fetch('https://cron-job.org/api/jobs', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            job: {
                url: job.url,
                method: job.method,
                schedule: {
                    timezone: 'UTC',
                    expression: job.schedule,
                    description: job.title
                },
                headers: job.headers,
                title: job.title,
                is_active: true,
                save_responses: true,
                notification: {
                    on_failure: true,
                    on_failure_threshold: 3,
                    on_failure_message: `Cron job "${job.title}" failed`
                }
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error(`❌ Failed to create "${job.title}":`, data);
        return null;
    }

    console.log(`✅ Created: ${job.title} (ID: ${data.job_id})`);
    return data.job_id;
}

async function main() {
    if (!API_TOKEN) {
        console.error('❌ CRONJOB_API_TOKEN not set');
        console.log('\nUsage:');
        console.log('  CRONJOB_API_TOKEN=your_api_token node scripts/setup-cronjobs.js');
        console.log('\nGet your API token from: https://cron-job.org/en/api/');
        process.exit(1);
    }

    if (!CRON_SECRET) {
        console.error('❌ MASTER_CRON_SECRET not set in environment');
        process.exit(1);
    }

    console.log(`\n🚀 Creating ${CRON_JOBS.length} cron jobs...`);
    console.log(`📡 Target: ${BASE_URL}\n`);

    const results = [];

    for (const job of CRON_JOBS) {
        try {
            const jobId = await createCronJob(job);
            results.push({ job: job.title, jobId, success: !!jobId });
            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Error creating "${job.title}":`, error.message);
            results.push({ job: job.title, jobId: null, success: false, error: error.message });
        }
    }

    console.log('\n📊 Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`   ✅ Successful: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);

    if (failed > 0) {
        console.log('\n⚠️ Failed jobs:');
        results.filter(r => !r.success).forEach(r => console.log(`   - ${r.job}: ${r.error}`));
    }

    console.log('\n✨ Setup complete! Check https://cron-job.org/en/jobs/ to verify.');
}

main().catch(console.error);
