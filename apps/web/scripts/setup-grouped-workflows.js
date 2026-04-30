#!/usr/bin/env node
/**
 * Grouped Automation Setup Script
 * 
 * Sets up 5 consolidated workflows to stay within Upstash Free Tier limits (10 max).
 * 
 * Usage: node scripts/setup-grouped-workflows.js [cleanup]
 */

const { Client } = require('@upstash/qstash');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
        'http://localhost:3000');

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

async function setup() {
    console.log('🚀 Setting up Grouped Automation Schedules...\n');

    if (!QSTASH_TOKEN) {
        console.error('❌ QSTASH_TOKEN is missing');
        process.exit(1);
    }

    const client = new Client({ token: QSTASH_TOKEN });

    try {
        // 1. Group Fast (Every 5 mins)
        console.log(`📍 Group Fast (Every 5m): ${BASE_URL}/api/workflows/group-fast`);
        await client.schedules.create({
            destination: `${BASE_URL}/api/workflows/group-fast`,
            cron: '*/5 * * * *',
            retries: 3,
        });

        // 2. Group Medium (Every 10 mins)
        console.log(`📍 Group Medium (Every 10m): ${BASE_URL}/api/workflows/group-medium`);
        await client.schedules.create({
            destination: `${BASE_URL}/api/workflows/group-medium`,
            cron: '*/10 * * * *',
            retries: 3,
        });

        // 3. Group Hourly (Every hour at minute 0)
        console.log(`📍 Group Hourly (Hourly): ${BASE_URL}/api/workflows/group-hourly`);
        await client.schedules.create({
            destination: `${BASE_URL}/api/workflows/group-hourly`,
            cron: '0 * * * *',
            retries: 3,
        });

        // 4. Group Quarterly (Every 6 hours)
        console.log(`📍 Group Quarterly (Every 6h): ${BASE_URL}/api/workflows/group-quarterly`);
        await client.schedules.create({
            destination: `${BASE_URL}/api/workflows/group-quarterly`,
            cron: '0 */6 * * *',
            retries: 3,
        });

        // 5. Group Daily (Midnight Bangladesh Time)
        console.log(`📍 Group Daily (Midnight): ${BASE_URL}/api/workflows/group-daily`);
        await client.schedules.create({
            destination: `${BASE_URL}/api/workflows/group-daily`,
            cron: '0 0 * * *',
            timezone: 'Asia/Dhaka',
            retries: 3,
        });

        console.log('\n✅ All 5 workflow groups scheduled successfully!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

async function cleanup() {
    console.log('🧹 Cleaning up all existing schedules...\n');
    if (!QSTASH_TOKEN) {
        console.error('❌ QSTASH_TOKEN is missing');
        process.exit(1);
    }
    const client = new Client({ token: QSTASH_TOKEN });

    try {
        const schedules = await client.schedules.list();
        for (const s of schedules) {
            await client.schedules.delete(s.scheduleId);
            console.log(`✅ Deleted: ${s.scheduleId} (${s.destination})`);
        }
        console.log('\n🎉 Cleanup complete!');
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
