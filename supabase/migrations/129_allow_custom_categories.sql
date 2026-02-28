-- Migration 129: Allow custom categories by dropping check constraints
-- ==================================================================

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'markets_category_check' 
        AND table_name = 'markets'
    ) THEN
        ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS markets_category_check;
    END IF;
END $$;
