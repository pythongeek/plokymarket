/**
 * Setup QStash Schedule for Tick Adjustment Cron
 * Runs every hour by default (recommended)
 * Usage: node scripts/setup-tick-adjustment-cron.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://plokymarket.vercel.app';

async function setupTickAdjustmentCron() {
  if (!QSTASH_TOKEN) {
    console.error('❌ Error: QSTASH_TOKEN environment variable is not set');
    process.exit(1);
  }

  const webhookUrl = `${APP_URL}/api/cron/tick-adjustment`;
  const cron = '0 * * * *'; // Every hour

  console.log('🔧 Setting up Tick Adjustment Cron Job...');
  console.log(`   Webhook: ${webhookUrl}`);
  console.log(`   Cron: ${cron} (hourly)`);
  console.log('');

  try {
    // List existing schedules
    const listResponse = await fetch(`${QSTASH_URL}/v2/schedules`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
    });

    if (!listResponse.ok) throw new Error(`Failed to list schedules (${listResponse.status})`);
    const schedules = await listResponse.json();

    const existing = schedules.find(s => s.destination === webhookUrl);
    if (existing) {
      console.log(`   Found existing schedule: ${existing.scheduleId} — deleting`);
      const del = await fetch(`${QSTASH_URL}/v2/schedules/${existing.scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
      });
      if (!del.ok) throw new Error(`Failed to delete existing schedule (${del.status})`);
      console.log('   ✅ Old schedule removed');
    }

    // Create schedule (use JSON-body endpoint)
    const createResponse = await fetch(`${QSTASH_URL}/v2/schedules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination: webhookUrl,
        cron: cron,
        method: 'GET',
        retries: 3
      })
    });

    if (!createResponse.ok) {
      const body = await createResponse.text();
      throw new Error(`Failed to create schedule: ${createResponse.status} - ${body}`);
    }

    const result = await createResponse.json();
    console.log('\n✅ Tick Adjustment Cron created');
    console.log(`  Schedule ID: ${result.scheduleId}`);
    console.log(`  Destination: ${webhookUrl}`);
    console.log('');
    console.log('To verify: https://console.upstash.com/qstash/schedules');

  } catch (err) {
    console.error('\n❌ Error:', err.message || err);
    process.exit(1);
  }
}

setupTickAdjustmentCron();
