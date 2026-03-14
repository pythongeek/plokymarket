# Complete TypeScript Error List by File

**Total Errors**: ~1100+ errors across all files
**Generated**: 2026-03-13

---

## Root Cause Categories

| Category | Error Count | Root Cause |
|----------|-------------|------------|
| Supabase Database Schema Mismatches | ~350 | Tables/columns exist in production but NOT in generated types |
| RPC Function Type Missing | ~200 | Database functions not registered in Supabase types |
| Type Definition Mismatches | ~300 | TypeScript types don't match actual data structures |
| Implicit Any Types | ~150 | Parameters/variables without explicit type annotations |
| Null/Undefined Type Issues | ~100 | Not handling null/undefined properly |

---

## API Routes (src/app/api/)

### Admin API Routes (src/app/api/admin/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| deposits/verify/route.ts | 1 | RPC function not registered |
| events/create/route.ts | 1 | Property 'retries' not valid |
| exchange-rate-migrate/route.ts | 1 | Wrong method on Supabase query |
| kyc/verify/route.ts | 1 | Missing column 'admin_notes' |
| markets/[id]/fields/route.ts | 1 | Wrong method on Supabase query |
| markets/batch/route.ts | 3 | Missing columns question_bn, event_id |
| metrics/market/route.ts | 3 | Missing view 'market_metrics' |
| resolution/markets/route.ts | 6 | Missing view 'view_resolvable_events' |
| settlement/route.ts | 1 | Null not assignable to string |
| support/messages/route.ts | 9 | Missing tables support_ticket_messages, support_tickets |
| support/route.ts | 6 | Missing table 'support_tickets' |
| usdt/credit/route.ts | 9 | Missing columns usdt_balance, is_admin |
| usdt/debit/route.ts | 7 | Missing columns usdt_balance, is_admin |
| users/audit-log/route.ts | 2 | RPC function, spread type |
| users/detail/route.ts | 10 | Multiple missing tables/views |
| users/interventions/route.ts | 8 | Missing table position_interventions |
| users/route.ts | 3 | Type null not assignable |
| verify-escrow/route.ts | 6 | Null handling |
| verify/route.ts | 1 | Missing property p_resource_id |
| withdrawals/complete/route.ts | 1 | RPC function |
| withdrawals/reject/route.ts | 1 | RPC function |
| withdrawals/route.ts | 1 | String not assignable to enum |
| workflows/dlq/route.ts | 7 | Multiple type issues |
| workflows/setup/route.ts | 2 | Wrong argument count |
| workflows/trigger/route.ts | 1 | Missing column is_admin |

### AI API Routes (src/app/api/ai-*/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| ai-oracle/resolve/route.ts | 4 | Missing column pipeline_id |
| ai/event-processor/route.ts | 5 | Missing table ai_event_pipelines |
| ai/event-workflow/route.ts | 7 | Missing table ai_event_pipelines |
| ai/reject-suggestion/route.ts | 1 | Undefined not assignable |

### Comments API (src/app/api/comments/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| [id]/like/route.ts | 2 | Null handling |
| route.ts | 1 | Null handling |

### Cron API Routes (src/app/api/cron/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| batch-markets/route.ts | 2 | Implicit any |
| check-markets/route.ts | 1 | Missing property resolution_status |
| daily-ai-topics/route.ts | 2 | Implicit any |
| daily-topics/route.ts | 2 | Missing property title |

### Workflows API Routes (src/app/api/workflows/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| auto-verify/route.ts | 9 | Multiple schema mismatches |
| combined-analytics/route.ts | 1 | Missing table/view |
| combined-daily-ops/route.ts | 1 | Missing table/view |
| combined-market-data/route.ts | 1 | Missing table/view |
| daily-report/route.ts | 1 | Missing property |
| deposit/route.ts | 6 | Schema mismatches |
| event-processor/route.ts | 1 | Missing table |
| exchange-rate/route.ts | 23 | Schema mismatches |
| execute/route.ts | 1 | Wrong argument |
| execute-crypto/route.ts | 2 | Schema mismatch |
| execute-news/route.ts | 4 | Schema mismatch |
| execute-sports/route.ts | 2 | Schema mismatch |
| management.ts | 1 | Schema mismatch |
| market-close-check/route.ts | 1 | Implicit any |
| resolution-trigger/route.ts | 8 | Multiple type issues |
| v2/execute/route.ts | 5 | Type mismatches |
| withdrawal/route.ts | 7 | Schema mismatches |

---

## Admin Panel Pages (src/app/sys-cmd-7x9k2/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| events/create/hybrid/page.tsx | 5 | Implicit any, indexing issues |
| events/create/old_page_utf8.tsx | 1 | Implicit any |
| markets/page.tsx | 2 | Missing property liquidity_source |
| resolutions/page.tsx | 1 | Implicit any |
| usdt/page.tsx | 4 | Missing columns usdt_balance, etc. |
| usdt/settings/page.tsx | 1 | Schema mismatch |
| usdt/transactions/page.tsx | 1 | Type mismatch |
| usdt/users/[id]/page.tsx | 2 | Schema mismatches |
| users/detail/components/UserWalletView.tsx | 1 | Duplicate identifier |

---

## Components (src/components/)

### Admin Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| AIAgentStatus.tsx | 1 | Missing name 'providerLabels' |
| EventCreationPanelWithPreview.tsx | 2 | Props mismatch |
| MarketActions.tsx | 4 | Implicit any |
| MarketStatsBanner.tsx | 1 | Implicit any |
| SecureAdminLayout.tsx | 1 | Duplicate identifier |

### Market Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| MarketCard.tsx | 1 | Missing property is_verified |
| MarketStatsBanner.tsx | 1 | Implicit any |
| MultiOutcomeList.tsx | 1 | Missing property title |

### Portfolio Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| AdvancedPerformanceCharts.tsx | 8 | Multiple type issues |
| ChartComponents.tsx | 6 | Type issues, duplicate import |
| PnLDashboard.tsx | 1 | Unused ts-expect-error |
| PositionHistory.tsx | 1 | Missing property taxLotMethod |

### Social Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| ActivityFeed.tsx | 2 | Type conversion issues |
| FollowButton.tsx | 3 | Type mismatch |

### Trading Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| AdvancedChart.tsx | 1 | Schema mismatch |
| MyPositions.tsx | 2 | Missing properties |
| TradingPanel.tsx | 2 | Multiple issues |

### Wallet Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| BalanceCard.tsx | 2 | Module not found, implicit any |
| TransactionHistory.tsx | 2 | Implicit any |
| WalletDashboard.tsx | 1 | Implicit any |

### Other Components

| File | Errors | Specific Errors |
|------|--------|-----------------|
| activity/ActivityItem.tsx | 5 | Type issues |
| deposit/ManualAgentDeposit.tsx | 1 | Implicit any |
| error/ErrorBoundary.tsx | 2 | ImportMeta, type issues |
| events/EventList.tsx | 1 | Type mismatch |
| ExchangeRateDisplay.tsx | 4 | Missing properties |
| home/MarketGrid.tsx | 1 | Expected 0 arguments |
| matching/FillNotifications.tsx | 6 | Type mismatches |
| tif/PartialFillTracker.tsx | 1 | Missing property |
| workflows/WorkflowDashboard.tsx | 5 | Missing properties |

---

## Hooks (src/hooks/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| useMarkets.ts | 1 | Not callable |
| useMarketsRealtime.ts | 9 | Multiple implicit any |
| useOrderTypes.ts | 2 | Undefined handling |
| useRealtimePrice.ts | 1 | Implicit any |
| useSmartNotifications.ts | 2 | Implicit any |

---

## Library Files (src/lib/)

### Admin Library

| File | Errors | Specific Errors |
|------|--------|-----------------|
| admin/fiscal-watchdog.ts | 3 | RPC function issues |

### AI Library

| File | Errors | Specific Errors |
|------|--------|-----------------|
| ai/ai-config.ts | 2 | Type mismatches |
| ai/workflows/event-creation-workflow.ts | 9 | Multiple type issues |

### Analytics

| File | Errors | Specific Errors |
|------|--------|-----------------|
| analytics/service.ts | 1 | Type mismatch |

### CLOB Library

| File | Errors | Specific Errors |
|------|--------|-----------------|
| clob/realtime/MarketDataPublisher.ts | 6 | Type issues |
| clob/RiskEngine.ts | 2 | Type comparison |
| clob/service.ts | 1 | Type issue |
| clob/test-*.ts | 26 | Test type issues |

### Events

| File | Errors | Specific Errors |
|------|--------|-----------------|
| events/slug-utils.ts | 1 | Duplicate property |

### KYC

| File | Errors | Specific Errors |
|------|--------|-----------------|
| kyc/service.ts | 10 | Multiple type mismatches |

### Leaderboard

| File | Errors | Specific Errors |
|------|--------|-----------------|
| leaderboard/service.ts | 4 | Missing columns |

### Markets

| File | Errors | Specific Errors |
|------|--------|-----------------|
| markets/MultiOutcomeMarkets.ts | 28 | Multiple schema mismatches |

### Matching

| File | Errors | Specific Errors |
|------|--------|-----------------|
| matching/engine.ts | 2 | Null handling |

### Notifications

| File | Errors | Specific Errors |
|------|--------|-----------------|
| notifications/service.ts | 1 | Implicit any |

### Oracle

| File | Errors | Specific Errors |
|------|--------|-----------------|
| oracle/ai/AIOrchestrator.ts | 8 | Multiple type issues |
| oracle/ai/agents/DeliberationAgent.ts | 1 | Missing property |
| oracle/ai/agents/RetrievalAgent.ts | 1 | Missing property |
| oracle/ai/feedback/FeedbackLoop.ts | 1 | Missing export |
| oracle/ai/resilience/CircuitBreaker.ts | 1 | Duplicate function |
| oracle/ai/resilience/RateLimiter.ts | 1 | Missing export |
| oracle/ai/verification/CrossVerificationEngine.ts | 1 | Undefined handling |
| oracle/ai/verification/SourceTiers.ts | 1 | Type assignment |
| oracle/service.ts | 3 | RPC function issues |

### Payout

| File | Errors | Specific Errors |
|------|--------|-----------------|
| payout/PayoutEngine.ts | 11 | Multiple type issues |
| payout/TokenBurn.ts | 24 | Multiple type issues |

### Realtime

| File | Errors | Specific Errors |
|------|--------|-----------------|
| realtime/balance-listener.ts | 3 | Implicit any |

### Services

| File | Errors | Specific Errors |
|------|--------|-----------------|
| services/feedService.ts | 4 | Schema mismatches |
| services/orderBookService.ts | 4 | Type issues |
| services/portfolioService.ts | 5 | Missing properties |
| services/walletService.ts | 2 | Null handling |

### Settlement

| File | Errors | Specific Errors |
|------|--------|-----------------|
| settlement/service.ts | 6 | Implicit any |
| settlement/SettlementEngine.ts | 1 | Type issue |

### Social

| File | Errors | Specific Errors |
|------|--------|-----------------|
| social/comments-service.ts | 10 | Multiple type issues |
| social/feed-service.ts | 22 | Multiple type issues |
| social/reputation-service.ts | 5 | Type issues |

### TIF

| File | Errors | Specific Errors |
|------|--------|-----------------|
| tif/service.ts | 1 | Implicit any |

### Upstash

| File | Errors | Specific Errors |
|------|--------|-----------------|
| upstash/workflows.ts | 4 | Json type, wrong arguments |

---

## Store (src/store/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| marketStore.ts | 7 | Type conversions |

---

## Tests (tests/)

| File | Errors | Specific Errors |
|------|--------|-----------------|
| e2e/e2e-agent-test.ts | 9 | Missing module, implicit any |

---

## Additional Detailed Errors from tsc_errors.txt

### Missing Modules / Imports

| File | Line | Error |
|------|------|-------|
| src/App.tsx | 3 | Cannot find module '@tanstack/react-query-devtools' |
| src/App.tsx | 5 | Cannot find module '@/views/Home' |
| src/App.tsx | 6 | Cannot find module '@/views/Markets' |
| src/App.tsx | 7 | Cannot find module '@/views/MarketDetail' |
| src/App.tsx | 8 | Cannot find module '@/views/Login' |
| src/App.tsx | 9 | Cannot find module '@/views/Register' |
| src/App.tsx | 10 | Cannot find module '@/views/Portfolio' |
| src/App.tsx | 11 | Cannot find module '@/views/Wallet' |
| src/App.tsx | 12 | Cannot find module '@/views/Admin' |
| src/App.tsx | 52 | Property 'env' does not exist on type 'ImportMeta' |

### Animation/Variant Type Errors

| File | Line | Error |
|------|------|-------|
| src/app/(dashboard)/leaderboard/page.tsx | 179 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 218 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 276 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 823 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 832 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 853 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 860 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 869 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 928 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 957 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 982 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 989 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 1027 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 1080 | Type not assignable to 'Variants' |
| src/app/(dashboard)/leaderboard/page.tsx | 1085 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 129 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 178 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 180 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 191 | Property 'current_level_id' does not exist on type 'User' |
| src/app/(dashboard)/portfolio/page.tsx | 198 | Cannot find name 'Link' |
| src/app/(dashboard)/portfolio/page.tsx | 201 | Property 'current_level_name' does not exist on type 'User' |
| src/app/(dashboard)/portfolio/page.tsx | 203 | Cannot find name 'Link' |
| src/app/(dashboard)/portfolio/page.tsx | 259 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 294 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 320 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 370 | Type not assignable to 'Variants' |
| src/app/(dashboard)/portfolio/page.tsx | 431 | Type not assignable to 'Variants' |

### Supabase Client Issues

| File | Line | Error |
|------|------|-------|
| src/app/api/admin/markets/[id]/fields/route.ts | 76 | Property 'catch' does not exist on type |
| src/app/api/binance-p2p/route.ts | 21 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/binance-p2p/route.ts | 52 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposit/manual/route.ts | 11 | Property 'auth' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposit/manual/route.ts | 29 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposit/manual/route.ts | 44 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposit/manual/route.ts | 58 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposits/request/route.ts | 11 | Property 'auth' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposits/request/route.ts | 55 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposits/request/route.ts | 75 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposits/request/route.ts | 94 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposits/request/route.ts | 172 | Property 'auth' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/deposits/request/route.ts | 188 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |
| src/app/api/p2p-sellers/route.ts | 17 | Property 'from' does not exist on type 'Promise<SupabaseClient>' |

### Missing Names/Properties

| File | Line | Error |
|------|------|-------|
| src/app/(dashboard)/notifications/page.tsx | 118 | Cannot find name 't' |
| src/app/api/cron/master/route.ts | 188 | Cannot find name 'userMarketSpreads' |
| src/app/api/dispute-workflow/route.ts | 101 | Argument of type 'any[] \| null' is not assignable to parameter of type 'any[]' |
| src/app/api/follows/route.ts | 27 | Property 'getFollowStatus' does not exist on type 'FeedService' |
| src/app/api/follows/route.ts | 31 | Property 'getFollowers' does not exist on type 'FeedService' |
| src/app/api/follows/route.ts | 35 | Property 'getFollowing' does not exist on type 'FeedService' |
| src/app/api/follows/route.ts | 41 | Property 'getFollowers' does not exist on type 'FeedService' |
| src/app/api/follows/route.ts | 42 | Property 'getFollowing' does not exist on type 'FeedService' |
| src/app/api/follows/route.ts | 85 | Property 'followUser' does not exist on type 'FeedService' |
| src/app/api/follows/route.ts | 87 | Property 'unfollowUser' does not exist on type 'FeedService' |
| src/app/api/notifications/route.ts | 170 | Cannot find name 'snoozeUntil' |
| src/app/(dashboard)/portfolio/page.tsx | 33 | Import declaration conflicts with local declaration of 'cn' |

---

## Missing Database Tables/Views

The following tables/views exist in production but are NOT in generated Supabase types:

- `usdt_transactions`
- `support_tickets`
- `support_ticket_messages`
- `user_internal_notes`
- `position_interventions`
- `ai_event_pipelines`
- `market_metrics`
- `view_resolvable_events`
- `user_portfolio_v2`

---

## Missing Database Columns

| Table | Missing Column |
|-------|----------------|
| profiles | is_admin |
| wallets | usdt_balance |
| wallets | locked_usdt |
| markets | question_bn |
| markets | creator_address |
| positions | unrealized_pnl |
| positions | side |

---

## Missing RPC Functions

The following database functions are not registered in Supabase types:

- verify_and_credit_deposit
- update_user_status
- perform_position_intervention
- get_user_admin_profile
- process_withdrawal
- admin_credit_wallet
- admin_debit_wallet
- get_total_balances
- get_total_escrow
- lock_creator_liquidity
- get_market_total_shares
- update_bounds_votes
- credit_user_balance
- manual_resolve_market
- increment_social_score
- update_comment_score
- hold_balance_for_withdrawal
- withdrawal_processing

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total API Route Files with Errors | ~60 |
| Total Admin Panel Pages with Errors | ~9 |
| Total Component Files with Errors | ~30 |
| Total Hook Files with Errors | ~5 |
| Total Library Files with Errors | ~25 |
| Total Store Files with Errors | ~1 |
| Total Test Files with Errors | ~1 |

**Grand Total**: ~1100+ TypeScript errors across ~130 files
