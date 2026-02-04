const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function deployMarkets() {
    try {
        await client.connect();
        console.log('Connected to DB.');

        const sqlPath = path.join(__dirname, 'supabase', 'db', 'add_bd_markets.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log('Bangladeshi markets injected successfully!');
    } catch (err) {
        console.error('Error injecting markets:', err);
    } finally {
        await client.end();
    }
}

deployMarkets();
