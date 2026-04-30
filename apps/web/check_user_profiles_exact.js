const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT typname, typtype, typbasetype::regtype as basetype
    FROM pg_type
    WHERE typname = 'user_status';
  `);
  console.log("Type user_status:", res.rows);
  await client.end();
}
main().catch(console.error);
