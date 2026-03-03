/**
 * Phase 2 Migration Verification Script
 * Checks which Phase 2 tables and columns have been applied to production database
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase environment variables');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to check for Phase 2 migrations
const PHASE2_TABLES = [
    'outcomes',           // Migration 001: Multi-Outcome Markets
    'user_bookmarks',    // Migration 002: Social Layer
    'market_followers',  // Migration 002: Social Layer
    'comment_likes',    // Migration 002: Social Layer
    'price_history',     // Migration 003: Price History & Market Analytics
    'market_daily_stats', // Migration 003: Price History & Market Analytics
    'notifications',     // Migration 004: Notifications System
    'order_batches'     // Migration 005: Batch Orders
];

// Columns to check on markets table
const MARKET_COLUMNS = [
    'market_type',
    'yes_price_change_24h',
    'no_price_change_24h',
    'unique_traders'
];

async function checkTableExists(tableName) {
    try {
        // Try to select from the table - if it doesn't exist, we'll get an error
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        // If error contains "relation" or "does not exist", table doesn't exist
        if (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('PGRST')) {
                return false;
            }
            // If it's another type of error (like permission denied), table likely exists
            return true;
        }

        return true;
    } catch (err) {
        console.error(`Exception checking table ${tableName}:`, err);
        return false;
    }
}

async function checkColumnExists(tableName, columnName) {
    try {
        // Try to select a specific column - if it doesn't exist, we'll get an error
        const { data, error } = await supabase
            .from(tableName)
            .select(columnName)
            .limit(1);

        // If error contains "column" or "does not exist", column doesn't exist
        if (error) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('does not exist') || errorMessage.includes('column') || errorMessage.includes('PGRST')) {
                return false;
            }
            // If it's another type of error, column likely exists
            return true;
        }

        return true;
    } catch (err) {
        console.error(`Exception checking column ${tableName}.${columnName}:`, err);
        return false;
    }
}

async function verifyPhase2Migrations() {
    console.log('\n========================================');
    console.log('PHASE 2 MIGRATION VERIFICATION');
    console.log('========================================\n');

    console.log('Checking Phase 2 Tables...\n');

    const tableResults = {};

    for (const table of PHASE2_TABLES) {
        const exists = await checkTableExists(table);
        tableResults[table] = exists;
        const status = exists ? '✓ EXISTS' : '✗ MISSING';
        console.log(`  ${status}: ${table}`);
    }

    console.log('\n------------------------------------------');
    console.log('Checking Markets Table Columns...\n');

    const columnResults = {};

    for (const column of MARKET_COLUMNS) {
        const exists = await checkColumnExists('markets', column);
        columnResults[column] = exists;
        const status = exists ? '✓ EXISTS' : '✗ MISSING';
        console.log(`  ${status}: markets.${column}`);
    }

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================\n');

    // Migration 001: Multi-Outcome Markets
    console.log('Migration 001: Multi-Outcome Markets');
    console.log(`  - outcomes table: ${tableResults['outcomes'] ? '✓' : '✗'}`);
    console.log(`  - markets.market_type: ${columnResults['market_type'] ? '✓' : '✗'}`);

    // Migration 002: Social Layer
    console.log('\nMigration 002: Social Layer');
    console.log(`  - user_bookmarks table: ${tableResults['user_bookmarks'] ? '✓' : '✗'}`);
    console.log(`  - market_followers table: ${tableResults['market_followers'] ? '✓' : '✗'}`);
    console.log(`  - comment_likes table: ${tableResults['comment_likes'] ? '✓' : '✗'}`);

    // Migration 003: Price History & Market Analytics
    console.log('\nMigration 003: Price History & Market Analytics');
    console.log(`  - price_history table: ${tableResults['price_history'] ? '✓' : '✗'}`);
    console.log(`  - market_daily_stats table: ${tableResults['market_daily_stats'] ? '✓' : '✗'}`);
    console.log(`  - markets.yes_price_change_24h: ${columnResults['yes_price_change_24h'] ? '✓' : '✗'}`);
    console.log(`  - markets.no_price_change_24h: ${columnResults['no_price_change_24h'] ? '✓' : '✗'}`);
    console.log(`  - markets.unique_traders: ${columnResults['unique_traders'] ? '✓' : '✗'}`);

    // Migration 004: Notifications System
    console.log('\nMigration 004: Notifications System');
    console.log(`  - notifications table: ${tableResults['notifications'] ? '✓' : '✗'}`);

    // Migration 005: Batch Orders
    console.log('\nMigration 005: Batch Orders');
    console.log(`  - order_batches table: ${tableResults['order_batches'] ? '✓' : '✗'}`);

    // Overall Status
    console.log('\n========================================');
    console.log('OVERALL STATUS');
    console.log('========================================\n');

    const tablesExist = Object.values(tableResults).filter(v => v).length;
    const columnsExist = Object.values(columnResults).filter(v => v).length;

    console.log(`Tables: ${tablesExist}/${PHASE2_TABLES.length} exist`);
    console.log(`Columns: ${columnsExist}/${MARKET_COLUMNS.length} exist`);

    // List missing items
    const missingTables = PHASE2_TABLES.filter(t => !tableResults[t]);
    const missingColumns = MARKET_COLUMNS.filter(c => !columnResults[c]);

    if (missingTables.length > 0) {
        console.log('\nMissing Tables:');
        missingTables.forEach(t => console.log(`  - ${t}`));
    }

    if (missingColumns.length > 0) {
        console.log('\nMissing Columns:');
        missingColumns.forEach(c => console.log(`  - markets.${c}`));
    }

    if (missingTables.length === 0 && missingColumns.length === 0) {
        console.log('\n✓ All Phase 2 migrations have been applied!');
    } else {
        console.log('\n✗ Some Phase 2 migrations are missing and need to be created.');
    }

    console.log('\n');
}

verifyPhase2Migrations()
    .then(() => {
        console.log('Verification complete.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Verification failed:', err);
        process.exit(1);
    });
