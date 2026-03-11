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
    '20260312100006_orders.sql',
    '20260312100007_trades.sql',
    '20260312100008_wrappers_orders.sql',
    '20260312100009_wrappers_trades.sql'
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    console.log(`\n--- Executing ${file} ---`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await client.query('BEGIN');
      await client.query(sql);
      
      const version = file.split('_')[0];
      const name = file.replace(`${version}_`, '').replace('.sql', '');
      await client.query(`
        INSERT INTO supabase_migrations.schema_migrations (version, statements, name) 
        VALUES ($1, $2, $3)
        ON CONFLICT (version) DO NOTHING;
      `, [version, [sql], name]);
      
      await client.query('COMMIT');
      console.log(`✅ Successfully applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to apply ${file}:`);
      console.error(err.message);
      // Continue to next file to see all errors
      console.log('Continuing to next file...');
    }
  }

  // Phase 3 verification
  console.log('\n\n--- PHASE 3 VERIFICATION ---');
  
  const tableCheck = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('orders', 'orders_v2', 'orders_legacy', 'trades', 'trades_v2', 'trades_legacy')
    ORDER BY tablename;
  `);
  console.log(`Tables: ${tableCheck.rows.map(r => r.tablename).join(', ')}`);

  const rpcCheck = await client.query(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN ('place_order_atomic_v2', 'settle_market_v2', 'place_order_atomic', 'submit_order', 'settle_market')
    ORDER BY routine_name;
  `);
  console.log(`RPCs: ${rpcCheck.rows.map(r => r.routine_name).join(', ')}`);
  
  const migCheck = await client.query(`
    SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
  `);
  console.log(`\nMigration history:`);
  migCheck.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log('\n✅ Phase 3 deployment completed.');
}

runDeploy().catch(err => {
  console.error('Fatal error during deployment:', err);
  process.exit(1);
});
