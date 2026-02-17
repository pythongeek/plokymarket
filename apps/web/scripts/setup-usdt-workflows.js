#!/usr/bin/env node
/**
 * USDT Management System - QStash Workflow Setup
 * Run this script after deployment to configure scheduled workflows
 * 
 * Usage: node scripts/setup-usdt-workflows.js
 */

const { Client } = require('@upstash/qstash');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
  'http://localhost:3000');

async function setupWorkflows() {
  console.log('🚀 Setting up USDT Management Workflows...\n');
  
  // Check environment
  if (!process.env.QSTASH_TOKEN) {
    console.error('❌ QSTASH_TOKEN environment variable is required');
    console.log('Set it with: vercel env add QSTASH_TOKEN');
    process.exit(1);
  }
  
  const client = new Client({ token: process.env.QSTASH_TOKEN });
  
  console.log(`📍 Base URL: ${BASE_URL}\n`);
  
  try {
    // 1. Daily Report Schedule (9 AM Bangladesh Time)
    console.log('📊 Setting up Daily Report workflow...');
    try {
      const dailyReport = await client.schedules.create({
        destination: `${BASE_URL}/api/workflows/daily-report`,
        cron: '0 9 * * *',
        timezone: 'Asia/Dhaka',
        retries: 3,
      });
      console.log(`✅ Daily Report scheduled: ${dailyReport.scheduleId}`);
    } catch (error) {
      console.error(`❌ Daily Report failed: ${error.message}`);
    }
    
    // 2. Exchange Rate Update (Every 5 minutes)
    console.log('\n💱 Setting up Exchange Rate Update workflow...');
    try {
      const exchangeRate = await client.schedules.create({
        destination: `${BASE_URL}/api/workflows/exchange-rate`,
        cron: '*/5 * * * *',
        retries: 3,
      });
      console.log(`✅ Exchange Rate Update scheduled: ${exchangeRate.scheduleId}`);
    } catch (error) {
      console.error(`❌ Exchange Rate Update failed: ${error.message}`);
    }
    
    // 3. Auto-Verification Check (Every 10 minutes)
    console.log('\n🔍 Setting up Auto-Verification workflow...');
    try {
      const autoVerify = await client.schedules.create({
        destination: `${BASE_URL}/api/workflows/auto-verify`,
        cron: '*/10 * * * *',
        retries: 3,
      });
      console.log(`✅ Auto-Verification scheduled: ${autoVerify.scheduleId}`);
    } catch (error) {
      console.error(`❌ Auto-Verification failed: ${error.message}`);
    }
    
    // 4. Expired Deposit Cleanup (Daily at midnight BD time)
    console.log('\n🧹 Setting up Expired Deposit Cleanup workflow...');
    try {
      const cleanup = await client.schedules.create({
        destination: `${BASE_URL}/api/workflows/cleanup-expired`,
        cron: '0 0 * * *',
        timezone: 'Asia/Dhaka',
        retries: 3,
      });
      console.log(`✅ Expired Deposit Cleanup scheduled: ${cleanup.scheduleId}`);
    } catch (error) {
      console.error(`❌ Expired Deposit Cleanup failed: ${error.message}`);
    }
    
    // List all schedules
    console.log('\n📋 Listing all schedules...');
    const schedules = await client.schedules.list();
    console.log(`Total schedules: ${schedules.length}\n`);
    
    schedules.forEach(schedule => {
      console.log(`  - ${schedule.scheduleId}: ${schedule.cron} → ${schedule.destination}`);
    });
    
    console.log('\n🎉 Workflow setup complete!');
    console.log('\nNext steps:');
    console.log('1. Test deposit workflow: POST /api/workflows/deposit');
    console.log('2. Test withdrawal workflow: POST /api/workflows/withdrawal');
    console.log('3. Monitor workflows in Upstash Console');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Delete all schedules (useful for cleanup)
async function cleanupWorkflows() {
  console.log('🧹 Cleaning up all workflows...\n');
  
  if (!process.env.QSTASH_TOKEN) {
    console.error('❌ QSTASH_TOKEN environment variable is required');
    process.exit(1);
  }
  
  const client = new Client({ token: process.env.QSTASH_TOKEN });
  
  try {
    const schedules = await client.schedules.list();
    
    for (const schedule of schedules) {
      await client.schedules.delete(schedule.scheduleId);
      console.log(`✅ Deleted: ${schedule.scheduleId}`);
    }
    
    console.log(`\n🎉 Cleaned up ${schedules.length} schedules`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'cleanup') {
  cleanupWorkflows();
} else {
  setupWorkflows();
}
