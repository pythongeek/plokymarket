const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function listAllTables() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('ALL TABLES:', JSON.stringify(res.rows.map(r => r.table_name), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
listAllTables();
