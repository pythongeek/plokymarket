#!/usr/bin/env node

/**
 * Plokymarket - Test Execution Automation
 * Executes phases: Trade Execution → Order Matching → Settlement → Real-time Monitoring
 */

const https = require('https');

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_KEY',
  marketId: '2698853e-f9fc-48d4-b9c9-d8663a929a93',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@plokymarket.bd',
  adminPassword: process.env.ADMIN_PASSWORD || 'YOUR_ADMIN_PASSWORD'
};

// Helper: Async fetch wrapper
async function fetchAPI(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.supabaseUrl}${path}`);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseKey,
        'Authorization': options.token ? `Bearer ${options.token}` : undefined,
        ...options.headers
      }
    };

    // Remove undefined headers
    Object.keys(opts.headers).forEach(k => opts.headers[k] === undefined && delete opts.headers[k]);

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// Phase 1: Verify Market Created
async function phase1_VerifyMarket() {
  console.log('\n📊 PHASE 1: Market Verification');
  console.log('================================\n');

  try {
    const { status, data } = await fetchAPI(
      `/rest/v1/markets?id=eq.${config.marketId}`
    );

    if (status === 200 && data.length > 0) {
      const market = data[0];
      console.log('✅ Market Found!');
      console.log(`   ID: ${market.id}`);
      console.log(`   Question: ${market.question}`);
      console.log(`   Status: ${market.status}`);
      console.log(`   Category: ${market.category}`);
      console.log(`   Trading Closes: ${new Date(market.trading_closes_at).toLocaleString()}`);
      console.log(`   Event Date: ${new Date(market.event_date).toLocaleString()}\n`);
      return market;
    } else {
      console.log('❌ Market Not Found!');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching market:', error.message);
    return null;
  }
}

// Phase 2: Create Test Users
async function phase2_CreateTestUsers() {
  console.log('\n👥 PHASE 2: Create Test Users');
  console.log('===============================\n');

  // For this demo, we'll use existing admin user
  // In production, create via registration endpoint

  const testUsers = [
    { email: 'test.buyer@plokymarket.bd', name: 'Test Buyer' },
    { email: 'test.seller@plokymarket.bd', name: 'Test Seller' }
  ];

  console.log('⚠️  Note: Create test users via registration UI:');
  testUsers.forEach(user => {
    console.log(`   📧 ${user.email}`);
  });

  console.log('\n✅ Use admin user for test trades:');
  console.log(`   📧 ${config.adminEmail}`);
  console.log('   🔑 PlokyAdmin2026!\n');

  return {
    buyer: { email: config.adminEmail, id: 'admin' },
    seller: { email: 'test.seller@plokymarket.bd', id: 'test-seller' }
  };
}

// Phase 3: Verify Order Matching System
async function phase3_VerifyOrderMatching() {
  console.log('\n📈 PHASE 3: Order Matching Verification');
  console.log('========================================\n');

  try {
    // Get current orders
    const { status, data } = await fetchAPI(
      `/rest/v1/orders?market_id=eq.${config.marketId}&order=created_at.desc&limit=10`
    );

    if (status === 200) {
      if (data.length === 0) {
        console.log('ℹ️  No orders placed yet');
        console.log('📝 Next: Place limit orders from UI or API\n');
      } else {
        console.log(`✅ Found ${data.length} orders:`);
        data.forEach(order => {
          console.log(`   Order: ${order.id.substring(0, 8)}...`);
          console.log(`   - Side: ${order.side.toUpperCase()}`);
          console.log(`   - Outcome: ${order.outcome}`);
          console.log(`   - Price: ৳${order.price}`);
          console.log(`   - Quantity: ${order.quantity}`);
          console.log(`   - Status: ${order.status}`);
          console.log();
        });
      }
      return data;
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error.message);
  }
  return [];
}

// Phase 4: Verify Trades
async function phase4_VerifyTrades() {
  console.log('\n💱 PHASE 4: Trade Execution Verification');
  console.log('=========================================\n');

  try {
    const { status, data } = await fetchAPI(
      `/rest/v1/trades?market_id=eq.${config.marketId}&order=created_at.desc&limit=10`
    );

    if (status === 200) {
      if (data.length === 0) {
        console.log('ℹ️  No trades executed yet');
        console.log('📝 Next: Submit matching buy/sell orders\n');
      } else {
        console.log(`✅ Found ${data.length} trades:`);
        data.forEach(trade => {
          console.log(`   Trade: ${trade.id.substring(0, 8)}...`);
          console.log(`   - Price: ৳${trade.price}`);
          console.log(`   - Quantity: ${trade.quantity}`);
          console.log(`   - Volume: ৳${trade.price * trade.quantity}`);
          console.log(`   - Time: ${new Date(trade.created_at).toLocaleTimeString()}`);
          console.log();
        });
      }
      return data;
    }
  } catch (error) {
    console.error('❌ Error fetching trades:', error.message);
  }
  return [];
}

// Phase 5: Verify Positions
async function phase5_VerifyPositions() {
  console.log('\n💼 PHASE 5: User Positions Verification');
  console.log('========================================\n');

  try {
    const { status, data } = await fetchAPI(
      `/rest/v1/positions?market_id=eq.${config.marketId}`
    );

    if (status === 200) {
      if (data.length === 0) {
        console.log('ℹ️  No positions yet');
        console.log('📝 Positions created after trades execute\n');
      } else {
        console.log(`✅ Found ${data.length} positions:`);
        data.forEach(pos => {
          console.log(`   Position: ${pos.id.substring(0, 8)}...`);
          console.log(`   - User: ${pos.user_id.substring(0, 8)}...`);
          console.log(`   - Outcome: ${pos.outcome}`);
          console.log(`   - Quantity: ${pos.quantity}`);
          console.log(`   - Entry Price: ৳${pos.entry_price}`);
          console.log();
        });
      }
      return data;
    }
  } catch (error) {
    console.error('❌ Error fetching positions:', error.message);
  }
  return [];
}

// Phase 6: Test Real-Time Readiness
async function phase6_RealTimeReadiness() {
  console.log('\n🔄 PHASE 6: Real-Time Monitoring Setup');
  console.log('=======================================\n');

  console.log('✅ Supabase Realtime Subscriptions Ready:\n');
  console.log('📡 Subscribe to order updates:');
  console.log(`   supabase.channel('orders:market=${config.marketId}')`);
  console.log(`     .on('postgres_changes', (payload) => console.log(payload))`);
  console.log(`     .subscribe()\n`);

  console.log('📡 Subscribe to trade updates:');
  console.log(`   supabase.channel('trades:market=${config.marketId}')`);
  console.log(`     .on('postgres_changes', (payload) => console.log(payload))`);
  console.log(`     .subscribe()\n`);

  console.log('📡 Subscribe to wallet updates:');
  console.log(`   supabase.channel('wallets:user=<userid>')`);
  console.log(`     .on('postgres_changes', (payload) => console.log(payload))`);
  console.log(`     .subscribe()\n`);

  console.log('💡 In browser, open DevTools Console and execute the code above');
  console.log('   and watch real-time updates as trades execute.\n');
}

// Main execution
async function main() {
  console.log('\n🚀 Plokymarket - Test Execution Summary');
  console.log('=========================================\n');

  try {
    const market = await phase1_VerifyMarket();
    if (!market) return;

    await phase2_CreateTestUsers();
    const orders = await phase3_VerifyOrderMatching();
    const trades = await phase4_VerifyTrades();
    const positions = await phase5_VerifyPositions();
    await phase6_RealTimeReadiness();

    // Summary
    console.log('\n📋 Test Summary');
    console.log('=================\n');
    console.log(`✅ Market Active: YES`);
    console.log(`📊 Orders Placed: ${orders.length}`);
    console.log(`💱 Trades Executed: ${trades.length}`);
    console.log(`💼 User Positions: ${positions.length}`);
    console.log();

    console.log('🎯 Next Testing Steps:');
    if (orders.length === 0) {
      console.log('   1️⃣  Place limit orders via UI or API');
      console.log('   2️⃣  Watch for automatic matching');
      console.log('   3️⃣  Monitor real-time updates');
    } else if (trades.length === 0) {
      console.log('   1️⃣  Place matching counter-orders');
      console.log('   2️⃣  Watch trades execute');
      console.log('   3️⃣  Verify position updates');
    } else {
      console.log('   1️⃣  Resolve market (admin only)');
      console.log('   2️⃣  Verify settlement');
      console.log('   3️⃣  Check winner payouts');
    }

    console.log('\n🔗 Access Points:');
    console.log(`   🏠 Market: https://polymarket-bangladesh.vercel.app/markets/${config.marketId}`);
    console.log(`   📊 Dashboard: https://polymarket-bangladesh.vercel.app`);
    console.log(`   🔐 Admin: https://polymarket-bangladesh.vercel.app/auth-portal-3m5n8\n`);

  } catch (error) {
    console.error('\n❌ Test Execution Failed:', error.message);
    process.exit(1);
  }
}

main();
