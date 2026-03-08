/**
 * Apply Workflow & AI Topics Migrations
 * Run: node apply_workflow_migration.js
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

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const migrations = [
        '20260307203000_workflow_execution_system.sql',
        '20260307204500_ai_topics_system.sql'
    ];

    for (const migrationFile of migrations) {
        const migrationPath = path.join(__dirname, 'supabase/migrations', migrationFile);

        if (!fs.existsSync(migrationPath)) {
            console.log(`Skipping: Migration file not found: ${migrationPath}`);
            continue;
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        try {
            console.log(`Applying ${migrationFile}...`);
            await client.query(sql);
            console.log(`Successfully applied ${migrationFile}!`);
        } catch (err) {
            console.error(`Error applying ${migrationFile}:`, err.message);
            // Continue with other migrations even if one fails
        }
    }

    await client.end();
    console.log('All migrations complete.');
}

main().catch(console.error);
