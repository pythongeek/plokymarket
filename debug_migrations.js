
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const migrations = [
    '123_phase2_multi_outcome_markets.sql',
    '125_phase2_price_history_analytics.sql',
    '126_phase2_notification_system.sql'
];

async function runStepByStep() {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        for (const migration of migrations) {
            console.log(`--- Processing ${migration} ---`);
            const sqlPath = path.join(__dirname, 'supabase', 'migrations', migration);
            const sql = fs.readFileSync(sqlPath, 'utf8');

            const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

            for (let i = 0; i < statements.length; i++) {
                const s = statements[i];
                try {
                    await client.query(s);
                    // console.log(`Step ${i+1} OK`);
                } catch (err) {
                    // Ignore "already exists" errors
                    if (err.message.includes('already exists') || err.message.includes('already a member')) {
                        continue;
                    }
                    console.error(`❌ Error in ${migration} at step ${i + 1}:`);
                    console.error(`Statement: ${s.substring(0, 200)}...`);
                    console.error(`Error: ${err.message}`);
                    if (err.detail) console.error(`Detail: ${err.detail}`);
                    if (err.where) console.error(`Where: ${err.where}`);
                    // throw err; // Stop at first serious error
                }
            }
            console.log(`--- Finished ${migration} ---`);
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runStepByStep();
