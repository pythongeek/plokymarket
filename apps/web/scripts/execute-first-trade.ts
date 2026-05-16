/**
 * Execute First Trade — End-to-End Simulation
 * Registers 2 test users, deposits funds, places opposing orders,
 * asserts matching engine creates Trade record and updates Positions.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createUser(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;

  // Create profile
  await supabase.from('user_profiles').insert({
    id: data.user.id,
    email,
    full_name: fullName,
    is_admin: false,
  });

  // Create wallet
  await supabase.from('wallets').insert({
    user_id: data.user.id,
    balance: 10000,
    locked_balance: 0,
  });

  return data.user;
}

async function createTestMarket() {
  // Create event first
  const { data: event, error: eErr } = await supabase
    .from('events')
    .insert({
      title: 'First Trade Test Event',
      category: 'crypto',
      status: 'active',
      closing_date: new Date(Date.now() + 86400000).toISOString(),
    })
    .select()
    .single();

  if (eErr) throw eErr;

  const { data: market, error: mErr } = await supabase
    .from('markets')
    .insert({
      event_id: event.id,
      title: 'Will BTC exceed $100k by end of month?',
      status: 'active',
      outcome_yes_price: 0.50,
      outcome_no_price: 0.50,
      total_volume: 0,
      liquidity: 1000,
    })
    .select()
    .single();

  if (mErr) throw mErr;
  return market;
}

async function placeOrder(userId: string, marketId: string, side: string, outcome: string, price: number, quantity: number) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      market_id: marketId,
      side,
      outcome,
      price,
      quantity,
      filled_quantity: 0,
      status: 'open',
      order_type: 'limit',
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger matching engine
  const { data: matchResult, error: matchErr } = await supabase.rpc('match_order', {
    p_order_id: data.id,
  });

  if (matchErr) throw matchErr;

  return { order: data, matchResult };
}

async function main() {
  console.log('🚀 FIRST TRADE SIMULATION');
  console.log('========================');

  // Step 1: Create users
  console.log('\n[1/5] Creating test users...');
  const userA = await createUser('user-a@plokymarket.test', 'TestPass123!', 'User A');
  const userB = await createUser('user-b@plokymarket.test', 'TestPass123!', 'User B');
  console.log(`✅ User A: ${userA.id}`);
  console.log(`✅ User B: ${userB.id}`);

  // Step 2: Create market
  console.log('\n[2/5] Creating test market...');
  const market = await createTestMarket();
  console.log(`✅ Market: ${market.id}`);

  // Step 3: Place opposing orders
  console.log('\n[3/5] Placing opposing orders...');
  const resultA = await placeOrder(userA.id, market.id, 'buy', 'YES', 0.55, 100);
  console.log(`✅ User A placed BUY YES @ 0.55 x100 (order: ${resultA.order.id})`);

  const resultB = await placeOrder(userB.id, market.id, 'buy', 'NO', 0.45, 100);
  console.log(`✅ User B placed BUY NO @ 0.45 x100 (order: ${resultB.order.id})`);

  // Step 4: Verify trade record
  console.log('\n[4/5] Verifying trade records...');
  const { data: trades, error: tErr } = await supabase
    .from('trades')
    .select('*')
    .eq('market_id', market.id);

  if (tErr) throw tErr;

  if (trades.length === 0) {
    console.error('❌ No trades created — matching engine did not match orders');
    process.exit(1);
  }

  console.log(`✅ ${trades.length} trade(s) created`);
  trades.forEach((t, i) => {
    console.log(`   Trade ${i + 1}: qty=${t.quantity}, price=${t.price}, buyer=${t.buyer_id?.slice(0, 8)}..., seller=${t.seller_id?.slice(0, 8)}...`);
  });

  // Step 5: Verify positions
  console.log('\n[5/5] Verifying positions...');
  const { data: positions, error: pErr } = await supabase
    .from('positions')
    .select('*')
    .eq('market_id', market.id);

  if (pErr) throw pErr;

  if (positions.length === 0) {
    console.error('❌ No positions updated');
    process.exit(1);
  }

  console.log(`✅ ${positions.length} position(s) updated`);
  positions.forEach((p) => {
    console.log(`   User ${p.user_id.slice(0, 8)}... | ${p.outcome} | qty=${p.quantity} | avg_price=${p.average_price}`);
  });

  console.log('\n🎉 FIRST TRADE SIMULATION: SUCCESS');
  console.log('Platform is ready for live trading.');
}

main().catch((err) => {
  console.error('❌ Simulation failed:', err);
  process.exit(1);
});
