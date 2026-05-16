-- ============================================================================
-- Migration 20260513_04: Performance Indexes for Order Matching & Audit Logs
-- Fixes: V3 (missing composite index for FIFO matching)
-- Rule 2: Simplicity first. Only add explicitly needed indexes.
-- NOTE: orders and trades are partitioned tables. CONCURRENTLY is not supported
--       on partitioned tables in PostgreSQL. We use regular CREATE INDEX which
--       propagates to all partitions automatically.
-- ============================================================================

-- ============================================================================
-- INDEX 1: FIFO order matching composite index
-- Supports the exact query pattern in match_order():
--   WHERE market_id = X AND outcome = Y AND side = Z 
--     AND status IN ('open', 'partially_filled')
--   ORDER BY created_at ASC
-- This replaces the need for match_order to scan large subsets.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_fifo
    ON public.orders (market_id, outcome, side, status, created_at)
    WHERE status IN ('open', 'partially_filled');

-- ============================================================================
-- INDEX 2: BRIN index for append-only audit logs
-- admin_audit_log is append-only (only INSERTs, no UPDATEs/DELETEs).
-- BRIN is O(1) space vs B-tree O(n) and ideal for time-series append-only.
-- pages_per_range = 128 balances precision vs index size.
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_brin
    ON public.admin_audit_log USING BRIN (created_at)
    WITH (pages_per_range = 128);

-- ============================================================================
-- INDEX 3: BRIN index for trades (append-only time-series)
-- NOTE: trades is partitioned, so no CONCURRENTLY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_trades_created_brin
    ON public.trades USING BRIN (created_at)
    WITH (pages_per_range = 128);

-- ============================================================================
-- INDEX 4: Covering index for wallet lookups by user_id
-- Frequently queried: SELECT balance, locked_balance FROM wallets WHERE user_id = X
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wallets_user_covering
    ON public.wallets (user_id) INCLUDE (balance, locked_balance);

-- ============================================================================
-- Post-migration verification (run manually):
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'
--   AND indexname IN ('idx_orders_fifo','idx_audit_logs_created_brin','idx_trades_created_brin','idx_wallets_user_covering');
-- ============================================================================
