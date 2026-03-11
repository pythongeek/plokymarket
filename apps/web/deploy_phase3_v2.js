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
    '20260312110001_orders_enhanced.sql',
    '20260312110002_trades_enhanced.sql',
    '20260312110003_wrappers_orders_trades.sql'
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
      if (err.hint) console.error(`   Hint: ${err.hint}`);
      if (err.where) console.error(`   Where: ${err.where}`);
      allSuccess = false;
    }
  }

  // Verification
  console.log('\n\n--- PHASE 3 ENHANCED VERIFICATION ---');

  // Check new columns on orders
  const orderCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name IN ('remaining_quantity','average_fill_price','total_cost','fee_amount','cancelled_at','filled_at','source','is_post_only')
    ORDER BY column_name;
  `);
  console.log(`Orders new columns: ${orderCols.rows.map(r => r.column_name).join(', ')}`);
  console.log(`  ${orderCols.rows.length >= 6 ? '✅' : '⚠️'} Expected ≥6 new columns`);

  // Check new columns on trades
  const tradeCols = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'trades' AND column_name IN ('fee_amount','maker_fee','taker_fee','trade_type','settlement_status','settled_at')
    ORDER BY column_name;
  `);
  console.log(`Trades new columns: ${tradeCols.rows.map(r => r.column_name).join(', ')}`);
  console.log(`  ${tradeCols.rows.length >= 4 ? '✅' : '⚠️'} Expected ≥4 new columns`);

  // Check RPCs
  const rpcs = await client.query(`
    SELECT DISTINCT routine_name FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name IN (
      'place_order_atomic_v2','cancel_order_v2','get_order_book_v2','get_user_orders_v2',
      'expire_stale_orders','execute_trade_v2','upsert_position_v2','settle_market_v2',
      'get_market_trades_v2','get_user_positions_v2','get_market_stats_v2',
      'cancel_order','get_order_book','get_user_orders','get_market_trades'
    ) ORDER BY routine_name;
  `);
  console.log(`\nRPCs deployed: ${rpcs.rows.map(r => r.routine_name).join(', ')}`);
  console.log(`  ${rpcs.rows.length >= 10 ? '✅' : '⚠️'} Expected ≥10 RPCs`);

  // Migration count
  const migs = await client.query(`SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;`);
  console.log(`\nMigration history (${migs.rows.length} entries):`);
  migs.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log(`\n${allSuccess ? '✅ All Phase 3 Enhanced files succeeded!' : '⚠️ Phase 3 completed with issues'}`);
}

runDeploy().catch(err => { console.error('Fatal:', err); process.exit(1); });
