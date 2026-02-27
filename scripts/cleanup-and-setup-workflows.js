/**
 * Cleanup and Setup QStash Workflows
 * 
 * This script:
 * 1. Lists existing schedules
 * 2. Removes duplicate Phase 2 schedules (if any)
 * 3. Keeps only the 5 core group workflows
 * 
 * The 5 core workflows are:
 * - group-daily (midnight daily)
 * - group-hourly (every hour)
 * - group-fast (every 5 minutes)
 * - group-medium (every 10 minutes)
 * - group-quarterly (every 6 hours)
 * 
 * Phase 2 tasks are now MERGED into these workflows:
 * - Price Snapshot goes to group-hourly
 * - Market Close Check goes to group-fast
 * - Daily Cleanup goes to group-daily
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io/v2/';
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://polymarket-bangladesh.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is required');
  process.exit(1);
}

// The 5 core workflows that should exist
const CORE_WORKFLOWS = [
  { name: 'group-daily', schedule: '0 0 * * *', endpoint: '/api/workflows/group-daily' },
  { name: 'group-hourly', schedule: '0 * * * *', endpoint: '/api/workflows/group-hourly' },
  { name: 'group-fast', schedule: '0/5 * * * *', endpoint: '/api/workflows/group-fast' },
  { name: 'group-medium', schedule: '0/10 * * * *', endpoint: '/api/workflows/group-medium' },
  { name: 'group-quarterly', schedule: '0 0/6 * * *', endpoint: '/api/workflows/group-quarterly' },
];

// Phase 2 workflows that should be REMOVED (now merged into core workflows)
const DEPRECATED_WORKFLOWS = [
  '/api/upstash-workflow/price-snapshot',
  '/api/upstash-workflow/market-close-check',
  '/api/upstash-workflow/cleanup',
];

async function listSchedules() {
  console.log('\n📊 Fetching existing schedules...\n');
  
  try {
    const response = await fetch(`${QSTASH_URL}schedules`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.status}`);
    }

    const schedules = await response.json();
    console.log(`   Found ${schedules.length} schedule(s)\n`);
    
    return schedules;
  } catch (error) {
    console.error('   ❌ Error fetching schedules:', error.message);
    return [];
  }
}

async function deleteSchedule(scheduleId) {
  try {
    const response = await fetch(`${QSTASH_URL}schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` },
    });

    return response.ok;
  } catch (error) {
    console.error(`   ❌ Error deleting schedule ${scheduleId}:`, error.message);
    return false;
  }
}

async function createSchedule(workflow) {
  const url = `${DEPLOYMENT_URL}${workflow.endpoint}`;
  
  try {
    const response = await fetch(`${QSTASH_URL}publish/${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Cron': workflow.schedule,
      },
      body: JSON.stringify({ init: true }),
    });

    return response.ok;
  } catch (error) {
    console.error(`   ❌ Error creating schedule for ${workflow.name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     QStash Workflow Cleanup & Setup (Phase 2)        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nDeployment URL: ${DEPLOYMENT_URL}`);
  console.log(`QStash URL: ${QSTASH_URL}`);

  const schedules = await listSchedules();
  
  // Categorize schedules
  const coreSchedules = [];
  const deprecatedSchedules = [];
  const otherSchedules = [];
  
  for (const schedule of schedules) {
    const isCore = CORE_WORKFLOWS.some(w => schedule.destination.includes(w.endpoint));
    const isDeprecated = DEPRECATED_WORKFLOWS.some(ep => schedule.destination.includes(ep));
    
    if (isCore) {
      coreSchedules.push(schedule);
    } else if (isDeprecated) {
      deprecatedSchedules.push(schedule);
    } else {
      otherSchedules.push(schedule);
    }
  }

  console.log('📋 Schedule Analysis:');
  console.log(`   ✅ Core workflows: ${coreSchedules.length}`);
  console.log(`   ⚠️  Deprecated (to remove): ${deprecatedSchedules.length}`);
  console.log(`   📦 Other: ${otherSchedules.length}\n`);

  // Remove deprecated schedules
  if (deprecatedSchedules.length > 0) {
    console.log('🗑️  Removing deprecated Phase 2 schedules...\n');
    for (const schedule of deprecatedSchedules) {
      console.log(`   Removing: ${schedule.destination}`);
      const deleted = await deleteSchedule(schedule.scheduleId);
      console.log(`   ${deleted ? '✅ Deleted' : '❌ Failed'}\n`);
    }
  }

  // Check core workflows
  console.log('🔍 Checking core workflows...\n');
  for (const workflow of CORE_WORKFLOWS) {
    const exists = coreSchedules.some(s => s.destination.includes(workflow.endpoint));
    if (exists) {
      console.log(`   ✅ ${workflow.name} - exists`);
    } else {
      console.log(`   ⚠️  ${workflow.name} - missing, creating...`);
      const created = await createSchedule(workflow);
      console.log(`   ${created ? '✅ Created' : '❌ Failed'}`);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                      Summary                           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('\n✅ Phase 2 workflows are now MERGED into existing groups:');
  console.log('   • Price Snapshot → group-hourly');
  console.log('   • Market Close Check → group-fast');
  console.log('   • Daily Cleanup → group-daily');
  console.log('\n📊 Final Schedule Count: 5 core workflows');
  console.log('   • group-daily (midnight)');
  console.log('   • group-hourly (every hour)');
  console.log('   • group-fast (every 5 min)');
  console.log('   • group-medium (every 10 min)');
  console.log('   • group-quarterly (every 6 hours)');
  console.log('\n🔗 All workflows available at:');
  console.log(`   ${DEPLOYMENT_URL}/api/workflows/{name}`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
