const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema='public' 
    ORDER BY table_name;
  `);
  console.log("public schema tables:", res.rows.map(r => `${r.table_name} (${r.table_type})`).join('\\n'));
  await client.end();
}
main().catch(console.error);
