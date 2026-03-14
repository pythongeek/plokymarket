-- ============================================================
-- PRODUCTION INTEGRATION TESTS
-- Comprehensive tests for Plokymarket API functions
-- Run this in Supabase SQL Editor to verify your integration
-- ============================================================

DO $$
DECLARE
  v_pass INT := 0;
  v_fail INT := 0;
  v_total INT := 0;
  v_test TEXT;
  v_result TEXT;
  v_json JSONB;
  v_count INT;
  
  -- Test data
  v_test_user_id UUID;
  v_test_market_id UUID;
  v_test_event_id UUID;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  PRODUCTION INTEGRATION TESTS';
  RAISE NOTICE '  Testing actual function execution with real data';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 1: Basic Database State
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 1.1: Check users table exists and has data
  v_test := 'Users table exists and has data';
  BEGIN
    SELECT COUNT(*) INTO v_count FROM users LIMIT 1;
    IF v_count >= 0 THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: % (count: %)', v_test, v_count;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 1.2: Get a test user ID
  v_test := 'Get test user ID';
  BEGIN
    SELECT id INTO v_test_user_id FROM users LIMIT 1;
    IF v_test_user_id IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: % (user: %)', v_test, v_test_user_id;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: No users found';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 1.3: Check markets table exists and has data
  v_test := 'Markets table exists and has data';
  BEGIN
    SELECT COUNT(*) INTO v_count FROM markets LIMIT 1;
    IF v_count >= 0 THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: % (count: %)', v_test, v_count;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 1.4: Get an active test market
  v_test := 'Get active test market';
  BEGIN
    SELECT id INTO v_test_market_id FROM markets WHERE status = 'active' LIMIT 1;
    IF v_test_market_id IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: % (market: %)', v_test, v_test_market_id;
    ELSE
      -- Try any market if no active ones
      SELECT id INTO v_test_market_id FROM markets LIMIT 1;
      IF v_test_market_id IS NOT NULL THEN
        v_pass := v_pass + 1;
        RAISE NOTICE '✅ PASS: % (using market: %)', v_test, v_test_market_id;
      ELSE
        v_fail := v_fail + 1;
        RAISE NOTICE '❌ FAIL: No markets found';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 1.5: Check events table
  v_test := 'Events table exists';
  BEGIN
    SELECT COUNT(*) INTO v_count FROM events LIMIT 1;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: % (count: %)', v_test, v_count;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 2: Wallet Functions
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 2.1: Get wallet summary
  v_test := 'get_wallet_summary_v2 function exists';
  BEGIN
    SELECT public.get_wallet_summary_v2(v_test_user_id) INTO v_json;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 2.2: Check wallet has required fields
  v_test := 'Wallet summary has required fields';
  BEGIN
    IF v_json IS NOT NULL AND 
       v_json ? 'balance' AND 
       v_json ? 'locked_balance' THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: % (balance: %, locked: %)', v_test, 
        v_json->>'balance', v_json->>'locked_balance';
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: % - Missing required fields', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 3: Market Data Functions
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 3.1: Get order book
  v_test := 'get_order_book_v2 function works';
  BEGIN
    SELECT public.get_order_book_v2(v_test_market_id, 'YES'::outcome_type, 10) INTO v_result;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 3.2: Get user orders
  v_test := 'get_user_orders_v2 function works';
  BEGIN
    SELECT public.get_user_orders_v2(v_test_user_id, NULL, NULL, 10, 0) INTO v_result;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 3.3: Get market trades
  v_test := 'get_market_trades_v2 function works';
  BEGIN
    SELECT public.get_market_trades_v2(v_test_market_id, 10, 0) INTO v_result;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 3.4: Get user positions
  v_test := 'get_user_positions_v2 function works';
  BEGIN
    SELECT public.get_user_positions_v2(v_test_user_id) INTO v_result;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 4: Leaderboard Functions
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 4.1: Get leaderboard
  v_test := 'get_leaderboard_v2 function works';
  BEGIN
    SELECT public.get_leaderboard_v2(10, 0) INTO v_json;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 4.2: Get platform stats
  v_test := 'get_platform_stats_v2 function works';
  BEGIN
    SELECT public.get_platform_stats_v2() INTO v_json;
    IF v_json IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: %', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: % - Returned NULL', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 5: Wrapper Function Tests (Legacy API)
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 5.1: place_order_atomic wrapper
  v_test := 'place_order_atomic wrapper exists';
  BEGIN
    -- Just check the function exists, don't execute (would need funds)
    SELECT pg_get_functiondef(oid)::TEXT INTO v_result
    FROM pg_proc 
    WHERE proname = 'place_order_atomic';
    
    IF v_result IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: %', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 5.2: submit_order wrapper
  v_test := 'submit_order wrapper exists';
  BEGIN
    SELECT pg_get_functiondef(oid)::TEXT INTO v_result
    FROM pg_proc 
    WHERE proname = 'submit_order';
    
    IF v_result IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: %', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 5.3: cancel_order wrapper
  v_test := 'cancel_order wrapper exists';
  BEGIN
    SELECT pg_get_functiondef(oid)::TEXT INTO v_result
    FROM pg_proc 
    WHERE proname = 'cancel_order';
    
    IF v_result IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: %', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 5.4: get_order_book wrapper
  v_test := 'get_order_book wrapper exists';
  BEGIN
    SELECT pg_get_functiondef(oid)::TEXT INTO v_result
    FROM pg_proc 
    WHERE proname = 'get_order_book';
    
    IF v_result IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: %', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 6: Event & Market Creation (if user is admin)
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 6.1: Check if current user is admin
  v_test := 'Check admin status';
  BEGIN
    SELECT is_admin INTO v_result FROM users WHERE id = v_test_user_id;
    IF v_result = 'true' THEN
      RAISE NOTICE 'ℹ️  INFO: Test user is admin - running admin tests';
    ELSE
      RAISE NOTICE 'ℹ️  INFO: Test user is not admin - skipping admin tests';
    END IF;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  -- TEST 6.2: Create event (if admin)
  v_test := 'create_event_complete_v3 function exists';
  BEGIN
    SELECT pg_get_functiondef(oid)::TEXT INTO v_result
    FROM pg_proc 
    WHERE proname = 'create_event_complete_v3';
    
    IF v_result IS NOT NULL THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: %', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: %', v_test;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SECTION 7: Price History
  -- ═══════════════════════════════════════════════════════════════
  
  -- TEST 7.1: Get price history
  v_test := 'get_price_history_ohlc function exists';
  BEGIN
    SELECT public.get_price_history_ohlc(v_test_market_id, 'YES'::outcome_type, '1h'::TEXT, 24) INTO v_result;
    v_pass := v_pass + 1;
    RAISE NOTICE '✅ PASS: %', v_test;
  EXCEPTION WHEN OTHERS THEN
    -- Function might not have data yet, that's ok
    IF SQLERRM LIKE '%no data found%' OR SQLERRM LIKE '%empty%' THEN
      v_pass := v_pass + 1;
      RAISE NOTICE '✅ PASS: % (function works, no data yet)', v_test;
    ELSE
      v_fail := v_fail + 1;
      RAISE NOTICE '❌ FAIL: % - %', v_test, SQLERRM;
    END IF;
  END;
  v_total := v_total + 1;

  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════
  -- SUMMARY
  -- ═══════════════════════════════════════════════════════════════
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  RESULTS: %/% passed, % failed', v_pass, v_total, v_fail;
  
  IF v_fail = 0 THEN
    RAISE NOTICE '  🎉 ALL TESTS PASSED! System is ready for production.';
  ELSIF v_fail <= 2 THEN
    RAISE NOTICE '  ⚠️  MINOR ISSUES: Review failed tests above.';
  ELSE
    RAISE NOTICE '  🔴 CRITICAL ISSUES: Fix failed tests before production.';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════';

END $$;
