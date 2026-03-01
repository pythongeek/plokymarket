-- ============================================================================
-- Migration 142a: Extend order_type enum (MUST RUN FIRST - Separate Transaction)
-- ============================================================================
-- This MUST be run as a separate transaction BEFORE migration 142b
-- PostgreSQL requires enum values to be committed before they can be used
-- ============================================================================

-- Add new values to order_type enum
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'stop_loss';
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'take_profit';
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'trailing_stop';
ALTER TYPE order_type ADD VALUE IF NOT EXISTS 'iceberg';

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ order_type enum extended successfully';
  RAISE NOTICE '   New values: stop_loss, take_profit, trailing_stop, iceberg';
END $$;
