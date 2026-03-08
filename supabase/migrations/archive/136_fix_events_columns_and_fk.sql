-- ============================================================================
-- Migration 136: Fix Events Columns and Foreign Key for PostgREST
-- Problem: PostgREST PGRST200 error - relationship not found + missing columns
-- Solution: Add missing columns and ensure FK relationship exists
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to events table that frontend expects
-- ============================================================================

-- Add name column (frontend uses this)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'name') THEN
        ALTER TABLE public.events ADD COLUMN name TEXT;
        -- Copy title to name for existing records
        UPDATE public.events SET name = title WHERE name IS NULL;
    END IF;
END $$;

-- Add name_en column (frontend uses this)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'name_en') THEN
        ALTER TABLE public.events ADD COLUMN name_en TEXT;
        -- Copy title to name_en for existing records
        UPDATE public.events SET name_en = title WHERE name_en IS NULL;
    END IF;
END $$;

-- Add event_date column (frontend uses this)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'event_date') THEN
        ALTER TABLE public.events ADD COLUMN event_date TIMESTAMPTZ DEFAULT NOW();
        -- Copy trading_closes_at or use NOW
        UPDATE public.events SET event_date = COALESCE(trading_closes_at, NOW()) WHERE event_date IS NULL;
    END IF;
END $$;

-- Ensure status column exists and has proper values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'status') THEN
        ALTER TABLE public.events ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Update existing events to have status='published' if they are active
UPDATE public.events 
SET status = 'published' 
WHERE status IN ('active', 'pending') OR status IS NULL;

-- ============================================================================
-- STEP 2: Fix markets table columns
-- ============================================================================

-- Ensure markets has all needed columns
DO $$
BEGIN
    -- Add name column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'name') THEN
        ALTER TABLE public.markets ADD COLUMN name TEXT;
        UPDATE public.markets SET name = question WHERE name IS NULL;
    END IF;
    
    -- Add question column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'question') THEN
        ALTER TABLE public.markets ADD COLUMN question TEXT;
        UPDATE public.markets SET question = name WHERE question IS NULL;
    END IF;
    
    -- Add category column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'category') THEN
        ALTER TABLE public.markets ADD COLUMN category VARCHAR(100) DEFAULT 'general';
    END IF;
    
    -- Add status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'status') THEN
        ALTER TABLE public.markets ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Fix Foreign Key Relationship
-- ============================================================================

-- First ensure event_id column exists in markets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'event_id') THEN
        ALTER TABLE public.markets ADD COLUMN event_id UUID;
    END IF;
END $$;

-- Drop existing constraint if any (to avoid errors)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'markets_event_id_fkey' AND table_name = 'markets'
    ) THEN
        ALTER TABLE public.markets DROP CONSTRAINT markets_event_id_fkey;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
END $$;

-- Clean up orphaned records
DELETE FROM public.markets 
WHERE event_id IS NOT NULL 
AND event_id NOT IN (SELECT id FROM public.events);

-- Add the foreign key constraint
ALTER TABLE public.markets
ADD CONSTRAINT markets_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON public.markets(event_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);

-- ============================================================================
-- STEP 5: Reload PostgREST schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================
DO $$
DECLARE
    col_record RECORD;
    fk_record RECORD;
BEGIN
    RAISE NOTICE '=== Events Table Columns ===';
    FOR col_record IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'events'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%)', col_record.column_name, col_record.data_type;
    END LOOP;
    
    RAISE NOTICE '=== Markets Table Columns ===';
    FOR col_record IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'markets'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%)', col_record.column_name, col_record.data_type;
    END LOOP;
    
    RAISE NOTICE '=== Foreign Keys ===';
    FOR fk_record IN 
        SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE '  %: %.% -> %', 
            fk_record.constraint_name,
            fk_record.table_name, 
            fk_record.column_name,
            fk_record.foreign_table_name;
    END LOOP;
END $$;
