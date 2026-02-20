const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runCheck() {
    try {
        await client.connect();
        const res = await client.query("SELECT id, question, trading_status, ends_at FROM events ORDER BY created_at DESC LIMIT 10");
        console.log('Recent Events:');
        console.table(res.rows);

        const countRes = await client.query("SELECT trading_status, COUNT(*) FROM events GROUP BY trading_status");
        console.log('\nStatus Distribution:');
        console.table(countRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

runCheck();
