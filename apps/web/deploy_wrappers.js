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
    '20260312130001_wrapper_migration.sql',
    '20260312130002_smoke_tests.sql'
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
      if (err.detail) console.error(`   Detail: ${err.detail}`);
      if (err.where) console.error(`   Where: ${err.where}`);
      allSuccess = false;
    }
  }

  // Final summary
  console.log('\n\n--- WRAPPER MIGRATION SUMMARY ---');
  
  // Count all wrappers that now delegate
  const wrappers = await client.query(`
    SELECT p.proname, pg_get_function_result(p.oid) as returns
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND (pg_get_functiondef(p.oid) LIKE '%_v2(%' OR pg_get_functiondef(p.oid) LIKE '%_v3(%')
    AND p.proname NOT LIKE '%_v2' AND p.proname NOT LIKE '%_v3'
    ORDER BY p.proname;
  `);
  console.log(`\nActive wrappers (${wrappers.rows.length}):`);
  wrappers.rows.forEach(r => console.log(`  ${r.proname} → ${r.returns}`));

  // Migration count
  const migs = await client.query(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  console.log(`\nMigration history (${migs.rows.length} entries):`);
  migs.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log(`\n${allSuccess ? '✅ Wrapper migration & smoke tests PASSED!' : '⚠️ Some issues — review above'}`);
}

runDeploy().catch(err => { console.error('Fatal:', err); process.exit(1); });
