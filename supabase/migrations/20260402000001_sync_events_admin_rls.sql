-- Migration: Sync events_admin_all RLS policy to include is_super_admin
-- Date: 2026-04-02
-- Issue: schema_production.sql has is_admin OR is_super_admin but remote DB only checks is_admin

-- Drop existing policy
DROP POLICY IF EXISTS "events_admin_all" ON public.events;

-- Recreate with is_super_admin check (matching schema_production.sql)
CREATE POLICY "events_admin_all"
    ON public.events
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));
