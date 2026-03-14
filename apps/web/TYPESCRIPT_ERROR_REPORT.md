# Complete TypeScript Error Report

**Total Lines of Errors**: 1115 lines
**Generated**: 2026-03-13

---

## Executive Summary

This report contains **all TypeScript errors** found in the Plokymarket codebase after running `npx tsc --noEmit`. The errors are categorized by root cause and file dependencies.

---

## Error Categories Summary

### 1. Supabase Database Schema Mismatches (~350 errors)
**Root Cause**: Database tables/columns exist in production but are NOT in generated Supabase types.

**Key Missing Tables/Views**:
- `usdt_transactions` - Not in Supabase types
- `support_tickets` - Not in types
- `support_ticket_messages` - Not in types
- `user_internal_notes` - Not in types
- `position_interventions` - Not in types
- `ai_event_pipelines` - Not in types
- `market_metrics` - Not in types
- `view_resolvable_events` - Not in types
- `user_portfolio_v2` - Missing in types

**Key Missing Columns**:
- `profiles.is_admin` - Column doesn't exist
- `wallets.usdt_balance` - Column doesn't exist
- `wallets.locked_usdt` - Column doesn't exist
- `markets.question_bn` - Column doesn't exist
- `markets.creator_address` - Column doesn't exist
- `positions.unrealized_pnl` - Column doesn't exist
- `positions.side` - Column doesn't exist

### 2. RPC Function Type Missing (~200 errors)
**Root Cause**: Database RPC functions are not registered in Supabase types.

**Missing RPC Functions**:
- `verify_and_credit_deposit`
- `update_user_status`
- `perform_position_intervention`
- `get_user_admin_profile`
- `process_withdrawal`
- `admin_credit_wallet`
- `admin_debit_wallet`
- `get_total_balances`
- `get_total_escrow`
- `lock_creator_liquidity`
- `get_market_total_shares`
- `update_bounds_votes`
- `credit_user_balance`
- `manual_resolve_market`
- `increment_social_score`
- `update_comment_score`
- `hold_balance_for_withdrawal`
- `withdrawal_processing`

### 3. Type Definition Mismatches (~300 errors)
**Root Cause**: TypeScript types don't match the actual data structures.

**Common Issues**:
- `Event` type vs `UnifiedEvent` - Missing properties
- `Market` type - Missing properties (is_verified, liquidity_source, title, etc.)
- `Position` type - Missing avg_price, unrealized_pnl, side
- `Wallet` type - Missing usdt_balance, locked_usdt
- `KycProfile` / `KycSettings` - Schema mismatch

### 4. Implicit Any Types (~150 errors)
**Root Cause**: Parameters and variables without explicit type annotations.

### 5. Null/Undefined Type Issues (~100 errors)
**Root Cause**: Not handling null/undefined properly.

---

## Complete File Error List

### API Routes (src/app/api/)

#### Admin API Routes (src/app/api/admin/)
| File | Errors | Root Cause |
|------|--------|------------|
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

#### AI API Routes (src/app/api/ai-*/)
| File | Errors | Root Cause |
|------|--------|------------|
| ai-oracle/resolve/route.ts | 4 | Missing column pipeline_id |
| ai/event-processor/route.ts | 5 | Missing table ai_event_pipelines |
| ai/event-workflow/route.ts | 7 | Missing table ai_event_pipelines |
| ai/reject-suggestion/route.ts | 1 | Undefined not assignable |

#### Comments API (src/app/api/comments/)
| File | Errors | Root Cause |
|------|--------|------------|
| [id]/like/route.ts | 2 | Null handling |
| route.ts | 1 | Null handling |

#### Cron API Routes (src/app/api/cron/)
| File | Errors | Root Cause |
|------|--------|------------|
| batch-markets/route.ts | 2 | Implicit any |
| check-markets/route.ts | 1 | Missing property resolution_status |
| daily-ai-topics/route.ts | 2 | Implicit any |
| daily-topics/route.ts | 2 | Missing property title |

#### Workflows API Routes (src/app/api/workflows/)
| File | Errors | Root Cause |
|------|--------|------------|
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

### Admin Panel Pages (src/app/sys-cmd-7x9k2/)

| File | Errors | Root Cause |
|------|--------|------------|
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

### Components (src/components/)

#### Admin Components
| File | Errors | Root Cause |
|------|--------|------------|
| AIAgentStatus.tsx | 1 | Missing name 'providerLabels' |
| EventCreationPanelWithPreview.tsx | 2 | Props mismatch |
| MarketActions.tsx | 4 | Implicit any |
| MarketStatsBanner.tsx | 1 | Implicit any |
| SecureAdminLayout.tsx | 1 | Duplicate identifier |

#### Market Components
| File | Errors | Root Cause |
|------|--------|------------|
| MarketCard.tsx | 1 | Missing property is_verified |
| MarketStatsBanner.tsx | 1 | Implicit any |
| MultiOutcomeList.tsx | 1 | Missing property title |

#### Portfolio Components
| File | Errors | Root Cause |
|------|--------|------------|
| AdvancedPerformanceCharts.tsx | 8 | Multiple type issues |
| ChartComponents.tsx | 6 | Type issues, duplicate import |
| PnLDashboard.tsx | 1 | Unused ts-expect-error |
| PositionHistory.tsx | 1 | Missing property taxLotMethod |

#### Social Components
| File | Errors | Root Cause |
|------|--------|------------|
| ActivityFeed.tsx | 2 | Type conversion issues |
| FollowButton.tsx | 3 | Type mismatch |

#### Trading Components
| File | Errors | Root Cause |
|------|--------|------------|
| AdvancedChart.tsx | 1 | Schema mismatch |
| MyPositions.tsx | 2 | Missing properties |
| TradingPanel.tsx | 2 | Multiple issues |

#### Wallet Components
| File | Errors | Root Cause |
|------|--------|------------|
| BalanceCard.tsx | 2 | Module not found, implicit any |
| TransactionHistory.tsx | 2 | Implicit any |
| WalletDashboard.tsx | 1 | Implicit any |

#### Other Components
| File | Errors | Root Cause |
|------|--------|------------|
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

### Hooks (src/hooks/)

| File | Errors | Root Cause |
|------|--------|------------|
| useMarkets.ts | 1 | Not callable |
| useMarketsRealtime.ts | 9 | Multiple implicit any |
| useOrderTypes.ts | 2 | Undefined handling |
| useRealtimePrice.ts | 1 | Implicit any |
| useSmartNotifications.ts | 2 | Implicit any |

---

### Library Files (src/lib/)

#### Admin Library
| File | Errors | Root Cause |
|------|--------|------------|
| admin/fiscal-watchdog.ts | 3 | RPC function issues |

#### AI Library
| File | Errors | Root Cause |
|------|--------|------------|
| ai/ai-config.ts | 2 | Type mismatches |
| ai/workflows/event-creation-workflow.ts | 9 | Multiple type issues |

#### Analytics
| File | Errors | Root Cause |
|------|--------|------------|
| analytics/service.ts | 1 | Type mismatch |

#### CLOB Library
| File | Errors | Root Cause |
|------|--------|------------|
| clob/realtime/MarketDataPublisher.ts | 6 | Type issues |
| clob/RiskEngine.ts | 2 | Type comparison |
| clob/service.ts | 1 | Type issue |
| clob/test-*.ts | 26 | Test type issues |

#### Events
| File | Errors | Root Cause |
|------|--------|------------|
| events/slug-utils.ts | 1 | Duplicate property |

#### KYC
| File | Errors | Root Cause |
|------|--------|------------|
| kyc/service.ts | 10 | Multiple type mismatches |

#### Leaderboard
| File | Errors | Root Cause |
|------|--------|------------|
| leaderboard/service.ts | 4 | Missing columns |

#### Markets
| File | Errors | Root Cause |
|------|--------|------------|
| markets/MultiOutcomeMarkets.ts | 28 | Multiple schema mismatches |

#### Matching
| File | Errors | Root Cause |
|------|--------|------------|
| matching/engine.ts | 2 | Null handling |

#### Notifications
| File | Errors | Root Cause |
|------|--------|------------|
| notifications/service.ts | 1 | Implicit any |

#### Oracle
| File | Errors | Root Cause |
|------|--------|------------|
| oracle/ai/AIOrchestrator.ts | 8 | Multiple type issues |
| oracle/ai/agents/DeliberationAgent.ts | 1 | Missing property |
| oracle/ai/agents/RetrievalAgent.ts | 1 | Missing property |
| oracle/ai/feedback/FeedbackLoop.ts | 1 | Missing export |
| oracle/ai/resilience/CircuitBreaker.ts | 1 | Duplicate function |
| oracle/ai/resilience/RateLimiter.ts | 1 | Missing export |
| oracle/ai/verification/CrossVerificationEngine.ts | 1 | Undefined handling |
| oracle/ai/verification/SourceTiers.ts | 1 | Type assignment |
| oracle/service.ts | 3 | RPC function issues |

#### Payout
| File | Errors | Root Cause |
|------|--------|------------|
| payout/PayoutEngine.ts | 11 | Multiple type issues |
| payout/TokenBurn.ts | 24 | Multiple type issues |

#### Realtime
| File | Errors | Root Cause |
|------|--------|------------|
| realtime/balance-listener.ts | 3 | Implicit any |

#### Services
| File | Errors | Root Cause |
|------|--------|------------|
| services/feedService.ts | 4 | Schema mismatches |
| services/orderBookService.ts | 4 | Type issues |
| services/portfolioService.ts | 5 | Missing properties |
| services/walletService.ts | 2 | Null handling |

#### Settlement
| File | Errors | Root Cause |
|------|--------|------------|
| settlement/service.ts | 6 | Implicit any |
| settlement/SettlementEngine.ts | 1 | Type issue |

#### Social
| File | Errors | Root Cause |
|------|--------|------------|
| social/comments-service.ts | 10 | Multiple type issues |
| social/feed-service.ts | 22 | Multiple type issues |
| social/reputation-service.ts | 5 | Type issues |

#### TIF
| File | Errors | Root Cause |
|------|--------|------------|
| tif/service.ts | 1 | Implicit any |

#### Upstash
| File | Errors | Root Cause |
|------|--------|------------|
| upstash/workflows.ts | 4 | Json type, wrong arguments |

---

### Store (src/store/)

| File | Errors | Root Cause |
|------|--------|------------|
| marketStore.ts | 7 | Type conversions |

---

### Tests (tests/)

| File | Errors | Root Cause |
|------|--------|------------|
| e2e/e2e-agent-test.ts | 9 | Missing module, implicit any |

---

## Root Cause Analysis

### 1. Database Schema Drift (Most Critical)
The production database has tables and columns that are NOT in the generated Supabase types. This happens when:
- New migrations are applied to production but types are not regenerated
- Database views are created directly in production
- Columns are added via SQL directly

**Solution**: Regenerate Supabase types: `npx supabase gen types typescript --local > src/types/supabase.ts`

### 2. RPC Functions Not Registered
Database functions (stored procedures) need to be either:
- Added to migrations with proper comments for Supabase to detect
- Manually added to types

**Solution**: Add function signatures to custom types or database wrapper functions.

### 3. Type Definition Out of Sync
Many TypeScript interfaces (Event, Market, Position, etc.) don't match the actual database schema.

**Solution**: 
- Regenerate Supabase types regularly
- Create unified type definitions that merge database types with application logic

### 4. Missing Null Checks
Many places don't handle null/undefined properly after schema changes.

**Solution**: Add proper null checks or use non-null assertions where appropriate.

---

## Recommended Fixes Priority

### P0 - Critical (Blocks Functionality)
1. Regenerate Supabase types: `npx supabase gen types typescript --project-id your-project > src/types/supabase.ts`
2. Add missing RPC function types
3. Fix critical wallet/USDT type issues

### P1 - High (Causes Runtime Errors)
1. Fix null/undefined handling in API routes
2. Add missing columns to Market/Event types
3. Fix position type properties

### P2 - Medium (Code Quality)
1. Add explicit types to implicit any parameters
2. Fix component prop type mismatches
3. Clean up duplicate identifiers

### P3 - Low (Cosmetic)
1. Fix unused ts-expect-error directives
2. Clean up test files
3. Fix import conflicts

---

## Dependencies Graph

```
Supabase Types (generated)
    ↓
All API Routes (src/app/api/*)
    ↓
Library Services (src/lib/*)
    ↓
Hooks (src/hooks/*)
    ↓
Components (src/components/*)
    ↓
Pages (src/app/*)
```

The root cause is at the **Supabase Types** level - all errors cascade from schema mismatches.

---

## How to Fix

### Step 1: Update Supabase Types
```bash
# In supabase project directory
npx supabase gen types typescript --project-id your-project-id > ../apps/web/src/types/supabase.ts
```

### Step 2: Add Missing RPC Functions
Create a custom types file for RPC functions:
```typescript
// src/types/rpc.ts
export type RpcFunctions = 
  | 'verify_and_credit_deposit'
  | 'update_user_status'
  | // ... all missing functions
```

### Step 3: Run Incremental Fixes
Focus on P0 and P1 issues first, then P2.

---

*Report generated from TypeScript compiler output (1115 lines of errors)*
