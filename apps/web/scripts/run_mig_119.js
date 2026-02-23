require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!dbUrl) {
    console.error('No POSTGRES_URL found in .env.local');
    process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const client = new Client({
    connectionString: dbUrl.split('?')[0] + '?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to production database via pg to apply migration 119...');
        await client.connect();
        const sqlPath = require('path').resolve(__dirname, '../../../supabase/migrations/119_secure_atomic_wallet_updates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);

        console.log('Migration successfully applied.');
    } catch (e) {
        console.error('Failed to apply migration:', e);
    } finally {
        await client.end();
    }
}
run();
