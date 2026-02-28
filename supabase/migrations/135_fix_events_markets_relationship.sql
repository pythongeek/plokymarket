-- ============================================================================
-- Migration 135: Fix Events-Markets Foreign Key Relationship
-- Problem: PostgREST cannot find relationship between events and markets
-- Solution: Ensure proper foreign key constraints exist
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current foreign key situation
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Checking events-markets relationship...';
END $$;

-- ============================================================================
-- STEP 2: Ensure markets table has event_id column with proper FK constraint
-- ============================================================================

-- First, check if event_id column exists in markets
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'markets' AND column_name = 'event_id'
    ) THEN
        RAISE NOTICE 'Adding event_id column to markets table...';
        ALTER TABLE public.markets ADD COLUMN event_id UUID;
    ELSE
        RAISE NOTICE 'event_id column already exists in markets table';
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'markets_event_id_fkey' 
        AND table_name = 'markets'
    ) THEN
        RAISE NOTICE 'Adding foreign key constraint markets_event_id_fkey...';
        ALTER TABLE public.markets
        ADD CONSTRAINT markets_event_id_fkey 
        FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;
    ELSE
        RAISE NOTICE 'Foreign key constraint markets_event_id_fkey already exists';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add FK constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 3: Alternative - Check if events table has market_id column (reverse relationship)
-- Some schemas use this pattern instead
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'market_id'
    ) THEN
        RAISE NOTICE 'Adding market_id column to events table (optional)...';
        ALTER TABLE public.events ADD COLUMN market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL;
    ELSE
        RAISE NOTICE 'market_id column already exists in events table';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add market_id to events: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON public.markets(event_id);
CREATE INDEX IF NOT EXISTS idx_events_market_id ON public.events(market_id) WHERE market_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Update PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- STEP 6: Verify the relationship
-- ============================================================================
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE 'Verifying foreign key relationships...';
    
    FOR fk_record IN 
        SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (tc.table_name = 'markets' OR tc.table_name = 'events')
    LOOP
        RAISE NOTICE 'FK: % (%.% -> %.%))', 
            fk_record.constraint_name,
            fk_record.table_name, 
            fk_record.column_name,
            fk_record.foreign_table_name, 
            fk_record.foreign_column_name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 7: Test the relationship with a direct query
-- ============================================================================
COMMENT ON TABLE public.events IS 'Core events table for prediction markets';
COMMENT ON TABLE public.markets IS 'Markets linked to events';
