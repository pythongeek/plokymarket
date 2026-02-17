/**
 * Setup Daily AI Topics Cron Job with Upstash QStash
 * Runs every day at 6:00 AM Bangladesh Time (UTC+6)
 */

const { Client } = require('@upstash/qstash');

const QSTASH_TOKEN = 'eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0=';

// Production URL
const PRODUCTION_URL = 'https://polymarket-bangladesh.vercel.app';

async function setupDailyAICron() {
  const client = new Client({ token: QSTASH_TOKEN });
  
  console.log('Setting up Daily AI Topics Cron Job...\n');
  
  try {
    // List existing schedules
    const existingSchedules = await client.schedules.list();
    console.log(`Found ${existingSchedules.length} existing schedules`);
    
    // Remove existing daily-ai-topics schedules
    for (const schedule of existingSchedules) {
      if (schedule.destination?.includes('daily-ai-topics')) {
        console.log(`Removing existing schedule: ${schedule.scheduleId}`);
        await client.schedules.delete(schedule.scheduleId);
      }
    }
    
    // Create new schedule - 6:00 AM Bangladesh Time (00:00 UTC)
    const schedule = await client.schedules.create({
      destination: `${PRODUCTION_URL}/api/cron/daily-ai-topics`,
      cron: '0 0 * * *', // 00:00 UTC = 6:00 AM Bangladesh Time
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'default-secret-change-in-production'
      },
      retries: 3,
      backoff: {
        type: 'exponential',
        delay: 60 // 60 seconds initial delay
      }
    });
    
    console.log('\n✅ Daily AI Topics Cron Job Created!');
    console.log('Schedule ID:', schedule.scheduleId);
    console.log('Cron:', '0 0 * * * (6:00 AM Bangladesh Time)');
    console.log('Destination:', `${PRODUCTION_URL}/api/cron/daily-ai-topics`);
    console.log('Retries:', 3);
    
    // Test the endpoint
    console.log('\n🧪 Testing endpoint...');
    const testResponse = await fetch(`${PRODUCTION_URL}/api/cron/daily-ai-topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || 'default-secret-change-in-production'
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Endpoint test successful');
    } else {
      console.log('⚠️ Endpoint test failed:', testResponse.status);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run setup
setupDailyAICron();
