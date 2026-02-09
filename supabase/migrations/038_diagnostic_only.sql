-- 038_diagnostic_only.sql
-- PURE DIAGNOSTIC - Find the root cause
-- Run this and share the output

-- ===================================
-- 1. Show all columns in users table
-- ===================================
SELECT '=== users TABLE COLUMNS ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ===================================
-- 2. Show ALL constraints on users table
-- ===================================
SELECT '=== ALL CONSTRAINTS ON users ===' as section;
SELECT 
    conname as constraint_name,
    contype as type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass
ORDER BY contype, conname;

-- Constraint type key:
-- 'c' = check constraint
-- 'f' = foreign key
-- 'p' = primary key
-- 'u' = unique
-- 'x' = exclusion

-- ===================================
-- 3. Show triggers on users
-- ===================================
SELECT '=== TRIGGERS ON users ===' as section;
SELECT 
    tgname as trigger_name,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'public.users'::regclass 
AND NOT tgisinternal;

-- ===================================
-- 4. Check if there's a self-referential FK
-- ===================================
SELECT '=== SELF-REFERENTIAL FK CHECK ===' as section;
SELECT 
    a.attname as column_name,
    pg_get_constraintdef(c.oid) as fk_definition
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.contype = 'f' 
AND c.conrelid = 'public.users'::regclass
AND c.confrelid = 'public.users'::regclass;

-- ===================================
-- 5. Try ULTRA-MINIMAL insert (id + email only)
-- ===================================
SELECT '=== ATTEMPTING ULTRA-MINIMAL INSERT ===' as section;

-- First check if user exists
SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE id = 'a1111111-1111-1111-1111-111111111111')
    THEN 'User already exists'
    ELSE 'User does not exist - will try insert'
END as status;

-- Try inserting with ONLY id and email
INSERT INTO public.users (id, email)
VALUES ('a1111111-1111-1111-1111-111111111111', 'minimal@test.com')
ON CONFLICT (id) DO NOTHING
RETURNING id, email, created_at;

-- ===================================
-- 6. If minimal insert worked, update with more data
-- ===================================
UPDATE public.users SET
    full_name = 'Test User',
    phone = '+88000000000'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- ===================================
-- 7. Show what users exist now
-- ===================================
SELECT '=== CURRENT USERS ===' as section;
SELECT id, email, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
