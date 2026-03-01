# 🚀 Production CLOB Deployment Guide
## Better Than Polymarket - Bangladesh Prediction Market

---

## 📋 Overview

This deployment implements a **production-ready Central Limit Order Book (CLOB)** with features matching or exceeding Polymarket.

### ✨ Key Features

| Feature | Polymarket | Plokymarket CLOB |
|---------|------------|------------------|
| Order Matching | Price-Time Priority | ✅ Price-Time Priority + Pro-Rata |
| Order Types | Limit, Market | ✅ Limit, Market, Stop-Loss, Take-Profit, Iceberg |
| Time in Force | GTC | ✅ GTC, IOC, FOK, DAY, GTD |
| Order Book Depth | Real-time | ✅ Real-time + Aggregated |
| Charts | Basic | ✅ TradingView-Ready OHLC |
| Resolution | Manual | ✅ 7 Methods including AI Oracle |
| Social | None | ✅ Bookmarks, Follows, Likes |
| Categories | General | ✅ 25 Bangladesh Categories |
| Languages | English | ✅ Bangla, English, Hindi |

---

## 🔴 CRITICAL: Two-Step Migration Process

**PostgreSQL requires enum values to be committed before they can be used.**

You MUST run these in order:

### Step 1: Extend Enum (Run First)
```sql
-- File: 142a_extend_order_type_enum.sql
-- This MUST complete successfully before Step 2
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'stop_loss';
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'take_profit';
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'trailing_stop';
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'iceberg';
```

### Step 2: Run Main Migration (After Step 1)
```sql
-- File: 142b_production_clob_system.sql
-- This uses the new enum values
```

---

## 🚀 Deployment Steps

### Step 1: Backup Data
```bash
# Export your data first!
supabase db dump --db-url $VERCEL_DB_URL > backup_pre_clob.sql
```

### Step 2: Run Cleanup on Vercel
1. Go to Vercel Dashboard → Storage → Supabase
2. Open SQL Editor
3. Copy contents of `vercel_cleanup_script.sql`
4. Run it

### Step 3: Extend Enum (CRITICAL - Run First!)
1. Copy `142a_extend_order_type_enum.sql` to Vercel SQL Editor
2. **Run it separately** (must complete before next step)
3. Verify success message appears

### Step 4: Apply Production Migration
1. Copy `142b_production_clob_system.sql` to Vercel SQL Editor
2. Run the migration
3. Verify with:
```sql
SELECT * FROM supabase_migrations.migrations 
WHERE name LIKE '142%';
```

### Step 5: Update Frontend
```bash
# Copy new files to your project
cp "Event fix final try/EventService.ts" apps/web/src/lib/services/
cp "Event fix final try/types.ts" apps/web/src/lib/services/

# Install any new dependencies
npm install

# Build
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 📁 Files Created

```
Event fix final try/
├── 142a_extend_order_type_enum.sql    -- Step 1: MUST RUN FIRST
├── 142b_production_clob_system.sql    -- Step 2: Main migration
├── vercel_cleanup_script.sql          -- Cleanup (run before 142a)
├── EventService.ts                    -- Updated service
├── types.ts                           -- TypeScript types
└── DEPLOY_CLOB_PRODUCTION.md          -- This guide
```

---

## 🏗️ Architecture

### CLOB Order Matching

```
BUY ORDERS (Bids)          SELL ORDERS (Asks)
Price    Size              Price    Size
0.65    1000              0.70    500
0.64     800              0.71    800
0.63    1500              0.72   1200

SPREAD: 0.05 (0.70 - 0.65)
```

### Order Types Supported

1. **LIMIT** - Place at specific price
2. **MARKET** - Execute immediately at best price
3. **STOP_LOSS** - Trigger when price hits stop level
4. **TAKE_PROFIT** - Trigger when profit target hit
5. **TRAILING_STOP** - Stop follows price up
6. **ICEBERG** - Large order split into visible chunks

### Time in Force

- **GTC** - Good Till Cancelled (default)
- **IOC** - Immediate or Cancel
- **FOK** - Fill or Kill
- **DAY** - Expires end of day
- **GTD** - Good Till Date

---

## 🔧 API Functions

### Create Event
```typescript
const result = await eventService.createEventAtomic({
  title: "Bangladesh Cricket Win",
  question: "Will Bangladesh win the World Cup?",
  category: "cricket",
  trading_closes_at: "2026-03-15T00:00:00+06:00",
  resolution_method: "ai_oracle",
  resolution_delay_hours: 24,
  initial_liquidity: 5000
}, adminId);
```

### Get Order Book
```typescript
const depth = await eventService.getOrderBookDepth(marketId, 10);
// Returns: { bids: [...], asks: [...] }
```

### Get Price History
```typescript
const history = await eventService.getPriceHistory(marketId, 'YES', 100);
const ohlc = await eventService.getPriceOHLC(marketId, 'YES');
```

---

## 📊 Resolution Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `manual_admin` | Admin manually resolves | Internal testing |
| `ai_oracle` | Google Gemini AI resolves | Sports, Weather |
| `expert_panel` | Multiple experts vote | Legal, Political |
| `external_api` | External data source | Stock prices, Crypto |
| `consensus` | Weighted consensus | Complex outcomes |
| `community_vote` | Token-weighted voting | DAO governance |
| `hybrid` | AI + Human review | High-stakes markets |

---

## 🌍 Bangladesh Categories (25)

1. 🏏 Sports
2. 🏏 Cricket
3. ⚽ Football
4. 🏏 BPL
5. 🗳️ Politics
6. 🏛️ Bangladesh Politics
7. 🗳️ Election
8. 💰 Economy
9. 📈 Stock Market
10. ₿ Crypto
11. 💻 Technology
12. 🎬 Entertainment
13. 🎥 Bollywood
14. 🎞️ Dhallywood
15. 🌍 World Events
16. 🔬 Science
17. 🎭 Culture
18. 🏢 Business
19. 📚 Education
20. 🏥 Health
21. 🌿 Environment
22. 🏗️ Infrastructure
23. 🏙️ Dhaka City
24. 🌐 International
25. 📌 General

---

## ⚠️ Important Notes

### Data Preservation
- Events and markets data is preserved
- Old `resolution_systems` table is replaced
- Orders history is preserved

### Rollback
If issues occur:
```sql
-- Restore from backup
\i backup_pre_clob.sql
```

### Performance
- Order matching is optimized with composite indexes
- Price history has time-based partitioning
- OHLC materialized view for fast chart loading

---

## 🎉 Post-Deployment Checklist

- [ ] Create test event via admin panel
- [ ] Verify order book displays correctly
- [ ] Place test limit order
- [ ] Verify matching engine works
- [ ] Check price history recording
- [ ] Test resolution system
- [ ] Verify social features (bookmarks, follows)

---

## 📞 Support

For issues:
1. Check Vercel logs
2. Check Supabase logs
3. Review migration status
4. Contact: support@plokymarket.com

---

## 📝 Migration Summary

| Migration | Action | Status |
|-----------|--------|--------|
| 141_final_resolution_fix.sql | ❌ Replaced by 142 | Delete from Vercel |
| 142a_extend_order_type_enum.sql | ✅ Step 1: Extend enum | Run FIRST |
| 142b_production_clob_system.sql | ✅ Step 2: Main migration | Run SECOND |
| 007, 008, 021 | ✅ Keep (CLOB core) | Keep in Vercel |
| 093, 094, 123 | ❌ Simple versions | Delete from Vercel |

**Result**: Production-ready CLOB matching Polymarket + Bangladesh-specific enhancements.

---

## 🔴 Common Errors & Solutions

### Error: "unsafe use of new value of enum type"
**Cause**: Running main migration before enum extension
**Solution**: Run `142a_extend_order_type_enum.sql` FIRST, then `142b_production_clob_system.sql`

### Error: "invalid input value for enum order_status"
**Cause**: Using 'partial' instead of 'partially_filled'
**Solution**: Fixed in 142b - uses correct enum values

### Error: "invalid input value for enum order_type"
**Cause**: Using 'stop_loss' before it's added to enum
**Solution**: Run 142a first to extend the enum
