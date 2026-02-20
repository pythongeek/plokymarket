-- Migration 106: Event Validation and Realtime Configuration
-- ==========================================================

-- 1. Timing Validation Function
-- Ensures realistic and secure timestamps for events
CREATE OR REPLACE FUNCTION public.validate_event_timing()
RETURNS TRIGGER AS $$
BEGIN
  -- ends_at must be in the future for new events or during update if changed
  IF (TG_OP = 'INSERT' OR NEW.ends_at IS DISTINCT FROM OLD.ends_at) AND NEW.ends_at <= CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'Market end time must be in the future: %', NEW.ends_at;
  END IF;
  
  -- ends_at must be after starts_at
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Market must end after it starts: starts_at=%, ends_at=%', 
      NEW.starts_at, NEW.ends_at;
  END IF;
  
  -- resolution_delay validation (0 to 2 weeks)
  IF NEW.resolution_delay < 0 OR NEW.resolution_delay > 20160 THEN
    RAISE EXCEPTION 'Resolution delay must be between 0 and 20160 minutes (2 weeks): %', NEW.resolution_delay;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing triggers if any, then add
DROP TRIGGER IF EXISTS enforce_future_end_time ON public.events;
CREATE TRIGGER enforce_future_end_time
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.validate_event_timing();

-- 3. Extend resolution_delay check constraint (Migration 101 had it at 10080)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_resolution_delay_check;
ALTER TABLE public.events ADD CONSTRAINT events_resolution_delay_check 
    CHECK (resolution_delay >= 0 AND resolution_delay <= 20160);

-- 4. Enable Supabase Realtime for events table
-- This allows clients to subscribe to changes via Supabase JS client
BEGIN;
  -- Add to publication if not already added
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'events'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    END IF;
  END $$;
COMMIT;

-- 5. Additional RLS Policy for Realtime (if needed, usually Select is enough)
-- Migration 100 already has "Public can view events" with USING (true)
-- We add an authenticated-specific one just to be explicit as requested
DROP POLICY IF EXISTS "Enable realtime for authenticated users" ON public.events;
CREATE POLICY "Enable realtime for authenticated users" 
  ON public.events FOR SELECT 
  TO authenticated 
  USING (true);

COMMENT ON FUNCTION public.validate_event_timing() IS 'Prevents invalid event timestamps and unreasonable resolution delays';
