/**
 * Diagnostic Script: Check Events and Markets Schema
 * Run: node scripts/check-events-markets-schema.js
 */

const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const connectionString = process.env.DATABASE_URL ||
    `postgres://postgres:${process.env.POSTGRES_PASSWORD}@${supabaseUrl.replace('https://', '')}:6543/postgres?sslmode=require`;

const c = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    console.log('=== CHECKING EVENTS AND MARKETS SCHEMA ===\n');

    try {
        await c.connect();

        // ========================================
        // 1. Check events table columns
        // ========================================
        console.log('--- EVENTS TABLE ---');
        const eventsCols = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='events' 
      ORDER BY ordinal_position
    `);

        console.log(`Found ${eventsCols.rows.length} columns:`);
        eventsCols.rows.forEach(x => {
            console.log(`  - ${x.column_name}: ${x.data_type} ${x.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${x.column_default ? 'default: ' + x.column_default : ''}`);
        });

        // ========================================
        // 2. Check markets table columns
        // ========================================
        console.log('\n--- MARKETS TABLE ---');
        const marketsCols = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='markets' 
      ORDER BY ordinal_position
    `);

        console.log(`Found ${marketsCols.rows.length} columns:`);
        marketsCols.rows.forEach(x => {
            console.log(`  - ${x.column_name}: ${x.data_type} ${x.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${x.column_default ? 'default: ' + x.column_default : ''}`);
        });

        // ========================================
        // 3. Check foreign key relationships
        // ========================================
        console.log('\n--- FOREIGN KEY RELATIONSHIPS ---');
        const fks = await c.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name IN ('events', 'markets') OR ccu.table_name IN ('events', 'markets'))
    `);

        if (fks.rows.length > 0) {
            console.log('Found foreign keys:');
            fks.rows.forEach(x => {
                console.log(`  - ${x.table_name}.${x.column_name} -> ${x.foreign_table_name}.${x.foreign_column_name}`);
            });
        } else {
            console.log('No foreign keys found between events and markets');
        }

        // ========================================
        // 4. Check RLS policies
        // ========================================
        console.log('\n--- RLS POLICIES ---');
        const rls = await c.query(`
      SELECT tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename IN ('events', 'markets')
      ORDER BY tablename, policyname
    `);

        if (rls.rows.length > 0) {
            console.log('Found RLS policies:');
            rls.rows.forEach(x => {
                console.log(`  - ${x.tablename}.${x.policyname}: ${x.cmd} (roles: ${x.roles})`);
                console.log(`    qual: ${x.qual?.substring(0, 100)}...`);
            });
        } else {
            console.log('No RLS policies found for events or markets');
        }

        // ========================================
        // 5. Check current data
        // ========================================
        console.log('\n--- CURRENT DATA ---');
        const eventsCount = await c.query(`SELECT COUNT(*) as count FROM events`);
        console.log(`Events: ${eventsCount.rows[0].count} rows`);

        const marketsCount = await c.query(`SELECT COUNT(*) as count FROM markets`);
        console.log(`Markets: ${marketsCount.rows[0].count} rows`);

        const activeEvents = await c.query(`SELECT id, title, status FROM events WHERE status = 'active' LIMIT 5`);
        console.log(`\nActive events (sample):`);
        activeEvents.rows.forEach(x => {
            console.log(`  - ${x.id?.substring(0, 8)}: ${x.title?.substring(0, 30)} (${x.status})`);
        });

        // ========================================
        // 6. Check for migration conflicts (duplicate column additions)
        // ========================================
        console.log('\n--- CHECKING FOR POTENTIAL CONFLICTS ---');

        // Check if there are any columns added by multiple migrations
        const columnCheck = await c.query(`
      SELECT column_name, COUNT(*) as additions
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='events'
      GROUP BY column_name
      HAVING COUNT(*) > 1
    `);

        if (columnCheck.rows.length > 0) {
            console.log('WARNING: Potential column conflicts:');
            columnCheck.rows.forEach(x => {
                console.log(`  - ${x.column_name}: added ${x.additions} times`);
            });
        } else {
            console.log('No column conflicts detected');
        }

        // Check for required columns used in API route
        console.log('\n--- API ROUTE REQUIRED COLUMNS CHECK ---');
        const requiredEventCols = ['title', 'slug', 'question', 'category', 'status', 'trading_closes_at', 'created_by'];
        const requiredMarketCols = ['event_id', 'name', 'question', 'category', 'status', 'trading_closes_at'];

        const eventColNames = eventsCols.rows.map(r => r.column_name);
        const marketColNames = marketsCols.rows.map(r => r.column_name);

        console.log('Events table:');
        requiredEventCols.forEach(col => {
            const exists = eventColNames.includes(col);
            console.log(`  ${exists ? '✓' : '✗'} ${col}`);
        });

        console.log('Markets table:');
        requiredMarketCols.forEach(col => {
            const exists = marketColNames.includes(col);
            console.log(`  ${exists ? '✓' : '✗'} ${col}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await c.end();
    }
}

checkSchema();
