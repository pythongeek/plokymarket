const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function runDeploy() {
  console.log('Connecting to production database...');
  await client.connect();
  
  const files = [
    '20260312100016_admin.sql',
    '20260312100017_rls.sql',
    '20260312100018_scaling.sql'
  ];

  let allSuccess = true;
  for (const file of files) {
    const filePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) { throw new Error(`Not found: ${filePath}`); }
    console.log(`\n--- Executing ${file} ---`);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      const version = file.split('_')[0];
      const name = file.replace(`${version}_`, '').replace('.sql', '');
      await client.query(`INSERT INTO supabase_migrations.schema_migrations (version, statements, name) VALUES ($1, $2, $3) ON CONFLICT (version) DO NOTHING;`, [version, [sql], name]);
      await client.query('COMMIT');
      console.log(`✅ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ ${file}: ${err.message}`);
      allSuccess = false;
    }
  }

  console.log('\n--- FINAL VERIFICATION ---');
  const policyCount = await client.query(`SELECT COUNT(*) as cnt FROM pg_policies WHERE schemaname = 'public';`);
  console.log(`RLS policies in production: ${policyCount.rows[0].cnt}`);
  
  const migs = await client.query(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  console.log(`\nFull migration history (${migs.rows.length} entries):`);
  migs.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log(`\n${allSuccess ? '✅ All Phase 5 files succeeded' : '⚠️ Phase 5 completed with issues'}`);
}

runDeploy().catch(err => { console.error('Fatal:', err); process.exit(1); });
