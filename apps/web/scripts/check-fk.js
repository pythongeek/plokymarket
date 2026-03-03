require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const res = await client.query(`
    SELECT conrelid::regclass AS table_name, a.attname AS column_name 
    FROM pg_constraint c 
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid 
    WHERE confrelid = 'public.markets'::regclass;
  `);
    console.log(res.rows);
    await client.end();
}
main().catch(console.error);
