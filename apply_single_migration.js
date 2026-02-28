const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Same prod DB string from apply_production_migrations.js
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runSingleMigration(migrationFilename) {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        await client.query('SET search_path TO public, extensions');

        console.log(`Applying ${migrationFilename}...`);
        const sqlPath = path.join(__dirname, 'supabase', 'migrations', migrationFilename);
        if (!fs.existsSync(sqlPath)) {
            console.error(`File not found: ${sqlPath}`);
            return;
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log(`✅ ${migrationFilename} applied.`);
    } catch (err) {
        console.error(`❌ Migration failed:`, err.message);
        console.error(`Detail:`, err.detail);
        console.error(`Hint:`, err.hint);
    } finally {
        await client.end();
    }
}

const target = process.argv[2];
if (!target) {
    console.error("Please provide a migration filename.");
    process.exit(1);
}

runSingleMigration(target);
