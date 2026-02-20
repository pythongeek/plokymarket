const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkTables() {
    const tables = ['events', 'markets', 'resolution_systems', 'transactions', 'wallet_transactions', 'deposit_requests', 'withdrawal_requests'];
    console.log('--- Database State ---');
    for (const table of tables) {
        try {
            const res = await client.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}'`);
            if (res.rows.length === 0) {
                console.log(`❌ Table ${table} does NOT exist.`);
            } else {
                console.log(`✅ Table ${table} exists.`);
                res.rows.forEach(r => {
                    console.log(`   - ${r.column_name} (${r.data_type}, Nullable: ${r.is_nullable})`);
                });

                // Fetch sample IDs and status
                try {
                    const sample = await client.query(`SELECT id, status, category FROM public.${table} LIMIT 5`);
                    console.log(`   Samples:`, sample.rows.map(r => ({ id: r.id, status: r.status, category: r.category })));
                } catch (sErr) {
                    console.log(`   Could not fetch samples: ${sErr.message}`);
                }
            }
        } catch (err) {
            console.log(`Error checking ${table}: ${err.message}`);
        }
    }
    console.log('-----------------------');
}

async function run() {
    try {
        await client.connect();
        await checkTables();
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
