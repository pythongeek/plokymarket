const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function diagnose() {
    try {
        await client.connect();

        console.log('--- TARGET TABLE CHECKS ---');
        const tables = ['deposit_requests', 'comments', 'platform_settings', 'profiles'];
        for (const table of tables) {
            const res = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}')`);
            console.log(`Table ${table} exists:`, res.rows[0].exists);
        }

        console.log('\n--- COLUMN TYPE CHECKS: events table ---');
        const colRes = await client.query(`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('ticker', 'category', 'answer1', 'answer2')`);
        console.table(colRes.rows);

        console.log('\n--- POLICY NAMES: events table ---');
        const polRes = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'events'`);
        console.table(polRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

diagnose();
