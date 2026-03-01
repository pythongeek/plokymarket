# Market-Related Migration Conflict Analysis

## Summary

Analysis of all market-related migrations to identify conflicts with migration 141.

---

## 🔴 CRITICAL CONFLICTS (Will Break or Conflict)

### 1. **007_clob_system.sql - Order Book Schema**

**Status:** ⚠️ **POTENTIAL CONFLICT**

**What it creates:**
- `order_book` table (BUY/SELL orders with price-time priority)
- `trades` table (maker_order_id, taker_order_id, buyer_id, seller_id)

**Conflict with 141:**
- Migration 141 creates a simplified `orders` table via `create_event_complete`
- 141's `record_trade_price_history()` trigger expects `orders` table, not `order_book`

**Analysis:**
- If your app uses `order_book` (from 007), 141's trigger won't work
- If your app uses `orders` (from 141), 007's tables are redundant

**Recommendation:** 
- **KEEP 007** if you use the CLOB (Central Limit Order Book) system
- **141 should NOT recreate orders tables** if 007 exists

---

### 2. **008_clob_functions.sql - increment_filled()**

**Status:** ✅ **NO CONFLICT**

**What it does:**
- `increment_filled(p_order_id UUID, p_amount DECIMAL)` function
- Updates order_book table

**Analysis:**
- Only references `order_book` table
- No conflict with 141

---

### 3. **016_market_phases.sql - Trading Phases**

**Status:** ✅ **NO CONFLICT**

**What it adds:**
- `trading_phase` enum (PRE_OPEN, CONTINUOUS, AUCTION, HALTED, CLOSED)
- `trading_phase` column to markets
- `next_phase_time`, `auction_data` columns

**Analysis:**
- Additive only - adds columns if not exist
- No conflict with 141

---

### 4. **017_atomic_order_commitment.sql - place_atomic_order()**

**Status:** ⚠️ **DEPENDS ON ORDER TABLE**

**What it does:**
- `place_atomic_order()` function
- References `orders` table (not `order_book`)

**Analysis:**
- If 007 (order_book) is primary: This function won't work
- If 141's orders is primary: This function works

---

### 5. **021_advanced_matching_engine.sql - Complex CLOB**

**Status:** ⚠️ **MAJOR CONFLICT POTENTIAL**

**What it creates:**
- `order_nodes` table (intrusive linked list)
- `price_levels` table
- `matching_sequence` table
- `fill_notifications` table
- `matching_latency_metrics` table
- Complex FIFO/pro-rata matching functions

**Conflict with 141:**
- 141 creates simple `orders` table and basic trigger
- 021 creates enterprise-grade matching engine
- **These are completely different architectures**

**Analysis:**
- If you need high-performance matching: **KEEP 021**
- If you need simple trading: **141 is sufficient**

**Recommendation:**
- **DO NOT use both** - pick one architecture
- For production CLOB: Keep 021, modify 141 to not create orders

---

### 6. **050_market_creation_workflow.sql - Complex Workflow**

**Status:** ✅ **NO DIRECT CONFLICT**

**What it creates:**
- `market_creation_drafts` table
- `legal_review_queue` table
- `market_templates` table
- `sensitive_topics` table
- Complex workflow functions

**Analysis:**
- Self-contained workflow system
- No conflict with 141's event creation
- **BUT:** 141's `create_event_complete` bypasses this workflow

**Recommendation:**
- Use 050 for complex multi-stage market creation
- Use 141 for simple admin event creation
- They serve different purposes

---

### 7. **057_market_verification_config.sql - Draft Extensions**

**Status:** ✅ **NO CONFLICT**

**What it does:**
- Adds columns to `market_creation_drafts`
- Creates `deploy_market_full()` function

**Analysis:**
- Extends 050's workflow
- No conflict with 141

---

### 8. **061_settle_market_function.sql vs 087_settle_market_v2.sql**

**Status:** 🔴 **FUNCTION NAME COLLISION**

**What they do:**
- 061: `settle_market(UUID, UUID)` - Uses `orders` table, `settlement_claims`, `settlement_batches`
- 087: `settle_market_v2(UUID, outcome_type)` - Uses `positions` table, `wallets`

**Conflict:**
- Different signatures (good)
- But 061 uses `winning_outcome` column that may not exist
- 087 uses `outcome` column

**Analysis:**
- 061 expects: `markets.winning_outcome`
- 087 expects: `markets.outcome` (integer)

**Recommendation:**
- Pick one settlement approach
- 087 is simpler but requires `positions` table
- 061 is more complex but handles claims

---

### 9. **080_fix_markets_rls.sql**

**Status:** ✅ **NO CONFLICT**

**What it does:**
- RLS policies for markets table
- "Public can view markets"

**Analysis:**
- 141 also creates this policy
- Duplicate but harmless (idempotent)

---

### 10. **102_market_admin_fields.sql**

**Status:** ✅ **NO CONFLICT**

**What it adds:**
- `initial_liquidity`, `condition_id`, `token1`, `token2`, `neg_risk`, `resolver_reference`
- `volume` column
- `admin_update_market_fields()` function

**Analysis:**
- 141 adds similar columns but NOT these specific ones
- No conflict

---

### 11. **104_market_spec_compliance.sql**

**Status:** ⚠️ **TRIGGER CONFLICT**

**What it creates:**
- `handle_market_updated_at()` function + trigger
- `handle_trade_volume_update()` function + trigger
- `update_unique_traders()` function + trigger

**Conflict with 141:**
- 141 creates `record_trade_price_history()` trigger
- Both trigger on `trades` INSERT
- **Multiple triggers = potential performance issues**

**Analysis:**
- 141's trigger: Updates `yes_price`, `no_price`, `total_volume`
- 104's trigger: Updates `volume`, `total_volume`, `total_trades`, `unique_traders`
- Both update `total_volume` = **redundant**

**Recommendation:**
- Pick one: Either 141's trigger OR 104's triggers
- 104 is more comprehensive

---

### 12. **117_market_metrics.sql vs 118_clob_industry_standard.sql**

**Status:** 🔴 **MATERIALIZED VIEW COLLISION**

**What they do:**
- 117: Creates `market_metrics` materialized view (uses `buyer_id`, `seller_id`)
- 118: **DROPS AND RECREATES** `market_metrics` view (uses `maker_id`, `taker_id`)

**Conflict:**
- 118 drops 117's view and recreates with different column names
- If you run 117 after 118, it will fail

**Analysis:**
- These migrations are designed to run 117 first, then 118
- Order matters!

---

### 13. **123_create_event_with_markets_rpc.sql**

**Status:** 🔴 **CRITICAL CONFLICT**

**What it does:**
- `create_event_with_markets(JSONB, JSONB[])` function
- References `markets.outcomes` column (which doesn't exist)

**Conflict:**
- This function has a **BUG** - tries to insert into `outcomes` column
- 141 replaces this with `create_event_complete`

**Analysis:**
- Already identified in event analysis
- **DELETE this migration**

---

### 14. **123_phase2_multi_outcome_markets.sql**

**Status:** ⚠️ **TABLE DEPENDENCY**

**What it creates:**
- `outcomes` table (separate from markets)
- Links outcomes to markets

**Conflict:**
- 141 doesn't use this - uses `answer1`, `answer2` columns instead
- Different architecture

**Analysis:**
- If you need multiple outcomes (>2): Keep this
- If binary only: 141 is sufficient

---

### 15. **127_phase2_batch_orders.sql**

**Status:** ✅ **NO CONFLICT**

**What it creates:**
- `order_batches` table
- Batch order functions

**Analysis:**
- Self-contained feature
- No conflict with 141
- Adds `batch_id` to orders table

---

## 📊 CONFLICT SUMMARY TABLE

| Migration | Conflict Level | Action |
|-----------|---------------|--------|
| 007_clob_system | ⚠️ Medium | Keep if using CLOB |
| 008_clob_functions | ✅ None | Safe |
| 016_market_phases | ✅ None | Safe |
| 017_atomic_order | ⚠️ Medium | Depends on order table |
| 021_matching_engine | 🔴 High | Pick one architecture |
| 050_market_workflow | ✅ None | Safe (different purpose) |
| 057_verification_config | ✅ None | Safe |
| 061_settle_market | 🔴 High | Pick 061 OR 087 |
| 080_fix_rls | ✅ None | Safe (duplicate) |
| 102_admin_fields | ✅ None | Safe |
| 104_spec_compliance | ⚠️ Medium | Pick 104 OR 141 trigger |
| 117_market_metrics | 🔴 High | Run before 118 only |
| 118_clob_standard | 🔴 High | Modifies 117's view |
| 123_event_with_markets | 🔴 Critical | **DELETE** |
| 123_phase2_outcomes | ⚠️ Medium | Keep if multi-outcome |
| 127_batch_orders | ✅ None | Safe |

---

## 🎯 RECOMMENDATIONS

### If Using Simple Trading (141's approach):
```
DELETE:
- 007_clob_system.sql
- 008_clob_functions.sql  
- 021_advanced_matching_engine.sql
- 061_settle_market_function.sql
- 117_market_metrics.sql
- 118_clob_industry_standard.sql
- 123_create_event_with_markets_rpc.sql
- 123_phase2_multi_outcome_markets.sql

KEEP:
- 016_market_phases.sql
- 050_market_creation_workflow.sql
- 057_market_verification_config.sql
- 080_fix_markets_rls.sql
- 087_settle_market_v2.sql
- 102_market_admin_fields.sql
- 104_market_spec_compliance.sql (instead of 141's trigger)
- 127_phase2_batch_orders.sql
```

### If Using CLOB (007/021 approach):
```
DELETE:
- 141_final_resolution_fix.sql (or modify to not create orders/triggers)
- 123_create_event_with_markets_rpc.sql

KEEP:
- 007_clob_system.sql
- 008_clob_functions.sql
- 021_advanced_matching_engine.sql
- 016_market_phases.sql
- 050_market_creation_workflow.sql
- 061_settle_market_function.sql (or 087)
- 117_market_metrics.sql (run before 118)
- 118_clob_industry_standard.sql
```

---

## ⚠️ CRITICAL DECISION POINT

**You must choose ONE architecture:**

### Option A: Simple Event-Driven (Migration 141)
- Pros: Simpler, easier to maintain, faster setup
- Cons: Basic matching, limited order book depth
- Good for: MVP, simple predictions

### Option B: Full CLOB (Migrations 007+008+021)
- Pros: Professional trading, price-time priority, pro-rata
- Cons: Complex, harder to maintain
- Good for: Production exchange, high volume

### Option C: Hybrid (Custom)
- Use 141 for event creation
- Use 021 for matching engine
- Requires custom integration work

---

## 🔧 NEXT STEPS

1. **Decide which architecture you want**
2. **Delete conflicting migrations** based on decision
3. **Run migration 141** (modified if needed)
4. **Test thoroughly** before production
