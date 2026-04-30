process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

let connString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
connString = connString.replace('?sslmode=require', '').replace('&sslmode=require', '');

const client = new Client({
  connectionString: connString,
  ssl: { rejectUnauthorized: false }
});

const migrationSQL = fs.readFileSync('f:/My profession/Hybrid APPs/Plokymarket/docs/event creation fix/files (7)/125_fix_event_creation_and_markets_fetch.sql', 'utf-8');

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query(migrationSQL);
    console.log('Migration 125 executed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
