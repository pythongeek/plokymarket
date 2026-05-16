-- ============================================================================
-- Migration 20260513_01: Resolve Duplicate Function Conflicts
-- Rule 7: Surface conflicts, don't average them. Pick the most recent/tested.
-- ============================================================================
-- ANALYSIS:
-- Query of pg_proc revealed duplicate definitions for several functions.
-- PostgreSQL keeps both due to different argument signatures.
-- OID auto-increments; higher OID = more recently defined.
--
-- EXCEPTION: is_admin() (no args) CANNOT be dropped because RLS policies on
-- events, markets, and admin_audit_log directly depend on it. We keep BOTH
-- is_admin() and is_admin(uuid) and fix search_path on both in Step 2.
--
-- CONFLICT RESOLUTION:
-- | Function                | Keep (Higher OID)                          | Drop (Lower OID)              | Reason |
-- |-------------------------|-------------------------------------------|-------------------------------|--------|
-- | settle_market           | (uuid, text, uuid) - wraps settle_market_v2| (uuid, outcome_type)          | Used by resolve_market |
-- | create_event_complete   | (varchar,text,uuid,text[],text,text)       | (jsonb, uuid)                 | Wraps v3, more explicit fields |
-- | is_admin                | BOTH KEPT - RLS policies depend on ()      | NONE                          | Policies on events/markets use is_admin() |
-- | log_admin_action        | 10-arg detailed version                    | 3-arg simple version          | More audit fields |
-- | admin_credit_wallet     | 5-arg with currency                        | 4-arg without currency        | Currency support needed |
-- | admin_debit_wallet      | 5-arg with currency                        | 4-arg without currency        | Currency support needed |
-- | get_platform_analytics  | 2-arg (period, metric_type)                | 1-arg (period)                | More flexible |
-- ============================================================================

-- 1. Drop older settle_market (2 args: uuid, outcome_type)
--    Kept: settle_market(p_market_id uuid, p_outcome text, p_resolved_by uuid)
DROP FUNCTION IF EXISTS public.settle_market(UUID, public.outcome_type);

-- 2. Drop older create_event_complete (2 args: jsonb, uuid)
--    Kept: create_event_complete(p_title varchar, p_description text, p_category_id uuid, p_tags text[], p_answer_type text, p_resolution_src text)
DROP FUNCTION IF EXISTS public.create_event_complete(JSONB, UUID);

-- 3. is_admin() KEPT - RLS policies on events, markets, admin_audit_log depend on it
--    We keep BOTH is_admin() and is_admin(user_id uuid)
--    DO NOT DROP - would cascade-delete RLS policies

-- 4. Drop older log_admin_action (3 args: uuid, text, text)
--    Kept: 10-arg version with full audit fields
DROP FUNCTION IF EXISTS public.log_admin_action(UUID, TEXT, TEXT);

-- 5. Drop older admin_credit_wallet (4 args: no currency)
--    Kept: admin_credit_wallet(p_admin_id uuid, p_user_id uuid, p_amount numeric, p_currency character varying, p_reason text)
DROP FUNCTION IF EXISTS public.admin_credit_wallet(UUID, UUID, NUMERIC, TEXT);

-- 6. Drop older admin_debit_wallet (4 args: no currency)
--    Kept: admin_debit_wallet(p_admin_id uuid, p_user_id uuid, p_amount numeric, p_currency character varying, p_reason text)
DROP FUNCTION IF EXISTS public.admin_debit_wallet(UUID, UUID, NUMERIC, TEXT);

-- 7. Drop older get_platform_analytics (1 arg: period only)
--    Kept: get_platform_analytics(p_period character varying, p_metric_type character varying)
DROP FUNCTION IF EXISTS public.get_platform_analytics(CHARACTER VARYING);

-- Verification: should now show only 1 row per function (except is_admin which has 2 by design)
-- SELECT proname, COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND proname IN ('settle_market','create_event_complete','log_admin_action','admin_credit_wallet','admin_debit_wallet','get_platform_analytics') GROUP BY proname;
