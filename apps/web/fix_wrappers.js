const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function fixWrappers() {
  console.log('Connecting...');
  await client.connect();

  const fixes = [
    // unfreeze_funds: drop boolean, recreate as jsonb wrapping release_funds_v2
    {
      name: 'unfreeze_funds',
      drop: `DROP FUNCTION IF EXISTS public.unfreeze_funds(uuid, numeric);`,
      create: `
        CREATE OR REPLACE FUNCTION public.unfreeze_funds(p_user_id UUID, p_amount NUMERIC)
        RETURNS jsonb AS $$
        BEGIN RETURN public.release_funds_v2(p_user_id, p_amount); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // credit_wallet: drop void, recreate as jsonb wrapping deposit_funds_v2
    {
      name: 'credit_wallet',
      drop: `DROP FUNCTION IF EXISTS public.credit_wallet(uuid, numeric);`,
      create: `
        CREATE OR REPLACE FUNCTION public.credit_wallet(p_user_id UUID, p_amount NUMERIC)
        RETURNS jsonb AS $$
        BEGIN RETURN public.deposit_funds_v2(p_user_id, p_amount, 'system'); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // debit_wallet: drop boolean, recreate as jsonb wrapping withdraw_funds_v2
    {
      name: 'debit_wallet',
      drop: `DROP FUNCTION IF EXISTS public.debit_wallet(uuid, numeric);`,
      create: `
        CREATE OR REPLACE FUNCTION public.debit_wallet(p_user_id UUID, p_amount NUMERIC)
        RETURNS jsonb AS $$
        BEGIN RETURN public.withdraw_funds_v2(p_user_id, p_amount, 'system'); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // lock_wallet_funds: drop boolean, recreate as jsonb wrapping freeze_funds_v2
    {
      name: 'lock_wallet_funds',
      drop: `DROP FUNCTION IF EXISTS public.lock_wallet_funds(uuid, numeric);`,
      create: `
        CREATE OR REPLACE FUNCTION public.lock_wallet_funds(p_user_id UUID, p_amount NUMERIC)
        RETURNS jsonb AS $$
        BEGIN RETURN public.freeze_funds_v2(p_user_id, p_amount); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // unlock_wallet_funds: change void to jsonb wrapping release_funds_v2
    {
      name: 'unlock_wallet_funds',
      drop: `DROP FUNCTION IF EXISTS public.unlock_wallet_funds(uuid, numeric);`,
      create: `
        CREATE OR REPLACE FUNCTION public.unlock_wallet_funds(p_user_id UUID, p_amount NUMERIC)
        RETURNS jsonb AS $$
        BEGIN RETURN public.release_funds_v2(p_user_id, p_amount); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // get_platform_analytics: may have varchar arg conflict
    {
      name: 'get_platform_analytics',
      drop: `DROP FUNCTION IF EXISTS public.get_platform_analytics(character varying);`,
      create: `
        CREATE OR REPLACE FUNCTION public.get_platform_analytics(p_period VARCHAR DEFAULT '24h')
        RETURNS jsonb AS $$
        BEGIN RETURN public.get_platform_stats_v2(); END;
        $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
      `
    },
    // update_position: may have different arg count
    {
      name: 'update_position',
      drop: `DROP FUNCTION IF EXISTS public.update_position(uuid, uuid, outcome_type, numeric, numeric);`,
      create: `
        CREATE OR REPLACE FUNCTION public.update_position(
          p_user_id UUID, p_market_id UUID, p_outcome outcome_type,
          p_quantity NUMERIC, p_price NUMERIC
        ) RETURNS void AS $$
        BEGIN PERFORM public.upsert_position_v2(p_user_id, p_market_id, p_outcome, p_quantity, p_price, 'buy'); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    // create_event_complete_v1: wrapper to v3
    {
      name: 'create_event_complete_v1',
      drop: `DROP FUNCTION IF EXISTS public.create_event_complete_v1(jsonb);`,
      create: `
        CREATE OR REPLACE FUNCTION public.create_event_complete_v1(event_data jsonb)
        RETURNS jsonb AS $$
        BEGIN RETURN public.create_event_complete_v3(event_data); END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ];

  let pass = 0, fail = 0;
  for (const fix of fixes) {
    try {
      await client.query('BEGIN');
      await client.query(fix.drop);
      await client.query(fix.create);
      await client.query('COMMIT');
      console.log(`✅ ${fix.name}: dropped & recreated as wrapper`);
      pass++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ ${fix.name}: ${err.message}`);
      fail++;
    }
  }

  // Track in migrations
  await client.query(`INSERT INTO supabase_migrations.schema_migrations (version, statements, name) VALUES ($1, $2, $3) ON CONFLICT (version) DO NOTHING;`, ['20260312130001', ['wrapper_migration_fix'], 'wrapper_migration']);

  // Verify: all wallet functions should return jsonb now
  console.log('\n--- RETURN TYPE CHECK ---');
  const check = await client.query(`
    SELECT p.proname, pg_get_function_result(p.oid) as returns
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN (
      'freeze_funds', 'unfreeze_funds', 'credit_wallet', 'debit_wallet',
      'lock_wallet_funds', 'unlock_wallet_funds', 'get_platform_analytics',
      'create_event_complete_v1'
    ) ORDER BY p.proname;
  `);
  check.rows.forEach(r => console.log(`  ${r.proname} → ${r.returns}`));

  // Count total wrappers
  const wrappers = await client.query(`
    SELECT COUNT(*) as cnt FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prokind = 'f'
    AND (pg_get_functiondef(p.oid) LIKE '%_v2(%' OR pg_get_functiondef(p.oid) LIKE '%_v3(%')
    AND p.proname NOT LIKE '%_v2' AND p.proname NOT LIKE '%_v3';
  `);
  console.log(`\nTotal active wrappers: ${wrappers.rows[0].cnt}`);
  console.log(`\n${fail === 0 ? '✅ All wrapper fixes applied!' : `⚠️ ${fail} fixes failed`}`);

  await client.end();
}

fixWrappers().catch(err => { console.error('Fatal:', err); process.exit(1); });
