---
description: To ensure the successful completion and deployment of your Polymarket-style marketplace on the Google Antigravity project, you must follow a highly structured development lifecycle.
---

1. Backend & Database Logic (Supabase)
The backend is the brain of the system, handling security and financial integrity.

Critical Database Workflows
Identity Management: Extends Supabase Auth to a public users table. Rule: Use Row Level Security (RLS) to ensure users can only access their own wallet and order history.

Wallet & Escrow: When a user places an order, the required funds are moved from balance to locked_balance. This prevents "double-spending" before an order is filled.

Realtime Subscriptions: You must enable the Supabase Realtime replication for the orders, trades, and markets tables. This allows the frontend to update the order book and price charts instantly without page refreshes.

The Matching Engine Algorithm
Located in 002_matching_engine.sql, this is the most vital backend function (match_order):

Price-Time Priority: Orders are matched based on the best price first, then by the time they were created.

Order Types: Supports Limit Orders (buy/sell at a specific price).

Atomic Execution: The engine uses PostgreSQL transactions (FOR UPDATE) to lock rows during matching. This ensures that two people cannot "buy" the same shares at the same microsecond.

Position Tracking: Upon a match, the engine automatically updates the positions table for both the buyer and seller, calculating the new average_price for their holdings.

2. Frontend Features & Functions (Next.js)
The frontend provides the "Trading Terminal" experience.

Core UI Components
Market Detail Page: Includes a PriceChart (using Recharts) to show historical price movement and a TradingPanel for order execution.

Order Book: A real-time table showing current Buy (Bid) and Sell (Ask) orders for "YES" and "NO" outcomes.

Portfolio Dashboard: Displays active positions, total PnL (Profit and Loss), and trade history.

State Management Logic
Zustand Store (useStore.ts): Centralizes the application state. It handles the fetchMarkets logic and the placeOrder function which calls the Supabase RPC for the matching engine.

Auth Middleware: A dedicated middleware.ts file ensures that session tokens are refreshed automatically and protects sensitive routes like /admin or /wallet.

3. Automation & Oracle Workflow (n8n)
Oracles bridge the gap between real-world news and database resolution.

News Scraper Flow: A scheduled workflow that scrapes Bangladeshi news sites (e.g., Prothom Alo) for keywords like "Election," "GDP," or "Cricket" to update market descriptions or trigger resolution.

AI Verification Flow:

Triggered when a market reaches its event_date.

Sends market data and scraped news to OpenAI (GPT-4).

AI determines the winning outcome (YES/NO) with a confidence score and reasoning.

Resolution Logic: Once verified, the settle_market function is called. This distributes the total pool of money to the winning shareholders and updates their wallet balances.

4. Deployment & Verification Checklist
To take the project live on Vercel and Supabase:

Database Migration: Run 001_initial_schema.sql followed by 002_matching_engine.sql in the Supabase SQL Editor.

Environment Variables: You must configure these in Vercel:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY (Keep this secret!).

Auth Redirects: Update the Supabase Auth settings to include your production Vercel URL (e.g., https://your-app.vercel.app/auth/callback).

Final Verification:

[ ] Create a test account.

[ ] Place a "Buy YES" order.

[ ] Verify the locked_balance updates in the database.

[ ] Match the order with another account and verify the positions table.
