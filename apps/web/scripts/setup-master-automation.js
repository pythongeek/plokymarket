#!/usr/bin/env node
/**
 * Master Automation Setup Script
 * 
 * Consolidates all individual workflows into a single intelligent master schedule.
 * Use this to stay within Upstash Free Tier limits.
 * 
 * Usage: node scripts/setup-master-automation.js [cleanup]
 */

const { Client } = require('@upstash/qstash');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
        'https://polymarket-bangladesh.vercel.app');

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

async function setup() {
    console.log('🚀 Setting up Master Automation Schedule...\n');

    if (!QSTASH_TOKEN) {
        console.error('❌ QSTASH_TOKEN is missing');
        process.exit(1);
    }

    const client = new Client({ token: QSTASH_TOKEN });

    try {
        // 1. Optional Cleanup
        const schedules = await client.schedules.list();
        if (schedules.length > 0) {
            console.log(`📋 Found ${schedules.length} existing schedules.`);
            console.log('Use "node scripts/setup-master-automation.js cleanup" to delete them first.\n');
        }

        // 2. Create Master Schedule
        console.log(`📍 Destination: ${BASE_URL}/api/workflows/master-automation`);

        const master = await client.schedules.create({
            destination: `${BASE_URL}/api/workflows/master-automation`,
            cron: '*/5 * * * *', // Every 5 minutes
            retries: 3,
        });

        console.log(`✅ Master Automation scheduled: ${master.scheduleId}`);
        console.log('\n✨ All tasks (Crypto, Sports, Exchange Rate, Analytics, etc.) are now managed through this single schedule.');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

async function cleanup() {
    console.log('🧹 Cleaning up all existing schedules...\n');
    const client = new Client({ token: QSTASH_TOKEN });

    try {
        const schedules = await client.schedules.list();
        for (const s of schedules) {
            await client.schedules.delete(s.scheduleId);
            console.log(`✅ Deleted: ${s.scheduleId} (${s.destination})`);
        }
        console.log('\n🎉 Cleanup complete! Now run "node scripts/setup-master-automation.js" to set up the consolidated schedule.');
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
    }
}

const command = process.argv[2];
if (command === 'cleanup') {
    cleanup();
} else {
    setup();
}
