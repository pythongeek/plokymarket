/**
 * Setup QStash Schedule for Daily Topics Generation
 * Run this script to initialize the daily cron job
 * 
 * Usage: node scripts/setup-daily-topics-cron.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://plokymarket.vercel.app';

async function setupDailyTopicsCron() {
  if (!QSTASH_TOKEN) {
    console.error('❌ Error: QSTASH_TOKEN environment variable is not set');
    console.log('\nPlease set the following environment variables:');
    console.log('  - QSTASH_TOKEN');
    console.log('  - NEXT_PUBLIC_APP_URL (optional)');
    process.exit(1);
  }

  const webhookUrl = `${APP_URL}/api/cron/daily-topics`;
  const cron = '0 6 * * *'; // Every day at 6 AM

  console.log('🔧 Setting up Daily Topics Cron Job...');
  console.log(`   App URL: ${APP_URL}`);
  console.log(`   Webhook: ${webhookUrl}`);
  console.log(`   Cron: ${cron} (daily at 6:00 AM)`);
  console.log('');

  try {
    // 1. List existing schedules
    console.log('📋 Checking existing schedules...');
    const listResponse = await fetch(`${QSTASH_URL}/v2/schedules`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list schedules: ${listResponse.status}`);
    }

    const schedules = await listResponse.json();
    const existingSchedule = schedules.find(s => s.destination === webhookUrl);

    if (existingSchedule) {
      console.log(`   Found existing schedule: ${existingSchedule.scheduleId}`);
      console.log('   Deleting old schedule...');
      
      const deleteResponse = await fetch(`${QSTASH_URL}/v2/schedules/${existingSchedule.scheduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete schedule: ${deleteResponse.status}`);
      }
      
      console.log('   ✅ Old schedule deleted');
    }

    // 2. Create new schedule
    console.log('');
    console.log('📝 Creating new schedule...');
    
    const createResponse = await fetch(`${QSTASH_URL}/v2/schedules/${encodeURIComponent(webhookUrl)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Cron': cron,
        'Upstash-Retries': '3'
      }
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create schedule: ${createResponse.status} - ${error}`);
    }

    const newSchedule = await createResponse.json();
    
    console.log('');
    console.log('✅ Daily Topics Cron Job Created Successfully!');
    console.log('');
    console.log('Schedule Details:');
    console.log(`  Schedule ID: ${newSchedule.scheduleId}`);
    console.log(`  Destination: ${webhookUrl}`);
    console.log(`  Cron: ${cron} (daily at 6:00 AM)`);
    console.log(`  Retries: 3`);
    console.log('');
    console.log('The cron job will run daily to generate new AI topics.');
    console.log('');
    console.log('To verify the schedule is working:');
    console.log(`  curl ${webhookUrl}`);
    console.log('');
    console.log('To manually trigger topic generation:');
    console.log(`  curl -X POST ${webhookUrl} -H "Authorization: Bearer YOUR_TOKEN"`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDailyTopicsCron();
