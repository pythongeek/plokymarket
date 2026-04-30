-- Migration: Fix events/markets query performance and relationships
-- Date: 2026-03-18

-- ============================================
-- Fix 1: Correct get_user_positions_v2 JOIN
-- The positions table has market_id referencing events.id, NOT markets.id
-- ============================================
CREATE OR REPLACE FUNCTION "public"."get_user_positions_v2"("p_user_id" "uuid") RETURNS TABLE("market_id" "uuid", "outcome" "public"."outcome_type", "quantity" bigint, "average_price" numeric, "realized_pnl" numeric, "current_value" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.market_id,
    p.outcome,
    p.quantity,
    p.average_price,
    p.realized_pnl,
    (p.quantity * COALESCE(
      CASE WHEN p.outcome = 'YES' THEN e.current_yes_price ELSE e.current_no_price END,
      p.average_price
    )) as current_value
  FROM positions p
  JOIN events e ON e.id = p.market_id
  WHERE p.user_id = p_user_id AND p.quantity > 0
  ORDER BY p.updated_at DESC;
END;
$$;

-- ============================================
-- Fix 2: Add composite indexes for common queries
-- ============================================

-- Composite index for "active events by category" query pattern
CREATE INDEX IF NOT EXISTS idx_events_status_category ON public.events(status, category);

-- Composite index for "active markets by category" query pattern
CREATE INDEX IF NOT EXISTS idx_markets_status_category ON public.markets(status, category);

-- Composite index for "events by slug" lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- ============================================
-- Fix 3: Update comment to clarify schema relationship
-- ============================================
COMMENT ON TABLE positions IS 'User positions - market_id references events.id (not markets.id)';
