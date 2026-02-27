/**
 * Setup Phase 2 QStash Workflows
 * 
 * This script sets up the following QStash schedules:
 * - Price Snapshot: Every hour (0 * * * *)
 * - Market Close Check: Every 15 minutes (*/15 * * * *)
 * - Cleanup: Daily at midnight (0 0 * * *)
 * 
 * Run: node scripts/setup-phase2-workflows.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io/v2/publish/';
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://your-app.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is required');
  console.log('Set it with: $env:QSTASH_TOKEN="your_token" (PowerShell)');
  console.log('Or: export QSTASH_TOKEN="your_token" (Bash)');
  process.exit(1);
}

const workflows = [
  {
    name: 'Price Snapshot',
    endpoint: '/api/upstash-workflow/price-snapshot',
    schedule: '0 * * * *', // Every hour
    description: 'Records hourly price snapshots for all active markets',
  },
  {
    name: 'Market Close Check',
    endpoint: '/api/upstash-workflow/market-close-check',
    schedule: '*/15 * * * *', // Every 15 minutes
    description: 'Checks for markets closing in <1 hour and sends notifications',
  },
  {
    name: 'Daily Cleanup',
    endpoint: '/api/upstash-workflow/cleanup',
    schedule: '0 0 * * *', // Daily at midnight
    description: 'Cleans up expired batches and old notifications',
  },
];

async function setupWorkflow(workflow) {
  const url = `${DEPLOYMENT_URL}${workflow.endpoint}`;
  
  console.log(`\n📋 Setting up: ${workflow.name}`);
  console.log(`   Endpoint: ${url}`);
  console.log(`   Schedule: ${workflow.schedule}`);
  console.log(`   Description: ${workflow.description}`);

  try {
    const response = await fetch(`${QSTASH_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Cron': workflow.schedule,
      },
      body: JSON.stringify({
        step: workflow.step || 'init',
        setup: true,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ Success! Schedule ID: ${result.scheduleId || 'N/A'}`);
      return { success: true, name: workflow.name, result };
    } else {
      const error = await response.text();
      console.log(`   ❌ Failed: ${error}`);
      return { success: false, name: workflow.name, error };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, name: workflow.name, error: error.message };
  }
}

async function listExistingSchedules() {
  console.log('\n📊 Checking existing schedules...');
  
  try {
    const response = await fetch('https://qstash.upstash.io/v2/schedules', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
      },
    });

    if (response.ok) {
      const schedules = await response.json();
      console.log(`   Found ${schedules.length} existing schedule(s)`);
      
      // Filter for our workflows
      const ourSchedules = schedules.filter(s => 
        s.destination.includes('/api/upstash-workflow/')
      );
      
      if (ourSchedules.length > 0) {
        console.log('   Our workflows:');
        ourSchedules.forEach(s => {
          console.log(`   - ${s.destination} (${s.cron})`);
        });
      }
      
      return schedules;
    } else {
      console.log('   ⚠️ Could not fetch existing schedules');
      return [];
    }
  } catch (error) {
    console.log(`   ⚠️ Error fetching schedules: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Plokymarket Phase 2 - QStash Workflow Setup       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nDeployment URL: ${DEPLOYMENT_URL}`);
  console.log(`QStash URL: ${QSTASH_URL}`);

  // List existing schedules
  await listExistingSchedules();

  // Setup each workflow
  console.log('\n🚀 Setting up workflows...\n');
  
  const results = [];
  for (const workflow of workflows) {
    const result = await setupWorkflow(workflow);
    results.push(result);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                      Summary                           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}/${workflows.length}`);
  successful.forEach(r => console.log(`   - ${r.name}`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  console.log('\n📚 Next Steps:');
  console.log('   1. Verify workflows are scheduled in Upstash dashboard');
  console.log('   2. Check /api/upstash-workflow/*/health endpoints');
  console.log('   3. Monitor logs for any issues');
  console.log('\n🔗 Useful URLs:');
  console.log(`   - Price Snapshot: ${DEPLOYMENT_URL}/api/upstash-workflow/price-snapshot`);
  console.log(`   - Market Close Check: ${DEPLOYMENT_URL}/api/upstash-workflow/market-close-check`);
  console.log(`   - Cleanup: ${DEPLOYMENT_URL}/api/upstash-workflow/cleanup`);
  
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
