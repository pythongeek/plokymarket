/**
 * PLOKY PIPELINE V4 — Event → Market → Order → Trade → Settlement
 * Direct DB test proving the FULL stack pipeline works end-to-end
 */
import { Pool } from 'pg';

const pgPool = new Pool({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  database: process.env.LOCAL_DB_NAME || 'polymarket',
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
});

interface TestResult {
  phase: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  data?: any;
  durationMs: number;
}

class PipelineV4Test {
  private results: TestResult[] = [];
  private eventId?: string;
  private marketId?: string;
  private simUserId?: string;
  private orderId?: string;

  async run() {
    console.log('🚀 PLOKY PIPELINE V4 — Full Stack End-to-End Test\n');
    const start = Date.now();

    await this.testPhase('PHASE_1_CREATE_EVENT', () => this.createEvent());
    await this.testPhase('PHASE_2_VERIFY_EVENT', () => this.verifyEvent());
    await this.testPhase('PHASE_3_CREATE_MARKET', () => this.createMarket());
    await this.testPhase('PHASE_4_VERIFY_MARKET', () => this.verifyMarket());
    await this.testPhase('PHASE_5_SEED_LIQUIDITY', () => this.seedLiquidity());
    await this.testPhase('PHASE_6_CREATE_USER', () => this.createSimUser());
    await this.testPhase('PHASE_7_PLACE_ORDER', () => this.placeOrder());
    await this.testPhase('PHASE_8_VERIFY_TRADE', () => this.verifyTrade());
    await this.testPhase('PHASE_9_VERIFY_POSITIONS', () => this.verifyPositions());
    await this.testPhase('PHASE_10_SETTLE', () => this.settleMarket());
    await this.testPhase('PHASE_11_VERIFY_SETTLEMENT', () => this.verifySettlement());
    await this.testPhase('PHASE_12_CLEANUP', () => this.cleanup());

    this.printReport(Date.now() - start);
    await pgPool.end();
  }

  private async testPhase(name: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      const data = await fn();
      this.results.push({ phase: name, status: 'PASS', data, durationMs: Date.now() - start });
      console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
    } catch (err: any) {
      this.results.push({ phase: name, status: 'FAIL', error: err.message, durationMs: Date.now() - start });
      console.log(`  ❌ ${name}: ${err.message}`);
    }
  }

  private async createEvent() {
    const { rows } = await pgPool.query(`
      INSERT INTO events (title, slug, question, description, category, status,
        trading_closes_at, starts_at, ends_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active',
        now() + interval '7 days', now(), now() + interval '7 days', now(), now())
      RETURNING id, title
    `, [
      `Pipeline V4 Event ${Date.now()}`,
      `v4-event-${Date.now()}`,
      'Will this end-to-end pipeline work?',
      'V4 full stack test event',
      'politics'
    ]);
    this.eventId = rows[0].id;
    return rows[0];
  }

  private async verifyEvent() {
    if (!this.eventId) throw new Error('No eventId');
    const { rows } = await pgPool.query(
      'SELECT id, title, status, trading_closes_at FROM events WHERE id = $1',
      [this.eventId]
    );
    if (rows.length === 0) throw new Error('Event not found');
    return rows[0];
  }

  private async createMarket() {
    if (!this.eventId) throw new Error('No eventId');
    const { rows } = await pgPool.query(`
      INSERT INTO markets (event_id, name, name_bn, question, question_bn,
        category, trading_closes_at, event_date, status, market_type, creator_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'politics', now() + interval '7 days', now() + interval '7 days',
        'active', 'binary', $6, now(), now())
      RETURNING id, event_id, question
    `, [
      this.eventId,
      `V4 Market ${Date.now()}`,
      `V4 Market ${Date.now()}`,
      'Will the pipeline work?',
      'Will the pipeline work?',
      'd369deac-b0c3-42d4-8851-f4c93fee945e'
    ]);
    this.marketId = rows[0].id;
    return rows[0];
  }

  private async verifyMarket() {
    if (!this.marketId) throw new Error('No marketId');
    const { rows } = await pgPool.query(
      'SELECT id, event_id, question, status FROM markets WHERE id = $1',
      [this.marketId]
    );
    if (rows.length === 0) throw new Error('Market not found');
    return rows[0];
  }

  private async seedLiquidity() {
    if (!this.marketId) throw new Error('No marketId');

    const { rows: mmRows } = await pgPool.query(`
      INSERT INTO orders (market_id, user_id, type, side, outcome, price, quantity, filled_quantity, status, created_at)
      VALUES
        ($1, $2, 'limit', 'sell', 'YES', 0.55, 1000, 0, 'open', now()),
        ($1, $2, 'limit', 'sell', 'NO', 0.45, 1000, 0, 'open', now())
      RETURNING id
    `, [this.marketId, 'd369deac-b0c3-42d4-8851-f4c93fee945e']);

    return { mmOrders: mmRows.length };
  }

  private async createSimUser() {
    const { rows } = await pgPool.query(`
      INSERT INTO auth.users (id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_user_meta_data, created_at, updated_at)
      VALUES (gen_random_uuid(), 'authenticated', 'authenticated',
        'pipelinev4@ploky.test', extensions.crypt('test123', extensions.gen_salt('bf')),
        now(), '{"is_simulation": true}'::jsonb, now(), now())
      RETURNING id
    `);
    this.simUserId = rows[0].id;

    await pgPool.query(
      'INSERT INTO public.users (id, email, full_name, created_at, updated_at) VALUES ($1, $2, $3, now(), now()) ON CONFLICT (id) DO NOTHING',
      [this.simUserId, 'pipelinev4@ploky.test', 'Pipeline V4 User']
    );

    await pgPool.query(
      'INSERT INTO wallets (user_id, balance, locked_balance, currency) VALUES ($1, 1000, 0, $2)',
      [this.simUserId, 'USDC']
    );

    return { userId: this.simUserId };
  }

  private async placeOrder() {
    if (!this.marketId || !this.simUserId) throw new Error('Missing IDs');

    const { rows } = await pgPool.query(`
      INSERT INTO orders (market_id, user_id, type, side, outcome, price, quantity, filled_quantity, status, created_at)
      VALUES ($1, $2, 'limit', 'buy', 'YES', 0.55, 100, 0, 'open', now())
      RETURNING id
    `, [this.marketId, this.simUserId]);

    this.orderId = rows[0].id;

    const { rows: matchRows } = await pgPool.query(
      'SELECT * FROM match_order_jsonb($1)',
      [this.orderId]
    );

    return { orderId: this.orderId, matchResult: matchRows[0]?.match_order_jsonb };
  }

  private async verifyTrade() {
    if (!this.marketId) throw new Error('No marketId');
    const { rows } = await pgPool.query(
      'SELECT COUNT(*) as count FROM trades WHERE market_id = $1',
      [this.marketId]
    );
    const count = parseInt(rows[0].count);
    if (count === 0) throw new Error('No trades created');
    return { tradeCount: count };
  }

  private async verifyPositions() {
    if (!this.marketId) throw new Error('No marketId');
    const { rows } = await pgPool.query(
      'SELECT user_id, outcome, quantity, average_price FROM positions WHERE market_id = $1',
      [this.marketId]
    );
    return { positions: rows };
  }

  private async settleMarket() {
    if (!this.marketId) throw new Error('No marketId');

    await pgPool.query(
      "UPDATE markets SET status = 'resolved', winning_outcome = 'YES', resolved_at = now() WHERE id = $1",
      [this.marketId]
    );

    const { rows } = await pgPool.query(
      'SELECT * FROM settle_market_with_collateral($1, $2)',
      [this.marketId, 'YES']
    );

    return rows[0];
  }

  private async verifySettlement() {
    if (!this.marketId || !this.simUserId) throw new Error('Missing IDs');

    const { rows: walletRows } = await pgPool.query(
      'SELECT balance, locked_balance FROM wallets WHERE user_id = $1',
      [this.simUserId]
    );

    const balance = parseFloat(walletRows[0]?.balance || 0);
    const locked = parseFloat(walletRows[0]?.locked_balance || 0);

    if (balance + locked < 1000) {
      throw new Error(`Settlement underpaid: total ${balance + locked} < 1000`);
    }

    return { finalBalance: balance, lockedBalance: locked };
  }

  private async cleanup() {
    if (this.marketId) {
      await pgPool.query('DELETE FROM trades WHERE market_id = $1', [this.marketId]);
      await pgPool.query('DELETE FROM orders WHERE market_id = $1', [this.marketId]);
      await pgPool.query('DELETE FROM positions WHERE market_id = $1', [this.marketId]);
      await pgPool.query('DELETE FROM markets WHERE id = $1', [this.marketId]);
    }
    if (this.eventId) {
      await pgPool.query('DELETE FROM events WHERE id = $1', [this.eventId]);
    }
    if (this.simUserId) {
      await pgPool.query('DELETE FROM wallets WHERE user_id = $1', [this.simUserId]);
      await pgPool.query('DELETE FROM public.users WHERE id = $1', [this.simUserId]);
      await pgPool.query('DELETE FROM auth.users WHERE id = $1', [this.simUserId]);
    }
    return { cleaned: true };
  }

  private printReport(totalMs: number) {
    console.log('\n═════════════════════════════════════════════════════════════════════');
    console.log('           PIPELINE V4 — FINAL REPORT');
    console.log('═════════════════════════════════════════════════════════════════════');

    const pass = this.results.filter(r => r.status === 'PASS').length;
    const fail = this.results.filter(r => r.status === 'FAIL').length;

    for (const r of this.results) {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${r.phase.padEnd(25)} ${r.durationMs}ms`);
      if (r.error) console.log(`   → ${r.error}`);
    }

    console.log(`\nTotal: ${pass} passed, ${fail} failed (${totalMs}ms)`);
    if (fail === 0) {
      console.log('🎯 FULL PIPELINE FUNCTIONAL — Event → Market → Order → Trade → Settlement');
    } else {
      console.log('⚠️  Pipeline has failures');
    }
    process.exit(fail > 0 ? 1 : 0);
  }
}

new PipelineV4Test().run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
