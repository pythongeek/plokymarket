const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function checkEnums() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT n.nspname as schema, t.typname as type, e.enumlabel as label
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            ORDER BY schema, type, e.enumsortorder;
        `);
        console.log('Enum values:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
checkEnums();
