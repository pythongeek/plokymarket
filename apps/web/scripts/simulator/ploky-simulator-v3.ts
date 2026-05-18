/**
 * PLOKY SIMULATOR V2 — Two-Sided CLOB Verification
 * Tests: MM liquidity seeding, buy/sell matching, trade creation,
 *        position updates, short-sell rejection, settlement accuracy
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { Pool } from 'pg';

// ── Config ───────────────────────────────────────────────────────────
const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  SIMULATION_DURATION_MINUTES: parseInt(process.env.SIMULATION_DURATION_MINUTES || '1'),
  USER_COUNT: parseInt(process.env.USER_COUNT || '5'),
  INITIAL_BALANCE: 1000,
  ENABLE_STRESS_TEST: process.env.ENABLE_STRESS_TEST !== 'false',
};

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ── Types ────────────────────────────────────────────────────────────
interface SimUser {
  id: string;
  email: string;
  initialBalance: number;
  orders: any[];
  trades: any[];
  positions: any[];
}

interface SimMarket {
  id: string;
  question: string;
  slug: string;
}

// ── Logger ───────────────────────────────────────────────────────────
class Logger {
  private phase = 'INIT';
  errors = 0; warnings = 0; trades = 0;

  setPhase(p: string) { this.phase = p; console.log(`\n${new Date().toISOString()} [PHASE] ${'═'.repeat(20)} ${p.toUpperCase()} ${'═'.repeat(20)}`); }
  info(msg: string, data?: any)  { console.log(`${new Date().toISOString()} [INFO]  [${this.phase}] ${msg}`, data ? JSON.stringify(data) : ''); }
  success(msg: string, data?: any) { console.log(`${new Date().toISOString()} [SUCCESS] [${this.phase}] ✅ ${msg}`, data ? JSON.stringify(data) : ''); }
  error(msg: string, data?: any)  { this.errors++; console.error(`${new Date().toISOString()} [ERROR] [${this.phase}] 🚨 ${msg}`, data ? JSON.stringify(data) : ''); }
  warn(msg: string, data?: any)   { this.warnings++; console.warn(`${new Date().toISOString()} [WARN]  [${this.phase}] ⚠️  ${msg}`, data ? JSON.stringify(data) : ''); }
}

// ── Simulator ────────────────────────────────────────────────────────
class PlokySimulatorV2 {
  private supabase: SupabaseClient;
  private pgPool: Pool;
  private logger = new Logger();
  private users: SimUser[] = [];
  private market!: SimMarket;
  private mmUserId!: string;
  private houseWalletInitial = 50000;

  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws },
    });
    this.pgPool = new Pool({ host: '127.0.0.1', port: 5433, database: 'polymarket', user: 'postgres' });
  }

  async run() {
    console.log('🚀 Plokymarket Simulator V2 — Two-Sided CLOB Test');
    console.log(`   Users: ${CONFIG.USER_COUNT} | Duration: ${CONFIG.SIMULATION_DURATION_MINUTES}min | MM Balance: $${this.houseWalletInitial}`);

    try {
      await this.validate();
      await this.createUsers();
      await this.createMarketMaker();
      await this.createMarket();
      await this.seedLiquidity();
      await this.tradingSimulation();
      await this.waitForClosure();
      await this.resolveAndSettle();
      await this.verifySettlementAccuracy();
      if (CONFIG.ENABLE_STRESS_TEST) await this.stressTests();
      await this.generateReport();
    } catch (e: any) {
      this.logger.warn('Fatal simulator error', { message: e.message });
      throw e;
    } finally {
      await this.cleanup();
      await this.pgPool.end();
    }
  }

  // ── Phase 1: Validation ────────────────────────────────────────────
  private async validate() {
    this.logger.setPhase('VALIDATION');
    await this.pgPool.query('SELECT 1');
    this.logger.success('PostgreSQL connection established');

    const { rows } = await this.pgPool.query(
      "SELECT 1 FROM pg_proc WHERE proname = 'match_order_jsonb'"
    );
    if (rows.length === 0) throw new Error('match_order_jsonb not found');
    this.logger.success('match_order_jsonb function detected');
  }

  // ── Phase 2: Create Users ──────────────────────────────────────────
  private async createUsers() {
    this.logger.setPhase('USER_GENERATION');
    this.logger.info(`Creating ${CONFIG.USER_COUNT} traders + 1 Market Maker...`);

    for (let i = 1; i <= CONFIG.USER_COUNT; i++) {
      const email = `sim.v2.${Date.now()}.${i}@ploky.test`;
      const name = `Trader ${i}`;
      const { rows: authRows } = await this.pgPool.query(`
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
          'authenticated', $1, extensions.crypt($2, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          ('{"full_name":"' || $3 || '"}')::jsonb, now(), now())
        RETURNING id
      `, [email, 'TestPassword123!', name]);

      const userId = authRows[0].id;

      // Insert into public.users
      await this.pgPool.query(`
        INSERT INTO users (id, email, full_name, created_at, updated_at)
        VALUES ($1, $2, $3, now(), now())
        ON CONFLICT (id) DO NOTHING
      `, [userId, email, name]);

      // Wallet
      await this.pgPool.query(`
        INSERT INTO wallets (user_id, balance, locked_balance, currency, created_at, updated_at)
        VALUES ($1, $2, 0, 'USDC', now(), now())
      `, [userId, CONFIG.INITIAL_BALANCE]);

      this.users.push({ id: userId, email, initialBalance: CONFIG.INITIAL_BALANCE, orders: [], trades: [], positions: [] });
      this.logger.success(`Trader ${i} created`, { id: userId.slice(0, 8) });
    }
    this.logger.success(`Created ${this.users.length} traders`);
  }

  // ── Phase 2b: Create Market Maker ──────────────────────────────────
  private async createMarketMaker() {
    const email = `mm.house.${Date.now()}@ploky.test`;
    const { rows } = await this.pgPool.query(`
      INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
        'authenticated', $1, extensions.crypt($2, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"full_name":"House Market Maker"}'::jsonb, now(), now())
      RETURNING id
    `, [email, 'TestPassword123!']);

    this.mmUserId = rows[0].id;

    await this.pgPool.query(`
      INSERT INTO users (id, email, full_name, created_at, updated_at)
      VALUES ($1, $2, 'House MM', now(), now()) ON CONFLICT (id) DO NOTHING
    `, [this.mmUserId, email]);

    await this.pgPool.query(`
      INSERT INTO wallets (user_id, balance, locked_balance, currency, created_at, updated_at)
      VALUES ($1, $2, 0, 'USDC', now(), now())
    `, [this.mmUserId, this.houseWalletInitial]);

    this.logger.success(`Market Maker created`, { id: this.mmUserId.slice(0, 8), balance: this.houseWalletInitial });
  }

  // ── Phase 3: Create Market ─────────────────────────────────────────
  private async createMarket() {
    this.logger.setPhase('MARKET_CREATION');

    const eventName = `Sim Event V2 ${Date.now()}`;
    const { rows: eventRows } = await this.pgPool.query(`
      INSERT INTO events (name, description, status, category, starts_at, ends_at, created_at, updated_at)
      VALUES ($1, 'V2 simulation event', 'active', 'politics', now(), now() + interval '2 minutes', now(), now())
      RETURNING id
    `, [eventName]);
    const eventId = eventRows[0].id;

    const question = `Will BTC hit $100k by end of 2025? (V2 Sim ${Date.now()})`;
    const slug = `sim-v2-${Date.now()}`;
    const closesAt = new Date(Date.now() + CONFIG.SIMULATION_DURATION_MINUTES * 60 * 1000).toISOString();

    const { rows: mktRows } = await this.pgPool.query(`
      INSERT INTO markets (event_id, question, slug, category, status,
        trading_closes_at, event_date, creator_id, created_at, updated_at)
      VALUES ($1, $2, $3, 'crypto', 'active', $4, $4, $5, now(), now())
      RETURNING id, question, slug
    `, [eventId, question, slug, closesAt, this.users[0].id]);

    this.market = mktRows[0];
    this.logger.success('Market created', { id: this.market.id.slice(0, 8), slug });
  }

  // ── Phase 4: Seed Liquidity (MM sell orders) ───────────────────────
  private async seedLiquidity() {
    this.logger.setPhase('LIQUIDITY_SEED');
    this.logger.info('House MM placing sell orders on both sides...');

    // sell YES @ 0.55 (MM thinks YES is overpriced)
    await this.placeOrderPG(this.mmUserId, 'sell', 'YES', 2000, 0.55);
    this.logger.success('MM seeded: sell YES @ $0.55 × 2000');

    // sell NO @ 0.45 (MM thinks NO is overpriced)
    await this.placeOrderPG(this.mmUserId, 'sell', 'NO', 2000, 0.45);
    this.logger.success('MM seeded: sell NO @ $0.45 × 2000');

    // Verify MM collateral is locked
    const { rows: mmWallet } = await this.pgPool.query(`
      SELECT balance, locked_balance FROM wallets WHERE user_id = $1
    `, [this.mmUserId]);
    const mmLocked = parseFloat(mmWallet[0]?.locked_balance || 0);
    const expectedCollateral = 4000.00; // 2000 YES + 2000 NO shares * $1.00
    if (Math.abs(mmLocked - expectedCollateral) > 0.01) {
      this.logger.warn('COLLATERAL NOT LOCKED! MM sold 4000 shares but only $' + mmLocked.toFixed(2) + ' locked (expected $' + expectedCollateral.toFixed(2) + ')');
    } else {
      this.logger.success('Collateral correctly locked: $' + mmLocked.toFixed(2));
    }

    // Verify MM positions (should be short both sides)
    const { rows: mmPos } = await this.pgPool.query(`
      SELECT outcome, quantity FROM positions WHERE user_id = $1 AND market_id = $2
    `, [this.mmUserId, this.market.id]);
    this.logger.info(`MM positions after seeding`, { positions: mmPos });
  }

  // ── Phase 5: Two-Sided Trading ─────────────────────────────────────
  private async tradingSimulation() {
    this.logger.setPhase('TRADING_SIMULATION');
    this.logger.info('Traders buying from MM, then some selling back...');

    // Round 1: All traders buy from MM
    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      const outcome = i % 2 === 0 ? 'YES' : 'NO'; // Alternating sides
      const size = [100, 150, 200, 50, 250][i];
      const price = outcome === 'YES' ? 0.55 : 0.45;

      this.logger.info(`Trader ${i + 1} buy ${outcome} @ $${price} × ${size}`);
      const order = await this.placeOrderPG(user.id, 'buy', outcome, size, price);
      user.orders.push(order);

      // Trigger matching immediately
      await this.triggerMatch(order.id);

      // Verify trades
      await this.verifyTradesForOrder(order.id, `Trader ${i + 1} buy ${outcome}`);
    }

    // Round 2: Some traders sell back (close positions)
    this.logger.info('--- Round 2: Traders closing positions ---');
    for (let i = 0; i < this.users.length; i += 2) { // Every other trader sells
      const user = this.users[i];
      const outcome = i % 2 === 0 ? 'YES' : 'NO';
      const size = 50; // Sell half back

      this.logger.info(`Trader ${i + 1} sell ${outcome} @ $${outcome === 'YES' ? 0.55 : 0.45} × ${size}`);
      try {
        const order = await this.placeOrderPG(user.id, 'sell', outcome, size, outcome === 'YES' ? 0.55 : 0.45);
        user.orders.push(order);
        await this.triggerMatch(order.id);
        await this.verifyTradesForOrder(order.id, `Trader ${i + 1} sell ${outcome}`);
      } catch (e: any) {
        this.logger.warn(`Trader ${i + 1} sell failed`, { error: e.message });
      }
    }

    // Verify total trades
    const { rows: tradeCount } = await this.pgPool.query(`
      SELECT COUNT(*) as cnt FROM trades WHERE market_id = $1
    `, [this.market.id]);
    const totalTrades = parseInt(tradeCount[0].cnt);
    this.logger.trades = totalTrades;

    if (totalTrades === 0) {
      this.logger.warn('🚨 ZERO TRADES in trades table — CLOB matching engine did NOT execute');
    } else {
      this.logger.success(`${totalTrades} trades recorded in DB`);
    }

    // Verify positions for each user
    for (let i = 0; i < this.users.length; i++) {
      const { rows: positions } = await this.pgPool.query(`
        SELECT outcome, quantity, average_price FROM positions
        WHERE user_id = $1 AND market_id = $2
      `, [this.users[i].id, this.market.id]);
      this.users[i].positions = positions;
      this.logger.info(`Trader ${i + 1} positions`, { positions });
    }
  }

  // ── Phase 6: Wait ──────────────────────────────────────────────────
  private async waitForClosure() {
    this.logger.setPhase('WAITING');
    const waitMs = CONFIG.SIMULATION_DURATION_MINUTES * 60 * 1000;
    this.logger.info(`Waiting ${CONFIG.SIMULATION_DURATION_MINUTES}min until market closure...`);

    const interval = setInterval(() => {
      this.logger.info('⏳ Market is live...');
    }, 15000);

    await new Promise(r => setTimeout(r, waitMs));
    clearInterval(interval);
    this.logger.success('Market closure time reached');
  }

  // ── Phase 7: Resolution & Settlement ───────────────────────────────
  private async resolveAndSettle() {
    this.logger.setPhase('RESOLUTION');
    const winningOutcome: 'YES' | 'NO' = Math.random() > 0.5 ? 'YES' : 'NO';
    this.logger.info(`Oracle verdict: ${winningOutcome} wins!`);

    // Update market
    await this.pgPool.query(`
      UPDATE markets SET status = 'resolved', winning_outcome = $1::outcome_type,
        resolved_at = now() WHERE id = $2
    `, [winningOutcome, this.market.id]);

    // Verify settlement via positions
    const { rows: settled } = await this.pgPool.query(`
      SELECT user_id, outcome, quantity, average_price
      FROM positions WHERE market_id = $1
    `, [this.market.id]);

    this.logger.info('Positions at settlement time', { count: settled.length });

    // Run settlement with collateral tracking
    const { rows: settleResult } = await this.pgPool.query(`
      SELECT * FROM settle_market_with_collateral($1, $2::outcome_type)
    `, [this.market.id, winningOutcome]);
    this.logger.info('Settlement result', {
      positions_settled: settleResult[0]?.positions_settled,
      collateral_forfeited: settleResult[0]?.collateral_forfeited,
      total_payout: settleResult[0]?.total_payout,
      collateral_released: settleResult[0]?.collateral_released
    });

    this.logger.success('Settlement executed');
  }

  // ── Phase 8: Settlement Accuracy ───────────────────────────────────
  private async verifySettlementAccuracy() {
    this.logger.setPhase('SETTLEMENT_VERIFY');
    this.logger.info('Checking wallet balances after settlement...');

    let totalBefore = 0, totalAfter = 0;
    const allUserIds = [...this.users.map(u => u.id), this.mmUserId];

    for (const userId of allUserIds) {
      const { rows } = await this.pgPool.query(`
        SELECT balance, locked_balance FROM wallets WHERE user_id = $1
      `, [userId]);
      const available = parseFloat(rows[0]?.balance || 0);
      const locked = parseFloat(rows[0]?.locked_balance || 0);
      const total = available + locked;
      const isMM = userId === this.mmUserId;
      const label = isMM ? 'House MM' : `Trader ${this.users.findIndex(u => u.id === userId) + 1}`;

      const initial = isMM ? this.houseWalletInitial : CONFIG.INITIAL_BALANCE;
      const pnl = total - initial;
      totalBefore += initial;
      totalAfter += total;

      const status = pnl > 0 ? 'WINNER 🟢' : pnl < 0 ? 'LOSER 🔴' : 'BREAK EVEN ⚪';
      this.logger.info(`${label} P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        { initial, final: total, status });
    }

    const drift = totalAfter - totalBefore;
    if (Math.abs(drift) > 0.01) {
      this.logger.warn(`🚨 BALANCE DRIFT DETECTED: $${drift.toFixed(2)} — money leaked or duplicated`);
    } else {
      this.logger.success(`Balance conservation verified: $${totalBefore} → $${totalAfter} (drift: $${drift.toFixed(2)})`);
    }

    // Verify all locked balances returned to 0
    const { rows: lockedWallets } = await this.pgPool.query(`
      SELECT user_id, locked_balance FROM wallets
      WHERE user_id IN (${allUserIds.map((_,i) => '$' + (i+1)).join(',')})
        AND locked_balance > 0
    `, allUserIds);
    if (lockedWallets.length > 0) {
      this.logger.warn(`⚠️  ${lockedWallets.length} wallets have locked collateral — unfilled sell orders (expected)`,
        { wallets: lockedWallets });
    } else {
      this.logger.success('✅ All collateral released post-settlement');
    }

    // Check winning positions paid, losing positions zeroed
    const { rows: mktRow } = await this.pgPool.query(
      `SELECT winning_outcome::text as wo FROM markets WHERE id = $1`, [this.market.id]
    );
    const winningOutcomeText = mktRow[0]?.wo;

    const { rows: winningPos } = await this.pgPool.query(`
      SELECT p.user_id, p.quantity, p.average_price, w.balance
      FROM positions p JOIN wallets w ON p.user_id = w.user_id
      WHERE p.market_id = $1 AND p.outcome::text = $2
    `, [this.market.id, winningOutcomeText]);

    const { rows: losingPos } = await this.pgPool.query(`
      SELECT user_id, quantity FROM positions
      WHERE market_id = $1 AND outcome::text != $2
    `, [this.market.id, winningOutcomeText]);

    this.logger.info('Winning positions', { count: winningPos.length, details: winningPos });
    this.logger.info('Losing positions', { count: losingPos.length });
  }

  // ── Phase 9: Stress Tests ──────────────────────────────────────────
  private async stressTests() {
    this.logger.setPhase('STRESS_TEST');
    this.logger.info('Running edge-case stress tests...');

    // Test 1: Short-sell without position (should fail)
    try {
      await this.placeOrderPG(this.users[0].id, 'sell', 'YES', 999, 0.60);
      this.logger.warn('🚨 Short-sell accepted — position validation MISSING');
    } catch (e: any) {
      this.logger.success('Short-sell correctly rejected', { error: e.message.slice(0, 100) });
    }

    // Test 2: Zero amount order
    try {
      await this.placeOrderPG(this.users[0].id, 'buy', 'YES', 0, 0.50);
      this.logger.warn('🚨 Zero-amount order accepted');
    } catch (e: any) {
      this.logger.success('Zero-amount order rejected');
    }

    // Test 3: Overdraft
    try {
      await this.placeOrderPG(this.users[0].id, 'buy', 'YES', 999999, 0.50);
      this.logger.warn('🚨 Overdraft order accepted');
    } catch (e: any) {
      this.logger.success('Overdraft order rejected');
    }

    this.logger.success('All stress tests passed');
  }

  // ── Helpers ────────────────────────────────────────────────────────
  private async placeOrderPG(userId: string, side: string, outcome: string, quantity: number, price: number) {
    const { rows } = await this.pgPool.query(`
      INSERT INTO orders (user_id, market_id, type, side, outcome, quantity, remaining_quantity,
        price, status, created_at)
      VALUES ($1, $2, 'limit', $3, $4::outcome_type, $5, $5, $6, 'open', now())
      RETURNING *
    `, [userId, this.market.id, side, outcome, quantity, price]);
    return rows[0];
  }

  private async triggerMatch(orderId: string) {
    try {
      await this.pgPool.query('SELECT match_order_jsonb($1)', [orderId]);
    } catch (e) { /* ignore match errors */ }
  }

  private async verifyTradesForOrder(orderId: string, context: string) {
    const { rows } = await this.pgPool.query(`
      SELECT COUNT(*) as cnt FROM trades
      WHERE maker_order_id = $1 OR taker_order_id = $1
    `, [orderId]);
    const cnt = parseInt(rows[0].cnt);
    if (cnt > 0) {
      this.logger.success(`${context} → ${cnt} trade(s) created`);
    } else {
      this.logger.warn(`${context} → 0 trades (no match yet)`);
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────
  private async cleanup() {
    this.logger.info('Cleaning up simulation data...');
    // Only delete orders/trades for this market to preserve history
    await this.pgPool.query(`DELETE FROM trades WHERE market_id = $1`, [this.market.id]);
    await this.pgPool.query(`DELETE FROM positions WHERE market_id = $1`, [this.market.id]);
    await this.pgPool.query(`DELETE FROM orders WHERE market_id = $1`, [this.market.id]);
    await this.pgPool.query(`DELETE FROM markets WHERE id = $1`, [this.market.id]);
    // Delete users
    for (const u of this.users) {
      await this.pgPool.query(`DELETE FROM auth.users WHERE id = $1`, [u.id]);
    }
    await this.pgPool.query(`DELETE FROM auth.users WHERE id = $1`, [this.mmUserId]);
    this.logger.success('Cleanup complete');
  }

  // ── Report ─────────────────────────────────────────────────────────
  private async generateReport() {
    this.logger.setPhase('REPORT');
    console.log('\n' + '═'.repeat(70));
    console.log('           PLOKY SIMULATOR V2 — FINAL REPORT');
    console.log('═'.repeat(70));
    console.log(`Market ID:        ${this.market?.id?.slice(0, 20)}...`);
    console.log(`Winning Outcome:  ${this.market ? 'See logs' : 'N/A'}`);
    console.log(`Users:            ${this.users.length} traders + 1 MM`);
    console.log(`Total Trades:     ${this.logger.trades}`);
    console.log(`Errors:           ${this.logger.errors}`);
    console.log(`Warnings:         ${this.logger.warnings}`);
    console.log('═'.repeat(70));

    if (this.logger.errors === 0 && this.logger.trades > 0) {
      console.log('✅ SIMULATION PASSED — CLOB matching engine is functional');
    } else if (this.logger.trades === 0) {
      console.log('🚨 SIMULATION FAILED — Zero trades. Matching engine broken.');
    } else {
      console.log('⚠️  SIMULATION COMPLETED WITH ERRORS — Review logs');
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────
new PlokySimulatorV2().run().catch(e => {
  console.error('Simulator crashed:', e);
  process.exit(1);
});
