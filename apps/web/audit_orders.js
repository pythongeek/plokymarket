const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function audit() {
  await client.connect();

  // 1. Orders table columns
  console.log('=== ORDERS TABLE ===');
  const ordersCols = await client.query(`
    SELECT column_name, data_type, udt_name, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'orders' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  ordersCols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.udt_name} | default: ${c.column_default || 'NULL'} | nullable: ${c.is_nullable}`));
  console.log(`  TOTAL: ${ordersCols.rows.length} columns`);

  // 2. Orders row count
  const ordersCount = await client.query(`SELECT COUNT(*) as cnt FROM orders;`);
  console.log(`  ROWS: ${ordersCount.rows[0].cnt}`);

  // 3. Orders indexes
  const ordersIdx = await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders' AND schemaname = 'public';`);
  console.log(`  INDEXES: ${ordersIdx.rows.length}`);
  ordersIdx.rows.forEach(i => console.log(`    ${i.indexname}`));

  // 4. Orders triggers
  const ordersTrg = await client.query(`SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'orders' AND trigger_schema = 'public';`);
  console.log(`  TRIGGERS: ${ordersTrg.rows.length}`);
  ordersTrg.rows.forEach(t => console.log(`    ${t.trigger_name}`));

  // 5. Trades table columns
  console.log('\n=== TRADES TABLE ===');
  const tradesCols = await client.query(`
    SELECT column_name, data_type, udt_name, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'trades' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  tradesCols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.udt_name} | default: ${c.column_default || 'NULL'} | nullable: ${c.is_nullable}`));
  console.log(`  TOTAL: ${tradesCols.rows.length} columns`);

  const tradesCount = await client.query(`SELECT COUNT(*) as cnt FROM trades;`);
  console.log(`  ROWS: ${tradesCount.rows[0].cnt}`);

  // 6. Existing orders/trades RPCs  
  console.log('\n=== EXISTING RPCs ===');
  const rpcs = await client.query(`
    SELECT routine_name, data_type as return_type
    FROM information_schema.routines
    WHERE routine_schema = 'public' 
      AND routine_name IN ('place_order_atomic','place_order_atomic_v2','match_order','cancel_order','get_user_orders','get_order_book','settle_market','settle_market_v2','settle_trade_cash','execute_trade','get_market_trades')
    ORDER BY routine_name;
  `);
  rpcs.rows.forEach(r => console.log(`  ${r.routine_name} -> ${r.return_type}`));

  // 7. Check positions table
  console.log('\n=== POSITIONS TABLE ===');
  const posCols = await client.query(`
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_name = 'positions' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  if (posCols.rows.length > 0) {
    posCols.rows.forEach(c => console.log(`  ${c.column_name} | ${c.udt_name}`));
  } else {
    console.log('  (table does not exist)');
  }

  await client.end();
}

audit().catch(err => { console.error('Audit failed:', err.message); process.exit(1); });
