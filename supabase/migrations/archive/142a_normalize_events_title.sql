-- ============================================================
-- Migration 142a: Normalize events.question → events.title
-- CRITICAL FIX: Must be applied FIRST before 142b
-- 
-- Problem: Frontend writes 'question', reads 'title'
-- Result: Events created with NULL title → orphaned events
-- ============================================================

BEGIN;

-- ===================================
-- STEP 1: Add title column if missing
-- ===================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'events' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.events ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column to events table';
  ELSE
    RAISE NOTICE 'title column already exists';
  END IF;
END $$;

-- ===================================
-- STEP 2: Migrate existing data
-- ===================================
-- Copy question → title where title is NULL
UPDATE public.events 
SET title = question 
WHERE title IS NULL 
AND question IS NOT NULL;

-- Also copy from name if title still NULL
UPDATE public.events 
SET title = name 
WHERE title IS NULL 
AND name IS NOT NULL;

-- Last resort: use slug
UPDATE public.events 
SET title = REPLACE(slug, '-', ' ')
WHERE title IS NULL 
AND slug IS NOT NULL;

-- ===================================
-- STEP 3: Make title NOT NULL with default
-- ===================================
-- First set any remaining NULLs to a placeholder
UPDATE public.events 
SET title = 'Untitled Event ' || id::text
WHERE title IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.events ALTER COLUMN title SET NOT NULL;

-- Add default for future inserts
ALTER TABLE public.events ALTER COLUMN title SET DEFAULT 'New Event';

-- ===================================
-- STEP 4: Add trigger to sync question/title
-- ===================================
CREATE OR REPLACE FUNCTION sync_event_title_question()
RETURNS TRIGGER AS $$
BEGIN
  -- If title changes but question is null, update question
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.question IS NULL THEN
    NEW.question := NEW.title;
  END IF;
  
  -- If question changes but title is null, update title
  IF NEW.question IS DISTINCT FROM OLD.question AND NEW.title IS NULL THEN
    NEW.title := NEW.question;
  END IF;
  
  -- If both are set and different, keep both (no action needed)
  -- If both are set and same, that's fine too
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS trigger_sync_event_title_question ON public.events;

CREATE TRIGGER trigger_sync_event_title_question
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_title_question();

-- ===================================
-- STEP 5: Add comment for documentation
-- ===================================
COMMENT ON COLUMN public.events.title IS 'Display title for the event (normalized from question)';
COMMENT ON COLUMN public.events.question IS 'The prediction question (kept for backward compatibility)';

-- ===================================
-- STEP 6: Verify migration
-- ===================================
DO $$
DECLARE
  null_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.events;
  SELECT COUNT(*) INTO null_count FROM public.events WHERE title IS NULL;
  
  RAISE NOTICE 'Events table: % total, % with NULL title', total_count, null_count;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % events still have NULL title', null_count;
  END IF;
END $$;

COMMIT;

-- ===================================
-- POST-MIGRATION: Optional cleanup (run after 24h verification)
-- ===================================
-- Uncomment after verifying everything works:
-- ALTER TABLE public.events DROP COLUMN IF EXISTS question;
-- DROP TRIGGER IF EXISTS trigger_sync_event_title_question ON public.events;
