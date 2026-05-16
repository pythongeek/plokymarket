-- ============================================================================
-- Migration 20260513_02: Fix SECURITY DEFINER Search Path Injection
-- Vulnerability: 175 functions with SECURITY DEFINER lack SET search_path = ''
-- Impact: Privilege escalation via schema squatting attack
-- Fix: Apply ALTER FUNCTION ... SET search_path = '' to all offending functions
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_count INT := 0;
    v_fixed INT := 0;
    v_skipped INT := 0;
BEGIN
    -- Count total SECURITY DEFINER functions in public schema
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true;

    RAISE NOTICE 'Found % SECURITY DEFINER functions in public schema', v_count;

    -- Loop through all SECURITY DEFINER functions and fix those missing search_path
    FOR r IN
        SELECT 
            n.nspname AS schema_name,
            p.proname AS func_name,
            pg_get_function_identity_arguments(p.oid) AS func_args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
          AND (
              p.proconfig IS NULL
              OR NOT EXISTS (
                  SELECT 1 FROM unnest(p.proconfig) AS cfg
                  WHERE cfg LIKE 'search_path=%'
              )
          )
        ORDER BY p.proname
    LOOP
        BEGIN
            EXECUTE format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = %L',
                r.schema_name,
                r.func_name,
                r.func_args,
                ''
            );
            v_fixed := v_fixed + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not fix %.%(%): %', r.schema_name, r.func_name, r.func_args, SQLERRM;
            v_skipped := v_skipped + 1;
        END;
    END LOOP;

    RAISE NOTICE 'Fixed % functions, skipped % functions', v_fixed, v_skipped;
END;
$$;

-- ============================================================================
-- Post-fix verification query (run manually to confirm):
-- SELECT COUNT(*) AS still_vulnerable
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.prosecdef = true
--   AND (p.proconfig IS NULL OR NOT EXISTS (
--       SELECT 1 FROM unnest(p.proconfig) AS cfg WHERE cfg LIKE 'search_path=%'
--   ));
-- Expected: 0
-- ============================================================================
