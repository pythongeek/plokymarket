-- ============================================================
-- Debug Script: Find user_id column issues
-- Run this in Supabase SQL Editor to find the exact problem
-- ============================================================

-- 1. List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Which tables have user_id column
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'user_id'
ORDER BY table_name;

-- 3. Check existing tables that we want to create (if they exist)
SELECT 'follows' as tbl, CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follows') THEN 'exists' ELSE 'missing' END as status
UNION ALL
SELECT 'user_feed_preferences', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_feed_preferences') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'ai_event_pipelines', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_event_pipelines') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'burn_events', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'burn_events') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'treasury_transfers', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treasury_transfers') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'payout_calculations', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payout_calculations') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'position_interventions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'position_interventions') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'user_internal_notes', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_internal_notes') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'support_tickets', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN 'exists' ELSE 'missing' END
UNION ALL
SELECT 'support_ticket_messages', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_ticket_messages') THEN 'exists' ELSE 'missing' END;

-- 4. Find policies that reference user_id
-- Note: pg_get_policydef is not available in Supabase, so we use an alternative
SELECT 
    c.relname AS table_name,
    p.polname AS policy_name,
    -- Use pg_get_expr instead which is available
    pg_get_expr(p.polqual, p.polrelid) AS policy_definition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public';

-- 5. Check if there are any triggers or functions that reference user_id
SELECT proname, prosrc 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND prosrc LIKE '%user_id%';
