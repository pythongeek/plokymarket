-- Migration 143c: Orphan Sync Cron Setup
-- Prepares the view and function used by the cleanup cron job

BEGIN;

-- 1. Create a view that filters orphaned events (active events lacking a market)
CREATE OR REPLACE VIEW public.orphaned_events AS
    SELECT e.id, e.title, e.status, e.created_at
    FROM public.events e
    LEFT JOIN public.markets m ON m.event_id = e.id
    WHERE m.id IS NULL AND e.status = 'active';

-- 2. Function to quickly return a set of orphaned event IDs
CREATE OR REPLACE FUNCTION public.get_orphaned_event_ids()
RETURNS SETOF UUID 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
    SELECT id FROM public.orphaned_events;
$$;

GRANT EXECUTE ON FUNCTION public.get_orphaned_event_ids() TO service_role;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
