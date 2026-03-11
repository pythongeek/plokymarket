const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
(async () => {
  await c.connect();
  const r1 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='oracle_disputes' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('oracle_disputes columns:', r1.rows.map(x => x.column_name).join(', '));
  const r2 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='oracle_requests' AND table_schema='public' ORDER BY ordinal_position`);
  console.log('oracle_requests columns:', r2.rows.map(x => x.column_name).join(', '));
  await c.end();
})();
