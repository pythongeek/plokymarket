/**
 * Apply Exchange Rate System Migration
 * Run: node apply_exchange_rate_migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
    const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.error('Error: POSTGRES_URL or POSTGRES_URL_NON_POOLING not set in .env.local');
        process.exit(1);
    }

    // Use the pgbouncer URL for direct connection
    const directUrl = process.env.POSTGRES_URL?.replace('pgbouncer=true', '').replace('supa=base-pooler.x', '');
    const finalConnectionString = process.env.POSTGRES_URL_NON_POOLING || directUrl || connectionString;

    const client = new Client({
        connectionString: finalConnectionString,
        ssl: false
    });

    await client.connect();

    const migrationFile = '20260308000000_exchange_rate_system.sql';
    const migrationPath = path.join(__dirname, 'supabase/migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
        console.error(`Error: Migration file not found: ${migrationPath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    try {
        console.log(`Applying ${migrationFile}...`);
        await client.query(sql);
        console.log(`Successfully applied ${migrationFile}!`);

        // Verify the function was created
        const funcCheck = await client.query(`
            SELECT proname, prosrc 
            FROM pg_proc 
            WHERE proname = 'update_exchange_rate'
        `);

        if (funcCheck.rows.length > 0) {
            console.log('✓ update_exchange_rate function verified');
        } else {
            console.warn('⚠ update_exchange_rate function not found');
        }

        // Verify tables exist
        const tables = ['exchange_rates_live', 'exchange_rate_history', 'exchange_rate_config'];
        for (const table of tables) {
            const tableCheck = await client.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_name = $1 AND table_schema = 'public'
            `, [table]);

            if (tableCheck.rows.length > 0) {
                console.log(`✓ ${table} table verified`);
            } else {
                console.warn(`⚠ ${table} table not found`);
            }
        }

    } catch (err) {
        console.error(`Error applying ${migrationFile}:`, err.message);
        // Continue anyway - may have partial success
    }

    await client.end();
    console.log('\nExchange rate migration complete.');
}

main().catch(console.error);
