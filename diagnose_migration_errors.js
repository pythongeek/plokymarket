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

        console.log('--- TABLE CHECKS ---');
        const tables = ['events', 'markets', 'deposit_requests', 'comments', 'platform_settings'];
        for (const table of tables) {
            const res = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}')`);
            console.log(`Table ${table} exists:`, res.rows[0].exists);
        }

        console.log('\n--- COLUMN CHECKS ---');
        const colRes = await client.query(`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'events' AND (column_name = 'ticker' OR column_name = 'category')`);
        console.table(colRes.rows);

        console.log('\n--- POLICY CHECKS ---');
        const policies = [
            { table: 'events', name: 'Public can view events' },
            { table: 'platform_settings', name: 'Platform settings are viewable by everyone' }
        ];
        for (const p of policies) {
            const res = await client.query(`SELECT EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = '${p.table}' AND policyname = '${p.name}')`);
            console.log(`Policy "${p.name}" on ${p.table} exists:`, res.rows[0].exists);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

diagnose();
