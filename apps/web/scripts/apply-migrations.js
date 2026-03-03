require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    const migrations = [
        '../../../Event fix final try/143a_field_normalization.sql',
        '../../../Event fix final try/143b_upstash_workflows.sql',
        '../../../Event fix final try/143c_orphan_sync_cron.sql'
    ];

    for (const file of migrations) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
            console.log(`Executing ${file}...`);
            await client.query(sql);
            console.log(`Successfully applied ${file}`);
        } catch (err) {
            console.error(`Error applying ${file}:`, err.message);
        }
    }

    await client.end();
}

main().catch(console.error);
