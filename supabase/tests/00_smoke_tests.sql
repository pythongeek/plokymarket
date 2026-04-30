-- ============================================================
-- DB Migration Pipeline - Smoke Test Suite (Phase 8.1)
-- ============================================================
DO $$
DECLARE
  v_count INT;
  v_admin_user UUID := gen_random_uuid();
  v_normal_user UUID := gen_random_uuid();
  v_event_id UUID;
  v_category_id UUID;
  v_market_id UUID;
  v_wallet_id UUID;
  v_order_id UUID;
  v_jsonb JSONB;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '▶ STARTING 10-POINT SMOKE TEST SUITE';
  RAISE NOTICE '========================================';

  -- Setup mocked users
  INSERT INTO users (id, email, wallet_address, is_admin) VALUES 
    (v_admin_user, 'admin@test.com', '0xADMIN123', true),
    (v_normal_user, 'user@test.com', '0xUSER123', false);
    
  -- Setup event dependencies
  -- (category_id is not strictly bound by FK in current v2 events table)
  v_category_id := gen_random_uuid();

  ------------------------------------------------------------
  -- 1. test_enums_unified
  ------------------------------------------------------------
  SELECT COUNT(*) INTO v_count FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
  WHERE t.typname = 'market_status' AND e.enumlabel IN ('draft', 'active', 'paused', 'closed', 'resolved', 'disputed');
  IF v_count != 6 THEN RAISE EXCEPTION 'test_enums_unified FAILED: Missing market_status enums'; END IF;
  RAISE NOTICE '✅ test_enums_unified: PASSED';

  ------------------------------------------------------------
  -- 2. test_is_admin_column
  ------------------------------------------------------------
  PERFORM is_admin FROM users LIMIT 1;
  RAISE NOTICE '✅ test_is_admin_column: PASSED';

  ------------------------------------------------------------
  -- 3. test_event_creation
  ------------------------------------------------------------
  -- Must return JSONB containing event_id
  v_jsonb := create_event_complete_v3('Test Event', 'Desc', 'binary', '["Tag1"]'::jsonb, v_event_id, 'Source', NULL, NULL);
  IF NOT (v_jsonb ? 'event_id') THEN RAISE EXCEPTION 'test_event_creation FAILED: No event_id returned'; END IF;
  v_event_id := (v_jsonb->>'event_id')::UUID;
  RAISE NOTICE '✅ test_event_creation: PASSED';

  ------------------------------------------------------------
  -- 4. test_order_placement & 9. test_partition_routing
  ------------------------------------------------------------
  v_market_id := gen_random_uuid();
  INSERT INTO markets (id, event_id, slug, ends_at) VALUES (v_market_id, v_event_id, 'test-slug', NOW() + interval '1 day');
  
  INSERT INTO wallets (user_id, balance) VALUES (v_normal_user, 1000) RETURNING id INTO v_wallet_id;
  
  -- Simulate placing an order natively to test atomic deduction
  v_jsonb := place_order_atomic_v2(v_normal_user, v_market_id, 'buy', 'limit', 0.50, 100);
  IF NOT (v_jsonb->>'success')::BOOLEAN THEN RAISE EXCEPTION 'test_order_placement FAILED: Engine rejected trade'; END IF;
  
  v_order_id := (v_jsonb->>'order_id')::UUID;
  
  -- Validate Wallet Deduction
  SELECT balance INTO v_count FROM wallets WHERE user_id = v_normal_user;
  IF v_count != 950 THEN RAISE EXCEPTION 'test_order_placement FAILED: Wallet balance % != 950', v_count; END IF;
  RAISE NOTICE '✅ test_order_placement: PASSED';

  -- Validate Partition Routing (Order should land in the master view which aggregates partitions correctly)
  SELECT COUNT(*) INTO v_count FROM orders WHERE id = v_order_id;
  IF v_count != 1 THEN RAISE EXCEPTION 'test_partition_routing FAILED: Order evaporated into void'; END IF;
  RAISE NOTICE '✅ test_partition_routing: PASSED';

  ------------------------------------------------------------
  -- 5. test_fk_integrity
  ------------------------------------------------------------
  BEGIN
    INSERT INTO markets (event_id, slug, ends_at) VALUES (gen_random_uuid(), 'test-slug-orphan', NOW());
    RAISE EXCEPTION 'test_fk_integrity FAILED: Allowed orphaned market';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '✅ test_fk_integrity: PASSED';
  END;

  ------------------------------------------------------------
  -- 6. test_rls_isolation
  ------------------------------------------------------------
  -- We mock auth.uid() by manipulating the session
  EXECUTE 'SET LOCAL request.jwt.claims TO ''{"sub": "' || v_admin_user || '"}'';';
  
  -- RLS ignores superuser roles. We must create and swap to a degraded test role to evaluate policy bounds.
  BEGIN
    CREATE ROLE rls_test_user;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  GRANT USAGE ON SCHEMA public TO rls_test_user;
  GRANT SELECT ON orders TO rls_test_user;

  EXECUTE 'SET LOCAL role TO rls_test_user';
  EXECUTE 'SET LOCAL request.jwt.claims TO ''{"sub": "' || gen_random_uuid() || '"}'';';
  
  -- RLS evaluation via subquery
  SELECT COUNT(*) INTO v_count FROM orders;
  IF v_count != 0 THEN RAISE EXCEPTION 'test_rls_isolation FAILED: Normal user saw % external orders', v_count; END IF;
  
  -- Reset
  EXECUTE 'SET LOCAL role TO postgres';
  RAISE NOTICE '✅ test_rls_isolation: PASSED';

  ------------------------------------------------------------
  -- 7. test_admin_rpc_auth
  ------------------------------------------------------------
  -- Mock user session again
  EXECUTE 'SET LOCAL request.jwt.claims TO ''{"sub": "' || v_normal_user || '"}'';';
  
  v_jsonb := log_admin_action_v2(v_normal_user, 'MOCK_ACTION');
  IF COALESCE((v_jsonb->>'success')::BOOLEAN, true) THEN
    RAISE EXCEPTION 'test_admin_rpc_auth FAILED: Normal user bypassed double gate';
  ELSIF v_jsonb->>'error' != 'Unauthorized' THEN
    RAISE EXCEPTION 'test_admin_rpc_auth FAILED: Expected Unauthorized but got %', v_jsonb->>'error';
  END IF;
  
  RAISE NOTICE '✅ test_admin_rpc_auth: PASSED';

  -- Reset
  EXECUTE 'SET LOCAL request.jwt.claims TO ''{"sub": "' || v_admin_user || '"}'';';

  ------------------------------------------------------------
  -- 8. test_wallet_atomicity (Check constaint negative guard)
  ------------------------------------------------------------
  v_jsonb := freeze_funds_v2(v_normal_user, 500000);
  IF COALESCE((v_jsonb->>'success')::BOOLEAN, true) THEN
    RAISE EXCEPTION 'test_wallet_atomicity FAILED: Allowed over-drain negative wallet state';
  END IF;
  RAISE NOTICE '✅ test_wallet_atomicity: PASSED';

  ------------------------------------------------------------
  -- 10. test_price_history (OHLC shape validation)
  ------------------------------------------------------------
  INSERT INTO price_history (market_id, price) VALUES 
    (v_market_id, 0.40), (v_market_id, 0.80), (v_market_id, 0.20), (v_market_id, 0.50);
    
  v_count := 0;
  SELECT COUNT(*) INTO v_count FROM get_price_history(v_market_id);
  IF v_count != 1 THEN RAISE EXCEPTION 'test_price_history FAILED: OHLC data invalid'; END IF;
  RAISE NOTICE '✅ test_price_history: PASSED';

  RAISE NOTICE '========================================';
  RAISE NOTICE '🏆 ALL 10 SMOKE TESTS COMPILED & PASSED';
  RAISE NOTICE '========================================';
END $$;
