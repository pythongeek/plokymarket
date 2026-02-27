
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        console.log('Adding missing yes_price and no_price columns to markets table...');
        await client.query(`
            ALTER TABLE markets 
            ADD COLUMN IF NOT EXISTS yes_price DECIMAL(10,4) DEFAULT 0.5,
            ADD COLUMN IF NOT EXISTS no_price DECIMAL(10,4) DEFAULT 0.5;
        `);
        console.log('✅ Columns added.');

        // Initialize them from current state if possible, or just leave as 0.5
        // Since we don't know the current prices, 0.5 is a safe starting point.

    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixSchema();
