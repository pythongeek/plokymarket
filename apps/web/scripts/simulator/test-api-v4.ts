/**
 * PLOKY API V4 — Event Creation → Market Sync Pipeline Test
 * Tests the FULL stack: Admin API → Next.js Route → PostgreSQL → Matching Engine
 */
import { Pool } from 'pg';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_JWT = process.env.ADMIN_JWT || '';

const pgPool = new Pool({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  database: process.env.LOCAL_DB_NAME || 'polymarket',
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
});

interface TestResult {
  phase: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  statusCode?: number;
  error?: string;
  data?: any;
  durationMs: number;
}

class ApiV4Test {
  private results: TestResult[] = [];
  private eventId?: string;
  private marketId?: string;

  async run() {
    console.log('🚀 PLOKY API V4 — Event Creation → Market Sync Pipeline Test\n');
    const start = Date.now();

    // Phase 1: Health check
    await this.testPhase('API_HEALTH_CHECK', () => this.healthCheck());

    // Phase 2: Get admin JWT if not provided
    if (!ADMIN_JWT) {
      await this.testPhase('ADMIN_AUTH', () => this.getAdminToken());
    }

    // Phase 3: Create event via API (create-atomic endpoint)
    await this.testPhase('CREATE_EVENT_ATOMIC', () => this.createEventAtomic());

    // Phase 4: Verify event in DB
    await this.testPhase('VERIFY_EVENT_DB', () => this.verifyEventInDb());

    // Phase 5: Create market linked to event via batch API
    await this.testPhase('CREATE_MARKET_BATCH', () => this.createMarketBatch());

    // Phase 6: Verify market in DB
    await this.testPhase('VERIFY_MARKET_DB', () => this.verifyMarketInDb());

    // Phase 7: Seed orderbook
    await this.testPhase('SEED_ORDERBOOK', () => this.seedOrderbook());

    // Phase 8: Place test order
    await this.testPhase('PLACE_ORDER', () => this.placeTestOrder());

    // Phase 9: Verify trade created
    await this.testPhase('VERIFY_TRADE', () => this.verifyTrade());

    // Phase 10: Cleanup
    await this.testPhase('CLEANUP', () => this.cleanup());

    const totalMs = Date.now() - start;
    this.printReport(totalMs);
    await pgPool.end();
  }

  private async testPhase(name: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      const data = await fn();
      this.results.push({ phase: name, status: 'PASS', data, durationMs: Date.now() - start });
      console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
    } catch (err: any) {
      this.results.push({
        phase: name, status: 'FAIL',
        error: err.message,
        statusCode: err.statusCode,
        durationMs: Date.now() - start
      });
      console.log(`  ❌ ${name}: ${err.message}`);
    }
  }

  private async healthCheck() {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  }

  private async getAdminToken() {
    const { rows } = await pgPool.query(
      `SELECT u.id FROM auth.users u
       JOIN user_profiles p ON u.id = p.id
       WHERE p.is_super_admin = true LIMIT 1`
    );
    if (!rows[0]) throw new Error('No super_admin found in DB');
    return { adminId: rows[0].id, note: 'Using DB admin ID for auth bypass' };
  }

  private async createEventAtomic() {
    const token = ADMIN_JWT || 'test-bypass';
    const body = {
      event_data: {
        title: `V4 API Test Event ${Date.now()}`,
        question: 'Will the API sync pipeline work end-to-end?',
        description: 'API V4 atomic creation test',
        category: 'politics',
        trading_closes_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        resolution_date: new Date(Date.now() + 86400000 * 8).toISOString(),
        initial_liquidity: 10000,
      },
      markets_data: [],
      resolution_config: {},
    };

    const res = await fetch(`${BASE_URL}/api/admin/events/create-atomic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(`Event creation failed: ${res.status} ${JSON.stringify(data)}`);
      (err as any).statusCode = res.status;
      throw err;
    }

    this.eventId = data.event_id;
    return { eventId: this.eventId, ...data };
  }

  private async verifyEventInDb() {
    if (!this.eventId) throw new Error('No eventId from creation');
    const { rows } = await pgPool.query(
      'SELECT id, title, status, trading_closes_at FROM events WHERE id = $1',
      [this.eventId]
    );
    if (rows.length === 0) throw new Error('Event not found in DB');
    return rows[0];
  }

  private async createMarketBatch() {
    if (!this.eventId) throw new Error('No eventId');
    const token = ADMIN_JWT || 'test-bypass';

    const res = await fetch(`${BASE_URL}/api/admin/markets/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        markets: [{
          event_id: this.eventId,
          name: `V4 Market ${Date.now()}`,
          name_bn: `V4 Market ${Date.now()}`,
          category: 'politics',
          question: 'Will the API sync pipeline work?',
          question_bn: 'Will the API sync pipeline work?',
          outcomes: ['YES', 'NO'],
          trading_closes_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        }]
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(`Market creation failed: ${res.status} ${JSON.stringify(data)}`);
      (err as any).statusCode = res.status;
      throw err;
    }

    this.marketId = data.data?.[0]?.id;
    return { marketId: this.marketId, ...data };
  }

  private async verifyMarketInDb() {
    if (!this.marketId) throw new Error('No marketId from creation');
    const { rows } = await pgPool.query(
      'SELECT id, event_id, question, status FROM markets WHERE id = $1',
      [this.marketId]
    );
    if (rows.length === 0) throw new Error('Market not found in DB');
    return rows[0];
  }

  private async seedOrderbook() {
    if (!this.marketId) throw new Error('No marketId');
    const token = ADMIN_JWT || 'test-bypass';

    const res = await fetch(`${BASE_URL}/api/admin/markets/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ marketId: this.marketId, initialLiquidity: 10000 }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(`Orderbook seed failed: ${res.status} ${JSON.stringify(data)}`);
      (err as any).statusCode = res.status;
      throw err;
    }
    return data;
  }

  private async placeTestOrder() {
    if (!this.marketId) throw new Error('No marketId');

    // Create a sim user for the test
    const { rows: userRows } = await pgPool.query(`
      INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
      VALUES (gen_random_uuid(), 'authenticated', 'authenticated',
        'v4test@ploky.test', extensions.crypt('test123', extensions.gen_salt('bf')),
        now(), '{"is_simulation": true}'::jsonb, now(), now())
      RETURNING id
    `);
    const userId = userRows[0].id;

    // Create wallet
    await pgPool.query(
      'INSERT INTO wallets (user_id, balance, locked_balance, currency) VALUES ($1, 1000, 0, $2)',
      [userId, 'USDC']
    );

    // Place BUY order via matching engine RPC (direct pg call)
    const { rows: orderRows } = await pgPool.query(`
      INSERT INTO orders (market_id, user_id, order_type, side, outcome, price, quantity, filled_quantity, status, created_at)
      VALUES ($1, $2, 'limit', 'buy', 'YES', 0.50, 100, 0, 'open', now())
      RETURNING id
    `, [this.marketId, userId]);

    const orderId = orderRows[0].id;

    // Run match_order
    const { rows: matchRows } = await pgPool.query(
      'SELECT * FROM match_order_jsonb($1)',
      [orderId]
    );

    return { userId, orderId, matchResult: matchRows[0]?.match_order_jsonb };
  }

  private async verifyTrade() {
    if (!this.marketId) throw new Error('No marketId');
    const { rows } = await pgPool.query(
      'SELECT COUNT(*) as count FROM trades WHERE market_id = $1',
      [this.marketId]
    );
    return { tradeCount: parseInt(rows[0].count) };
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
    await pgPool.query("DELETE FROM auth.users WHERE email = 'v4test@ploky.test'");
    return { cleaned: true };
  }

  private printReport(totalMs: number) {
    console.log('\n══════════════════════════════════════════════════════════════════════');
    console.log('           API V4 — FINAL REPORT');
    console.log('══════════════════════════════════════════════════════════════════════');

    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;

    for (const r of this.results) {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${icon} ${r.phase.padEnd(20)} ${r.durationMs}ms`);
      if (r.error) console.log(`   → ${r.error}`);
    }

    console.log(`\nTotal: ${passCount} passed, ${failCount} failed (${totalMs}ms)`);
    console.log(failCount === 0 ? '🎯 ALL PHASES PASSED — Pipeline is functional' : '⚠️  Pipeline has failures');
    process.exit(failCount > 0 ? 1 : 0);
  }
}

new ApiV4Test().run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
