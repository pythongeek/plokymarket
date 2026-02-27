
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

        console.log('Adding updated_at column to markets table...');
        await client.query(`
            ALTER TABLE markets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
        `);
        console.log('✅ Column added.');

        console.log('Ensuring handle_market_updated_at() is correct...');
        await client.query(`
            CREATE OR REPLACE FUNCTION handle_market_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Function updated.');

    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await client.end();
    }
}

fixSchema();
