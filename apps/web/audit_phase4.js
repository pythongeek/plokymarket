const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function audit() {
  await client.connect();

  // 1. Check if leaderboard table exists
  console.log('=== LEADERBOARD TABLE ===');
  const lbExists = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'leaderboard' AND schemaname = 'public';`);
  console.log(`  Exists: ${lbExists.rows.length > 0 ? 'YES' : 'NO'}`);
  if (lbExists.rows.length > 0) {
    const lbCols = await client.query(`SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'leaderboard' AND table_schema = 'public' ORDER BY ordinal_position;`);
    lbCols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.udt_name}`));
  }

  // 2. Wallets table current state
  console.log('\n=== WALLETS TABLE ===');
  const wCols = await client.query(`SELECT column_name, udt_name, column_default FROM information_schema.columns WHERE table_name = 'wallets' AND table_schema = 'public' ORDER BY ordinal_position;`);
  wCols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.udt_name} | ${c.column_default || 'NULL'}`));
  console.log(`  TOTAL: ${wCols.rows.length} columns`);
  const wCount = await client.query(`SELECT COUNT(*) as cnt FROM wallets;`);
  console.log(`  ROWS: ${wCount.rows[0].cnt}`);

  // 3. Check existing freeze_funds signatures (the conflict)
  console.log('\n=== FREEZE_FUNDS SIGNATURES ===');
  const ffSigs = await client.query(`
    SELECT p.proname, pg_get_function_arguments(p.oid) as args, pg_get_function_result(p.oid) as returns
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname LIKE 'freeze_funds%'
    ORDER BY p.proname;
  `);
  ffSigs.rows.forEach(r => console.log(`  ${r.proname}(${r.args}) -> ${r.returns}`));

  // 4. Transactions table
  console.log('\n=== TRANSACTIONS TABLE ===');
  const txExists = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'transactions' AND schemaname = 'public';`);
  console.log(`  transactions: ${txExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  const wtxExists = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'wallet_transactions' AND schemaname = 'public';`);
  console.log(`  wallet_transactions: ${wtxExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  if (txExists.rows.length > 0) {
    const txCols = await client.query(`SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'transactions' AND table_schema = 'public' ORDER BY ordinal_position;`);
    txCols.rows.forEach(c => console.log(`    ${c.column_name} | ${c.udt_name}`));
    const txCount = await client.query(`SELECT COUNT(*) as cnt FROM transactions;`);
    console.log(`    ROWS: ${txCount.rows[0].cnt}`);
  }

  // 5. Payment transactions
  console.log('\n=== PAYMENT_TRANSACTIONS TABLE ===');
  const ptExists = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'payment_transactions' AND schemaname = 'public';`);
  console.log(`  payment_transactions: ${ptExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  if (ptExists.rows.length > 0) {
    const ptCols = await client.query(`SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'payment_transactions' AND table_schema = 'public' ORDER BY ordinal_position;`);
    ptCols.rows.forEach(c => console.log(`    ${c.column_name} | ${c.udt_name}`));
  }

  // 6. Price history
  console.log('\n=== PRICE_HISTORY TABLE ===');
  const phExists = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'price_history' AND schemaname = 'public';`);
  console.log(`  price_history: ${phExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  if (phExists.rows.length > 0) {
    const phCols = await client.query(`SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'price_history' AND table_schema = 'public' ORDER BY ordinal_position;`);
    phCols.rows.forEach(c => console.log(`    ${c.column_name} | ${c.udt_name}`));
  }

  // 7. Exchange rates
  console.log('\n=== EXCHANGE_RATES TABLE ===');
  const erExists = await client.query(`SELECT tablename FROM pg_tables WHERE tablename = 'exchange_rates' AND schemaname = 'public';`);
  console.log(`  exchange_rates: ${erExists.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  if (erExists.rows.length > 0) {
    const erCols = await client.query(`SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = 'exchange_rates' AND table_schema = 'public' ORDER BY ordinal_position;`);
    erCols.rows.forEach(c => console.log(`    ${c.column_name} | ${c.udt_name}`));
  }

  // 8. Oracle tables
  console.log('\n=== ORACLE TABLES ===');
  const orTables = await client.query(`SELECT tablename FROM pg_tables WHERE tablename LIKE 'oracle%' AND schemaname = 'public' ORDER BY tablename;`);
  orTables.rows.forEach(t => console.log(`  ${t.tablename}`));

  // 9. All wallet-related RPCs
  console.log('\n=== WALLET/ANALYTICS RPCs ===');
  const rpcs = await client.query(`
    SELECT DISTINCT p.proname, pg_get_function_result(p.oid) as returns
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND (
      p.proname LIKE '%wallet%' OR p.proname LIKE '%deposit%' OR p.proname LIKE '%withdraw%' 
      OR p.proname LIKE '%leaderboard%' OR p.proname LIKE '%exchange%' OR p.proname LIKE '%price%'
      OR p.proname LIKE '%analytics%' OR p.proname LIKE '%transaction%'
    )
    ORDER BY p.proname;
  `);
  rpcs.rows.forEach(r => console.log(`  ${r.proname} -> ${r.returns}`));

  await client.end();
}

audit().catch(err => { console.error('Audit failed:', err.message); process.exit(1); });
