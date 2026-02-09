-- Diagnostic queries for FK constraint error
-- Run these in Supabase SQL Editor

-- 1. Find all foreign keys that reference public.users(id)
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.column_name = 'id';

-- 2. Check triggers on public.users
SELECT tgname, tgtype::text, tgenabled, pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgrelid = 'public.users'::regclass
  AND NOT tgisinternal;

-- 3. Check for self-referential FK columns on users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users';

-- 4. List FKs defined ON the users table (columns referencing other tables)
SELECT
  tc.constraint_name, kcu.column_name, ccu.table_name AS references_table, ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema='public' AND tc.table_name='users' AND tc.constraint_type='FOREIGN KEY';

-- 5. Check wallets table FK specifically
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints
WHERE table_schema='public' AND table_name='wallets';

-- 6. Check deferrable constraints
SELECT conname, condeferrable, condeferred
FROM pg_constraint
WHERE contype = 'f' AND confrelid = 'users'::regclass;
