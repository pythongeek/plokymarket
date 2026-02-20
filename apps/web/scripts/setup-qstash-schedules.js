#!/usr/bin/env node
/**
 * QStash Schedule Setup Script
 * 
 * This script sets up automated workflow schedules using Upstash QStash SDK.
 * Run with: node scripts/setup-qstash-schedules.js
 * 
 * Required environment variables:
 * - QSTASH_TOKEN
 * - NEXT_PUBLIC_APP_URL (your production URL)
 */

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not load .env.local file:', error.message);
  }
}

// Load from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
loadEnvFile(envPath);

const { Client } = require('@upstash/qstash');

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
// Use production URL - detected from existing schedules or env
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://polymarket-bangladesh.vercel.app';

if (!QSTASH_TOKEN) {
  console.error('❌ Error: QSTASH_TOKEN environment variable is required');
  console.error('Please set it in your .env.local file or environment');
  process.exit(1);
}

// Initialize QStash client
const client = new Client({ token: QSTASH_TOKEN });

// Consolidated Schedule Configurations (4 core automated workflows)
const schedules = [
  {
    name: 'Combined Market Data',
    description: 'Fetch crypto and sports market data (consolidated from execute-crypto + execute-sports)',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/combined-market-data',
    method: 'POST',
    retries: 3
  },
  {
    name: 'Combined Analytics',
    description: 'Run analytics, tick adjustment, and exchange rate updates (consolidated)',
    cron: '0 * * * *',
    endpoint: '/api/workflows/combined-analytics',
    method: 'POST',
    retries: 3
  },
  {
    name: 'Combined Daily Operations',
    description: 'Daily leaderboard update, AI topics generation, and cleanup (consolidated)',
    cron: '0 0 * * *',
    timezone: 'Asia/Dhaka',
    endpoint: '/api/workflows/combined-daily-ops',
    method: 'POST',
    retries: 3
  },
  {
    name: 'Check Escalations',
    description: 'Check support escalations every 5 minutes',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/check-escalations',
    method: 'POST',
    retries: 2
  }
];

// Manual Workflows (can be triggered from admin panel)
const manualWorkflows = [
  { name: 'Dispute Workflow', endpoint: '/api/dispute-workflow', description: 'Process pending disputes' },
  { name: 'News Market Data', endpoint: '/api/workflows/execute-news', description: 'Fetch news market data' },
  { name: 'Batch Markets', endpoint: '/api/cron/batch-markets', description: 'Batch process markets' },
  { name: 'Daily Report', endpoint: '/api/workflows/daily-report', description: 'Generate daily report' },
  { name: 'Auto-Verification', endpoint: '/api/workflows/auto-verify', description: 'Check pending deposits' },
  { name: 'Combined Market Data', endpoint: '/api/workflows/combined-market-data', description: 'Manual run of combined market data' },
  { name: 'Combined Analytics', endpoint: '/api/workflows/combined-analytics', description: 'Manual run of combined analytics' },
  { name: 'Combined Daily Ops', endpoint: '/api/workflows/combined-daily-ops', description: 'Manual run of daily operations' }
];

async function createSchedule(schedule) {
  const destinationUrl = `${APP_URL}${schedule.endpoint}`;
  
  console.log(`   Destination: ${destinationUrl}`);
  
  try {
    const result = await client.schedules.create({
      destination: destinationUrl,
      cron: schedule.cron,
      method: schedule.method,
      retries: schedule.retries
    });
    
    return { success: true, scheduleId: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function listExistingSchedules() {
  try {
    const schedules = await client.schedules.list();
    return schedules;
  } catch (error) {
    console.error('Failed to list schedules:', error.message);
    return [];
  }
}

async function deleteSchedule(scheduleId) {
  try {
    await client.schedules.delete(scheduleId);
    return true;
  } catch (error) {
    console.error(`Failed to delete schedule ${scheduleId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 QStash Schedule Setup\n');
  console.log(`📍 App URL: ${APP_URL}`);
  console.log(`🔧 Using Upstash QStash SDK\n`);

  // Check for existing schedules
  console.log('📋 Checking existing schedules...');
  const existingSchedules = await listExistingSchedules();
  
  if (existingSchedules.length > 0) {
    console.log(`Found ${existingSchedules.length} existing schedule(s):`);
    existingSchedules.forEach(s => {
      console.log(`  - ${s.scheduleId}: ${s.destination}`);
    });
    
    // Ask if user wants to clean up (in non-interactive mode, we'll skip)
    console.log('\n⚠️  Existing schedules will be preserved. New schedules will be added.\n');
  }

  console.log('⏰ Creating new schedules...\n');

  const results = [];
  
  for (const schedule of schedules) {
    console.log(`📌 ${schedule.name}`);
    console.log(`   Endpoint: ${schedule.endpoint}`);
    console.log(`   Cron: ${schedule.cron}`);
    if (schedule.timezone) console.log(`   Timezone: ${schedule.timezone}`);
    
    const result = await createSchedule(schedule);
    
    if (result.success) {
      console.log(`   ✅ Created (ID: ${result.scheduleId})\n`);
      results.push({ ...schedule, status: 'created', scheduleId: result.scheduleId });
    } else {
      console.log(`   ❌ Failed: ${result.error}\n`);
      results.push({ ...schedule, status: 'failed', error: result.error });
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Created: ${results.filter(r => r.status === 'created').length}`);
  console.log(`   Failed: ${results.filter(r => r.status === 'failed').length}`);

  // Save results to file
  const fs = require('fs');
  const output = {
    timestamp: new Date().toISOString(),
    appUrl: APP_URL,
    qstashUrl: QSTASH_URL,
    schedules: results
  };
  
  fs.writeFileSync(
    'qstash-schedules.json',
    JSON.stringify(output, null, 2)
  );
  
  console.log('\n📝 Results saved to qstash-schedules.json');
  console.log('\n✨ Done!');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createSchedule, listExistingSchedules, deleteSchedule };
