/**
 * Fix: Add missing 'liquidity' column and other potentially missing columns
 * to the production 'markets' table, then reload the PostgREST schema cache.
 */
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected');

        // 1. Check what columns markets currently has
        const colResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='markets'
      ORDER BY ordinal_position
    `);
        console.log('\n--- Current markets columns ---');
        const existingCols = colResult.rows.map(r => r.column_name);
        colResult.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type}) ${r.column_default || ''}`));

        // 2. Add missing columns
        const columnsToAdd = [
            { name: 'liquidity', sql: "ALTER TABLE public.markets ADD COLUMN liquidity NUMERIC DEFAULT 1000;" },
            { name: 'name', sql: "ALTER TABLE public.markets ADD COLUMN name TEXT;" },
            { name: 'event_id', sql: "ALTER TABLE public.markets ADD COLUMN event_id UUID REFERENCES public.events(id);" },
            { name: 'event_date', sql: "ALTER TABLE public.markets ADD COLUMN event_date TIMESTAMPTZ;" },
            { name: 'creator_id', sql: "ALTER TABLE public.markets ADD COLUMN creator_id UUID REFERENCES auth.users(id);" },
            { name: 'subcategory', sql: "ALTER TABLE public.markets ADD COLUMN subcategory VARCHAR(50);" },
            { name: 'tags', sql: "ALTER TABLE public.markets ADD COLUMN tags TEXT[] DEFAULT '{}';" },
            { name: 'initial_liquidity', sql: "ALTER TABLE public.markets ADD COLUMN initial_liquidity NUMERIC DEFAULT 1000;" },
            { name: 'slug', sql: "ALTER TABLE public.markets ADD COLUMN slug VARCHAR(200);" },
            { name: 'answer_type', sql: "ALTER TABLE public.markets ADD COLUMN answer_type VARCHAR(20) DEFAULT 'binary';" },
            { name: 'answer1', sql: "ALTER TABLE public.markets ADD COLUMN answer1 VARCHAR(100) DEFAULT 'Yes';" },
            { name: 'answer2', sql: "ALTER TABLE public.markets ADD COLUMN answer2 VARCHAR(100) DEFAULT 'No';" },
            { name: 'is_featured', sql: "ALTER TABLE public.markets ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;" },
            { name: 'created_by', sql: "ALTER TABLE public.markets ADD COLUMN created_by UUID REFERENCES auth.users(id);" },
            { name: 'resolution_delay_hours', sql: "ALTER TABLE public.markets ADD COLUMN resolution_delay_hours INTEGER DEFAULT 24;" },
        ];

        console.log('\n--- Adding missing columns ---');
        for (const col of columnsToAdd) {
            if (!existingCols.includes(col.name)) {
                try {
                    await client.query(col.sql);
                    console.log(`  ✅ Added: ${col.name}`);
                } catch (err) {
                    if (err.message.includes('already exists')) {
                        console.log(`  ⏭️  ${col.name} (already exists)`);
                    } else {
                        console.error(`  ❌ ${col.name}: ${err.message}`);
                    }
                }
            } else {
                console.log(`  ✓ ${col.name} (already exists)`);
            }
        }

        // 3. Reload PostgREST schema cache via pg_notify
        console.log('\n--- Reloading schema cache ---');
        try {
            await client.query("NOTIFY pgrst, 'reload schema'");
            console.log('✅ Schema cache reload requested');
        } catch (err) {
            console.log('⚠️ Schema cache reload notification failed:', err.message);
        }

        // 4. Verify
        const verifyResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='markets'
      ORDER BY ordinal_position
    `);
        console.log(`\n✅ markets table now has ${verifyResult.rows.length} columns`);
        console.log('🎉 Done! The API should now work.');

    } catch (err) {
        console.error('Critical error:', err.message);
    } finally {
        await client.end();
    }
}

run();
