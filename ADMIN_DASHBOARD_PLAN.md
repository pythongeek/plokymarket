# Plokymarket Admin Dashboard — Full Assessment & Competitor-Grade Plan

## Current State Summary

### Git Status
- **Modified files:** ~70 (all admin API routes + core frontend)
- **Untracked files:** 13 (new auth components, AI agents, migration files, ecosystem config)
- **Repository health:** Needs commit. All changes are functional fixes, no dead code.

### Database — 95 Tables, Enterprise-Grade Schema
| Layer | Tables | Status |
|-------|--------|--------|
| Auth & Users | users, user_profiles, password_reset_tokens | ✅ |
| Events & Markets | events (VIEW), markets (113 cols), event_definitions, market_templates, custom_categories | ✅ |
| Trading Engine | orders, trades, positions, order_book, fill_records, clob engine | ✅ |
| Financial | wallets, transactions, deposit_requests, withdrawal_requests, wallet_transactions | ✅ |
| Settlement | settlement_claims, settlement_batches, settlement_records, settlement_statistics | ✅ |
| KYC | kyc_submissions, kyc_documents, user_kyc_profiles, kyc_settings | ✅ |
| AI/Oracle | ai_configs, ai_topic_configs, ai_daily_topics, oracle_requests, oracle_verifications | ✅ |
| Admin Ops | admin_audit_log, admin_settings, site_settings, site_announcements | ✅ |
| Social | comments, follows, activities, activity_feed | ✅ |
| Workflows | workflow_configs, workflow_schedules, upstash_workflow_runs | ✅ |

### Admin Dashboard — 17 Pages, ~5,000+ LOC
| Page | Lines | Status |
|------|-------|--------|
| Dashboard (sys-cmd-7x9k2) | ~350 | ✅ Stats cards, AI health, pending items |
| Market Control | 525 | ✅ CRUD, filter, search, status toggle |
| Event Management | 609 | ✅ List, status change, resolve, bulk actions |
| User Management | 762 | ✅ List, detail, suspend, wallet, interventions |
| Resolution System | 770 | ✅ Manual resolve, settlement tracking |
| KYC Verification | 216 | ✅ Approve/reject, settings |
| Deposits | 73 | ✅ Verify/reject |
| Withdrawals | 16 | ⚠️ Minimal — needs expansion |
| USDT Operations | 188 | ✅ Credit/debit/bulk |
| Exchange Rate | 393 | ✅ Config + migration |
| Analytics | 15 | ⚠️ Stub — needs charts |
| Monitoring | 407 | ✅ System health, trade metrics |
| Cron Jobs | 110 | ✅ QStash workflow manager |
| Levels | 363 | ✅ User level management |
| P2P | 235 | ⚠️ Basic display |
| AI Config | 19 | ⚠️ Stub |
| Daily Topics | 19 | ⚠️ Stub |

### What's WORKING Now
1. ✅ Homepage renders with live market data
2. ✅ All 9 core admin API routes return 200
3. ✅ Admin login via `/auth-portal-3m5n8` with JWT + rate limiting + IP whitelist
4. ✅ Market CRUD (create, edit, delete, filter, search)
5. ✅ Event status management (active → paused → resolved → closed)
6. ✅ Manual resolution with settlement tracking
7. ✅ KYC approve/reject + settings
8. ✅ Deposit/withdrawal verification
9. ✅ USDT credit/debit/bulk operations
10. ✅ User suspension, wallet interventions, audit logs
11. ✅ AI topic config, daily topics generation
12. ✅ Exchange rate configuration
13. ✅ Site announcements

---

## GAPS vs Polymarket.com — What's MISSING

### 🔴 Critical Gaps (Must Fix)

| # | Gap | Why It Matters |
|---|-----|---------------|
| 1 | **No AMM (Automated Market Maker)** | Polymarket uses CLOB + AMM hybrid. We only have CLOB. Liquidity bootstrapping is manual. |
| 2 | **No liquidity mining / rewards** | Polymarket has LP rewards. We have `maker_rebate_percent` in DB but no UI to configure. |
| 3 | **No real-time order book admin view** | Admin can't see live bids/asks for any market. Can't detect manipulation. |
| 4 | **No market analytics** | No volume-over-time charts, trader demographics, price history. |
| 5 | **No comment moderation** | Comments table exists, no admin moderation UI. |
| 6 | **Withdrawals page is 16 lines** | Barely functional. Needs full queue management. |
| 7 | **Analytics page is 15 lines** | Empty stub. Needs real charts. |
| 8 | **No market simulation before launch** | DB has `simulation_config`, `simulation_results` — unused. |
| 9 | **No scheduled publishing** | Can't schedule markets to go live at a future time. |
| 10 | **No market duplication** | Can't clone existing markets as templates. |

### 🟡 Medium Gaps (Should Fix)

| # | Gap | Why It Matters |
|---|-----|---------------|
| 11 | **No multi-outcome markets** | Only binary (YES/NO). Polymarket supports 3+ outcomes. |
| 12 | **No neg-risk (parimutuel) markets** | DB has `neg_risk` flag but unused. |
| 13 | **No scalar markets** | DB has `min_value`, `max_value`, `scalar_unit` but unused. |
| 14 | **No market categories admin** | `custom_categories` table exists, no admin UI. |
| 15 | **No fee breakdown config** | `fee_percent`, `trading_fee_percent` in DB, no admin UI to adjust. |
| 16 | **No risk score management** | `risk_score` column exists, no admin UI. |
| 17 | **No P&L reporting for users** | Admin can't see who won/lost money. |
| 18 | **No admin audit log viewer** | `admin_audit_log` table full of data, no UI to read it. |
| 19 | **No bulk user operations** | Can't bulk-suspend, bulk-email, bulk-level-change. |
| 20 | **No referral program admin** | No referral tracking at all. |

### 🟢 Nice-to-Have (Polymarket Extras)

| # | Feature | Polymarket Has |
|---|---------|---------------|
| 21 | **Twitter/X embed for market discussion** | ✅ |
| 22 | **Market embed widget for external sites** | ✅ |
| 23 | **API keys for power users** | ✅ |
| 24 | **Subgraphs / GraphQL API** | ✅ |
| 25 | **Mobile app** | ✅ |
| 26 | **Push notifications** | ✅ |
| 27 | **Dark mode toggle** | ✅ |
| 28 | **Leaderboard with badges/achievements** | Partial |
| 29 | **Social following / copy trading** | ✅ |
| 30 | **Conditional orders (stop-loss, take-profit)** | DB has `conditional_orders` table — unused |

---

## 🎯 PLAN: Beyond Polymarket Standard

### Phase 1: Foundation (Week 1) — "Admin Control Center"
**Goal:** Make admin dashboard fully functional for daily operations

1. **Admin Audit Log Viewer** — New page `/sys-cmd-7x9k2/audit-log`
   - Read `admin_audit_log` table
   - Filter by admin, action type, date range
   - Export CSV
   
2. **Real-Time Order Book Monitor** — New page `/sys-cmd-7x9k2/orderbook`
   - Select any active market
   - Show live bids/asks table
   - Detect wash trading patterns
   - Cancel suspicious orders

3. **Market Analytics Dashboard** — Expand `/sys-cmd-7x9k2/analytics`
   - Volume over time (Recharts line chart)
   - Unique traders per market
   - Price history chart
   - Top traders P&L
   - Market comparison table

4. **Withdrawals Full Management** — Rewrite `/sys-cmd-7x9k2/withdrawals`
   - Queue view (pending, processing, completed, rejected)
   - Bulk approve/reject
   - Export for bank reconciliation
   - Auto-approve under threshold

5. **Comment Moderation** — New page `/sys-cmd-7x9k2/comments`
   - List all comments
   - Flag/delete toxic comments
   - Ban users from commenting
   - Moderation actions logged

### Phase 2: Market Power (Week 2) — "Market Creation Studio"
**Goal:** Make market creation faster, safer, more powerful than Polymarket

6. **Market Templates System** — Expand existing templates
   - Pre-built templates: Sports, Crypto, Politics, Weather, Election
   - Clone existing market as template
   - Template marketplace (admin-only)

7. **Market Simulation Before Launch**
   - Use existing `simulation_config`, `simulation_results` columns
   - Simulate 100 traders with random strategies
   - Show projected liquidity, price volatility
   - Recommend initial liquidity amount

8. **Scheduled Publishing**
   - `starts_at` field already in DB
   - Draft → Scheduled → Active → Closed lifecycle
   - Auto-tweet on publish (if Twitter API configured)

9. **Multi-Outcome Markets**
   - Currently binary only (YES/NO)
   - Support 3+ outcomes: `answer1`, `answer2`, `answer3`, `answer4`
   - UI for outcome management
   - Resolution by selecting winning outcome

10. **Market Categories Admin**
    - CRUD for `custom_categories`
    - Subcategory management
    - Category stats (markets count, volume)

### Phase 3: Financial Engine (Week 3) — "Revenue & Risk Control"
**Goal:** Full control over fees, rewards, risk

11. **Fee Configuration UI**
    - Adjust `fee_percent`, `trading_fee_percent`, `maker_rebate_percent`
    - Per-category fee overrides
    - VIP user tier discounts
    - Fee revenue dashboard

12. **Liquidity Mining / Rewards**
    - Configure LP reward pools
    - Track `pmf_liquidity_pools`, `pmf_pool_shares`
    - Reward distribution schedule

13. **Risk Score Management**
    - Set `risk_score` per market (1-100)
    - Auto-flag high-risk markets for review
    - Risk-adjusted position limits

14. **P&L Reporting**
    - Per-user P&L report
    - Per-market P&L (house edge)
    - Monthly revenue report
    - Export for accounting

15. **Admin Audit Trail Enhancement**
    - Log ALL admin actions to `admin_audit_log`
    - Immutable log (append-only)
    - Alert on suspicious admin activity

### Phase 4: Scale & Intelligence (Week 4) — "AI-Powered Operations"
**Goal:** Reduce manual work, catch issues early

16. **AI Market Quality Scorer**
    - Auto-score new markets: clarity, liquidity potential, category fit
    - Reject low-quality markets automatically
    - Suggest improvements

17. **Anomaly Detection**
    - Detect unusual trading patterns (pump & dump, wash trading)
    - Auto-flag accounts
    - Alert admin via Telegram/email

18. **Auto-Resolution for Clear-Cut Events**
    - Sports scores via API
    - Crypto prices via oracle
    - Weather via API
    - Only manual for subjective events

19. **User Segmentation & Targeting**
    - Cohort analysis (new vs active vs churned)
    - Re-engagement campaigns
    - Personalized market recommendations

20. **Performance Monitoring**
    - API latency dashboard
    - DB query performance
    - Error rate tracking
    - Uptime monitoring

---

## 📊 Implementation Priority Matrix

| Feature | User Impact | Revenue Impact | Implementation Effort | Priority |
|---------|-------------|----------------|----------------------|----------|
| Audit Log Viewer | ⭐⭐ | ⭐ | Low | P1 |
| Order Book Monitor | ⭐⭐⭐ | ⭐⭐ | Medium | P1 |
| Market Analytics | ⭐⭐⭐ | ⭐⭐ | Medium | P1 |
| Withdrawals Full | ⭐⭐⭐ | ⭐⭐⭐ | Medium | P1 |
| Comment Moderation | ⭐⭐ | ⭐ | Low | P1 |
| Market Templates | ⭐⭐⭐ | ⭐⭐ | Medium | P2 |
| Multi-Outcome | ⭐⭐⭐ | ⭐⭐⭐ | High | P2 |
| Fee Config | ⭐⭐ | ⭐⭐⭐ | Low | P2 |
| Scheduled Publish | ⭐⭐ | ⭐⭐ | Low | P2 |
| P&L Reporting | ⭐⭐ | ⭐⭐⭐ | Medium | P3 |
| AI Quality Scorer | ⭐⭐ | ⭐⭐ | High | P3 |
| Anomaly Detection | ⭐⭐ | ⭐⭐⭐ | High | P3 |

---

## 🔧 DB Schema Additions Needed

```sql
-- For scheduled publishing (already have starts_at, but need status tracking)
ALTER TABLE markets ADD COLUMN IF NOT EXISTS publish_status varchar(20) DEFAULT 'draft';
-- draft, scheduled, active, paused, closed, resolved

-- For market templates
ALTER TABLE markets ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES markets(id);

-- For admin audit log (enhance existing)
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS user_agent text;

-- For referral program (new table)
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  code text UNIQUE NOT NULL,
  reward_rate numeric DEFAULT 0.05,
  total_referred integer DEFAULT 0,
  total_earned numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- For API keys (power users)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  key_hash text NOT NULL,
  name text,
  permissions text[], -- ['read', 'trade', 'withdraw']
  rate_limit integer DEFAULT 100,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);
```

---

## 🎯 Next Steps — Decision Needed

**Option A: Fix critical gaps first (P1 only)**
- 5 features, ~1 week
- Makes admin fully operational
- Cost: Low effort, high impact

**Option B: Full Phase 1+2 (P1+P2)**
- 10 features, ~2 weeks
- Beyond Polymarket in market creation power
- Cost: Medium effort, very high impact

**Option C: Everything (P1+P2+P3+P4)**
- 20 features, ~4 weeks
- True competitor-grade platform
- Cost: High effort, maximum impact

**Recommended: Option B** — Fix critical gaps + add market creation power. This gives you a platform that beats Polymarket on admin control while keeping scope manageable.

---

## 📋 Immediate Action Items (If You Say Go)

1. Commit current changes to git
2. Create feature branch: `admin-dashboard-v2`
3. Start with Audit Log Viewer (easiest win)
4. Then Order Book Monitor (highest admin value)
5. Then Withdrawals Full Rewrite (highest user value)
6. Then Market Analytics (impressive demo feature)

**Ready when you are.** Pick your option and I'll start building.
