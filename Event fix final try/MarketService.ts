/**
 * ============================================================
 * MarketService.ts — Server-side Market operations
 * ============================================================
 * Companion to EventService. Handles everything that happens
 * AFTER a market is created: live price updates, volume
 * aggregation, orderbook seeding, and stats queries.
 *
 * Architecture:
 *   Trades table → trigger updates markets (yes_price, total_volume)
 *   MarketService.updateMarketPrices() → manual override if trigger lags
 *   MarketService.seedInitialOrderbook() → called by create_event_complete RPC
 *     (but also callable standalone for markets that were created pre-fix)
 *
 * Bangladesh context:
 *   - Volume tracked in BDT (integer paisa not used — whole BDT only)
 *   - Initial prices: 0.50/0.50 (fair coin), seeded orders at 0.48
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Admin client factory ─────────────────────────────────────────────────────
function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           || process.env.SUPABASE_SECRET_KEY!;
  if (!url || !key) {
    throw new Error('[MarketService] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarketStats {
  market_id:    string;
  yes_price:    number;   // 0.00 – 1.00
  no_price:     number;
  total_volume: number;   // BDT
  liquidity:    number;   // BDT in orderbook
  trader_count: number;
  trade_count:  number;
  price_24h_delta: number; // percentage points, e.g. +3.5
}

export interface OrderbookSeedResult {
  success:  boolean;
  order_ids: string[];
  error?:   string;
}

// ── MarketService ────────────────────────────────────────────────────────────

export class MarketService {

  /**
   * Seed the orderbook for a freshly created market.
   *
   * Why we do this:
   *   Without any orders, the YES/NO price is undefined and the market
   *   appears broken to users. We plant two small limit orders:
   *     - YES @ 0.48 BDT  (willing to buy YES for 0.48, implies ~50% chance)
   *     - NO  @ 0.48 BDT
   *   This gives the market a fair starting price and allows immediate trading.
   *
   * Note: The create_event_complete RPC already calls this logic internally.
   * Use this method for legacy markets that were created before the fix.
   *
   * @param marketId  - UUID of the market to seed
   * @param adminId   - UUID of the admin placing the seed orders
   * @param liquidity - Total BDT to split between YES/NO seed orders
   */
  async seedInitialOrderbook(
    marketId: string,
    adminId: string,
    liquidity = 1000
  ): Promise<OrderbookSeedResult> {
    const supabase = getAdminClient();
    const halfLiquidity = Math.floor(liquidity / 2);

    // Check: don't re-seed if orders already exist
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('market_id', marketId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[MarketService] Market ${marketId} already has orders — skipping seed`);
      return { success: true, order_ids: [] };
    }

    const seedOrders = [
      {
        market_id:    marketId,
        user_id:      adminId,
        order_type:   'limit',
        side:         'buy',
        outcome:      'yes',
        price:        0.48,
        quantity:     halfLiquidity,
        filled:       0,
        status:       'open',
        created_at:   new Date().toISOString(),
      },
      {
        market_id:    marketId,
        user_id:      adminId,
        order_type:   'limit',
        side:         'buy',
        outcome:      'no',
        price:        0.48,
        quantity:     halfLiquidity,
        filled:       0,
        status:       'open',
        created_at:   new Date().toISOString(),
      },
    ];

    const { data, error } = await supabase
      .from('orders')
      .insert(seedOrders)
      .select('id');

    if (error) {
      console.error('[MarketService] seedInitialOrderbook error:', error);
      return { success: false, order_ids: [], error: error.message };
    }

    // Update market liquidity column to reflect seeded amount
    await supabase
      .from('markets')
      .update({ liquidity, yes_price: 0.50, no_price: 0.50 })
      .eq('id', marketId);

    const orderIds = (data || []).map((r: { id: string }) => r.id);
    console.log(`[MarketService] ✅ Seeded ${orderIds.length} orders for market ${marketId}`);
    return { success: true, order_ids: orderIds };
  }

  /**
   * Recalculate and persist yes_price / no_price for a market.
   *
   * The DB trigger record_trade_price_history() handles this automatically
   * on every trade. Call this method when you need a manual refresh, e.g.
   * after bulk-importing historical trades or debugging stale prices.
   *
   * Price formula: weighted average of last N filled trade prices.
   */
  async updateMarketPrices(marketId: string, lookbackTrades = 20): Promise<void> {
    const supabase = getAdminClient();

    // Fetch recent trades for this market
    const { data: trades, error } = await supabase
      .from('trades')
      .select('price, outcome, quantity, created_at')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(lookbackTrades);

    if (error || !trades || trades.length === 0) {
      console.log(`[MarketService] No trades found for market ${marketId} — prices unchanged`);
      return;
    }

    // Weighted average price for each outcome
    const calcWeightedAvg = (outcome: 'yes' | 'no') => {
      const relevant = trades.filter(t => t.outcome === outcome);
      if (relevant.length === 0) return 0.50; // fair default
      const totalQty   = relevant.reduce((s, t) => s + t.quantity, 0);
      const weightedSum = relevant.reduce((s, t) => s + t.price * t.quantity, 0);
      return totalQty > 0 ? weightedSum / totalQty : 0.50;
    };

    const yesPrice = parseFloat(calcWeightedAvg('yes').toFixed(4));
    const noPrice  = parseFloat((1 - yesPrice).toFixed(4)); // binary constraint: yes + no = 1

    const totalVolume = trades.reduce((s, t) => s + (t.quantity * t.price), 0);

    await supabase
      .from('markets')
      .update({
        yes_price:    yesPrice,
        no_price:     noPrice,
        total_volume: totalVolume,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', marketId);

    console.log(`[MarketService] Updated market ${marketId}: YES=${yesPrice}, NO=${noPrice}`);
  }

  /**
   * Fetch comprehensive stats for a market page (MarketStatsBanner component).
   *
   * Returns a single aggregated object that the frontend can display directly.
   * Falls back gracefully if some columns don't exist (schema migration not yet run).
   */
  async getMarketStats(marketId: string): Promise<MarketStats | null> {
    const supabase = getAdminClient();

    // Fetch core market data
    const { data: market, error: mErr } = await supabase
      .from('markets')
      .select('yes_price, no_price, total_volume, liquidity')
      .eq('id', marketId)
      .single();

    if (mErr || !market) {
      console.error('[MarketService] getMarketStats: market not found', mErr);
      return null;
    }

    // Count distinct traders (supports both old user_id and new buyer_id/seller_id schema)
    const { count: tradeCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('market_id', marketId);

    // Approximate unique traders via buyer_id (new schema), fall back to user_id
    const { data: traderRows } = await supabase
      .from('trades')
      .select('buyer_id, seller_id, user_id')
      .eq('market_id', marketId);

    const traderSet = new Set<string>();
    (traderRows || []).forEach(t => {
      if (t.buyer_id)  traderSet.add(t.buyer_id);
      if (t.seller_id) traderSet.add(t.seller_id);
      if (t.user_id)   traderSet.add(t.user_id);
    });

    // 24h price delta: compare current yes_price with price 24h ago
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: oldPriceRow } = await supabase
      .from('price_history')
      .select('yes_price')
      .eq('market_id', marketId)
      .lte('recorded_at', since24h)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentYes = market.yes_price ?? 0.50;
    const oldYes     = oldPriceRow?.yes_price ?? currentYes;
    const delta24h   = parseFloat(((currentYes - oldYes) * 100).toFixed(2)); // in % points

    return {
      market_id:       marketId,
      yes_price:       currentYes,
      no_price:        market.no_price ?? (1 - currentYes),
      total_volume:    market.total_volume ?? 0,
      liquidity:       market.liquidity ?? 0,
      trader_count:    traderSet.size,
      trade_count:     tradeCount ?? 0,
      price_24h_delta: delta24h,
    };
  }

  /**
   * Batch-seed multiple legacy markets that have no orderbook entries.
   * Useful as a one-time fix when deploying migration 140 on an existing DB.
   *
   * Usage: call from a one-off admin API route, not on every request.
   */
  async seedLegacyMarkets(adminId: string, dryRun = false): Promise<{
    seeded: string[];
    skipped: string[];
  }> {
    const supabase = getAdminClient();

    // Find all active markets with no orders
    const { data: markets } = await supabase
      .from('markets')
      .select('id')
      .eq('status', 'active');

    if (!markets || markets.length === 0) {
      return { seeded: [], skipped: [] };
    }

    const seeded:  string[] = [];
    const skipped: string[] = [];

    for (const { id } of markets) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('market_id', id)
        .limit(1);

      if (orders && orders.length > 0) {
        skipped.push(id);
        continue;
      }

      if (!dryRun) {
        const result = await this.seedInitialOrderbook(id, adminId, 1000);
        if (result.success) seeded.push(id);
        else skipped.push(id);
      } else {
        seeded.push(id); // dry run: report what would be seeded
      }
    }

    console.log(`[MarketService] seedLegacyMarkets: seeded=${seeded.length}, skipped=${skipped.length}`);
    return { seeded, skipped };
  }
}

// Singleton export for use in API routes
export const marketService = new MarketService();
