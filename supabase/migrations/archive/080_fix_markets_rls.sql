-- Migration 080: Fix Markets RLS Policies
-- Ensure public can view active markets

-- 1. Enable RLS on markets table (if not already enabled)
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (optional, but safer for "fix")
DROP POLICY IF EXISTS "Public can view active markets" ON public.markets;
DROP POLICY IF EXISTS "Admins can manage markets" ON public.markets;
DROP POLICY IF EXISTS "Public read access" ON public.markets;

-- 3. Create Policy: Public Read Access (Active Markets)
-- Allowing public to view all markets or just active ones?
-- Frontend fetches 'active' markets. But market details page needs 'resolved' too.
-- Let's allow viewing ALL markets for now to prevent "missing data" issues.
CREATE POLICY "Public can view markets"
ON public.markets
FOR SELECT
USING (true);

-- 4. Create Policy: Admin Management
CREATE POLICY "Admins can manage markets"
ON public.markets
FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 5. Fix RLS for related tables if needed (categories, etc. if they exist)
-- (Assuming categories are strings in markets table, not separate table)
