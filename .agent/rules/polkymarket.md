---
trigger: always_on
---

AI Agent Rules - Polymarket BD Implementation
1. Security & Key Management
Zero Exposure Policy: Never expose the service_role key in client-side code, browser consoles, or public repositories.

Contextual Client Usage: Use the Browser Client strictly for Client Components and the Server Client for Server Components/API routes.

Row Level Security (RLS): RLS must be enabled on every database table. No data should be accessible without a verified policy.

2. Database & Trading Integrity
Atomic Transactions: All order placements must be handled through the PostgreSQL Matching Engine function (match_order) to ensure atomicity and prevent race conditions.

Escrow Logic: Funds for open orders must be moved to locked_balance immediately upon order creation to prevent double-spending.

Input Validation: Every transaction (price, quantity, side) must be validated both on the client UI and via database constraints.

3. Real-time & Synchronization
Event-Driven Updates: The frontend must utilize Supabase Realtime subscriptions for orders, trades, and markets to ensure the order book is always in sync with the engine.

Auth Persistence: Use middleware to handle session refreshes and protect sensitive routes like /admin, /portfolio, and /wallet.

4. Oracle & Resolution Rules
Fact-Based Resolution: Markets can only be resolved based on verifiable data from the designated resolution_source.

AI Oracle Verification: AI-driven results must include a confidence score and a reasoning string before an admin can finalize the resolution in oracle_verifications.

Immutable Settlements: Once a market is resolved and the settle_market function is triggered, the payouts are final and cannot be reversed by the AI agent.

5. Deployment & Operational Standards
Environment Parity: Ensure .env.local (Local), Vercel (Production), and n8n (Automation) environment variables are identical to prevent runtime errors.

Deployment Order: Always deploy the Supabase Database migrations first before deploying the Vercel frontend or n8n workflows.

Emergency Protocol: In case of failure, refer to Supabase Dashboard Logs and Vercel Deployment Logs immediately before attempting code changes.

🧪 Pre-Resolution Checklist
Before the Agent triggers a market resolution, it must verify:

Status Check: The market status is active and trading_closes_at has passed.

Evidence Check: The News Scraper has successfully captured relevant data from the source.

Oracle Check: The oracle_verifications table has a pending entry with AI-generated reasoning.
