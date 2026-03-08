-- Migration 130: Fix Foreign Key Relationship between markets and events
-- =====================================================================

DO $$
BEGIN
    -- Drop the constraint if it already exists (to prevent errors)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'markets' AND constraint_name = 'markets_event_id_fkey'
    ) THEN
        ALTER TABLE public.markets DROP CONSTRAINT markets_event_id_fkey;
    END IF;

    -- Clean up orphaned markets (markets referencing non-existent events)
    DELETE FROM public.markets 
    WHERE event_id IS NOT NULL 
    AND event_id NOT IN (SELECT id FROM public.events);

    -- Add the correct foreign key constraint
    ALTER TABLE public.markets 
        ADD CONSTRAINT markets_event_id_fkey 
        FOREIGN KEY (event_id) 
        REFERENCES public.events(id) 
        ON DELETE SET NULL;
END $$;

-- Reload the PostgREST schema cache to immediately resolve PGRST200 error
NOTIFY pgrst, 'reload schema';
