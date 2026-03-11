const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function listRemoteMigrations() {
  await client.connect();
  
  console.log('--- Remote Migration History ---');
  const res = await client.query(`
    SELECT version, name 
    FROM supabase_migrations.schema_migrations 
    ORDER BY version;
  `);
  
  console.log(`Total remote migrations tracked: ${res.rows.length}`);
  res.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));
  
  await client.end();
}

listRemoteMigrations().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
