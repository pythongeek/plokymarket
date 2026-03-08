-- ============================================
-- FIX ADMIN RLS RECURSION & MISSING RPCs
-- ============================================

-- 1. Create a secure is_admin function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  _is_admin boolean;
  _is_super_admin boolean;
BEGIN
  SELECT is_admin, is_super_admin INTO _is_admin, _is_super_admin
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(_is_admin, false) OR COALESCE(_is_super_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER allows this to run without RLS restrictions

-- 2. Update user_profiles policies to avoid recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin(auth.uid()));

-- 3. Update related policies to use the secure function
-- This replaces the recursive subqueries
DROP POLICY IF EXISTS "Admins can view all status" ON user_status;
CREATE POLICY "Admins can view all status" 
    ON user_status FOR SELECT 
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can modify status" ON user_status;
CREATE POLICY "Admins can modify status" 
    ON user_status FOR ALL 
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all KYC" ON user_kyc_profiles;
CREATE POLICY "Admins can view all KYC" 
    ON user_kyc_profiles FOR SELECT 
    USING (is_admin(auth.uid()));

-- 4. Create missing search_users RPC
CREATE OR REPLACE FUNCTION search_users(
    p_query TEXT,
    p_status_filter VARCHAR DEFAULT NULL,
    p_kyc_filter VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    created_at TIMESTAMPTZ,
    account_status VARCHAR,
    verification_status VARCHAR,
    total_matches BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_users AS (
        SELECT 
            up.id,
            up.email,
            up.full_name,
            up.created_at,
            us.account_status,
            ukp.verification_status
        FROM user_profiles up
        LEFT JOIN user_status us ON up.id = us.id
        LEFT JOIN user_kyc_profiles ukp ON up.id = ukp.id
        WHERE 
            (p_query IS NULL OR p_query = '' OR 
             up.email ILIKE '%' || p_query || '%' OR 
             up.full_name ILIKE '%' || p_query || '%')
            AND
            (p_status_filter IS NULL OR us.account_status = p_status_filter)
            AND
            (p_kyc_filter IS NULL OR ukp.verification_status = p_kyc_filter)
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM filtered_users) AS total_matches
    FROM filtered_users
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
