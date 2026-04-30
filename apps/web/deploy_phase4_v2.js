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
    '20260312120001_wallets_enhanced.sql',
    '20260312120002_leaderboard_analytics.sql',
    '20260312120003_oracle_enhanced.sql',
    '20260312120004_phase4_rls_wrappers.sql'
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

  // Verification
  console.log('\n\n--- PHASE 4 ENHANCED VERIFICATION ---');

  // Leaderboard exists?
  const lbCheck = await client.query(`SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_name = 'leaderboard' AND table_schema = 'public';`);
  console.log(`leaderboard table columns: ${lbCheck.rows[0].cnt} ${lbCheck.rows[0].cnt > 0 ? '✅' : '❌'}`);

  // freeze_funds return type fixed?
  const ffCheck = await client.query(`
    SELECT pg_get_function_result(p.oid) as returns FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'freeze_funds';
  `);
  console.log(`freeze_funds returns: ${ffCheck.rows.map(r => r.returns).join(', ')}`);
  const allJsonb = ffCheck.rows.every(r => r.returns === 'jsonb');
  console.log(`  All JSONB: ${allJsonb ? '✅' : '❌ still has conflicting types'}`);

  // Wallet new columns
  const wCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name IN ('total_deposited','total_withdrawn','daily_withdrawal_limit','risk_score')
    ORDER BY column_name;
  `);
  console.log(`Wallet new columns: ${wCols.rows.map(r => r.column_name).join(', ')} ${wCols.rows.length >= 3 ? '✅' : '⚠️'}`);

  // Oracle disputes table
  const odCheck = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'oracle_disputes' AND schemaname = 'public';`);
  console.log(`oracle_disputes table: ${odCheck.rows.length > 0 ? '✅' : '❌'}`);

  // Materialized view
  const mvCheck = await client.query(`SELECT matviewname FROM pg_matviews WHERE matviewname = 'leaderboard_mv';`);
  console.log(`leaderboard_mv materialized view: ${mvCheck.rows.length > 0 ? '✅' : '❌'}`);

  // RPCs
  const rpcs = await client.query(`
    SELECT DISTINCT routine_name FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name IN (
      'deposit_funds_v2','withdraw_funds_v2','release_funds_v2','get_wallet_summary_v2','freeze_wallet_v2',
      'get_exchange_rate_v2','record_trade_result_v2','get_leaderboard_v2','get_user_rank_v2',
      'get_price_history_ohlc','get_platform_stats_v2','get_user_analytics_v2',
      'submit_oracle_request_v2','submit_oracle_verdict_v2','dispute_resolution_v2',
      'resolve_dispute_v2','get_oracle_status_v2'
    ) ORDER BY routine_name;
  `);
  console.log(`\nNew RPCs (${rpcs.rows.length}): ${rpcs.rows.map(r => r.routine_name).join(', ')}`);

  // Migration history
  const migs = await client.query(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  console.log(`\nMigration history (${migs.rows.length} entries):`);
  migs.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log(`\n${allSuccess ? '✅ All Phase 4 Enhanced files succeeded!' : '⚠️ Phase 4 completed with issues'}`);
}

runDeploy().catch(err => { console.error('Fatal:', err); process.exit(1); });
