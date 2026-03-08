require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');

const connectionString = process.env.POSTGRES_URL_NON_POOLING;

async function main() {
    const client = new Client({
        connectionString,
        ssl: false
    });

    try {
        await client.connect();
        console.log('✓ Connected to database');

        // Apply migration
        const sql = fs.readFileSync('./supabase/migrations/20260308000000_exchange_rate_system.sql', 'utf8');
        console.log('✓ Applying migration...');
        await client.query(sql);
        console.log('✓ Migration applied successfully!');

        // Verify function
        const result = await client.query("SELECT proname FROM pg_proc WHERE proname = 'update_exchange_rate'");
        console.log('✓ Functions found:', result.rows.length);

        // Check tables
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'exchange%'");
        console.log('✓ Exchange tables:', tables.rows.map(t => t.table_name));

        // Get current rate
        const rate = await client.query("SELECT * FROM exchange_rates_live WHERE is_active = true ORDER BY fetched_at DESC LIMIT 1");
        console.log('✓ Current rate:', rate.rows[0] || 'No active rate');

    } catch (e) {
        console.error('✗ Error:', e.message);
    } finally {
        await client.end();
        console.log('✓ Done!');
    }
}

main();
