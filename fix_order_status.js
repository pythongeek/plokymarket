const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function fixOrderStatus() {
    try {
        await client.connect();
        console.log('Adding "expired" to order_status...');
        await client.query("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired'");
        console.log('Enum fix completed.');
    } catch (err) {
        // ADD VALUE might fail if already in transaction (it must be outside)
        // apply_production_migrations.js runs queries individually if one fails? No, it throws.
        // But here I'm running it directly.
        console.error('Enum fix failed:', err.message);
    } finally {
        await client.end();
    }
}
fixOrderStatus();
