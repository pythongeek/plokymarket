/**
 * Setup QStash Schedule for Market Resolution
 * Run this script to initialize the cron job
 * 
 * Usage: node scripts/setup-qstash.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://plokymarket.vercel.app';

async function setupQStash() {
  if (!QSTASH_TOKEN) {
    console.error('❌ Error: QSTASH_TOKEN environment variable is not set');
    console.log('\nPlease set the following environment variables:');
    console.log('  - QSTASH_TOKEN');
    console.log('  - NEXT_PUBLIC_APP_URL (optional, defaults to https://plokymarket.vercel.app)');
    process.exit(1);
  }

  const webhookUrl = `${APP_URL}/api/cron/check-markets`;
  const cron = '0 * * * *'; // Every hour

  console.log('🔧 Setting up QStash Schedule...');
  console.log(`   App URL: ${APP_URL}`);
  console.log(`   Webhook: ${webhookUrl}`);
  console.log(`   Cron: ${cron} (every hour)`);
  console.log('');

  try {
    // 1. List existing schedules
    console.log('📋 Checking existing schedules...');
    const listResponse = await fetch(`${QSTASH_URL}/v2/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
      },
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
        headers: {
          'Authorization': `Bearer ${QSTASH_TOKEN}`,
        },
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete schedule: ${deleteResponse.status}`);
      }
      
      console.log('   ✅ Old schedule deleted');
    } else {
      console.log('   No existing schedule found');
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
        'Upstash-Retries': '3',
      },
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create schedule: ${createResponse.status} - ${error}`);
    }

    const newSchedule = await createResponse.json();
    
    console.log('');
    console.log('✅ QStash Schedule Created Successfully!');
    console.log('');
    console.log('Schedule Details:');
    console.log(`  Schedule ID: ${newSchedule.scheduleId}`);
    console.log(`  Destination: ${webhookUrl}`);
    console.log(`  Cron: ${cron}`);
    console.log(`  Retries: 3`);
    console.log('');
    console.log('The cron job will run every hour to check for markets ready for resolution.');
    console.log('');
    console.log('To verify the schedule is working:');
    console.log(`  curl ${webhookUrl}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run setup
setupQStash();
