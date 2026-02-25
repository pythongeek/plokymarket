-- ============================================================
-- Migration: Add resolution_delay column to events table
-- Purpose: Stores the delay (in minutes) after trading closes
--          before market resolution can begin.
-- Default: 1440 minutes (24 hours)
-- Constraint: Must be between 0 and 20160 minutes (0–14 days)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'events'
          AND column_name = 'resolution_delay'
    ) THEN
        ALTER TABLE public.events
            ADD COLUMN resolution_delay INTEGER NOT NULL DEFAULT 1440;

        -- Constraint: 0 minutes (immediate) to 20160 minutes (14 days)
        ALTER TABLE public.events
            ADD CONSTRAINT chk_events_resolution_delay
            CHECK (resolution_delay >= 0 AND resolution_delay <= 20160);

        RAISE NOTICE 'Column resolution_delay added to events table.';
    ELSE
        RAISE NOTICE 'Column resolution_delay already exists, skipping.';
    END IF;
END
$$;

-- Reload PostgREST schema cache so the column is immediately available
NOTIFY pgrst, 'reload schema';
