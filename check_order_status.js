const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function filterEnums() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT enumlabel 
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname = 'order_status'
            ORDER BY e.enumsortorder;
        `);
        console.log('order_status levels:', res.rows.map(r => r.enumlabel));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
filterEnums();
