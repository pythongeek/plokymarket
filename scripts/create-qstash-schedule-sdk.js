/**
 * Create QStash Schedule using Upstash SDK
 */

const { Client } = require('@upstash/qstash');

const QSTASH_TOKEN = process.env.QSTASH_TOKEN || 'eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0=';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app';

async function createSchedule() {
  console.log('Creating QStash schedule...\n');
  
  try {
    const client = new Client({ token: QSTASH_TOKEN });
    
    const schedule = await client.schedules.create({
      destination: `${APP_URL}/api/cron/batch-markets`,
      cron: '0,15,30,45 * * * *',
      method: 'GET',
      retries: 3,
    });
    
    console.log('✅ Schedule created successfully!');
    console.log('Schedule ID:', schedule.id);
    console.log('Next run:', new Date(Date.now() + 15 * 60 * 1000).toLocaleString());
    
  } catch (error) {
    console.error('❌ Failed to create schedule:', error.message);
    console.log('\nThe token you have may not be a valid QStash token.');
    console.log('Please create the schedule manually at:');
    console.log('https://console.upstash.com/qstash/schedules');
  }
}

createSchedule();
