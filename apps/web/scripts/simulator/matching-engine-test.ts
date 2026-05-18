import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { Pool } from 'pg';

const pool = new Pool({ host: '127.0.0.1', port: 5433, database: 'polymarket', user: 'postgres' });

const URL = process.env.SUPABASE_URL || 'http://localhost:8000';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function run() {
  console.log('🔬 Matching Engine Test\n');

  const { rows: users } = await pool.query(
    "SELECT id FROM auth.users WHERE email LIKE 'sim%@ploky.test' LIMIT 3"
  );
  if (users.length < 2) { console.error('Need 2+ sim users'); process.exit(1); }
  const [u1, u2, u3] = users.map(r => r.id);
  console.log(`✅ Users: ${u1.slice(0,8)}..., ${u2.slice(0,8)}..., ${u3.slice(0,8)}...`);

  let marketId: string;
  const { data: existingMarkets, error: mErr } = await supabase.from('markets').select('id,question').limit(1);
  if (mErr) { console.log('Market fetch error:', mErr.message); }
  if (existingMarkets && existingMarkets.length > 0) {
    marketId = existingMarkets[0].id;
    console.log(`✅ Using market: ${existingMarkets[0].question}`);
  } else {
    console.log('❌ No markets found'); process.exit(1);
  }

  console.log('\n📋 Placing orders via direct PostgreSQL...');
  const o1Result = await pool.query(
    `INSERT INTO orders (id, user_id, market_id, side, type, price, quantity, filled_quantity, remaining_quantity, status, outcome, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, 'buy', 'limit', 0.60, 100, 0, 100, 'open', 'YES', now(), now())
     RETURNING id`,
    [u1, marketId]
  );
  const o1Id = o1Result.rows[0].id;
  console.log(`  ✅ Buy YES 100@0.60 -> ${o1Id.slice(0,8)}`);

  const o2Result = await pool.query(
    `INSERT INTO orders (id, user_id, market_id, side, type, price, quantity, filled_quantity, remaining_quantity, status, outcome, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, 'sell', 'limit', 0.60, 100, 0, 100, 'open', 'YES', now(), now())
     RETURNING id`,
    [u2, marketId]
  );
  const o2Id = o2Result.rows[0].id;
  console.log(`  ✅ Sell YES 100@0.60 -> ${o2Id.slice(0,8)}`);

  console.log('\n⚡ Calling match_order_jsonb()...');
  for (const oid of [o1Id, o2Id]) {
    const { data, error } = await supabase.rpc('match_order', { p_order_id: oid });
    if (error) console.log(`  ❌ match_order_jsonb(${oid.slice(0,8)}): ${error.message}`);
    else console.log(`  ✅ match_order -> matched=${data?.matched}, trades=${data?.trade_count}, remaining=${data?.remaining}`);
  }

  console.log('\n🔍 Checking trades...');
  const { data: trades } = await supabase.from('trades').select('*').eq('market_id', marketId).order('created_at', { ascending: false });
  console.log(`  Trades: ${trades?.length || 0}`);
  if (trades) for (const t of trades.slice(0, 5)) {
    console.log(`    ${t.side?.toUpperCase()} ${t.quantity}@${t.price} buyer=${t.buyer_id?.slice(0,8)} seller=${t.seller_id?.slice(0,8)}`);
  }

  console.log('\n💰 Wallets before settlement:');
  const { rows: before } = await pool.query('SELECT user_id, balance, locked_balance FROM wallets WHERE user_id = ANY($1)', [[u1, u2, u3]]);
  for (const w of before) console.log(`  ${w.user_id.slice(0,8)}: bal=${w.balance}, locked=${w.locked_balance}`);

  console.log('\n🏁 Resolving market to YES...');
  await pool.query("UPDATE markets SET status = 'resolved', winning_outcome = 'YES'::outcome_type, resolved_at = now() WHERE id = $1", [marketId]);

  console.log('💸 Calling settle_market()...');
  const { data: sr, error: se } = await supabase.rpc('settle_market', { p_market_id: marketId, p_winning_outcome: 'YES' });
  if (se) console.log(`  ❌ settle_market: ${se.message}`);
  else console.log(`  ✅ settle_market -> users_settled=${sr?.users_settled}, total_payout=${sr?.total_payout}`);

  console.log('\n📊 Wallets after settlement:');
  const { rows: after } = await pool.query('SELECT user_id, balance, locked_balance FROM wallets WHERE user_id = ANY($1)', [[u1, u2, u3]]);
  for (const w of after) console.log(`  ${w.user_id.slice(0,8)}: bal=${w.balance}, locked=${w.locked_balance}`);

  console.log('\n🧹 Cleanup...');
  await pool.query('DELETE FROM trades WHERE market_id = $1', [marketId]);
  await pool.query('DELETE FROM orders WHERE market_id = $1', [marketId]);
  await pool.query("UPDATE markets SET status = 'active', winning_outcome = null, resolved_at = null WHERE id = $1", [marketId]);
  console.log('✅ Test complete');
  await pool.end();
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
