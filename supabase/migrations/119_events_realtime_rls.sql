-- 119_events_realtime_rls.sql
-- Enable public SELECT access specifically for Realtime propagation

-- We use DROP POLICY IF EXISTS first to prevent errors if running multiple times
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;

CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT TO authenticated, anon USING (true);

-- Ensure Realtime is enabled for the 'events' table
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Ignore if already added
END $$;
