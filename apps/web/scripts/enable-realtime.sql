-- Enable Realtime for events and markets tables
-- This ensures real-time updates work for the frontend

-- Add events table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- Add markets table to supabase_realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE markets;

-- Verify the changes
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
