const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function checkTypes() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name, column_name, udt_name as type_name
            FROM information_schema.columns 
            WHERE table_name IN ('events', 'markets') AND column_name = 'status'
            AND table_schema = 'public'
        `);
        console.log('Column types:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
checkTypes();
