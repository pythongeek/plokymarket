---
description: Complete workflow to finish Plokymarket features and launch to production
---

# Plokymarket Production Launch Workflow

This workflow outlines the step-by-step process to complete the missing features and deploy Plokymarket to production.

## Phase 1: Missing Core Features Implementation

### 1. Oracle System (Critical)
The Oracle system is the heart of the prediction market. We need a hybrid approach to support various event types, not just UMA.
**Requirement:** Support for Centralized, Decentralized (UMA), AI-Powered, and Manual Admin Resolution.

- [ ] Update Database Schema (`markets` table): Ensure `resolution_source` column can handle different types (e.g., 'UMA', 'AI', 'ADMIN', 'API').
- [ ] Create `src/lib/oracle/types.ts`: Define interfaces for different resolution strategies.
- [ ] Create `src/lib/oracle/service.ts`: Implement valid resolution flow for each type:
    - **AI-Powered**: Existing Gemini implementation.
    - **Manual/Admin**: Admin dashboard override.
    - **Centralized/API**: Fetch result from specific API (e.g., CricInfo for cricket).
    - **Decentralized**: (Future/Optional) Stub for UMA integration.
- [ ] Create `supabase/migrations/003_oracle.sql`: Add `oracle_requests` and `oracle_disputes` tables.
- [ ] Implement `src/app/api/oracle/route.ts`: API endpoint for oracle triggers.

### 2. Leaderboard System (High Priority)
Gamification to drive user engagement.
- [ ] Create `src/lib/leaderboard.ts`: Functions to calculate rankings based on PnL and Volume.
- [ ] Create `src/app/(dashboard)/leaderboard/page.tsx`: Leaderboard UI with Daily/Weekly/All-time tabs.
- [ ] Create `src/components/leaderboard/LeaderboardTable.tsx`: Reusable component for displaying ranks.
- [ ] Add `leaderboard_entries` table to database schema.

### 3. Activity Feed (Medium Priority)
Social proof and platform liveliness.
- [ ] Create `src/lib/activity.ts`: Service to log and fetch user activities.
- [ ] Create `src/app/(dashboard)/activity/page.tsx`: Global activity feed page.
- [ ] Create `src/components/activity/ActivityFeed.tsx`: Component to show "User X bought Y" events.
- [ ] Add `activity_feed` table to database schema.

### 4. Comments System (Medium Priority)
Community discussion around markets.
- [ ] Create `src/components/market/CommentSection.tsx`: Threaded comments UI.
- [ ] Implement `src/app/api/comments/route.ts`: Backend logic for posting/reading comments.
- [ ] Add `comments` table to database schema.

## Phase 2: Refinement & Polish

### 5. Trading Experience
- [ ] Verify `OrderBook.tsx` visual accuracy (depth bars, spread calculation).
- [ ] Ensure `TradingPanel.tsx` properly handles insufficient funds errors and validations.
- [ ] Add "My Positions" section to the Market Details page.

### 6. Portfolio Analytics
- [ ] Enhance `src/app/portfolio/page.tsx` with PnL charts (using Recharts).
- [ ] Add "Transaction History" table showing deposits/withdrawals.

## Phase 3: Production Deployment

### 7. Database Finalization
- [ ] Execute all pending migrations on Supabase Production.
- [ ] Enable Row Level Security (RLS) on all tables.
- [ ] Set up Supabase Realtime for `orders`, `trades`, `activities`.

### 8. Vercel Deployment
- [ ] Set Environment Variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY` (for Oracle)
  - `BKASH_APP_KEY`, `BKASH_APP_SECRET` (if implementing payments)
- [ ] Deploy with `vercel --prod`.

### 9. Post-Launch Verification
- [ ] Create an Admin account manually in Supabase.
- [ ] Log in as Admin and create a test market.
- [ ] Register as a generic user and place a trade.
- [ ] Verify Order Book updates in real-time.
- [ ] Test Market Resolution flow.

## Slash Commands
- `/implement_oracle`: Scaffolds the Oracle service.
- `/implement_leaderboard`: Scaffolds the Leaderboard page and components.
- `/deploy_check`: Runs a pre-deployment checklist.
