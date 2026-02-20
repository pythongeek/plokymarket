const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('--- Production Markets ---');
        const markets = await client.query('SELECT id, status, category, question FROM public.markets');
        console.log(JSON.stringify(markets.rows, null, 2));

        console.log('\n--- Production Events ---');
        const events = await client.query('SELECT id, status, category, title FROM public.events');
        console.log(JSON.stringify(events.rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
