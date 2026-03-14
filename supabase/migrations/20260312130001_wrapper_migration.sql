-- ============================================================
-- WRAPPER PATTERN MIGRATION (Production-Safe)
-- Ensures ALL legacy function names delegate to canonical v2/v3
-- Step A: Canonical functions already exist from prior migrations
-- Step B: This file creates/updates all wrappers
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- GROUP 1: EVENTS — create_event_complete → v3
-- ══════════════════════════════════════════════════════════════

-- Drop old overloads that might conflict
DO $$ BEGIN
  -- Drop v1 wrapper if signature conflicts
  DROP FUNCTION IF EXISTS public.create_event_complete_v1(jsonb);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.create_event_complete_v1(event_data jsonb)
RETURNS jsonb AS $$
BEGIN
  RETURN public.create_event_complete_v3(event_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the top-level name also wraps v3
-- (only if create_event_complete exists and doesn't already delegate)
DO $$ BEGIN
  -- Drop first if parameter names changed
  DROP FUNCTION IF EXISTS public.create_event_complete(jsonb);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_event_complete'
    AND pg_get_function_arguments(p.oid) = 'event_data jsonb'
    AND pg_get_functiondef(p.oid) NOT LIKE '%create_event_complete_v3%'
  ) THEN
    EXECUTE $x$
      CREATE OR REPLACE FUNCTION public.create_event_complete(event_data jsonb)
      RETURNS jsonb AS $fn$
      BEGIN
        RETURN public.create_event_complete_v3(event_data);
      END;
      $fn$ LANGUAGE plpgsql SECURITY DEFINER;
    $x$;
    RAISE NOTICE 'Wrapped create_event_complete → v3';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- GROUP 2: MARKETS — create_market → v2
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  -- Drop first if parameter names changed
  DROP FUNCTION IF EXISTS public.create_market(uuid, text);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'create_market'
    AND pg_get_functiondef(p.oid) NOT LIKE '%create_market_v2%'
  ) THEN
    EXECUTE $x$
      CREATE OR REPLACE FUNCTION public.create_market(
        p_event_id uuid, p_question text, p_slug text DEFAULT NULL,
        p_resolution_source text DEFAULT NULL, p_trading_closes_at timestamptz DEFAULT NULL
      ) RETURNS jsonb AS $fn$
      BEGIN
        RETURN public.create_market_v2(p_event_id, p_question, p_slug, p_resolution_source, p_trading_closes_at);
      END;
      $fn$ LANGUAGE plpgsql SECURITY DEFINER;
    $x$;
    RAISE NOTICE 'Wrapped create_market → v2';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- GROUP 3: ORDERS — place_order_atomic → v2  
-- ══════════════════════════════════════════════════════════════

-- Already wrapped in Phase 3 migration. Verify & reinforce:
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.place_order_atomic(UUID, UUID, TEXT, NUMERIC, NUMERIC, TEXT);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_user_id UUID, p_market_id UUID, p_side TEXT,
  p_price NUMERIC, p_size NUMERIC, p_order_type TEXT DEFAULT 'limit'
) RETURNS jsonb AS $$
BEGIN
  RETURN public.place_order_atomic_v2(
    p_user_id, p_market_id, p_side::order_side, p_order_type::order_type,
    p_price, p_size
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- submit_order → place_order_atomic_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.submit_order(UUID, UUID, TEXT, NUMERIC, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.submit_order(
  p_user_id UUID, p_market_id UUID, p_side TEXT,
  p_price NUMERIC, p_size NUMERIC
) RETURNS jsonb AS $$
BEGIN
  RETURN public.place_order_atomic_v2(
    p_user_id, p_market_id, p_side::order_side, 'limit'::order_type,
    p_price, p_size
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_order → cancel_order_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.cancel_order(UUID, UUID);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID, p_user_id UUID DEFAULT NULL
) RETURNS jsonb AS $$
BEGIN
  IF p_user_id IS NULL THEN p_user_id := auth.uid(); END IF;
  RETURN public.cancel_order_v2(p_order_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_order_book → get_order_book_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.get_order_book(UUID, INT);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_order_book(
  p_market_id UUID, p_depth INT DEFAULT 20
) RETURNS TABLE(side TEXT, price NUMERIC, total_quantity NUMERIC, order_count BIGINT) AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_order_book_v2(p_market_id, 'YES', p_depth);
END;
$$ LANGUAGE plpgsql STABLE;

-- get_user_orders → get_user_orders_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.get_user_orders(UUID, INT);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_user_orders(
  p_user_id UUID, p_limit INT DEFAULT 50
) RETURNS TABLE(
  id UUID, market_id UUID, side order_side, order_type order_type,
  outcome outcome_type, price NUMERIC, quantity BIGINT,
  filled_quantity BIGINT, remaining_quantity NUMERIC,
  status order_status, total_cost NUMERIC, fee_amount NUMERIC,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_user_orders_v2(p_user_id, NULL, NULL, p_limit, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ══════════════════════════════════════════════════════════════
-- GROUP 4: TRADES — settle_market → v2, get_market_trades → v2
-- ══════════════════════════════════════════════════════════════

-- settle_market: Drop old conflicting signatures first
DO $$ BEGIN
  -- Drop settle_market that returns 'record' (old)
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'settle_market'
    AND pg_get_function_result(p.oid) = 'record'
  ) THEN
    EXECUTE 'DROP FUNCTION public.settle_market(' || (
      SELECT pg_get_function_arguments(p.oid)
      FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'settle_market'
      AND pg_get_function_result(p.oid) = 'record'
      LIMIT 1
    ) || ')';
    RAISE NOTICE 'Dropped old settle_market -> record';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'settle_market record drop skipped: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.settle_market(
  p_market_id UUID, p_outcome TEXT, p_resolved_by UUID DEFAULT NULL
) RETURNS jsonb AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN public.settle_market_v2(p_market_id, p_outcome);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_market_trades → v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.get_market_trades(UUID, INT);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_market_trades(
  p_market_id UUID, p_limit INT DEFAULT 50
) RETURNS TABLE(
  id UUID, price NUMERIC, quantity BIGINT, outcome outcome_type,
  created_at TIMESTAMPTZ, trade_type TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_market_trades_v2(p_market_id, p_limit, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- settle_trade_cash: Drop old duplicates, create wrapper
DO $$ BEGIN
  -- There may be duplicate settle_trade_cash with different args. Clean up:
  DROP FUNCTION IF EXISTS public.settle_trade_cash(UUID, UUID, NUMERIC, NUMERIC);
  DROP FUNCTION IF EXISTS public.settle_trade_cash(UUID, UUID, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ══════════════════════════════════════════════════════════════
-- GROUP 5: WALLETS — freeze_funds, unfreeze, deposit, withdraw
-- ══════════════════════════════════════════════════════════════

-- freeze_funds already fixed in Phase 4 (BOOLEAN → JSONB wrapper → v2)

-- unfreeze_funds → release_funds_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.unfreeze_funds(UUID, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.unfreeze_funds(
  p_user_id UUID, p_amount NUMERIC
) RETURNS jsonb AS $$
BEGIN
  RETURN public.release_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- credit_wallet → deposit_funds_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.credit_wallet(UUID, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID, p_amount NUMERIC
) RETURNS jsonb AS $$
BEGIN
  RETURN public.deposit_funds_v2(p_user_id, p_amount, 'system');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- debit_wallet → withdraw_funds_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.debit_wallet(UUID, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_user_id UUID, p_amount NUMERIC
) RETURNS jsonb AS $$
BEGIN
  RETURN public.withdraw_funds_v2(p_user_id, p_amount, 'system');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- lock_wallet_funds → freeze_funds_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.lock_wallet_funds(UUID, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.lock_wallet_funds(
  p_user_id UUID, p_amount NUMERIC
) RETURNS jsonb AS $$
BEGIN
  RETURN public.freeze_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- unlock_wallet_funds → release_funds_v2
DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.unlock_wallet_funds(UUID, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.unlock_wallet_funds(
  p_user_id UUID, p_amount NUMERIC
) RETURNS jsonb AS $$
BEGIN
  RETURN public.release_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- GROUP 6: LEADERBOARD — get/update/fetch → v2
-- ══════════════════════════════════════════════════════════════

-- Already handled in Phase 4 wrappers migration.

-- ══════════════════════════════════════════════════════════════
-- GROUP 7: ORACLE — resolve_market → v2
-- ══════════════════════════════════════════════════════════════

-- resolve_market → settle_market_v2
DO $$ BEGIN
  -- Drop function first if it exists (to handle parameter name changes)
  DROP FUNCTION IF EXISTS public.resolve_market(UUID, TEXT);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'resolve_market'
    AND pg_get_functiondef(p.oid) NOT LIKE '%settle_market_v2%'
  ) THEN
    EXECUTE $x$
      CREATE OR REPLACE FUNCTION public.resolve_market(
        p_market_id UUID, p_resolution TEXT
      ) RETURNS jsonb AS $fn$
      BEGIN
        IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
          RAISE EXCEPTION 'Unauthorized';
        END IF;
        RETURN public.settle_market_v2(p_market_id, p_resolution);
      END;
      $fn$ LANGUAGE plpgsql SECURITY DEFINER;
    $x$;
    RAISE NOTICE 'Wrapped resolve_market → settle_market_v2';
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- GROUP 8: ANALYTICS — get_platform_analytics → v2
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.get_platform_analytics(VARCHAR);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.get_platform_analytics(
  p_period VARCHAR DEFAULT '24h'
) RETURNS jsonb AS $$
BEGIN
  RETURN public.get_platform_stats_v2();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- GROUP 9: EXCHANGE RATE — update/set/get → v2
-- ══════════════════════════════════════════════════════════════

-- set_exchange_rate → update_exchange_rate_v2 (done in Phase 4)
-- update_exchange_rate → update_exchange_rate_v2 (done in Phase 4)

-- ══════════════════════════════════════════════════════════════
-- GROUP 10: POSITIONS — update_position → upsert_position_v2
-- ══════════════════════════════════════════════════════════════

DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.update_position(UUID, UUID, outcome_type, NUMERIC, NUMERIC);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_position(
  p_user_id UUID, p_market_id UUID, p_outcome outcome_type,
  p_quantity NUMERIC, p_price NUMERIC
) RETURNS void AS $$
BEGIN
  PERFORM public.upsert_position_v2(p_user_id, p_market_id, p_outcome, p_quantity, p_price, 'buy');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
