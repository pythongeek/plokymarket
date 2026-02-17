/**
 * Setup QStash Schedules for Advanced Workflow Verification System
 * 
 * Usage: 
 *   Set QSTASH_TOKEN environment variable first:
 *   Windows PowerShell: $env:QSTASH_TOKEN="your_token_here"
 *   Windows CMD: set QSTASH_TOKEN=your_token_here
 *   Linux/Mac: export QSTASH_TOKEN=your_token_here
 *   
 *   Then run: node scripts/setup-workflows-manual.js
 */

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const APP_URL = 'https://polymarket-bangladesh.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is not set');
  console.error('');
  console.error('To set it:');
  console.error('  PowerShell: $env:QSTASH_TOKEN="your_token_here"');
  console.error('  CMD:        set QSTASH_TOKEN=your_token_here');
  console.error('  Bash:       export QSTASH_TOKEN=your_token_here');
  console.error('');
  console.error('Get your token from: https://console.upstash.com/qstash');
  process.exit(1);
}

const WORKFLOWS = [
  {
    name: 'workflow-verification-crypto',
    description: 'Verify crypto events every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/execute-crypto'
  },
  {
    name: 'workflow-verification-sports',
    description: 'Verify sports events every 10 minutes',
    cron: '*/10 * * * *',
    endpoint: '/api/workflows/execute-sports'
  },
  {
    name: 'workflow-verification-news',
    description: 'Verify news events every 15 minutes',
    cron: '*/15 * * * *',
    endpoint: '/api/workflows/execute-news'
  },
  {
    name: 'workflow-escalation-check',
    description: 'Check for escalated events every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/check-escalations'
  },
  {
    name: 'workflow-analytics-daily',
    description: 'Generate daily workflow analytics',
    cron: '0 0 * * *',
    endpoint: '/api/workflows/analytics/daily'
  }
];

async function listSchedules() {
  try {
    const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
      headers: { 'Authorization': `Bearer ${QSTASH_TOKEN}` }
    });
    
    if (response.status === 404) {
      // No schedules exist yet
      return [];
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list schedules: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.log('   ⚠️  Could not list existing schedules, continuing...');
    return [];
  }
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
  const destinationUrl = `${APP_URL}${workflow.endpoint}`;
  console.log(`   📝 Creating ${workflow.name}...`);
  console.log(`      Destination: ${destinationUrl}`);
  
  const response = await fetch(`${QSTASH_URL}/v2/schedules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      destination: destinationUrl,
      cron: workflow.cron,
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
  console.log(`   ✅ Created: ${workflow.name}`);
  console.log(`      Schedule ID: ${result.scheduleId}`);
  console.log(`      Cron: ${workflow.cron}`);
  console.log(`      Endpoint: ${APP_URL}${workflow.endpoint}`);
  return result;
}

async function setupWorkflows() {
  console.log('🔧 Setting up Advanced Workflow Verification QStash Schedules\n');
  console.log(`   App URL: ${APP_URL}\n`);
  
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
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed to create ${workflow.name}:`, error.message);
        console.log('');
      }
    }
    
    console.log('✨ Setup complete!');
    console.log('');
    console.log('📊 Verify in Upstash Console:');
    console.log('   https://console.upstash.com/qstash/schedules');
    console.log('');
    console.log('📚 Created schedules:');
    WORKFLOWS.forEach(w => {
      console.log(`   • ${w.name}`);
      console.log(`     ${w.cron} → ${w.endpoint}`);
    });
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupWorkflows();
