-- Migration: Fix user_profiles RLS to allow users to create their own profile
-- This fixes the auth-portal "Failed to verify admin status" error permanently

-- Drop existing insert policy
-- Drop any existing policies that might conflict (be idempotent)
DROP POLICY IF EXISTS user_profiles_admin_insert ON user_profiles;
DROP POLICY IF EXISTS user_profiles_self_insert ON user_profiles;

-- Create new policy that allows users to insert their own profile
CREATE POLICY user_profiles_self_insert ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also allow users to view their own profile
-- Drop any existing select policies for this table
DROP POLICY IF EXISTS user_profiles_self_select ON user_profiles;
DROP POLICY IF EXISTS workflows_view_policy ON user_profiles;

CREATE POLICY user_profiles_self_select ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS(
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
