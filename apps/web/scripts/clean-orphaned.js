require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    // 1. Get all tables referencing markets
    const res = await client.query(`
    SELECT conrelid::regclass AS table_name, a.attname AS column_name 
    FROM pg_constraint c 
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid 
    WHERE confrelid = 'public.markets'::regclass;
  `);

    const tables = res.rows;
    console.log(`Found ${tables.length} tables referencing markets.`);

    // 2. Cascade delete
    for (const { table_name, column_name } of tables) {
        if (table_name === 'events' || table_name === 'public.events') continue; // Don't delete events! (well, we only delete if their market is orphaned, but let's be safe)
        try {
            console.log(`Deleting orphaned records from ${table_name}...`);
            await client.query(`DELETE FROM ${table_name} WHERE ${column_name} IN (SELECT id FROM public.markets WHERE event_id IS NULL)`);
        } catch (e) {
            console.warn(`Could not delete from ${table_name}: ${e.message}`);
        }
    }

    // 3. Finally delete the orphaned markets
    try {
        const delRes = await client.query(`DELETE FROM public.markets WHERE event_id IS NULL RETURNING id`);
        console.log(`Deleted ${delRes.rowCount} orphaned markets.`);
    } catch (e) {
        console.error(`Failed to delete markets: ${e.message}`);
    }

    await client.end();
}
main().catch(console.error);
