-- ============================================================
-- SMOKE TESTS — pgTAP-style assertions for wrapper pattern
-- Verifies every wrapper correctly delegates to canonical v2/v3
-- This runs inside a TRANSACTION and ROLLBACKs (no side effects)
-- ============================================================

DO $$
DECLARE
  v_pass INT := 0;
  v_fail INT := 0;
  v_total INT := 0;
  v_test TEXT;
  v_result BOOLEAN;
  v_error TEXT;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  SMOKE TESTS — Wrapper Pattern Verification';
  RAISE NOTICE '═══════════════════════════════════════════';

  -- ── TEST 1: All canonical v2/v3 functions exist ──────────
  v_test := 'place_order_atomic_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'place_order_atomic_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'cancel_order_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'cancel_order_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'get_order_book_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_order_book_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'settle_market_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'settle_market_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'execute_trade_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'execute_trade_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'freeze_funds_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'freeze_funds_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'release_funds_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'release_funds_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'deposit_funds_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'deposit_funds_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'withdraw_funds_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'withdraw_funds_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'get_leaderboard_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_leaderboard_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'upsert_position_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'upsert_position_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'create_event_complete_v3 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_event_complete_v3');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'get_platform_stats_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_platform_stats_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'submit_oracle_verdict_v2 exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'submit_oracle_verdict_v2');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'get_price_history_ohlc exists';
  v_result := EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_price_history_ohlc');
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  -- ── TEST 2: All wrappers delegate to canonical versions ──
  -- Check that the function body contains the v2/v3 call
  v_test := 'place_order_atomic wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'place_order_atomic'
    AND pg_get_functiondef(p.oid) LIKE '%place_order_atomic_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'submit_order wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'submit_order'
    AND pg_get_functiondef(p.oid) LIKE '%place_order_atomic_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'cancel_order wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'cancel_order'
    AND pg_get_functiondef(p.oid) LIKE '%cancel_order_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'get_order_book wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_order_book'
    AND pg_get_functiondef(p.oid) LIKE '%get_order_book_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'settle_market wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'settle_market'
    AND pg_get_functiondef(p.oid) LIKE '%settle_market_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'freeze_funds wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'freeze_funds'
    AND pg_get_functiondef(p.oid) LIKE '%freeze_funds_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'unfreeze_funds wraps release_funds_v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'unfreeze_funds'
    AND pg_get_functiondef(p.oid) LIKE '%release_funds_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'credit_wallet wraps deposit_funds_v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'credit_wallet'
    AND pg_get_functiondef(p.oid) LIKE '%deposit_funds_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'debit_wallet wraps withdraw_funds_v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'debit_wallet'
    AND pg_get_functiondef(p.oid) LIKE '%withdraw_funds_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'get_platform_analytics wraps v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_platform_analytics'
    AND pg_get_functiondef(p.oid) LIKE '%get_platform_stats_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'update_position wraps upsert_position_v2';
  v_result := EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_position'
    AND pg_get_functiondef(p.oid) LIKE '%upsert_position_v2%'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  -- ── TEST 3: Return type consistency ──────────────────────
  v_test := 'All freeze_funds variants return JSONB';
  v_result := NOT EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname LIKE 'freeze_funds%'
    AND pg_get_function_result(p.oid) NOT IN ('jsonb', 'void')
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  v_test := 'All settle_market variants return JSONB';
  v_result := NOT EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname LIKE 'settle_market%'
    AND pg_get_function_result(p.oid) NOT IN ('jsonb', 'void')
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  -- ── TEST 4: No BOOLEAN return types on wallet functions ──
  v_test := 'No BOOLEAN wallet functions (should all be JSONB)';
  v_result := NOT EXISTS(
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN ('freeze_funds', 'unfreeze_funds', 'credit_wallet', 'debit_wallet', 'lock_wallet_funds')
    AND pg_get_function_result(p.oid) = 'boolean'
  );
  IF v_result THEN v_pass := v_pass + 1; RAISE NOTICE '✅ PASS: %', v_test;
  ELSE v_fail := v_fail + 1; RAISE NOTICE '❌ FAIL: %', v_test; END IF;
  v_total := v_total + 1;

  -- ── SUMMARY ──────────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  RESULTS: %/% passed, % failed', v_pass, v_total, v_fail;
  IF v_fail = 0 THEN
    RAISE NOTICE '  🎉 ALL TESTS PASSED!';
  ELSE
    RAISE NOTICE '  ⚠️  SOME TESTS FAILED — review wrapper chain';
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════';

END $$;
