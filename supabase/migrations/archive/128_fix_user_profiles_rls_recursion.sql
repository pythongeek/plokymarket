-- ============================================
-- FIX USER_PROFILES RLS RECURSION
-- ============================================

-- 1. Create a secure function to check admin status bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean AS $$
DECLARE
  _is_admin boolean;
  _is_super_admin boolean;
BEGIN
  SELECT is_admin, is_super_admin INTO _is_admin, _is_super_admin
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(_is_admin, false) OR COALESCE(_is_super_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policy from 031_fix_user_profiles_rls.sql
DROP POLICY IF EXISTS user_profiles_self_select ON user_profiles;

-- 3. Recreate the policy using the secure function to avoid the infinite loop
CREATE POLICY user_profiles_self_select ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    public.is_admin_secure()
  );

-- 4. Clean up any other potential recursive policies on user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (public.is_admin_secure());
