/**
 * Setup QStash Schedules for Advanced Workflow Verification System
 * 
 * This script creates scheduled jobs that:
 * 1. Run workflow verification on events approaching deadline
 * 2. Check for pending escalations
 * 3. Generate workflow analytics reports
 * 
 * Usage: node scripts/setup-workflow-verification.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
// Use production URL since we're deploying to Vercel
const APP_URL = 'https://polymarket-bangladesh.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is not set');
  console.error('   Get your token from: https://console.upstash.com/qstash');
  process.exit(1);
}

const WORKFLOWS = [
  {
    name: 'workflow-verification-crypto',
    description: 'Verify crypto events every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/execute-crypto',
    body: { category: 'crypto' }
  },
  {
    name: 'workflow-verification-sports',
    description: 'Verify sports events every 10 minutes',
    cron: '*/10 * * * *',
    endpoint: '/api/workflows/execute-sports',
    body: { category: 'sports' }
  },
  {
    name: 'workflow-verification-news',
    description: 'Verify news events every 15 minutes',
    cron: '*/15 * * * *',
    endpoint: '/api/workflows/execute-news',
    body: { category: 'news' }
  },
  {
    name: 'workflow-escalation-check',
    description: 'Check for escalated events every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/check-escalations',
    body: {}
  },
  {
    name: 'workflow-analytics-daily',
    description: 'Generate daily workflow analytics',
    cron: '0 0 * * *',
    endpoint: '/api/workflows/analytics/daily',
    body: {}
  }
];

async function listSchedules() {
  const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
    headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to list schedules: ${response.status}`);
  }
  
  return await response.json();
}

async function deleteSchedule(scheduleId) {
  const response = await fetch(`${QSTASH_URL}/v2/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete schedule ${scheduleId}: ${response.status}`);
  }
  
  console.log(`   🗑️  Deleted existing schedule: ${scheduleId}`);
}

async function createSchedule(workflow) {
  const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      destination: `${APP_URL}${workflow.endpoint}`,
      cron: workflow.cron,
      body: JSON.stringify(workflow.body),
      headers: {
        'Content-Type': 'application/json',
        'X-Workflow-Name': workflow.name
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create schedule: ${response.status} - ${error}`);
  }
  
  const result = await response.json();
  console.log(`   ✅ Created: ${workflow.name} (${workflow.cron})`);
  console.log(`      Schedule ID: ${result.scheduleId}`);
  console.log(`      Endpoint: ${workflow.endpoint}`);
  return result;
}

async function setupWorkflows() {
  console.log('🔧 Setting up Advanced Workflow Verification QStash Schedules\n');
  
  try {
    // List existing schedules
    console.log('📋 Checking existing schedules...');
    const existingSchedules = await listSchedules();
    
    // Delete existing workflow schedules
    for (const schedule of existingSchedules) {
      const name = schedule.headers?.['X-Workflow-Name'] || '';
      if (name.startsWith('workflow-')) {
        await deleteSchedule(schedule.scheduleId);
      }
    }
    
    console.log('\n🚀 Creating new workflow schedules...\n');
    
    // Create new schedules
    for (const workflow of WORKFLOWS) {
      try {
        await createSchedule(workflow);
      } catch (error) {
        console.error(`   ❌ Failed to create ${workflow.name}:`, error.message);
      }
    }
    
    console.log('\n✨ Setup complete!');
    console.log('📊 Verify in Upstash Console: https://console.upstash.com/qstash/schedules');
    console.log('\n📚 Workflow endpoints:');
    WORKFLOWS.forEach(w => {
      console.log(`   • ${w.name}: ${w.cron}`);
    });
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupWorkflows();
