-- ============================================================
-- MIGRATION 142a - APPLY THIS NOW IN SUPABASE DASHBOARD
-- SQL Editor → New Query → Paste → Run
-- ============================================================

-- STEP 1: Add title column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'events' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.events ADD COLUMN title TEXT;
    RAISE NOTICE '✅ Added title column to events table';
  ELSE
    RAISE NOTICE 'ℹ️ title column already exists';
  END IF;
END $$;

-- STEP 2: Migrate existing data (question → title)
UPDATE public.events 
SET title = question 
WHERE title IS NULL 
AND question IS NOT NULL;

UPDATE public.events 
SET title = name 
WHERE title IS NULL 
AND name IS NOT NULL;

UPDATE public.events 
SET title = REPLACE(slug, '-', ' ')
WHERE title IS NULL 
AND slug IS NOT NULL;

-- STEP 3: Set any remaining NULLs
UPDATE public.events 
SET title = 'Untitled Event ' || id::text
WHERE title IS NULL;

-- STEP 4: Make title NOT NULL
ALTER TABLE public.events ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN title SET DEFAULT 'New Event';

-- STEP 5: Add sync trigger
CREATE OR REPLACE FUNCTION sync_event_title_question()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.question IS NULL THEN
    NEW.question := NEW.title;
  END IF;
  IF NEW.question IS DISTINCT FROM OLD.question AND NEW.title IS NULL THEN
    NEW.title := NEW.question;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_event_title_question ON public.events;
CREATE TRIGGER trigger_sync_event_title_question
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION sync_event_title_question();

-- STEP 6: Verify
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE title IS NULL) as null_titles,
  COUNT(*) FILTER (WHERE title IS NOT NULL) as with_titles
FROM public.events;
