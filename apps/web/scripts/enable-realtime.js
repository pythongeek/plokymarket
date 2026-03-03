/**
 * Enable Realtime for events and markets tables
 * Run: node scripts/enable-realtime.js
 */

const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Connection string from check_cols.js
const connectionString = 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';

const c = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function enableRealtime() {
    console.log('Enabling Realtime for events and markets tables...\n');

    try {
        await c.connect();

        // Add events table to supabase_realtime publication
        console.log('Adding events table to supabase_realtime...');
        try {
            await c.query(`ALTER PUBLICATION supabase_realtime ADD TABLE events;`);
            console.log('✓ events table added');
        } catch (e) {
            if (e.message.includes('already exists') || e.code === '0P') {
                console000.log('✓ events table already in publication');
            } else {
                throw e;
            }
        }

        // Add markets table to supabase_realtime publication
        console.log('Adding markets table to supabase_realtime...');
        try {
            await c.query(`ALTER PUBLICATION supabase_realtime ADD TABLE markets;`);
            console.log('✓ markets table added');
        } catch (e) {
            if (e.message.includes('already exists') || e.code === '0P000') {
                console.log('✓ markets table already in publication');
            } else {
                throw e;
            }
        }

        // Verify the changes
        console.log('\nVerifying Realtime tables:');
        const result = await c.query(`
      SELECT * FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename IN ('events', 'markets')
    `);

        if (result.rows.length === 0) {
            console.log('⚠ No tables found in publication');
        } else {
            result.rows.forEach(row => {
                console.log(`✓ ${row.tablename} is in supabase_realtime`);
            });
        }

        // Also show all tables in the publication
        console.log('\nAll tables in supabase_realtime:');
        const all = await c.query(`SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`);
        all.rows.forEach(row => {
            console.log(`  - ${row.tablename}`);
        });

        console.log('\n✅ Realtime enabled successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await c.end();
    }
}

enableRealtime();
