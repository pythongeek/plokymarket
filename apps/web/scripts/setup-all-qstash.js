/**
 * Setup ALL QStash Schedules used by Plokymarket
 * - idempotent: deletes any existing schedule for the same destination
 * - run: node scripts/setup-all-qstash.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://plokymarket.vercel.app';

const SCHEDULES = [
  {
    name: 'Batch Markets',
    destination: `${APP_URL}/api/cron/batch-markets`,
    cron: '0,15,30,45 * * * *',
    method: 'GET'
  },
  {
    name: 'Check Markets',
    destination: `${APP_URL}/api/cron/check-markets`,
    cron: '0 * * * *',
    method: 'GET'
  },
  {
    name: 'Daily Topics',
    destination: `${APP_URL}/api/cron/daily-topics`,
    cron: '0 6 * * *',
    method: 'POST'
  },
  {
    name: 'Daily AI Topics',
    destination: `${APP_URL}/api/cron/daily-ai-topics`,
    cron: '0 0 * * *', // 00:00 UTC = 06:00 BDT
    method: 'POST'
  },
  {
    name: 'Tick Adjustment',
    destination: `${APP_URL}/api/cron/tick-adjustment`,
    cron: '0 * * * *',
    method: 'GET'
  },
  {
    name: 'Leaderboard (daily)',
    destination: `${APP_URL}/api/leaderboard/cron`,
    cron: '0 0 * * *', // daily at 06:00 BDT
    method: 'POST'
  }
];

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is required');
  process.exit(1);
}

async function listSchedules() {
  const res = await fetch(`${QSTASH_URL}/v2/schedules`, {
    headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Failed to list schedules (${res.status})`);
  return res.json();
}

async function deleteSchedule(scheduleId) {
  const res = await fetch(`${QSTASH_URL}/v2/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Failed to delete schedule ${scheduleId} (${res.status})`);
  return res.json();
}

async function createSchedule(destination, cron) {
  const res = await fetch(`${QSTASH_URL}/v2/schedules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      destination,
      cron,
      method: 'GET',
      retries: 3
    })
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create schedule for ${destination}: ${res.status} - ${body}`);
  }
  return res.json();
}

async function main() {
  console.log('🔁 Running full QStash setup for Plokymarket (idempotent)');
  try {
    const existing = await listSchedules();

    for (const s of SCHEDULES) {
      console.log(`\n---\nScheduling: ${s.name}`);
      const found = existing.find(x => x.destination === s.destination);
      if (found) {
        console.log(`  Found existing schedule ${found.scheduleId} — deleting`);
        await deleteSchedule(found.scheduleId);
        console.log('  ✅ Removed');
      }

      const created = await createSchedule(s.destination, s.cron);
      console.log(`  ✅ Created scheduleId=${created.scheduleId} cron='${s.cron}' -> ${s.destination}`);
    }

    console.log('\n🎉 All schedules created successfully. Verify in Upstash Console: https://console.upstash.com/qstash/schedules');
  } catch (err) {
    console.error('\n❌ Error:', err.message || err);
    process.exit(1);
  }
}

main();
