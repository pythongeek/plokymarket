/**
 * Create missing QStash schedules using Upstash SDK
 * - tick-adjustment (hourly)
 * - leaderboard/cron (daily 06:00 BDT)
 */

const { Client } = require('@upstash/qstash');

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://polymarket-bangladesh.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is required');
  process.exit(1);
}

const WORKFLOWS = [
  {
    name: 'Tick Adjustment',
    destination: `${APP_URL}/api/cron/tick-adjustment`,
    cron: '0 * * * *',
    method: 'GET'
  },
  {
    name: 'Leaderboard Daily',
    destination: `${APP_URL}/api/leaderboard/cron`,
    cron: '0 0 * * *',
    method: 'POST'
  }
];

async function setupWorkflows() {
  console.log('🔧 Setting up missing QStash workflows...\n');
  console.log(`Target URL: ${APP_URL}\n`);

  const client = new Client({ token: QSTASH_TOKEN });

  for (const wf of WORKFLOWS) {
    try {
      console.log(`\n--- ${wf.name} ---`);
      console.log(`  Destination: ${wf.destination}`);
      console.log(`  Cron: ${wf.cron}`);

      const schedule = await client.schedules.create({
        destination: wf.destination,
        cron: wf.cron,
        method: wf.method,
        retries: 3
      });

      console.log(`  ✅ Created (ID: ${schedule.id || 'unknown'})`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  console.log('\n🎉 Workflow setup complete!');
  console.log('Verify at: https://console.upstash.com/qstash/schedules');
}

setupWorkflows();
