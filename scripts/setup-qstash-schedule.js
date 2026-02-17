/**
 * QStash Schedule Setup Script
 * Creates a recurring schedule for the batch-markets cron job
 * 
 * Usage: node setup-qstash-schedule.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is required');
  console.log('\nSet it with:');
  console.log('  $env:QSTASH_TOKEN="your_token_here"  (PowerShell)');
  console.log('  export QSTASH_TOKEN=your_token_here   (Linux/Mac)');
  process.exit(1);
}

async function createSchedule() {
  const scheduleUrl = 'https://qstash.upstash.io/v2/schedules';
  
  // Cron: Every 15 minutes (free tier friendly)
  // For more frequent: */5 * * * * (every 5 min) - but may exceed free tier
  const cronExpression = '*/15 * * * *';
  
  const targetUrl = `${APP_URL}/api/cron/batch-markets`;
  
  console.log('🔄 Setting up QStash Schedule...\n');
  console.log('Configuration:');
  console.log(`  Target URL: ${targetUrl}`);
  console.log(`  Schedule: ${cronExpression} (Every 15 minutes)`);
  console.log(`  Method: GET`);
  console.log('');
  
  try {
    const response = await fetch(scheduleUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Forward-upstash-signature': QSTASH_CURRENT_SIGNING_KEY || 'dev-signature'
      },
      body: JSON.stringify({
        destination: targetUrl,
        cron: cronExpression,
        method: 'GET',
        retries: 3,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Schedule created successfully!\n');
    console.log('Schedule Details:');
    console.log(`  Schedule ID: ${result.scheduleId}`);
    console.log(`  Next Run: ${new Date(Date.now() + 15 * 60 * 1000).toLocaleString()}`);
    console.log(`  Runs per day: ~96`);
    console.log('');
    console.log('To verify, check Upstash Console:');
    console.log('  https://console.upstash.com/qstash/schedules');
    console.log('');
    console.log('To delete this schedule:');
    console.log(`  curl -X DELETE https://qstash.upstash.io/v2/schedules/${result.scheduleId} \\\n    -H "Authorization: Bearer ${QSTASH_TOKEN}"`);
    
  } catch (error) {
    console.error('❌ Failed to create schedule:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Verify QSTASH_TOKEN is correct');
    console.log('  2. Check if APP_URL is accessible');
    console.log('  3. Ensure you have not exceeded free tier limits');
    process.exit(1);
  }
}

// List existing schedules
async function listSchedules() {
  console.log('\n📋 Checking existing schedules...\n');
  
  try {
    const response = await fetch('https://qstash.upstash.io/v2/schedules', {
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const schedules = await response.json();
    
    if (schedules.length === 0) {
      console.log('No schedules found.\n');
      return;
    }
    
    console.log(`Found ${schedules.length} schedule(s):\n`);
    schedules.forEach((schedule, index) => {
      console.log(`${index + 1}. Schedule ID: ${schedule.scheduleId}`);
      console.log(`   Destination: ${schedule.destination}`);
      console.log(`   Cron: ${schedule.cron}`);
      console.log(`   Created: ${new Date(schedule.createdAt).toLocaleString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Failed to list schedules:', error.message);
  }
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Upstash QStash Schedule Setup for Plokymarket     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  await listSchedules();
  await createSchedule();
}

main();
