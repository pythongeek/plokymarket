const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function runDeploy() {
  console.log('Deploying Phase 4D wrappers fix...');
  await client.connect();
  
  const filePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260312120004_phase4_rls_wrappers.sql');
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(`INSERT INTO supabase_migrations.schema_migrations (version, statements, name) VALUES ($1, $2, $3) ON CONFLICT (version) DO NOTHING;`, ['20260312120004', [sql], 'phase4_rls_wrappers']);
    await client.query('COMMIT');
    console.log('✅ phase4_rls_wrappers.sql deployed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`❌ ${err.message}`);
    if (err.detail) console.error(`   Detail: ${err.detail}`);
  }

  // Verify RLS
  const policies = await client.query(`SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('leaderboard','oracle_disputes') ORDER BY tablename, policyname;`);
  console.log(`\nRLS policies:`);
  policies.rows.forEach(r => console.log(`  ${r.tablename}: ${r.policyname}`));

  const migs = await client.query(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  console.log(`\nMigration history (${migs.rows.length} entries):`);
  migs.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
}

runDeploy().catch(err => { console.error('Fatal:', err); process.exit(1); });
