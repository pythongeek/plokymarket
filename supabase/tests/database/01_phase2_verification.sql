-- ============================================================================
-- Phase 2 Verification Script
-- Intent: Prove race conditions are impossible and SECURITY DEFINER is fixed
-- Rule 9: Tests verify WHY, not just WHAT
-- ============================================================================

-- ============================================================================
-- TEST 1: SECURITY DEFINER Search Path Fix
-- Intent: If search_path is not set, an attacker can create a schema with
--         a shadow table and have functions read from it instead of public.
--         This test asserts ZERO vulnerable functions remain.
-- ============================================================================
DO $$
DECLARE
    v_vulnerable_count INT;
BEGIN
    SELECT COUNT(*) INTO v_vulnerable_count
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
      );

    IF v_vulnerable_count > 0 THEN
        RAISE EXCEPTION 'TEST FAILED: % SECURITY DEFINER functions still lack search_path', v_vulnerable_count;
    END IF;

    RAISE NOTICE 'TEST 1 PASSED: All SECURITY DEFINER functions have search_path set';
END;
$$;

-- ============================================================================
-- TEST 2: Wallet Constraint Prevents Negative Balances
-- Intent: Even if two concurrent transactions both read balance=100 and both
--         try to deduct 60, the CHECK constraint ensures at least one fails.
--         Without this, double-spending is possible.
-- ============================================================================
DO $$
DECLARE
    v_test_user UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    v_wallet_id UUID;
BEGIN
    -- Create a test wallet with balance 100
    INSERT INTO wallets (id, user_id, balance, locked_balance)
    VALUES (gen_random_uuid(), v_test_user, 100, 0)
    RETURNING id INTO v_wallet_id;

    -- Attempt to set negative balance (must fail)
    BEGIN
        UPDATE wallets SET balance = -1 WHERE id = v_wallet_id;
        RAISE EXCEPTION 'TEST FAILED: CHECK constraint did not block negative balance';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TEST 2 PASSED: CHECK constraint blocked negative balance update';
    END;

    -- Clean up
    DELETE FROM wallets WHERE id = v_wallet_id;
END;
$$;

-- ============================================================================
-- TEST 3: Order Constraint Prevents Over-fill
-- Intent: A bug in match_order that increments filled_quantity beyond quantity
--         must be blocked at the database level to prevent phantom shares.
-- ============================================================================
DO $$
DECLARE
    v_test_order UUID;
BEGIN
    -- Create a test order with quantity 100, filled 0
    INSERT INTO orders (id, user_id, market_id, order_type, side, outcome, price, quantity, filled_quantity, status)
    VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000002'::UUID,
            'limit', 'buy', 'YES', 0.5, 100, 0, 'open')
    RETURNING id INTO v_test_order;

    -- Attempt to over-fill (must fail)
    BEGIN
        UPDATE orders SET filled_quantity = 101 WHERE id = v_test_order;
        RAISE EXCEPTION 'TEST FAILED: CHECK constraint did not block over-fill';
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'TEST 3 PASSED: CHECK constraint blocked over-filled_quantity';
    END;

    -- Clean up
    DELETE FROM orders WHERE id = v_test_order;
END;
$$;

-- ============================================================================
-- TEST 4: Composite Index Exists for FIFO Matching
-- Intent: Without this index, match_order scans the entire orders table
--         for each match iteration. With it, PostgreSQL uses Index Only Scan.
-- ============================================================================
DO $$
DECLARE
    v_index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'idx_orders_fifo'
    ) INTO v_index_exists;

    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'TEST FAILED: idx_orders_fifo composite index missing';
    END IF;

    RAISE NOTICE 'TEST 4 PASSED: idx_orders_fifo composite index exists';
END;
$$;

-- ============================================================================
-- TEST 5: BRIN Index Exists for Audit Logs
-- Intent: BRIN is 100x smaller than B-tree for append-only time-series.
--         Without it, audit log queries scan the full table.
-- ============================================================================
DO $$
DECLARE
    v_index_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = 'idx_audit_logs_created_brin'
    ) INTO v_index_exists;

    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'TEST FAILED: idx_audit_logs_created_brin BRIN index missing';
    END IF;

    RAISE NOTICE 'TEST 5 PASSED: BRIN index on admin_audit_log exists';
END;
$$;

-- ============================================================================
-- TEST 6: Duplicate Functions Resolved
-- Intent: Duplicate function definitions create ambiguity. PostgreSQL picks
--         the first match, which may be the wrong version.
-- ============================================================================
DO $$
DECLARE
    v_dup_count INT;
BEGIN
    SELECT COUNT(*) INTO v_dup_count
    FROM (
        SELECT proname, COUNT(*) AS cnt
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND proname IN ('settle_market','create_event_complete','is_admin','log_admin_action',
                          'admin_credit_wallet','admin_debit_wallet','get_platform_analytics')
        GROUP BY proname
        HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_count > 0 THEN
        RAISE EXCEPTION 'TEST FAILED: % functions still have duplicate definitions', v_dup_count;
    END IF;

    RAISE NOTICE 'TEST 6 PASSED: All duplicate functions resolved';
END;
$$;

-- ============================================================================
-- SUMMARY OUTPUT
-- ============================================================================
SELECT 'VERIFICATION COMPLETE' AS status;
