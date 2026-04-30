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
    '20260312100010_wallets.sql',
    '20260312100011_analytics.sql',
    '20260312100012_oracle.sql',
    '20260312100013_wrappers_wallets.sql',
    '20260312100014_wrappers_analytics.sql',
    '20260312100015_wrappers_oracle.sql'
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

  console.log('\n--- PHASE 4 VERIFICATION ---');
  const walletCol = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'locked_balance';`);
  console.log(`wallets.locked_balance: ${walletCol.rows.length > 0 ? '✅' : '❌'}`);
  
  const rpcs = await client.query(`SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('freeze_funds_v2','update_exchange_rate_v2','update_leaderboard_v2','get_price_history','resolve_market_v2') ORDER BY routine_name;`);
  console.log(`RPCs: ${rpcs.rows.map(r => r.routine_name).join(', ')}`);

  const migs = await client.query(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  console.log(`\nMigration history:`);
  migs.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log(`\n${allSuccess ? '✅' : '⚠️'} Phase 4 completed.`);
}

runDeploy().catch(err => { console.error('Fatal:', err); process.exit(1); });
