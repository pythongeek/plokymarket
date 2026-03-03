-- Migration 143a: Event/Market Field Normalization
-- Ensures that the events table has a 'title' field to match frontend expectations
-- Adds constraint linking markets strictly to events

BEGIN;

-- 1. Add computed 'title' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'title'
    ) THEN
        ALTER TABLE public.events ADD COLUMN title TEXT GENERATED ALWAYS AS (question) STORED;
    END IF;
END $$;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_events_title ON public.events(title);

-- 3. Ensure 'event_id' cannot be null on markets table
ALTER TABLE public.markets ALTER COLUMN event_id SET NOT NULL;

-- 4. Re-establish foreign key with ON DELETE CASCADE to prevent orphaned markets
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS fk_markets_event;
ALTER TABLE public.markets ADD CONSTRAINT fk_markets_event 
    FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
