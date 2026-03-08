-- Migration: Add admin full access policy to market_creation_drafts
-- Date: 2026-03-06
-- Purpose: Allow admins to have full access to all drafts for admin panel functionality

-- Drop existing admin policy if exists (in case of re-run)
DROP POLICY IF EXISTS "Admin full access on drafts" ON public.market_creation_drafts;

-- Create admin full access policy
-- This policy grants full access (SELECT, INSERT, UPDATE, DELETE) to authenticated users
-- who have is_admin = true in user_profiles table
-- Note: user_profiles uses 'id' (not 'user_id') as the primary key
CREATE POLICY "Admin full access on drafts" 
ON public.market_creation_drafts 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Also add super_admin access
DROP POLICY IF EXISTS "Super admin full access on drafts" ON public.market_creation_drafts;

CREATE POLICY "Super admin full access on drafts" 
ON public.market_creation_drafts 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_super_admin = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_super_admin = TRUE
  )
);

-- Verify the policies were created
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'market_creation_drafts';
