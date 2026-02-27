
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function fixNotifications() {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        console.log('Adding missing columns to notifications table...');
        await client.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS type TEXT, -- In case notification_type enum change failed
            ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        `);
        console.log('✅ Columns added.');

        // Also check if read and read_at exist (just in case)
        await client.query(`
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
        `);
        console.log('✅ Status columns verified.');

    } catch (err) {
        console.error('Error fixing notifications table:', err);
    } finally {
        await client.end();
    }
}

fixNotifications();
