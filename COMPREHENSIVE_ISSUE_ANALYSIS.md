# Plokymarket - Comprehensive Issue Analysis

**Project:** Plokymarket (Polymarket-style prediction marketplace for Bangladesh)  
**Date:** March 7, 2026  
**Status:** Skeleton Structure Complete - Many Features Non-Operational

---

## Executive Summary

The Plokymarket project has a comprehensive skeleton structure with most features having at least partial implementation. However, many components remain non-functional or incomplete. This document provides a systematic breakdown of all identified issues categorized by functional area, following Silicon Valley startup methodologies for prioritization and resolution.

---

## 1. DATABASE & MIGRATION ISSUES

### 1.1 Duplicate/Overlapping Functions
**Priority: CRITICAL**

Multiple database functions exist with overlapping responsibilities across different migrations:

| Function | Migrations | Issue |
|----------|-----------|-------|
| `create_event_complete` | 094, 123, 125 | Multiple versions with JSONB→TEXT[] casting issues |
| `create_event_with_markets` | 123, 125 | Duplicate implementation |
| `admin_get_user_wallet` | admin_wallet_functions.sql | Permission check references non-existent `users.is_admin` column |
| `fifo_enqueue`, `fifo_dequeue`, `fifo_remove` | matching_engine.sql | RPC functions may not exist in production |
| `match_order_fifo` | matching_engine.sql | Core matching function may be missing |
| `calculate_pro_rata_fills` | matching_engine.sql | Pro-rata algorithm function missing |

### 1.2 JSONB to TEXT[] Casting Errors
**Priority: CRITICAL**

The events and markets tables have `tags`, `ai_keywords`, and `ai_sources` columns defined as `TEXT[]` but the application sends JSONB arrays.

```sql
-- FAILS:
INSERT INTO events (tags) VALUES ('["sports", "cricket"]'::JSONB::TEXT[]);
-- ERROR: cannot cast type jsonb to text[]
```

**Files affected:**
- `supabase/migrations/094_reimplemented_events_markets.sql`
- `supabase/migrations/123_*.sql` (multiple)
- `supabase/migrations/125_*.sql` (multiple)

### 1.3 Missing Columns in Production
**Priority: HIGH**

- `events.title` - Migration 142a addresses this but may not be applied
- `markets.answer_type`, `answer1`, `answer2` - Missing in some markets
- `resolution_systems.ai_keywords`, `ai_sources` - Array columns may not exist

### 1.4 Schema Inconsistencies
**Priority: HIGH**

- Orders table: Schema variant with `user_id` vs `buyer_id` + `seller_id`
- Trades table: Inconsistent schema between old and new implementations
- User profiles: Multiple columns with similar purposes (`is_admin` vs `users.role`)

---

## 2. MARKET SETTINGS (Non-Functional)

### 2.1 Market Configuration UI
**Priority: MEDIUM**

**Status:** Component exists but settings don't persist or apply

- [`MarketInfoPanel.tsx`](apps/web/src/components/market/MarketInfoPanel.tsx) - Shows resolution criteria but values are hardcoded fallbacks
- No dedicated market settings page in admin panel
- Trading parameters (min/max order size, fee tiers) not configurable per market

### 2.2 Trading Parameters
**Priority: MEDIUM**

The following market parameters are not being applied:
- Minimum order size
- Maximum order size  
- Fee tiers (maker/rebate)
- Trading hours restrictions
- Market pause/resume functionality partially works but not reliable

### 2.3 Fee Structure Settings
**Priority: LOW**

- Fee configuration UI exists in admin but not wired to order matching
- Maker rebates table exists but not integrated with trades
- Rebates page shows placeholder data

---

## 3. RESOLUTION OPTIONS (5-6 Options - Most Non-Functional)

### 3.1 Manual Admin Resolution
**Status:** IMPLEMENTED (needs testing)

**Files:**
- [`/api/resolution/manual/route.ts`](apps/web/src/app/api/resolution/manual/route.ts)

**Issues:**
- Emergency mode works immediately
- Standard mode requires approval workflow (partially implemented)
- Telegram notifications need valid bot token

### 3.2 AI Oracle Resolution
**Status:** PARTIALLY FUNCTIONAL (uses mock data)

**Files:**
- [`/api/resolution/ai-oracle/route.ts`](apps/web/src/app/api/resolution/ai-oracle/route.ts)
- [`/api/ai-oracle/resolve/`](apps/web/src/app/api/ai-oracle/resolve/)

**Critical Issues:**
```typescript
// Line 15-31: Mock news fetcher - NOT FUNCTIONAL
async function fetchNewsArticles(keywords: string[], sources: string[]): Promise<any[]> {
  // In production, integrate with:
  // - NewsAPI
  // - GDELT
  // - Custom RSS feeds
  // - Bangladesh news sources

  // For now, return mock data based on keywords
  return [
    {
      title: `Latest update on ${keywords[0]}`,
      source: sources[0] || 'prothomalo.com',
      // ...
    }
  ];
}
```

**Required for production:**
- [ ] Integrate real news APIs (NewsAPI, GDELT, Bangladesh RSS)
- [ ] Add web scraping for local news sources
- [ ] Implement confidence threshold tuning

### 3.3 Expert Panel Resolution
**Status:** API EXISTS, UI NOT BUILT

**Files:**
- [`/api/resolution/expert-panel/route.ts`](apps/web/src/app/api/resolution/expert-panel/route.ts)

**Issues:**
- API for voting exists (`expert_votes` table)
- Expert panel table exists with weights/accuracy
- No UI for experts to cast votes
- Minimum 5 votes required but no verification flow

### 3.4 External API / n8n Webhook
**Status:** DEPRECATED - Migrated to QStash

**Status:** Legacy - moved to deprecated folder

### 3.5 Community Vote
**Status:** NOT IMPLEMENTED

- No database tables for voting
- No API endpoints
- No UI components

### 3.6 Hybrid System  
**Status:** NOT IMPLEMENTED

- No combination logic implemented
- No UI for hybrid configuration

---

## 4. FRONTEND FEATURE GAPS

### 4.1 TopPositionsLeaderboard
**Priority: MEDIUM**

**Status:** PLACEHOLDER ONLY

```typescript
// File: apps/web/src/components/market/TopPositionsLeaderboard.tsx
export function TopPositionsLeaderboard({ marketId }: TopPositionsLeaderboardProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12...">
            <Trophy className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">পজিশন র্যাংকিং লুড হচ্ছে...</p>
            <p className="text-xs opacity-60">শীঘ্রই এই ফিচারটি উন্মোচন করা হবে।</p>
        </div>
    );
}
```

**Required:**
- Query positions table for market
- Calculate P&L per user
- Display ranked leaderboard

### 4.2 MarketRecommendations
**Priority: MEDIUM**

**Status:** PARTIALLY FUNCTIONAL

**File:** [`MarketRecommendations.tsx`](apps/web/src/components/market/MarketRecommendations.tsx)

**Issues:**
- Uses basic algorithm (volume, closing time, spread)
- No real AI personalization (user interests not populated)
- "For You" tab falls back to popular markets

### 4.3 Historical Price Chart
**Priority: MEDIUM**

**Status:** PLACEHOLDER ONLY

```typescript
// File: apps/web/src/components/market/MarketInfoPanel.tsx (line 100-129)
// Historical Mini Chart Placeholder (To be implemented with Recharts/Canvas)
<div className="h-24 w-full bg-muted/30 rounded-lg border border-border/50 flex items-center justify-center">
    <span className="text-xs text-muted-foreground z-10">Chart Data Loading...</span>
</div>
```

**Required:**
- Integrate Recharts or Chart.js
- Fetch price history from database
- Implement time range selectors

### 4.4 Real-time Notifications
**Priority: MEDIUM**

**Status:** INCOMPLETE

- WebSocket subscriptions exist but not reliable
- Toast notifications partial
- No notification center UI
- Email notifications for large fills not implemented

---

## 5. AI AGENTS (Not Functional)

### 5.1 Agent Files Present (18 files)
**Priority: CRITICAL**

Located in [`apps/web/src/lib/ai-agents/`](apps/web/src/lib/ai-agents/):

| Agent | Purpose | Status |
|-------|---------|--------|
| `content-agent.ts` | Content generation | Not wired |
| `duplicate-detector.ts` | Deduplication | Not wired |
| `intelligent-router.ts` | Request routing | Not wired |
| `market-logic-agent.ts` | Market validation | Not wired |
| `market-proposal-agent.ts` | Event suggestions | Not wired |
| `orchestrator.ts` | Agent coordination | Not wired |
| `risk-agent.ts` | Risk assessment | Not wired |
| `timing-agent.ts` | Timing optimization | Not wired |
| `vertex-audit-agent.ts` | Compliance | Not wired |
| `vertex-concierge-agent.ts` | User support | Not wired |
| `vertex-content-agent.ts` | Content | Not wired |
| `vertex-growth-agent.ts` | Growth | Not wired |
| `vertex-quant-logic-agent.ts` | Quantitative | Not wired |
| `vertex-sentinel-agent.ts` | Security | Not wired |
| `vertex-timing-agent.ts` | Timing | Not wired |

### 5.2 Vertex AI Integration
**Priority: HIGH**

**File:** [`apps/web/src/app/api/ai/vertex-generate/route.ts`](apps/web/src/app/api/ai/vertex-generate/route.ts)

**Issues:**
- Model IDs may be outdated (`gemini-1.5-flash-002`, `gemini-1.5-pro-002`)
- Requires `GOOGLE_CLOUD_PROJECT` and `VERTEX_LOCATION` env vars
- Asia-south1 region (Mumbai) may have latency issues

### 5.3 Kimi AI Integration
**Priority: MEDIUM**

**File:** [`apps/web/src/lib/ai/kimi-client.ts`](apps/web/src/lib/ai/kimi-client.ts)

**Issues:**
- API key may not be configured (`KIMI_API_KEY`)
- Not integrated into any workflow

---

## 6. ORDERBOOK & MATCHING ENGINE

### 6.1 Missing Database Functions
**Priority: CRITICAL**

The matching engine in [`apps/web/src/lib/matching/engine.ts`](apps/web/src/lib/matching/engine.ts) calls these RPC functions that may not exist:

```typescript
// Required DB functions that may be missing:
await supabase.rpc('fifo_enqueue', {...})      // May not exist
await supabase.rpc('fifo_dequeue', {...})      // May not exist
await supabase.rpc('fifo_remove', {...})       // May not exist
await supabase.rpc('match_order_fifo', {...})  // May not exist
await supabase.rpc('calculate_pro_rata_fills', {...}) // May not exist
await supabase.rpc('notify_fill', {...})       // May not exist
await supabase.rpc('record_latency', {...})    // May not exist
```

### 6.2 In-Memory Implementation Issues
**Priority: HIGH**

The [`OrderQueue`](apps/web/src/lib/matching/engine.ts:55) class has issues:
- Uses client-side linked list that doesn't persist
- Node references are incomplete (only stores IDs)
- Cannot properly remove nodes from middle of queue

### 6.3 Pro-Rata Implementation
**Priority: MEDIUM**

- Algorithm exists in code but database function may be missing
- Threshold configuration (`PRO_RATA_MIN_VOLUME: 1000000`) may be unrealistic

---

## 7. WALLET & PAYMENTS

### 7.1 Admin Wallet Functions
**Priority: HIGH**

**File:** [`supabase/migrations/admin_wallet_functions.sql`](apps/web/supabase/migrations/admin_wallet_functions.sql)

**Critical Issue - Permission Check Bug:**
```sql
-- Line 30-36: References non-existent column
IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id 
    AND (is_admin = true OR is_super_admin = true)  -- is_admin column may not exist in users table
) THEN
```

The `users` table may not have `is_admin` column - should reference `user_profiles.is_admin`.

### 7.2 USDT Deposit/Withdrawal System
**Priority: HIGH**

**Status:** INCOMPLETE

- Workflows created in migration 142
- Manual verification queue exists
- TRC20 address generation not implemented
- Confirmation tracking incomplete

### 7.3 bKash/Nagad Integration
**Priority: LOW**

**Status:** NOT IMPLEMENTED

- Payment method enum exists but no integration
- No API endpoints for payment callbacks
- No reconciliation system

---

## 8. SCALABILITY INFRASTRUCTURE

### 8.1 Database Indexes
**Priority: MEDIUM**

Current indexes may not be optimal for high traffic:
- Orders: Need composite index on `(market_id, outcome, side, status, price)`
- Trades: Need index on `(market_id, created_at)`
- Positions: Need index on `(user_id, market_id)`

### 8.2 Redis Caching
**Priority: MEDIUM**

- Redis client exists (`lib/upstash/redis.ts`)
- Not integrated into hot paths
- No cache invalidation strategy

### 8.3 Connection Pooling
**Priority: LOW**

- Supabase handles automatically
- May need tuning for high-load scenarios

---

## 9. WORKFLOW & AUTOMATION

### 9.1 QStash Migration (Complete)
**Priority: DONE**

- n8n webhooks deprecated and moved to `_deprecated` folders
- New tables created: `upstash_workflow_runs`, `workflow_dlq`, `workflow_schedules`
- Migration 142b/142c applied

### 9.2 Workflow Monitoring
**Priority: MEDIUM**

**Status:** PARTIALLY COMPLETE

- Views created in migration 142c
- Health check function exists
- Dashboard incomplete

### 9.3 Dead Letter Queue (DLQ)
**Priority: MEDIUM**

**Status:** PARTIALLY COMPLETE

- Table exists: `workflow_dlq`
- API endpoints created but not fully tested
- Manual resolution workflow needed

---

## 10. ADDITIONAL GAPS

### 10.1 KYC System
**Priority: MEDIUM**

- Tables exist
- API routes exist (`/api/kyc/*`)
- Frontend incomplete

### 10.2 Social Features
**Priority: LOW**

- Comments table exists
- Follows table exists
- Activity feed table exists
- No UI components fully implemented

### 10.3 Leaderboard
**Priority: LOW**

- Tables and APIs exist
- Rebates page shows placeholder
- Rewards tiers not calculated

### 10.4 Expert Panel
**Priority: LOW**

- Tables exist (`expert_panel`, `expert_votes`)
- API exists for voting
- No admin UI for managing experts

---

## Priority Matrix

| Priority | Category | Issues Count | Impact |
|----------|----------|--------------|--------|
| CRITICAL | Database Functions | 7 | System cannot process orders |
| CRITICAL | AI News Fetching | 1 | Resolution system broken |
| CRITICAL | AI Agents | 18 | Core intelligence non-functional |
| HIGH | Admin Wallet Permissions | 1 | Admin cannot manage wallets |
| HIGH | Market Settings | 3 | Configuration not applied |
| HIGH | USDT System | 2 | Payment system incomplete |
| MEDIUM | Frontend Features | 4 | UI gaps |
| MEDIUM | Resolution Options | 3 | Half implemented |
| MEDIUM | Orderbook/Matching | 2 | Performance issues |
| MEDIUM | Scalability | 3 | Performance at scale |
| LOW | Payment Integrations | 2 | Future feature |
| LOW | Social Features | 3 | Nice to have |

---

## Recommended Approach

### Phase 1: Critical Fixes (Week 1-2)
1. Fix database function permissions (admin_wallet_functions.sql)
2. Create missing matching engine RPC functions
3. Fix JSONB→TEXT[] casting in event creation
4. Implement real news fetching for AI Oracle

### Phase 2: Core Functionality (Week 3-4)
1. Complete market settings persistence
2. Fix order matching flow end-to-end
3. Complete USDT deposit/withdrawal flow
4. Implement expert panel UI

### Phase 3: Feature Completion (Week 5-6)
1. Complete AI agent orchestration
2. Implement historical charts
3. Build notification system
4. Complete KYC flow

### Phase 4: Polish & Scale (Week 7-8)
1. Optimize database indexes
2. Implement Redis caching
3. Complete social features
4. Build analytics dashboard

---

## Appendix: File Reference Map

### Database
- Migrations: `apps/web/supabase/migrations/`
- Key tables: events, markets, orders, trades, positions, wallets, resolution_systems

### API Routes
- Admin: `apps/web/src/app/api/admin/`
- Resolution: `apps/web/src/app/api/resolution/`
- AI: `apps/web/src/app/api/ai*/`
- Workflows: `apps/web/src/app/api/workflows/`

### Frontend Components
- Market: `apps/web/src/components/market/`
- Trading: `apps/web/src/components/trading/`
- Admin: `apps/web/src/components/admin/`

### Services
- Matching: `apps/web/src/lib/matching/`
- AI Agents: `apps/web/src/lib/ai-agents/`
- Oracle: `apps/web/src/lib/oracle/`
