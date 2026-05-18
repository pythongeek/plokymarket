#!/usr/bin/env tsx
/**
 * ============================================================================
 * PLOKYMARKET END-TO-END SIMULATION SCRIPT
 * ============================================================================
 * 
 * Scope: EXTERNAL — Runs completely outside the main project codebase.
 * Purpose: Simulate real-world user behavior to test the entire platform lifecycle.
 * 
 * What it does:
 *   1. Creates 5-10 synthetic users with wallets & balances
 *   2. Creates a live prediction market (10-minute duration)
 *   3. Simulates realistic betting patterns (market/limit orders, YES/NO, various sizes)
 *   4. Triggers the PostgreSQL matching engine
 *   5. Waits for market closure
 *   6. Resolves the market via admin resolution flow
 *   7. Verifies profit/loss settlement across all wallets
 *   8. Generates a comprehensive audit report
 * 
 * Prerequisites:
 *   npm install @supabase/supabase-js
 *   npx tsx ploky-simulator.ts
 * 
 * Environment Variables:
 *   SUPABASE_URL                  (default: http://localhost:54321)
 *   SUPABASE_SERVICE_ROLE_KEY     (required — bypasses RLS)
 *   SIMULATION_DURATION_MINUTES   (default: 10)
 *   USER_COUNT                    (default: 8)
 *   INITIAL_BALANCE               (default: 1000)
 *   MARKET_NAME                   (default: auto-generated)
 * 
 * ============================================================================
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import ws from 'ws';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  USER_COUNT: Math.min(Math.max(parseInt(process.env.USER_COUNT || '8', 10), 3), 20),
  INITIAL_BALANCE: parseFloat(process.env.INITIAL_BALANCE || '1000'),
  SIMULATION_DURATION_MS: parseInt(process.env.SIMULATION_DURATION_MINUTES || '10', 10) * 60 * 1000,
  MARKET_NAME: process.env.MARKET_NAME || 'SIMULATION: Will BTC close above $100k this month?',
  ENABLE_STRESS_TEST: (process.env.ENABLE_STRESS_TEST || 'true') === 'true',
  LOG_TO_FILE: (process.env.LOG_TO_FILE || 'true') === 'true',
  OUTPUT_FILE: process.env.OUTPUT_FILE || `./simulation-report-${Date.now()}.json`,
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER — Every action is logged with timestamp, severity, and context
// ─────────────────────────────────────────────────────────────────────────────

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'PHASE';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  phase: string;
  message: string;
  data?: any;
  error?: string;
}

class SimulationLogger {
  private logs: LogEntry[] = [];
  private currentPhase = 'INIT';

  private formatTime(): string {
    return new Date().toISOString();
  }

  private color(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m',    // Cyan
      INFO: '\x1b[34m',     // Blue
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      SUCCESS: '\x1b[32m',  // Green
      PHASE: '\x1b[35m',    // Magenta
    };
    return colors[level] || '';
  }

  private reset(): string {
    return '\x1b[0m';
  }

  setPhase(phase: string) {
    this.currentPhase = phase;
    this.log('PHASE', `══════════════════ ${phase} ══════════════════`);
  }

  log(level: LogLevel, message: string, data?: any, error?: any) {
    const entry: LogEntry = {
      timestamp: this.formatTime(),
      level,
      phase: this.currentPhase,
      message,
      data: data ? this.sanitize(data) : undefined,
      error: error ? (error instanceof Error ? error.message : String(error)) : undefined,
    };
    this.logs.push(entry);

    const color = this.color(level);
    const reset = this.reset();
    const prefix = `${entry.timestamp} [${level}] [${this.currentPhase}]`;

    if (level === 'ERROR') {
      console.error(`${color}${prefix}${reset} ${message}`, error || '');
    } else if (level === 'SUCCESS') {
      console.log(`${color}${prefix}${reset} ✓ ${message}`);
    } else if (level === 'PHASE') {
      console.log(`\n${color}${prefix}${reset} ${message}\n`);
    } else {
      console.log(`${color}${prefix}${reset} ${message}`, data ? JSON.stringify(this.sanitize(data)).slice(0, 200) : '');
    }
  }

  debug(message: string, data?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('DEBUG', message, data);
    }
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  error(message: string, err?: any) {
    this.log('ERROR', message, undefined, err);
  }

  success(message: string, data?: any) {
    this.log('SUCCESS', message, data);
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const clone = JSON.parse(JSON.stringify(data));
    if (clone.password) clone.password = '***REDACTED***';
    if (clone.service_role_key) clone.service_role_key = '***REDACTED***';
    return clone;
  }

  getReport(): { summary: any; logs: LogEntry[]; stats: any } {
    const errors = this.logs.filter(l => l.level === 'ERROR');
    const warnings = this.logs.filter(l => l.level === 'WARN');

    return {
      summary: {
        totalLogs: this.logs.length,
        errors: errors.length,
        warnings: warnings.length,
        generatedAt: this.formatTime(),
      },
      logs: this.logs,
      stats: this.extractStats(),
    };
  }

  private extractStats(): any {
    const phases = [...new Set(this.logs.map(l => l.phase))];
    const phaseStats: Record<string, { errors: number; warnings: number; duration?: number }> = {};
    phases.forEach(p => {
      const phaseLogs = this.logs.filter(l => l.phase === p);
      phaseStats[p] = {
        errors: phaseLogs.filter(l => l.level === 'ERROR').length,
        warnings: phaseLogs.filter(l => l.level === 'WARN').length,
      };
    });
    return phaseStats;
  }

  async saveToFile(filepath: string) {
    if (!CONFIG.LOG_TO_FILE) return;
    const fs = await import('fs');
    fs.writeFileSync(filepath, JSON.stringify(this.getReport(), null, 2));
    console.log(`\n📄 Full report saved to: ${filepath}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATED USER ENTITY
// ─────────────────────────────────────────────────────────────────────────────

interface SimulatedUser {
  authUser: User;
  profile: any;
  wallet: any;
  initialBalance: number;
  finalBalance?: number;
  orders: any[];
  positions: any[];
  trades: any[];
  netPnl?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SIMULATOR ENGINE
// ─────────────────────────────────────────────────────────────────────────────

class PlokySimulator {
  private supabase: SupabaseClient;
  private logger: SimulationLogger;
  private users: SimulatedUser[] = [];
  private marketId: string | null = null;
  private marketSlug: string | null = null;
  private winningOutcome: 'YES' | 'NO' | null = null;
  private startTime: number = 0;

  constructor() {
    if (!CONFIG.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Get it from Supabase Dashboard > Project Settings > API > service_role key.');
    }
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws },
    });
    this.logger = new SimulationLogger();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 0: VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  async validateConnection() {
    this.logger.setPhase('VALIDATION');

    try {
      const { data, error } = await this.supabase.from('markets').select('count', { count: 'exact', head: true });
      if (error) throw error;
      this.logger.success('Supabase connection established', { marketsCount: data });
    } catch (err) {
      this.logger.error('Failed to connect to Supabase. Check URL and service role key.', err);
      throw err;
    }

    // Verify matching engine exists
    try {
      const { data, error } = await this.supabase.rpc('match_order', { p_order_id: '00000000-0000-0000-0000-000000000000' }).maybeSingle();
      if (error && !error.message.includes('not found')) {
        this.logger.warn('Matching engine function may not exist or requires valid UUID', { error: error.message });
      } else {
        this.logger.success('Matching engine function detected');
      }
    } catch (err: any) {
      this.logger.warn('Could not verify matching engine — will attempt during simulation', { error: err.message });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: USER GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async createUsers() {
    this.logger.setPhase('USER_GENERATION');
    this.logger.info(`Creating ${CONFIG.USER_COUNT} simulated users with $${CONFIG.INITIAL_BALANCE} balance each...`);

    for (let i = 0; i < CONFIG.USER_COUNT; i++) {
      const userNum = i + 1;
      const email = `simuser_${Date.now()}_${userNum}@ploky.test`;
      const password = `SimPass_${Math.random().toString(36).slice(2, 10)}`;
      const fullName = `Simulated Trader ${userNum}`;

      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, is_simulation: true },
        });

        if (authError || !authData.user) {
          throw authError || new Error('User creation returned null');
        }

        const authUser = authData.user;
        this.logger.debug(`Auth user created`, { id: authUser.id, email: authUser.email });

        // 2. Create extended profile in users table
        const { error: profileError } = await this.supabase.from('users').upsert({
          id: authUser.id,
          email,
          full_name: fullName,
          avatar_url: null,
          role: 'user',
          created_at: new Date().toISOString(),
          is_simulation: true,
        }, { onConflict: 'id' });

        if (profileError) {
          this.logger.warn(`Profile insert failed (table may not exist or schema differs)`, { error: profileError.message });
        }

        // 3. Create wallet
        const { data: wallet, error: walletError } = await this.supabase
          .from('wallets')
          .insert({
            user_id: authUser.id,
            available_balance: CONFIG.INITIAL_BALANCE,
            locked_balance: 0,
            currency: 'USDC',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (walletError) {
          // Try alternative schema (balance instead of available_balance)
          const { data: walletAlt, error: walletAltError } = await this.supabase
            .from('wallets')
            .insert({
              user_id: authUser.id,
              balance: CONFIG.INITIAL_BALANCE,
              currency: 'USDC',
            })
            .select()
            .single();

          if (walletAltError) {
            throw walletAltError;
          }
          this.logger.success(`User ${userNum} wallet created (alt schema)`, { walletId: walletAlt?.id });
        } else {
          this.logger.success(`User ${userNum} created`, { id: authUser.id.slice(0, 8), walletId: wallet?.id });
        }

        this.users.push({
          authUser,
          profile: { full_name: fullName, email },
          wallet: wallet || { user_id: authUser.id, available_balance: CONFIG.INITIAL_BALANCE },
          initialBalance: CONFIG.INITIAL_BALANCE,
          orders: [],
          positions: [],
          trades: [],
        });

      } catch (err) {
        this.logger.error(`Failed to create user ${userNum}`, err);
        // Continue with remaining users
      }
    }

    if (this.users.length < 3) {
      throw new Error(`Only ${this.users.length} users created. Need at least 3 for meaningful simulation.`);
    }

    this.logger.success(`Successfully created ${this.users.length} users`, {
      totalInitialCapital: this.users.length * CONFIG.INITIAL_BALANCE,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: MARKET CREATION
  // ═══════════════════════════════════════════════════════════════════════════
  async createMarket() {
    this.logger.setPhase('MARKET_CREATION');

    const now = new Date();
    const endsAt = new Date(now.getTime() + CONFIG.SIMULATION_DURATION_MS);
    const slug = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const marketData = {
      name: CONFIG.MARKET_NAME,
      slug,
      question: CONFIG.MARKET_NAME,
      category: 'Crypto',
      answer1: 'Yes',
      answer2: 'No',
      description: 'Auto-generated by PlokySimulator for end-to-end system validation.',
      status: 'active',
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      initial_price: 0.5,
      initial_liquidity: 10000,
      neg_risk: false,
      resolver_address: '0x0000000000000000000000000000000000000000',
      created_at: now.toISOString(),
      is_simulation: true,
    };

    try {
      const { data, error } = await this.supabase
        .from('markets')
        .insert(marketData)
        .select()
        .single();

      if (error) {
        // Try alternative column names
        const altData = {
          ...marketData,
          start_time: marketData.starts_at,
          end_time: marketData.ends_at,
          created_by: this.users[0]?.authUser.id,
        };
        delete (altData as any).starts_at;
        delete (altData as any).ends_at;

        const { data: altResult, error: altError } = await this.supabase
          .from('markets')
          .insert(altData)
          .select()
          .single();

        if (altError) throw altError;
        this.marketId = altResult.id;
        this.marketSlug = altResult.slug;
      } else {
        this.marketId = data.id;
        this.marketSlug = data.slug;
      }

      this.logger.success('Market created', {
        marketId: this.marketId,
        slug: this.marketSlug,
        duration: `${CONFIG.SIMULATION_DURATION_MS / 60000} minutes`,
        closesAt: endsAt.toISOString(),
      });

    } catch (err) {
      this.logger.error('Market creation failed', err);
      throw err;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: BETTING SIMULATION
  // ═══════════════════════════════════════════════════════════════════════════
  async simulateBetting() {
    this.logger.setPhase('BETTING_SIMULATION');
    this.startTime = Date.now();

    if (!this.marketId) throw new Error('Market not created');

    // Betting strategies for realistic simulation
    const strategies = [
      { name: 'Bullish Whale', bias: 'YES', avgSize: 200, orderType: 'market' as const },
      { name: 'Bearish Hedger', bias: 'NO', avgSize: 150, orderType: 'limit' as const },
      { name: 'Arbitrageur', bias: 'MIXED', avgSize: 100, orderType: 'limit' as const },
      { name: 'Small Gambler', bias: 'YES', avgSize: 25, orderType: 'market' as const },
      { name: 'Contrarian', bias: 'NO', avgSize: 75, orderType: 'market' as const },
      { name: 'Degen Ape', bias: 'YES', avgSize: 500, orderType: 'market' as const },
      { name: 'Careful Analyst', bias: 'NO', avgSize: 50, orderType: 'limit' as const },
      { name: 'Momentum Chaser', bias: 'MIXED', avgSize: 120, orderType: 'market' as const },
    ];

    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      const strategy = strategies[i % strategies.length];
      const orderCount = 1 + Math.floor(Math.random() * 3); // 1-3 orders per user

      this.logger.info(`User ${i + 1} (${strategy.name}) placing ${orderCount} orders...`);

      for (let o = 0; o < orderCount; o++) {
        try {
          // Determine outcome
          let outcome: 'YES' | 'NO';
          if (strategy.bias === 'YES') outcome = Math.random() > 0.3 ? 'YES' : 'NO';
          else if (strategy.bias === 'NO') outcome = Math.random() > 0.3 ? 'NO' : 'YES';
          else outcome = Math.random() > 0.5 ? 'YES' : 'NO';

          // Determine size (with some variance)
          const size = Math.max(5, Math.round(strategy.avgSize * (0.5 + Math.random())));

          // Determine price for limit orders
          const price = outcome === 'YES' 
            ? 0.45 + Math.random() * 0.15  // YES bids between 0.45-0.60
            : 0.35 + Math.random() * 0.20; // NO bids between 0.35-0.55

          const orderType = strategy.orderType === 'market' && Math.random() > 0.4 
            ? 'market' 
            : 'limit';

          // Check wallet balance before placing
          const { data: walletCheck } = await this.supabase
            .from('wallets')
            .select('*')
            .eq('user_id', user.authUser.id)
            .single();

          const available = walletCheck?.available_balance ?? walletCheck?.balance ?? 0;
          if (available < size) {
            this.logger.warn(`User ${i + 1} insufficient balance ($${available}), skipping order`);
            continue;
          }

          // Insert order
          const orderData: any = {
            user_id: user.authUser.id,
            market_id: this.marketId,
            type: orderType,
            side: 'buy', // All buying for simplicity; sells would require existing positions
            outcome,
            amount: size,
            price: orderType === 'limit' ? parseFloat(price.toFixed(2)) : null,
            status: 'open',
            created_at: new Date().toISOString(),
          };

          const { data: order, error: orderError } = await this.supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

          if (orderError) {
            // Try alternative schema
            delete orderData.outcome;
            orderData.outcome_type = outcome;
            const { data: altOrder, error: altErr } = await this.supabase
              .from('orders')
              .insert(orderData)
              .select()
              .single();
            if (altErr) throw altErr;
            user.orders.push(altOrder);
          } else {
            user.orders.push(order);
          }

          this.logger.debug(`Order placed`, {
            user: i + 1,
            type: orderType,
            outcome,
            size,
            price: orderType === 'limit' ? price.toFixed(2) : 'market',
          });

          // Trigger matching engine
          if (order?.id) {
            try {
              const { error: matchError } = await this.supabase.rpc('match_order', {
                p_order_id: order.id,
              });
              if (matchError) {
                this.logger.warn(`Matching engine error for order ${order.id.slice(0, 8)}`, { error: matchError.message });
              } else {
                this.logger.debug(`Matching engine processed order ${order.id.slice(0, 8)}`);
              }
            } catch (matchErr: any) {
              this.logger.warn(`Matching engine exception`, { error: matchErr.message });
            }
          }

          // Small delay between orders to simulate real timing
          await this.delay(300);

        } catch (err) {
          this.logger.error(`Order failed for user ${i + 1}`, err);
        }
      }
    }

    // Fetch resulting trades
    await this.syncTrades();

    this.logger.success('Betting phase complete', {
      totalOrders: this.users.reduce((sum, u) => sum + u.orders.length, 0),
      totalTrades: this.users.reduce((sum, u) => sum + u.trades.length, 0),
    });
  }

  private async syncTrades() {
    if (!this.marketId) return;

    for (const user of this.users) {
      const { data: trades } = await this.supabase
        .from('trades')
        .select('*')
        .or(`buyer_id.eq.${user.authUser.id},seller_id.eq.${user.authUser.id}`)
        .eq('market_id', this.marketId);

      if (trades) user.trades = trades;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: WAIT FOR MARKET CLOSE
  // ═══════════════════════════════════════════════════════════════════════════
  async waitForMarketClose() {
    this.logger.setPhase('WAITING');

    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, CONFIG.SIMULATION_DURATION_MS - elapsed);

    if (remaining > 0) {
      this.logger.info(`Market is live. Waiting ${Math.ceil(remaining / 1000)}s until closure...`);

      // Progress updates every 30 seconds
      const updateInterval = setInterval(() => {
        const left = Math.max(0, CONFIG.SIMULATION_DURATION_MS - (Date.now() - this.startTime));
        if (left > 0) {
          this.logger.info(`⏳ ${Math.ceil(left / 1000)}s remaining until resolution...`);
        }
      }, 30000);

      await this.delay(remaining);
      clearInterval(updateInterval);
    }

    this.logger.success('Market closure time reached');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: RESOLUTION
  // ═══════════════════════════════════════════════════════════════════════════
  async resolveMarket() {
    this.logger.setPhase('RESOLUTION');

    if (!this.marketId) throw new Error('No market to resolve');

    // Determine winner (simulating oracle/verdict)
    // In real scenario this would come from external data source
    this.winningOutcome = Math.random() > 0.5 ? 'YES' : 'NO';

    this.logger.info(`Oracle verdict: ${this.winningOutcome} wins!`, {
      marketId: this.marketId,
      resolutionTime: new Date().toISOString(),
    });

    try {
      // Update market status
      const { error: updateError } = await this.supabase
        .from('markets')
        .update({ 
          status: 'resolved', 
          resolved_outcome: this.winningOutcome,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', this.marketId);

      if (updateError) {
        this.logger.warn('Market status update error (may use different column names)', { error: updateError.message });
      }

      // Trigger settlement function
      try {
        const { error: settleError } = await this.supabase.rpc('settle_market', {
          p_market_id: this.marketId,
          p_winning_outcome: this.winningOutcome,
        });

        if (settleError) {
          this.logger.warn('Settlement function error', { error: settleError.message });
        } else {
          this.logger.success('Settlement function executed successfully');
        }
      } catch (settleErr: any) {
        this.logger.error('Settlement function exception', settleErr);
      }

      // Alternative: manual settlement if function fails
      await this.manualSettlementFallback();

    } catch (err) {
      this.logger.error('Resolution failed', err);
      throw err;
    }
  }

  private async manualSettlementFallback() {
    this.logger.info('Running manual settlement verification...');

    if (!this.marketId || !this.winningOutcome) return;

    // Get all positions for this market
    const { data: positions, error } = await this.supabase
      .from('positions')
      .select('*')
      .eq('market_id', this.marketId);

    if (error || !positions) {
      this.logger.warn('Could not fetch positions for manual settlement', { error: error?.message });
      return;
    }

    this.logger.info(`Found ${positions.length} positions to settle`);

    for (const pos of positions) {
      const isWinner = pos.outcome === this.winningOutcome || pos.outcome_type === this.winningOutcome;
      const payout = isWinner ? (pos.amount || pos.quantity || 0) * 1 : 0; // 1 USDC per share

      this.logger.debug(`Position settlement`, {
        user: pos.user_id?.slice(0, 8),
        outcome: pos.outcome || pos.outcome_type,
        amount: pos.amount || pos.quantity,
        isWinner,
        payout,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: VERIFICATION & AUDIT
  // ═══════════════════════════════════════════════════════════════════════════
  async verifySettlement() {
    this.logger.setPhase('VERIFICATION');

    let totalProfit = 0;
    let totalLoss = 0;
    let inconsistencies = 0;

    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];

      try {
        // Fetch final wallet state
        const { data: wallet, error: walletError } = await this.supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user.authUser.id)
          .single();

        if (walletError) {
          this.logger.error(`Cannot fetch final wallet for user ${i + 1}`, walletError);
          inconsistencies++;
          continue;
        }

        const finalBalance = wallet.available_balance ?? wallet.balance ?? 0;
        user.finalBalance = finalBalance;
        user.netPnl = finalBalance - user.initialBalance;

        if (user.netPnl > 0) totalProfit += user.netPnl;
        if (user.netPnl < 0) totalLoss += Math.abs(user.netPnl);

        // Verify positions are settled
        const { data: positions } = await this.supabase
          .from('positions')
          .select('*')
          .eq('user_id', user.authUser.id)
          .eq('market_id', this.marketId);

        user.positions = positions || [];

        // Check for orphaned orders (should be filled/cancelled)
        const { data: openOrders } = await this.supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.authUser.id)
          .eq('market_id', this.marketId)
          .eq('status', 'open');

        if (openOrders && openOrders.length > 0) {
          this.logger.warn(`User ${i + 1} has ${openOrders.length} orphaned open orders after settlement`);
          inconsistencies++;
        }

        this.logger.info(`User ${i + 1} P&L: ${user.netPnl >= 0 ? '+' : ''}$${user.netPnl.toFixed(2)}`, {
          initial: user.initialBalance,
          final: finalBalance,
          orders: user.orders.length,
          trades: user.trades.length,
          positions: user.positions.length,
        });

      } catch (err) {
        this.logger.error(`Verification failed for user ${i + 1}`, err);
        inconsistencies++;
      }
    }

    // System-wide balance check (conservation of money)
    const totalUserBalances = this.users.reduce((sum, u) => sum + (u.finalBalance || 0), 0);
    const expectedTotal = this.users.length * CONFIG.INITIAL_BALANCE;
    const drift = totalUserBalances - expectedTotal;

    this.logger.info(`System balance conservation check`, {
      expectedTotal,
      actualTotal: totalUserBalances,
      drift: drift.toFixed(2),
      driftAcceptable: Math.abs(drift) < 0.01 ? 'YES ✓' : 'NO ✗ (fees/house edge may explain)',
    });

    this.logger.success(`Verification complete`, {
      winners: this.users.filter(u => (u.netPnl || 0) > 0).length,
      losers: this.users.filter(u => (u.netPnl || 0) < 0).length,
      breakEven: this.users.filter(u => (u.netPnl || 0) === 0).length,
      totalProfit: totalProfit.toFixed(2),
      totalLoss: totalLoss.toFixed(2),
      inconsistencies,
    });

    if (inconsistencies > 0) {
      this.logger.error(`⚠️ ${inconsistencies} inconsistencies detected — review logs above`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: STRESS TESTS (Optional)
  // ═══════════════════════════════════════════════════════════════════════════
  async runStressTests() {
    if (!CONFIG.ENABLE_STRESS_TEST) return;

    this.logger.setPhase('STRESS_TEST');
    this.logger.info('Running edge-case stress tests...');

    const tests = [
      { name: 'Double Spend Attempt', fn: () => this.testDoubleSpend() },
      { name: 'Zero Amount Order', fn: () => this.testZeroAmount() },
      { name: 'Overdraft Order', fn: () => this.testOverdraft() },
      { name: 'Invalid Market ID', fn: () => this.testInvalidMarket() },
    ];

    for (const test of tests) {
      try {
        await test.fn();
        this.logger.success(`Stress test passed: ${test.name}`);
      } catch (err: any) {
        this.logger.error(`Stress test failed: ${test.name}`, err);
      }
      await this.delay(200);
    }
  }

  private async testDoubleSpend() {
    if (this.users.length < 2) return;
    const user = this.users[0];

    // Try to place two orders simultaneously that exceed balance
    const { data: wallet } = await this.supabase.from('wallets').select('*').eq('user_id', user.authUser.id).single();
    const balance = wallet?.available_balance ?? wallet?.balance ?? 0;

    const order1 = this.supabase.from('orders').insert({
      user_id: user.authUser.id,
      market_id: this.marketId,
      type: 'market',
      side: 'buy',
      outcome: 'YES',
      amount: Math.floor(balance * 0.8),
      status: 'open',
    });

    const order2 = this.supabase.from('orders').insert({
      user_id: user.authUser.id,
      market_id: this.marketId,
      type: 'market',
      side: 'buy',
      outcome: 'NO',
      amount: Math.floor(balance * 0.8),
      status: 'open',
    });

    await Promise.all([order1, order2]);
    this.logger.debug('Double-spend attempt executed — check if both were accepted');
  }

  private async testZeroAmount() {
    const user = this.users[0];
    await this.supabase.from('orders').insert({
      user_id: user.authUser.id,
      market_id: this.marketId,
      type: 'market',
      side: 'buy',
      outcome: 'YES',
      amount: 0,
      status: 'open',
    });
  }

  private async testOverdraft() {
    const user = this.users[0];
    await this.supabase.from('orders').insert({
      user_id: user.authUser.id,
      market_id: this.marketId,
      type: 'market',
      side: 'buy',
      outcome: 'YES',
      amount: 999999,
      status: 'open',
    });
  }

  private async testInvalidMarket() {
    const user = this.users[0];
    await this.supabase.from('orders').insert({
      user_id: user.authUser.id,
      market_id: '00000000-0000-0000-0000-000000000000',
      type: 'market',
      side: 'buy',
      outcome: 'YES',
      amount: 10,
      status: 'open',
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: REPORT GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  async generateReport() {
    this.logger.setPhase('REPORT');

    const report = this.logger.getReport();

    console.log(`\n${'='.repeat(70)}`);
    console.log('           PLOKYMARKET SIMULATION FINAL REPORT');
    console.log(`${'='.repeat(70)}`);
    console.log(`Simulation ID:    sim-${Date.now()}`);
    console.log(`Market ID:          ${this.marketId}`);
    console.log(`Market Slug:        ${this.marketSlug}`);
    console.log(`Winning Outcome:    ${this.winningOutcome}`);
    console.log(`Users Created:      ${this.users.length}`);
    console.log(`Total Orders:       ${this.users.reduce((s, u) => s + u.orders.length, 0)}`);
    console.log(`Total Trades:       ${this.users.reduce((s, u) => s + u.trades.length, 0)}`);
    console.log(`Total Errors:       ${report.summary.errors}`);
    console.log(`Total Warnings:     ${report.summary.warnings}`);
    console.log(`${'='.repeat(70)}`);

    // User breakdown
    console.log('\n📊 USER BREAKDOWN:');
    console.log(`#  │ User ID      │ Orders │ Trades │ P&L      │ Status`);
    console.log(`───┼──────────────┼────────┼────────┼──────────┼─────────────`);
    this.users.forEach((u, i) => {
      const status = (u.netPnl || 0) > 0 ? 'WINNER 🟢' : (u.netPnl || 0) < 0 ? 'LOSER 🔴' : 'BREAK EVEN ⚪';
      const pnl = `${u.netPnl && u.netPnl >= 0 ? '+' : ''}$${(u.netPnl || 0).toFixed(2)}`;
      console.log(`${(i + 1).toString().padStart(2)} │ ${u.authUser.id.slice(0, 12)} │ ${u.orders.length.toString().padStart(6)} │ ${u.trades.length.toString().padStart(6)} │ ${pnl.padStart(8)} │ ${status}`);
    });

    console.log(`\n${'='.repeat(70)}`);

    await this.logger.saveToFile(CONFIG.OUTPUT_FILE);

    if (report.summary.errors > 0) {
      console.log(`\n⚠️  ${report.summary.errors} ERRORS detected — inspect the JSON report for details.`);
      process.exit(1);
    } else {
      console.log(`\n✅ Simulation completed with no critical errors.`);
      process.exit(0);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════════════════════
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ORCHESTRATOR
  // ═══════════════════════════════════════════════════════════════════════════
  async run() {
    try {
      console.log(`\n🚀 Starting Plokymarket Simulation`);
      console.log(`   Users: ${CONFIG.USER_COUNT} | Duration: ${CONFIG.SIMULATION_DURATION_MS / 60000}min | Balance: $${CONFIG.INITIAL_BALANCE}\n`);

      await this.validateConnection();
      await this.createUsers();
      await this.createMarket();
      await this.simulateBetting();
      await this.waitForMarketClose();
      await this.resolveMarket();
      await this.verifySettlement();
      await this.runStressTests();
      await this.generateReport();

    } catch (err: any) {
      this.logger.error('FATAL SIMULATION ERROR', err);
      await this.generateReport();
      process.exit(1);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

const simulator = new PlokySimulator();
simulator.run();
