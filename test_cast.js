const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function testInsert() {
    try {
        await client.connect();
        // Just try to cast 'active' to market_status
        const res = await client.query("SELECT 'active'::market_status as val");
        console.log('Cast successful:', res.rows[0].val);
    } catch (err) {
        console.error('Cast failed:', err.message);
    } finally {
        await client.end();
    }
}
testInsert();
