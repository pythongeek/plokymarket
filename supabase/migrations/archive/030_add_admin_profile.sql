-- Migration: Add admin user profile
-- Fixes auth-portal "Failed to verify admin status" error

-- Temporarily disable RLS to insert admin profile
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Insert admin profile for existing auth user
-- User ID: d369deac-b0c3-42d4-8851-f4c93fee945e (admin@plokymarket.bd)
INSERT INTO user_profiles (
    id,
    is_admin,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    'd369deac-b0c3-42d4-8851-f4c93fee945e',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    is_super_admin = true,
    updated_at = NOW();

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify insertion
SELECT id, is_admin, is_super_admin 
FROM user_profiles 
WHERE id = 'd369deac-b0c3-42d4-8851-f4c93fee945e';
