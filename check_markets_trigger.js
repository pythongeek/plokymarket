
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        console.log('Checking markets table columns...');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'markets';
        `);
        console.log('Columns in markets table:');
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

        console.log('\nChecking triggers on markets table...');
        const triggers = await client.query(`
            SELECT trigger_name, event_manipulation, action_statement
            FROM information_schema.triggers
            WHERE event_object_table = 'markets';
        `);
        triggers.rows.forEach(row => console.log(`- ${row.trigger_name}: ${row.event_manipulation}`));

        console.log('\nChecking handle_market_updated_at function...');
        const func = await client.query(`
            SELECT routine_definition
            FROM information_schema.routines
            WHERE routine_name = 'handle_market_updated_at';
        `);
        if (func.rows.length > 0) {
            console.log('Function definition:');
            console.log(func.rows[0].routine_definition);
        } else {
            console.log('Function handle_market_updated_at not found.');
        }

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
