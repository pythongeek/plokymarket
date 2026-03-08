-- Migration: Fix RLS policy for market_creation_drafts to allow admin counts
-- Date: 2026-03-04
-- Description: Add a bypass policy for counting pending legal reviews without authentication

-- Drop existing SELECT policy that requires authentication
DROP POLICY IF EXISTS "Creators can view own drafts" ON market_creation_drafts;

-- Create new policy that allows:
-- 1. Owners to view their own drafts
-- 2. Admins to view all drafts
-- 3. Anonymous/count queries for pending legal reviews (for dashboard badges)
DROP POLICY IF EXISTS "Allow read access to market_creation_drafts" ON market_creation_drafts;
CREATE POLICY "Allow read access to market_creation_drafts"
    ON market_creation_drafts
    FOR SELECT
    USING (
        -- Allow creators to view their own drafts
        auth.uid() = creator_id
        OR
        -- Allow admins to view all drafts
        (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
        OR
        -- Allow anyone to count pending legal reviews (for HEAD requests)
        (legal_review_status = 'pending')
    );

-- Also create a separate policy for INSERT with check
DROP POLICY IF EXISTS "Allow insert for creators" ON market_creation_drafts;
CREATE POLICY "Allow insert for creators"
    ON market_creation_drafts
    FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Create policy for UPDATE
DROP POLICY IF EXISTS "Allow update for creators and admins" ON market_creation_drafts;
CREATE POLICY "Allow update for creators and admins"
    ON market_creation_drafts
    FOR UPDATE
    USING (
        auth.uid() = creator_id
        OR
        (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
    );

-- Create policy for DELETE
DROP POLICY IF EXISTS "Allow delete for creators and admins" ON market_creation_drafts;
CREATE POLICY "Allow delete for creators and admins"
    ON market_creation_drafts
    FOR DELETE
    USING (
        auth.uid() = creator_id
        OR
        (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
    );

-- Grant SELECT permission to anon role for counting pending reviews
-- This is needed for the dashboard badge HEAD requests
GRANT SELECT ON market_creation_drafts TO anon;

-- Also grant to authenticated role
GRANT SELECT ON market_creation_drafts TO authenticated;

-- Verify the table exists and has the expected columns
DO $$
BEGIN
    -- Verify legal_review_status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'market_creation_drafts' 
        AND column_name = 'legal_review_status'
    ) THEN
        RAISE WARNING 'market_creation_drafts.legal_review_status column not found';
    END IF;
END $$;
