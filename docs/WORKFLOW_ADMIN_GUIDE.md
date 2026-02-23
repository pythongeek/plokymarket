# Polymarket BD - Admin Workflow Guide

This guide explains how the platform's automated background tasks have been grouped and consolidated to operate efficiently within Upstash's Free Tier limits (maximum 10 schedules), while still maintaining real-time capabilities.

## The 5 Consolidated Workflow Groups

Instead of running 13+ individual schedules, the system now uses 5 **"Group" API routes**. Each group is triggered by QStash on a specific schedule. When the group API is hit, it sequentially calls the original, individual API endpoints.

This means **no original logic was changed or deleted**. The individual functions (and their Admin Panel manual triggers) still work exactly as they did before. The Groups simply act as "Dispatchers."

---

### 1. Group Fast (`/api/workflows/group-fast`)
**Schedule:** Every 5 Minutes (`*/5 * * * *`)
**Purpose:** High-frequency data that needs to be as close to real-time as possible.

**Underlying Functions Called:**
1.  **Crypto Market Data** (`/api/workflows/execute-crypto`)
    *   *Original Function:* Fetches live crypto prices (BTC, ETH, etc.) to evaluate active crypto markets.
2.  **USDT Exchange Rate** (`/api/workflows/update-exchange-rate`)
    *   *Original Function:* Scrapes Binance P2P (bKash/Nagad) to update the `exchange_rates_live` table, keeping the frontend deposit badge accurate.
3.  **Support Escalations** (`/api/workflows/check-escalations`)
    *   *Original Function:* Checks if any pending manual verifications or disputes have breached their SLA time and need to be escalated to super-admins.

---

### 2. Group Medium (`/api/workflows/group-medium`)
**Schedule:** Every 10 Minutes (`*/10 * * * *`)
**Purpose:** Data that needs frequent updates, but where 5 minutes would consume too many API credits or rate limits from external providers.

**Underlying Functions Called:**
1.  **Sports Market Data** (`/api/workflows/execute-sports`)
    *   *Original Function:* Fetches live sports scores (Cricket, Football) to evaluate active sports prediction markets.
2.  **Auto-Verification** (`/api/workflows/auto-verify`)
    *   *Original Function:* Scans pending user deposits and attempts to automatically match them against incoming MFS/Crypto transaction hashes without admin intervention.

---

### 3. Group Hourly (`/api/workflows/group-hourly`)
**Schedule:** Every Hour (`0 * * * *`)
**Purpose:** System maintenance algorithms and data rollups that don't need sub-hour precision.

**Underlying Functions Called:**
1.  **Daily Analytics** (`/api/workflows/analytics/daily`)
    *   *Original Function:* Rolls up the last hour's trading volume, active users, and platform revenue into the `analytics` tables for the Admin Dashboard charts.
2.  **Tick Adjustment** (`/api/cron/tick-adjustment`)
    *   *Original Function:* Adjusts the "ticks" (price spread increments) on CLOB markets based on recent volatility and liquidity depth.
3.  **Batch Market Processing** (`/api/cron/batch-markets`)
    *   *Original Function:* Performs bulk state transitions (e.g., flipping markets from 'Active' to 'Resolution Pending' if their end date has passed).

---

### 4. Group Quarterly (`/api/workflows/group-quarterly`)
**Schedule:** Every 6 Hours (`0 */6 * * *`)
**Purpose:** Long-running or heavy consensus processes.

**Underlying Functions Called:**
1.  **Dispute Workflow** (`/api/dispute-workflow`)
    *   *Original Function:* Triggers the Oracle/AI consensus mechanism to review user-flagged market resolutions. If the AI cannot reach a high-confidence consensus, it marks the dispute for human review.

---

### 5. Group Daily (`/api/workflows/group-daily`)
**Schedule:** Midnight Bangladesh Time (`0 0 * * *`, TZ: Asia/Dhaka)
**Purpose:** End-of-day operations, cleanups, and fresh content generation for the next day.

**Underlying Functions Called:**
1.  **News Market Fetch** (`/api/workflows/execute-news`)
    *   *Original Function:* Scrapes news APIs to evaluate long-term or daily current events markets.
2.  **Leaderboard Refresh** (`/api/leaderboard/cron`)
    *   *Original Function:* Calculates user PnL (Profit and Loss) and updates the global ranking tables for the frontend Leaderboard.
3.  **Daily AI Topics** (`/api/cron/daily-ai-topics`)
    *   *Original Function:* Calls the Gemini AI API to generate new trending market topics for the upcoming day (e.g., "Will X happen in Bangladesh politics today?").
4.  **Cleanup Expired Deposits** (`/api/workflows/cleanup-expired`)
    *   *Original Function:* Deletes or marks as 'Expired' any pending deposit requests that are older than 24 hours without payment.
5.  **Daily Platform Report** (`/api/workflows/daily-report`)
    *   *Original Function:* Generates the daily summary PDF/Email for administrators detailing total volume, new users, and flagged issues.

---

## Admin Panel Integration & Manual Overrides

Because the Group APIs simply use `fetch()` to call the underlying, original API endpoints, your Admin Panel is completely unaffected.

If an admin clicks a button like **"Trigger Exchange Rate Update"** or **"Run Leaderboard Calculation"** in the UI:
1. The frontend hits the specific, underlying API route (e.g., `/api/workflows/update-exchange-rate`).
2. The specific task runs immediately.
3. This does **not** conflict with the grouped QStash schedules, it just provides an on-demand manual override.

## Managing the Locall QStash Environment

While developing locally, you are currently running:
```bash
npx @upstash/qstash-cli@latest dev
```
This intercepts outgoing QStash calls and routes them to `http://localhost:3000` (or whichever port Next.js is running on), allowing you to test these 5 grouped schedules on your own machine without using production Upstash credits.
