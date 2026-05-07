--
-- PostgreSQL database dump
--

\restrict SnLQaDHJXx89a8anq7yrgxPlS2rr51edW858ztAGYUIRpErgYW2uZRgdMUnEEgl

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn'
);


--
-- Name: answer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.answer_type AS ENUM (
    'binary',
    'categorical',
    'scalar'
);


--
-- Name: kyc_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.kyc_status AS ENUM (
    'not_started',
    'pending',
    'approved',
    'rejected',
    'expired'
);


--
-- Name: margin_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.margin_event_type AS ENUM (
    'margin_check',
    'margin_call',
    'liquidation',
    'margin_deposit',
    'margin_withdrawal',
    'position_opened',
    'position_closed',
    'order_filled',
    'order_cancelled'
);


--
-- Name: margin_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.margin_status AS ENUM (
    'healthy',
    'warning',
    'critical',
    'liquidated'
);


--
-- Name: market_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.market_status AS ENUM (
    'active',
    'closed',
    'resolved',
    'cancelled',
    'draft',
    'paused',
    'disputed'
);


--
-- Name: oracle_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.oracle_status AS ENUM (
    'pending',
    'verified',
    'disputed',
    'finalized'
);


--
-- Name: order_activity_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_activity_action AS ENUM (
    'place',
    'cancel',
    'modify',
    'expire'
);


--
-- Name: order_side; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_side AS ENUM (
    'buy',
    'sell'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'open',
    'partially_filled',
    'filled',
    'cancelled',
    'OPEN',
    'CLOSED',
    'PARTIAL',
    'PENDING'
);


--
-- Name: order_tif; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_tif AS ENUM (
    'GTC',
    'IOC',
    'FOK',
    'GTD'
);


--
-- Name: order_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_type AS ENUM (
    'limit',
    'market',
    'LIMIT',
    'MARKET',
    'FOK',
    'IOC',
    'GTD'
);


--
-- Name: outcome_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.outcome_type AS ENUM (
    'YES',
    'NO'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'bkash',
    'nagad',
    'bank_transfer'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


--
-- Name: pmf_distribution_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pmf_distribution_status AS ENUM (
    'pending',
    'calculating',
    'completed',
    'failed'
);


--
-- Name: pmf_pool_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pmf_pool_status AS ENUM (
    'initializing',
    'active',
    'paused',
    'draining',
    'resolved',
    'failed'
);


--
-- Name: pmf_position_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pmf_position_status AS ENUM (
    'active',
    'partially_withdrawn',
    'fully_withdrawn',
    'claimed'
);


--
-- Name: settlement_strategy; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.settlement_strategy AS ENUM (
    'manual',
    'oracle',
    'ai',
    'uma'
);


--
-- Name: stp_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stp_mode AS ENUM (
    'none',
    'cancel_matching',
    'cancel_passive',
    'abort'
);


--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'trade_buy',
    'trade_sell',
    'settlement',
    'refund'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: pmf_liquidity_pools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pmf_liquidity_pools (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid,
    name text NOT NULL,
    description text,
    initial_liquidity numeric(20,8) DEFAULT 0,
    current_liquidity numeric(20,8) DEFAULT 0,
    total_shares numeric(20,8) DEFAULT 0,
    reserve0 numeric(20,8) DEFAULT 0,
    reserve1 numeric(20,8) DEFAULT 0,
    fee_rate numeric(5,4) DEFAULT 0.003,
    creator_id uuid,
    status public.pmf_pool_status DEFAULT 'initializing'::public.pmf_pool_status,
    pmf_vector jsonb DEFAULT '[]'::jsonb,
    outcome_distribution jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    activated_at timestamp with time zone,
    resolved_at timestamp with time zone,
    CONSTRAINT pmf_liquidity_pools_fee_rate_check CHECK (((fee_rate >= (0)::numeric) AND (fee_rate <= 0.1)))
);


--
-- Name: TABLE pmf_liquidity_pools; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pmf_liquidity_pools IS 'PMF (Probability Mass Function) liquidity pools for prediction markets';


--
-- Name: activate_pmf_pool(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.activate_pmf_pool(p_pool_id uuid) RETURNS public.pmf_liquidity_pools
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
BEGIN
    UPDATE public.pmf_liquidity_pools
    SET status = 'active', activated_at = NOW(), updated_at = NOW()
    WHERE id = p_pool_id AND status = 'initializing'
    RETURNING * INTO v_pool;
    
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found or already activated: %', p_pool_id;
    END IF;
    
    RETURN v_pool;
END;
$$;


--
-- Name: add_pmf_liquidity(uuid, uuid, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_pmf_liquidity(p_pool_id uuid, p_user_id uuid, p_amount0 numeric, p_amount1 numeric, p_min_shares numeric DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_shares_minted NUMERIC(20, 8);
    v_price0 NUMERIC(20, 8);
    v_price1 NUMERIC(20, 8);
    v_current_shares public.pmf_pool_shares;
BEGIN
    -- Get pool info with lock
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    IF v_pool.status != 'active' THEN
        RAISE EXCEPTION 'Pool is not active. Current status: %', v_pool.status;
    END IF;
    
    -- Calculate shares to mint based on constant product formula
    -- For PMF pools, we use a weighted average approach
    IF v_pool.total_shares = 0 THEN
        -- Initial liquidity: shares = amount0 + amount1
        v_shares_minted := p_amount0 + p_amount1;
    ELSE
        -- Subsequent: shares proportional to liquidity added
        v_shares_minted := LEAST(
            (p_amount0 * v_pool.total_shares) / NULLIF(v_pool.reserve0, 0),
            (p_amount1 * v_pool.total_shares) / NULLIF(v_pool.reserve1, 0)
        );
    END IF;
    
    IF v_shares_minted < p_min_shares THEN
        RAISE EXCEPTION 'Slippage too high. Minimum shares: %, Got: %', p_min_shares, v_shares_minted;
    END IF;
    
    -- Update pool reserves
    UPDATE public.pmf_liquidity_pools
    SET reserve0 = reserve0 + p_amount0,
        reserve1 = reserve1 + p_amount1,
        total_shares = total_shares + v_shares_minted,
        current_liquidity = current_liquidity + p_amount0 + p_amount1,
        updated_at = NOW()
    WHERE id = p_pool_id;
    
    -- Update or create user shares
    INSERT INTO public.pmf_pool_shares (pool_id, user_id, shares_count, liquidity_added, average_entry_price)
    VALUES (p_pool_id, p_user_id, v_shares_minted, p_amount0 + p_amount1, 
            CASE WHEN v_shares_minted > 0 THEN (p_amount0 + p_amount1) / v_shares_minted ELSE 0 END)
    ON CONFLICT (pool_id, user_id) DO UPDATE
    SET shares_count = pmf_pool_shares.shares_count + v_shares_minted,
        liquidity_added = pmf_pool_shares.liquidity_added + (p_amount0 + p_amount1),
        average_entry_price = (
            (pmf_pool_shares.shares_count * COALESCE(pmf_pool_shares.average_entry_price, 0) + v_shares_minted * ((p_amount0 + p_amount1) / v_shares_minted))
            / NULLIF(pmf_pool_shares.shares_count + v_shares_minted, 0)
        ),
        updated_at = NOW();
    
    -- Record the addition
    INSERT INTO public.pmf_liquidity_additions (pool_id, user_id, amount0, amount1, shares_minted, price0, price1)
    VALUES (p_pool_id, p_user_id, p_amount0, p_amount1, v_shares_minted,
            CASE WHEN p_amount0 > 0 THEN 1 ELSE NULL END,
            CASE WHEN p_amount1 > 0 THEN 1 ELSE NULL END);
    
    RETURN jsonb_build_object(
        'success', true,
        'shares_minted', v_shares_minted,
        'pool_id', p_pool_id,
        'user_id', p_user_id
    );
END;
$$;


--
-- Name: add_to_workflow_dlq(text, text, text, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_to_workflow_dlq(p_workflow_run_id text, p_error_message text, p_error_stack text DEFAULT NULL::text, p_failed_step character varying DEFAULT NULL::character varying) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.workflow_dlq (
        workflow_run_id, error_message, error_stack, failed_step, payload_snapshot
    )
    SELECT 
        p_workflow_run_id, p_error_message, p_error_stack, p_failed_step,
        COALESCE(payload, '{}'::jsonb)
    FROM public.upstash_workflow_runs
    WHERE workflow_run_id = p_workflow_run_id
    RETURNING id INTO v_id;
    
    UPDATE public.upstash_workflow_runs
    SET status = 'FAILED', error_message = p_error_message, updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
    
    RETURN v_id;
END;
$$;


--
-- Name: calculate_pmf_distribution(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_pmf_distribution(p_pool_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_market public.markets;
    v_winning_outcome outcome_type;
    v_distribution JSONB;
    v_share_record RECORD;
BEGIN
    -- Get pool and market info
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    SELECT * INTO v_market FROM public.markets WHERE id = v_pool.market_id;
    IF v_market IS NULL THEN
        RAISE EXCEPTION 'Market not found for pool: %', v_pool.market_id;
    END IF;
    
    IF v_market.status != 'resolved' THEN
        RAISE EXCEPTION 'Market is not resolved. Current status: %', v_market.status;
    END IF;
    
    v_winning_outcome := v_market.winning_outcome;
    
    -- Create distribution based on PMF vector and winning outcome
    v_distribution := jsonb_build_object(
        'winning_outcome', v_winning_outcome,
        'total_liquidity', v_pool.current_liquidity,
        'total_shares', v_pool.total_shares,
        'calculated_at', NOW(),
        'distributions', jsonb_build_object()
    );
    
    -- Calculate per-user distribution
    FOR v_share_record IN 
        SELECT user_id, shares_count 
        FROM public.pmf_pool_shares 
        WHERE pool_id = p_pool_id AND shares_count > 0
    LOOP
        -- User gets: (their_shares / total_shares) * total_liquidity
        -- But scaled by the PMF probability for the winning outcome
        UPDATE public.pmf_distributions
        SET total_distribution = (v_share_record.shares_count / v_pool.total_shares) * v_pool.current_liquidity,
            shares_count = v_share_record.shares_count,
            status = 'completed',
            distribution_details = jsonb_build_object(
                'winning_outcome', v_winning_outcome,
                'share_ratio', v_share_record.shares_count / v_pool.total_shares,
                'pmf_pool_total', v_pool.current_liquidity
            )
        WHERE pool_id = p_pool_id AND user_id = v_share_record.user_id;
        
        -- Insert if doesn't exist
        IF NOT FOUND THEN
            INSERT INTO public.pmf_distributions (pool_id, user_id, shares_count, total_distribution, status, distribution_details)
            VALUES (
                p_pool_id, 
                v_share_record.user_id, 
                v_share_record.shares_count,
                (v_share_record.shares_count / v_pool.total_shares) * v_pool.current_liquidity,
                'completed',
                jsonb_build_object(
                    'winning_outcome', v_winning_outcome,
                    'share_ratio', v_share_record.shares_count / v_pool.total_shares,
                    'pmf_pool_total', v_pool.current_liquidity
                )
            );
        END IF;
    END LOOP;
    
    -- Update pool status
    UPDATE public.pmf_liquidity_pools
    SET status = 'resolved',
        resolved_at = NOW(),
        outcome_distribution = v_distribution,
        updated_at = NOW()
    WHERE id = p_pool_id;
    
    RETURN v_distribution;
END;
$$;


--
-- Name: cancel_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancel_order(p_order_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order RECORD;
    v_unfilled BIGINT;
BEGIN
    SELECT * INTO v_order FROM public.order_book
    WHERE id = p_order_id AND user_id = p_user_id AND status IN ('open', 'partially_filled')
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_unfilled := v_order.size - v_order.filled;

    -- Record activity
    INSERT INTO public.order_activity (order_id, user_id, market_id, action, price, size, reason)
    VALUES (p_order_id, p_user_id, v_order.market_id, 'cancel', v_order.price, v_unfilled, 'User requested');

    -- Update status
    UPDATE public.order_book SET status = 'cancelled', updated_at = now()
    WHERE id = p_order_id;

    -- Unfreeze funds for buy orders
    IF v_order.side = 'buy' AND v_unfilled > 0 THEN
        PERFORM public.unfreeze_funds(p_user_id, v_order.price * v_unfilled / 1000000.0);
    END IF;

    RETURN true;
END;
$$;


--
-- Name: cancel_order_atomic(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cancel_order_atomic(p_order_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD;
    v_unfilled BIGINT;
BEGIN
    SELECT * INTO v_order FROM public.orders
    WHERE id = p_order_id AND user_id = p_user_id AND status IN ('open', 'partially_filled')
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    v_unfilled := v_order.quantity - v_order.filled_quantity;

    UPDATE public.orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;

    IF v_order.side = 'buy' AND v_unfilled > 0 THEN
        UPDATE public.wallets
        SET locked_balance = GREATEST(0, locked_balance - (v_order.price * v_unfilled / 1000000.0)),
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;

    RETURN true;
END;
$$;


--
-- Name: check_circuit_breaker(uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_circuit_breaker(p_market_id uuid, p_new_price numeric) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_last_trade_price NUMERIC;
    v_price_change NUMERIC;
    v_threshold NUMERIC := 0.10; -- 10% circuit breaker
    v_recent_trades INTEGER;
BEGIN
    -- Get last trade price
    SELECT price INTO v_last_trade_price
    FROM public.fill_records
    WHERE market_id = p_market_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Count recent trades (last 60 seconds)
    SELECT COUNT(*) INTO v_recent_trades
    FROM public.fill_records
    WHERE market_id = p_market_id
      AND created_at > NOW() - INTERVAL '60 seconds';

    -- If too many trades in short period, might be manipulation
    IF v_recent_trades > 100 THEN
        RETURN true; -- circuit breaker triggered
    END IF;

    IF v_last_trade_price IS NOT NULL AND v_last_trade_price > 0 THEN
        v_price_change := ABS(p_new_price - v_last_trade_price) / v_last_trade_price;
        IF v_price_change > v_threshold THEN
            RETURN true; -- price moved more than 10%
        END IF;
    END IF;

    RETURN false;
END;
$$;


--
-- Name: check_conditional_orders_for_market(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_conditional_orders_for_market(p_market_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_current_price NUMERIC;
    v_order RECORD;
    v_triggered_count INT := 0;
BEGIN
    -- Get current market price from most recent trade
    SELECT INTO v_current_price
        COALESCE(
            (SELECT price FROM trades WHERE market_id = p_market_id ORDER BY created_at DESC LIMIT 1),
            0.5
        );

    -- Find active orders to trigger
    FOR v_order IN
        SELECT co.*, u.id as owner_id
        FROM conditional_orders co
        JOIN auth.users u ON u.id = co.user_id
        WHERE co.market_id = p_market_id
          AND co.status = 'active'
          AND (
              (co.type = 'stop_loss' AND co.trigger_price >= v_current_price) OR
              (co.type = 'stop_win' AND co.trigger_price <= v_current_price) OR
              (co.type = 'take_profit' AND co.trigger_price <= v_current_price)
          )
          AND (co.expires_at IS NULL OR co.expires_at > NOW())
    LOOP
        -- Mark as triggered
        UPDATE conditional_orders
        SET status = 'triggered', triggered_at = NOW()
        WHERE id = v_order.id;

        -- Log trigger (actual order execution would happen via matching engine)
        INSERT INTO activity_feed (user_id, activity_type, metadata)
        VALUES (
            v_order.user_id,
            'conditional_order_triggered',
            jsonb_build_object(
                'order_id', v_order.id,
                'market_id', p_market_id,
                'type', v_order.type,
                'trigger_price', v_order.trigger_price,
                'executed_price', v_current_price
            )
        );

        v_triggered_count := v_triggered_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'market_id', p_market_id,
        'current_price', v_current_price,
        'triggered_count', v_triggered_count
    );
END;
$$;


--
-- Name: FUNCTION check_conditional_orders_for_market(p_market_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_conditional_orders_for_market(p_market_id uuid) IS 'Check active conditional orders for a market and trigger those whose price conditions are met.
 Called by the check-conditional-orders cron endpoint.';


--
-- Name: claim_pmf_distribution(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.claim_pmf_distribution(p_pool_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_distribution public.pmf_distributions;
    v_pool public.pmf_liquidity_pools;
    v_claimable_amount NUMERIC(20, 8);
BEGIN
    -- Get distribution
    SELECT * INTO v_distribution 
    FROM public.pmf_distributions 
    WHERE pool_id = p_pool_id AND user_id = p_user_id 
    FOR UPDATE;
    
    IF v_distribution IS NULL THEN
        RAISE EXCEPTION 'No distribution found for user in this pool';
    END IF;
    
    IF v_distribution.status != 'completed' THEN
        RAISE EXCEPTION 'Distribution is not completed. Status: %', v_distribution.status;
    END IF;
    
    v_claimable_amount := v_distribution.total_distribution - v_distribution.claimed_amount;
    
    IF v_claimable_amount <= 0 THEN
        RAISE EXCEPTION 'Nothing to claim. Already claimed: %', v_distribution.claimed_amount;
    END IF;
    
    -- Mark as claimed
    UPDATE public.pmf_distributions
    SET claimed_amount = total_distribution,
        status = 'claimed',
        claimed_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_user_id;
    
    -- Update user position status
    UPDATE public.pmf_pool_shares
    SET status = 'claimed',
        updated_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'pool_id', p_pool_id,
        'user_id', p_user_id,
        'amount_claimed', v_claimable_amount
    );
END;
$$;


--
-- Name: create_event_complete(jsonb, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_event_complete(p_event_data jsonb, p_creator_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_market_id          UUID;
  v_slug               TEXT;
  v_question           TEXT;
  v_title              TEXT;
  v_description        TEXT;
  v_category           TEXT;
  v_event_date         TIMESTAMPTZ;
  v_trading_closes     TIMESTAMPTZ;
  v_initial_liq        NUMERIC;
  v_resolution_method  TEXT;
  v_answer_type        TEXT;
  v_tags               JSONB;
  v_source_url         TEXT;
  v_image_url          TEXT;
  v_is_featured        BOOLEAN;
  v_result             JSONB;
BEGIN
  -- Extract fields safely
  v_title             := COALESCE(TRIM(p_event_data->>'title'), 'Untitled Event');
  v_question          := COALESCE(TRIM(p_event_data->>'question'), v_title);
  v_description       := COALESCE(TRIM(p_event_data->>'description')::TEXT, '');
  v_category          := COALESCE(LOWER(TRIM(p_event_data->>'category')), 'general');
  v_tags              := COALESCE(p_event_data->'tags', '[]'::jsonb);
  v_source_url        := COALESCE(TRIM(p_event_data->>'source_url')::TEXT, '');
  v_image_url         := COALESCE(TRIM(p_event_data->>'image_url')::TEXT, '');
  v_answer_type       := COALESCE(LOWER(TRIM(p_event_data->>'answer_type')), 'binary');
  v_initial_liq       := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
  v_resolution_method := COALESCE(TRIM(p_event_data->>'resolution_method'), 'manual_admin');
  v_is_featured       := COALESCE((p_event_data->>'is_featured')::BOOLEAN, false);

  -- Parse dates safely
  BEGIN v_event_date := (p_event_data->>'event_date')::TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN v_event_date := NULL; END;

  BEGIN
    v_trading_closes := (p_event_data->>'trading_closes_at')::TIMESTAMPTZ;
    IF v_trading_closes IS NULL THEN v_trading_closes := NOW() + INTERVAL '30 days'; END IF;
  EXCEPTION WHEN OTHERS THEN v_trading_closes := NOW() + INTERVAL '30 days'; END;

  -- Generate slug
  IF TRIM(COALESCE(p_event_data->>'slug', '')) != '' THEN
    v_slug := LOWER(TRIM(BOTH '-' FROM regexp_replace(p_event_data->>'slug', '[^a-zA-Z0-9-]', '-', 'g')));
  ELSE
    v_slug := LOWER(TRIM(BOTH '-' FROM regexp_replace(regexp_replace(v_title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')));
  END IF;

  -- Uniquify slug
  IF EXISTS (SELECT 1 FROM markets WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6);
  END IF;

  -- SINGLE TABLE INSERT (industry standard)
  INSERT INTO markets (
    question, name, question_bn,
    description, category, image_url, source_url,
    creator_id, status,
    trading_closes_at, event_date,
    slug, tags, answer_type,
    -- Event metadata columns (unified architecture)
    event_title, event_description, event_tags, event_answer_type,
    event_source_url, event_slug, event_category,
    -- Price/financial
    min_price, max_price, tick_size,
    fee_percent, initial_liquidity, maker_rebate_percent,
    total_volume, liquidity,
    is_featured, market_type, resolution_method, resolution_delay_hours,
    created_at, updated_at
  ) VALUES (
    v_question,
    v_title, NULL,
    v_description,
    v_category,
    v_image_url,
    v_source_url,
    p_creator_id,
    'active'::market_status,
    v_trading_closes,
    v_event_date,
    v_slug,
    NULL,                   -- tags: text[] on markets (not used, event_tags is canonical)
    v_answer_type,
    -- Event metadata — stored on the market row itself
    v_title,               -- event_title
    v_description,         -- event_description
    v_tags,                -- event_tags (JSONB)
    v_answer_type,         -- event_answer_type
    v_source_url,          -- event_source_url
    v_slug,                -- event_slug
    v_category,            -- event_category
    -- Financial defaults
    0.0001,
    0.9999,
    0.01,
    0.02,
    v_initial_liq,
    0.01,
    0,
    v_initial_liq,
    v_is_featured,
    'binary',
    v_resolution_method,
    24,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_market_id;

  RETURN JSONB_BUILD_OBJECT(
    'success',   TRUE,
    'market_id', v_market_id,
    'slug',      v_slug,
    'message',   'Market created successfully — unified single-table architecture'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN JSONB_BUILD_OBJECT(
    'success', FALSE,
    'market_id', NULL,
    'slug',     NULL,
    'message',  SQLERRM
  );
END;
$$;


--
-- Name: deposit_margin(uuid, numeric, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deposit_margin(p_user_id uuid, p_amount numeric, p_source character varying DEFAULT 'deposit'::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_wallet_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Get current balance
    SELECT balance INTO v_wallet_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    v_new_balance := v_wallet_balance + p_amount;

    -- Update balance
    UPDATE wallets
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log the deposit
    INSERT INTO margin_history (user_id, event_type, margin_before, margin_after, pnl_realized, notes)
    VALUES (
        p_user_id,
        'margin_deposit',
        v_wallet_balance,
        v_new_balance,
        0,
        jsonb_build_object('source', p_source, 'amount', p_amount)
    );

    RETURN TRUE;
END;
$$;


--
-- Name: freeze_funds(uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.freeze_funds(p_user_id uuid, p_amount numeric) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_balance NUMERIC;
    v_frozen NUMERIC;
    v_available NUMERIC;
BEGIN
    -- Get wallet balance
    SELECT COALESCE(w.balance, 0), COALESCE(w.locked_balance, 0)
    INTO v_balance, v_frozen
    FROM public.wallets w WHERE w.user_id = p_user_id FOR UPDATE;

    v_available := v_balance - v_frozen;

    IF v_available < p_amount THEN
        RETURN false;
    END IF;

    -- Increase locked amount
    UPDATE public.wallets
    SET locked_balance = locked_balance + p_amount, updated_at = now()
    WHERE user_id = p_user_id;

    RETURN true;
END;
$$;


--
-- Name: get_admin_events(text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_events(p_status text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, title text, question text, description text, category text, subcategory text, tags jsonb, slug text, status public.market_status, is_featured boolean, trading_closes_at timestamp with time zone, event_date timestamp with time zone, total_volume bigint, liquidity bigint, current_yes_price numeric, current_no_price numeric, unique_traders bigint, volume_24h bigint, resolution_method text, resolved_at timestamp with time zone, winning_outcome text, event_id uuid, creator_id uuid, event_title text, event_slug text, event_category text, event_answer_type text, event_description text, event_source_url text, event_tags jsonb, created_at timestamp with time zone, answer_type text, source_url text, image_url text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    COALESCE(m.event_title, m.question, m.name)::TEXT      AS title,
    m.question,
    COALESCE(m.event_description, m.description)::TEXT    AS description,
    COALESCE(m.event_category, m.category)::TEXT          AS category,
    m.subcategory,
    COALESCE(m.event_tags, m.tags, '[]'::jsonb)          AS tags,
    m.slug,
    m.status,
    m.is_featured,
    m.trading_closes_at,
    m.event_date,
    COALESCE(m.total_volume, 0)::BIGINT                  AS total_volume,
    COALESCE(m.liquidity, m.initial_liquidity, 0)::BIGINT AS liquidity,
    COALESCE(m.current_price_yes, m.yes_price, 0.5)::NUMERIC AS current_yes_price,
    COALESCE(m.current_price_no, m.no_price, 0.5)::NUMERIC  AS current_no_price,
    COALESCE(m.unique_traders, 0)::BIGINT               AS unique_traders,
    COALESCE(m.volume_24h, 0)::BIGINT                    AS volume_24h,
    m.resolution_method,
    m.resolved_at,
    m.winning_outcome,
    m.event_id,
    m.creator_id,
    m.event_title,
    m.event_slug,
    m.event_category,
    m.event_answer_type,
    m.event_description,
    m.event_source_url,
    COALESCE(m.event_tags, m.tags, '[]'::jsonb)        AS event_tags,
    m.created_at,
    m.event_answer_type::TEXT                            AS answer_type,
    m.event_source_url                                   AS source_url,
    m.image_url
  FROM markets m
  WHERE
    (p_status IS NULL OR m.status = p_status::market_status)
    AND (p_category IS NULL OR COALESCE(m.event_category, m.category) = p_category)
    AND (
      p_search IS NULL OR
      COALESCE(m.event_title, m.question, m.name) ILIKE '%' || p_search || '%' OR
      m.question ILIKE '%' || p_search || '%' OR
      m.slug ILIKE '%' || p_search || '%'
    )
  ORDER BY m.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


--
-- Name: get_current_user_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_user_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'user_id', '')::UUID;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$;


--
-- Name: get_market_depth(uuid, public.outcome_type, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_market_depth(p_market_id uuid, p_outcome public.outcome_type DEFAULT 'YES'::public.outcome_type, p_depth integer DEFAULT 20) RETURNS TABLE(side public.order_side, price numeric, total_quantity bigint, order_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT o.side, o.price,
           SUM(o.quantity - o.filled_quantity) AS total_quantity,
           COUNT(*) AS order_count
    FROM public.orders o
    WHERE o.market_id = p_market_id
      AND o.outcome = p_outcome
      AND o.status IN ('open', 'partially_filled')
    GROUP BY o.side, o.price
    HAVING SUM(o.quantity - o.filled_quantity) > 0
    ORDER BY o.side, o.price DESC
    LIMIT p_depth;
END;
$$;


--
-- Name: get_market_maker_rebates(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_market_maker_rebates(p_market_id uuid) RETURNS TABLE(maker_id uuid, total_rebate numeric, trade_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT maker_id, COALESCE(SUM(maker_rebate_amount), 0), COUNT(*)
    FROM public.trades
    WHERE market_id = p_market_id
      AND maker_id IS NOT NULL
      AND maker_rebate_amount > 0
    GROUP BY maker_id;
END;
$$;


--
-- Name: get_market_prices(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_market_prices(p_market_id uuid) RETURNS TABLE(yes_price numeric, no_price numeric, yes_volume bigint, no_volume bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH yes_orders AS (
        SELECT 
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_yes_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_yes_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id 
            AND outcome = 'YES'
            AND status IN ('open', 'partially_filled')
    ),
    no_orders AS (
        SELECT 
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_no_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_no_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as no_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as no_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id 
            AND outcome = 'NO'
            AND status IN ('open', 'partially_filled')
    )
    SELECT 
        CASE 
            WHEN y.best_yes_ask > 0 THEN LEAST(y.best_yes_ask, 1 - COALESCE(n.best_no_bid, 0))
            ELSE 0.5
        END as yes_price,
        CASE 
            WHEN n.best_no_ask > 0 THEN LEAST(n.best_no_ask, 1 - COALESCE(y.best_yes_bid, 0))
            ELSE 0.5
        END as no_price,
        COALESCE(y.yes_buy_volume, 0) + COALESCE(y.yes_sell_volume, 0) as yes_volume,
        COALESCE(n.no_buy_volume, 0) + COALESCE(n.no_sell_volume, 0) as no_volume
    FROM yes_orders y, no_orders n;
END;
$$;


--
-- Name: get_order_book_depth(uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_order_book_depth(p_market_id uuid, p_depth integer DEFAULT 10) RETURNS TABLE(side public.order_side, price numeric, total_size bigint, order_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT ob.side, ob.price, SUM(ob.size - ob.filled) AS total_size, COUNT(*) AS order_count
    FROM public.order_book ob
    WHERE ob.market_id = p_market_id
      AND ob.status IN ('open', 'partially_filled')
    GROUP BY ob.side, ob.price
    HAVING SUM(ob.size - ob.filled) > 0
    ORDER BY ob.side, ob.price DESC
    LIMIT p_depth;
END;
$$;


--
-- Name: get_orderbook(uuid, public.outcome_type, public.order_side); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_orderbook(p_market_id uuid, p_outcome public.outcome_type, p_side public.order_side) RETURNS TABLE(price numeric, quantity bigint, total bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.price,
        SUM(o.quantity - o.filled_quantity)::BIGINT as quantity,
        SUM((o.quantity - o.filled_quantity) * o.price)::BIGINT as total
    FROM public.orders o
    WHERE o.market_id = p_market_id
        AND o.outcome = p_outcome
        AND o.side = p_side
        AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY 
        CASE WHEN p_side = 'buy' THEN o.price END DESC,
        CASE WHEN p_side = 'sell' THEN o.price END ASC;
END;
$$;


--
-- Name: get_pmf_pool_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_pmf_pool_stats(p_pool_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_participant_count BIGINT;
    v_total_fees NUMERIC(20, 8);
BEGIN
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    SELECT COUNT(*) INTO v_participant_count 
    FROM public.pmf_pool_shares 
    WHERE pool_id = p_pool_id AND shares_count > 0;
    
    SELECT COALESCE(SUM(fee_amount), 0) INTO v_total_fees
    FROM public.pmf_accrued_fees
    WHERE pool_id = p_pool_id;
    
    RETURN jsonb_build_object(
        'pool_id', p_pool_id,
        'market_id', v_pool.market_id,
        'name', v_pool.name,
        'status', v_pool.status,
        'current_liquidity', v_pool.current_liquidity,
        'total_shares', v_pool.total_shares,
        'reserve0', v_pool.reserve0,
        'reserve1', v_pool.reserve1,
        'fee_rate', v_pool.fee_rate,
        'participant_count', v_participant_count,
        'total_accrued_fees', v_total_fees,
        'created_at', v_pool.created_at,
        'activated_at', v_pool.activated_at,
        'resolved_at', v_pool.resolved_at
    );
END;
$$;


--
-- Name: get_user_maker_rebates(uuid, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_maker_rebates(p_user_id uuid, p_start_date timestamp with time zone DEFAULT date_trunc('month'::text, now()), p_end_date timestamp with time zone DEFAULT now()) RETURNS TABLE(total_rebate numeric, trade_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT COALESCE(SUM(maker_rebate_amount), 0), COUNT(*)
    FROM public.trades
    WHERE maker_id = p_user_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date;
END;
$$;


--
-- Name: get_user_pmf_positions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_pmf_positions(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_positions JSONB;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'pool_id', ps.pool_id,
        'pool_name', pp.name,
        'market_id', pp.market_id,
        'shares_count', ps.shares_count,
        'liquidity_added', ps.liquidity_added,
        'average_entry_price', ps.average_entry_price,
        'realized_pnl', ps.realized_pnl,
        'pending_distribution', ps.pending_distribution,
        'status', ps.status,
        'current_liquidity', pp.current_liquidity,
        'total_shares', pp.total_shares,
        'share_ratio', CASE WHEN pp.total_shares > 0 THEN ps.shares_count / pp.total_shares ELSE 0 END
    ))
    INTO v_positions
    FROM public.pmf_pool_shares ps
    JOIN public.pmf_liquidity_pools pp ON ps.pool_id = pp.id
    WHERE ps.user_id = p_user_id;
    
    RETURN COALESCE(v_positions, '[]'::jsonb);
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.wallets (user_id, balance, locked_balance)
    VALUES (NEW.id, 1000, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


--
-- Name: increment_filled(uuid, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_filled(p_order_id uuid, p_amount bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.order_book
    SET filled = LEAST(filled + p_amount, size),
        status = CASE WHEN filled + p_amount >= size THEN 'filled' ELSE 'partially_filled' END,
        updated_at = now()
    WHERE id = p_order_id;
END;
$$;


--
-- Name: is_admin_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_user() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE uid UUID;
BEGIN
    uid := public.get_current_user_id();
    IF uid IS NULL THEN RETURN FALSE; END IF;
    RETURN EXISTS (SELECT 1 FROM users WHERE id = uid AND is_admin = TRUE);
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$;


--
-- Name: liquidate_position(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.liquidate_position(p_user_id uuid, p_market_id uuid, p_admin_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_position RECORD;
    v_market RECORD;
    v_wallet_balance NUMERIC;
    v_liquidation_price NUMERIC;
    v_loss NUMERIC;
BEGIN
    -- Get position to liquidate
    SELECT * INTO v_position
    FROM positions
    WHERE user_id = p_user_id AND market_id = p_market_id AND quantity > 0;

    IF v_position IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Position not found');
    END IF;

    -- Get market data
    SELECT * INTO v_market FROM markets WHERE id = p_market_id;

    -- Get wallet balance
    SELECT balance INTO v_wallet_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;

    -- Calculate liquidation at current price (or 0.5 if not set)
    v_liquidation_price := COALESCE(
        CASE WHEN v_position.outcome = 'YES' THEN v_market.current_yes_price ELSE v_market.current_no_price END,
        0.5
    );

    -- Calculate loss
    v_loss := v_position.quantity * (v_position.average_price - v_liquidation_price);

    -- Close position at current market price
    UPDATE positions
    SET quantity = 0,
        realized_pnl = realized_pnl + v_loss,
        updated_at = NOW()
    WHERE id = v_position.id;

    -- Log liquidation
    INSERT INTO margin_history (user_id, market_id, event_type, margin_before, margin_after, pnl_realized, notes)
    VALUES (
        p_user_id,
        p_market_id,
        'liquidation',
        v_wallet_balance,
        v_wallet_balance + v_loss,
        v_loss,
        jsonb_build_object('admin_id', p_admin_id, 'liquidation_price', v_liquidation_price, 'loss', v_loss)
    );

    RETURN jsonb_build_object(
        'success', true,
        'liquidation_price', v_liquidation_price,
        'loss', v_loss,
        'new_balance', v_wallet_balance + v_loss
    );
END;
$$;


--
-- Name: lock_margin_for_order(uuid, uuid, uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.lock_margin_for_order(p_user_id uuid, p_order_id uuid, p_market_id uuid, p_margin_amount numeric) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_wallet_balance NUMERIC;
    v_locked_balance NUMERIC;
    v_available NUMERIC;
BEGIN
    -- Get current wallet state
    SELECT balance, locked_balance INTO v_wallet_balance, v_locked_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    v_available := v_wallet_balance - v_locked_balance;

    -- Check if enough margin is available
    IF v_available < p_margin_amount THEN
        RAISE EXCEPTION 'Insufficient margin';
    END IF;

    -- Lock the margin
    UPDATE wallets
    SET locked_balance = locked_balance + p_margin_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record the lock
    INSERT INTO margin_locks (user_id, order_id, market_id, amount, status)
    VALUES (p_user_id, p_order_id, p_market_id, p_margin_amount, 'active');

    -- Log the event
    INSERT INTO margin_history (user_id, market_id, order_id, event_type, notes)
    VALUES (p_user_id, p_market_id, p_order_id, 'margin_check', 
            jsonb_build_object('action', 'lock', 'amount', p_margin_amount));

    RETURN TRUE;
END;
$$;


--
-- Name: log_conditional_order_created(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_conditional_order_created() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO admin_audit_log (admin_id, action, resource, metadata)
    VALUES (
        NEW.user_id,
        'conditional_order_created',
        'conditional_orders',
        jsonb_build_object(
            'order_id', NEW.id,
            'market_id', NEW.market_id,
            'type', NEW.type,
            'trigger_price', NEW.trigger_price,
            'quantity', NEW.quantity
        )
    );
    RETURN NEW;
END;
$$;


--
-- Name: log_conditional_order_triggered(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_conditional_order_triggered() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.status = 'triggered' AND OLD.status = 'active' THEN
        INSERT INTO admin_audit_log (admin_id, action, resource, metadata)
        VALUES (
            NEW.user_id,
            'conditional_order_triggered',
            'conditional_orders',
            jsonb_build_object(
                'order_id', NEW.id,
                'market_id', NEW.market_id,
                'triggered_at', NEW.triggered_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: match_order(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.match_order(p_order_id uuid) RETURNS TABLE(matched boolean, trades_created integer, remaining_quantity bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order RECORD;
    v_match RECORD;
    v_trade_quantity BIGINT;
    v_trade_price NUMERIC(5, 4);
    v_trades_count INT := 0;
    v_remaining BIGINT;
    v_maker_id UUID;
    v_maker_rebate_amount NUMERIC(12, 4);
    v_maker_rebate_percent NUMERIC(5, 2);
    v_is_maker_order BOOLEAN;
BEGIN
    -- Lock and get the order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;
    
    IF NOT FOUND OR v_order.status NOT IN ('open', 'partially_filled') THEN
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT;
        RETURN;
    END IF;
    
    -- Get maker rebate percent from market
    SELECT maker_rebate_percent INTO v_maker_rebate_percent
    FROM public.markets
    WHERE id = v_order.market_id;
    
    -- Default to 0 if not found
    v_maker_rebate_percent := COALESCE(v_maker_rebate_percent, 0);
    
    v_remaining := v_order.quantity - v_order.filled_quantity;
    
    WHILE v_remaining > 0 LOOP
        IF v_order.side = 'buy' THEN
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND (
                  (side = 'sell' AND outcome = v_order.outcome AND price <= v_order.price)
                  OR
                  (side = 'buy' 
                   AND outcome != v_order.outcome 
                   AND (price + v_order.price) <= 1.00)
              )
            ORDER BY 
              CASE 
                WHEN side = 'sell' THEN price
                ELSE (1.00 - price)
              END ASC,
              created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        ELSE
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND side = 'buy'
              AND outcome = v_order.outcome
              AND price >= v_order.price
            ORDER BY price DESC, created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        END IF;
        
        EXIT WHEN NOT FOUND;
        
        v_trade_quantity := LEAST(v_remaining, v_match.quantity - v_match.filled_quantity);
        
        IF v_order.created_at < v_match.created_at THEN
            v_trade_price := v_order.price;
            v_is_maker_order := TRUE;
            v_maker_id := v_order.user_id;
        ELSE
            v_trade_price := v_match.price;
            v_is_maker_order := FALSE;
            v_maker_id := v_match.user_id;
        END IF;
        
        -- Calculate maker rebate amount
        v_maker_rebate_amount := v_trade_quantity * v_trade_price * v_maker_rebate_percent;
        
        -- Create trade with maker rebate tracking
        INSERT INTO public.trades (
            market_id, buy_order_id, sell_order_id, outcome,
            price, quantity, buyer_id, seller_id,
            maker_id, maker_rebate_amount
        ) VALUES (
            v_order.market_id,
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_order.outcome,
            v_trade_price,
            v_trade_quantity,
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END,
            v_maker_id,
            v_maker_rebate_amount
        );
        
        -- Update orders
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END
        WHERE id = v_order.id;
        
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END
        WHERE id = v_match.id;
        
        -- Update positions
        PERFORM update_position(
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, v_order.outcome, v_trade_quantity, v_trade_price
        );
        
        PERFORM update_position(
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, v_order.outcome, -v_trade_quantity, v_trade_price
        );
        
        -- Process settlement
        PERFORM process_trade_settlement(
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_trade_quantity, v_trade_price
        );
        
        v_remaining := v_remaining - v_trade_quantity;
        v_trades_count := v_trades_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_trades_count > 0, v_trades_count, v_remaining;
END;
$$;


--
-- Name: place_and_match(uuid, uuid, public.order_side, numeric, bigint, public.order_type, public.order_tif, boolean, public.stp_mode); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.place_and_match(p_market_id uuid, p_user_id uuid, p_side public.order_side, p_price numeric, p_size bigint, p_order_type public.order_type DEFAULT 'limit'::public.order_type, p_time_in_force public.order_tif DEFAULT 'GTC'::public.order_tif, p_post_only boolean DEFAULT false, p_stp_flag public.stp_mode DEFAULT 'none'::public.stp_mode) RETURNS TABLE(order_id uuid, fills jsonb, fill_count integer, total_filled bigint, avg_price numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order_id UUID;
    v_fill_count INTEGER := 0;
    v_fills JSONB := '[]'::JSONB;
    v_total_filled BIGINT := 0;
    v_avg_price NUMERIC := 0;
    v_remaining_size BIGINT := p_size;
    v_counterparty RECORD;
    v_trade_price NUMERIC;
    v_trade_size BIGINT;
    v_opposite_side order_side;
    v_market_status market_status;
    v_is_crossed BOOLEAN := false;
    v_prev_best_bid NUMERIC;
    v_prev_best_ask NUMERIC;
    v_inversion_fee NUMERIC;
    v_trade_num BIGINT;
    v_unfilled BIGINT;
BEGIN
    -- Check market is active
    SELECT status INTO v_market_status FROM public.markets WHERE id = p_market_id FOR UPDATE;
    IF v_market_status != 'active' THEN
        RAISE EXCEPTION 'Market is not active: %', v_market_status;
    END IF;

    v_opposite_side := CASE WHEN p_side = 'buy' THEN 'sell' ELSE 'buy' END;

    -- For BUY orders, freeze funds (price * size / 1e6 for decimal conversion)
    IF p_side = 'buy' THEN
        IF NOT public.freeze_funds(p_user_id, p_price * p_size / 1000000.0) THEN
            RAISE EXCEPTION 'Insufficient funds';
        END IF;
    END IF;

    -- Create order
    INSERT INTO public.order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, post_only, stp_flag, original_quantity)
    VALUES (gen_random_uuid(), p_market_id, p_user_id, p_side, p_price, p_size, 0, 'open', p_order_type, p_time_in_force, p_post_only, p_stp_flag, p_size)
    RETURNING id INTO v_order_id;

    -- Record activity
    INSERT INTO public.order_activity (order_id, user_id, market_id, action, price, size)
    VALUES (v_order_id, p_user_id, p_market_id, 'place', p_price, p_size);

    -- Get trade number
    SELECT COALESCE(MAX(trade_number), 0) + 1 INTO v_trade_num FROM public.fill_records WHERE market_id = p_market_id;

    -- Get best opposite prices for spread detection
    SELECT MAX(price) INTO v_prev_best_bid FROM public.order_book WHERE market_id = p_market_id AND side = 'buy' AND status IN ('open', 'partially_filled');
    SELECT MIN(price) INTO v_prev_best_ask FROM public.order_book WHERE market_id = p_market_id AND side = 'sell' AND status IN ('open', 'partially_filled');

    -- Check if this order crosses the spread (aggressive)
    IF (p_side = 'buy' AND p_price >= COALESCE(v_prev_best_ask, 1)) OR
       (p_side = 'sell' AND p_price <= COALESCE(v_prev_best_bid, 0)) THEN
        v_is_crossed := true;
    END IF;

    -- Post-only orders cannot cross spread - they rest at best price
    IF p_post_only AND v_is_crossed THEN
        UPDATE public.order_book SET status = 'cancelled' WHERE id = v_order_id;
        IF p_side = 'buy' THEN
            PERFORM public.unfreeze_funds(p_user_id, p_price * p_size / 1000000.0);
        END IF;
        INSERT INTO public.order_activity (order_id, user_id, market_id, action, price, size, reason)
        VALUES (v_order_id, p_user_id, p_market_id, 'cancel', p_price, p_size, 'Post-only would cross spread');
        RETURN QUERY SELECT v_order_id, '[]'::JSONB, 0, BIGINT '0', NUMERIC '0';
        RETURN;
    END IF;

    -- FOK: Check if we can fill immediately
    IF p_order_type = 'FOK' AND v_is_crossed = false THEN
        -- FOK without crossing means it can't fill, cancel
        UPDATE public.order_book SET status = 'cancelled' WHERE id = v_order_id;
        IF p_side = 'buy' THEN
            PERFORM public.unfreeze_funds(p_user_id, p_price * p_size / 1000000.0);
        END IF;
        RETURN QUERY SELECT v_order_id, '[]'::JSONB, 0, BIGINT '0', NUMERIC '0';
        RETURN;
    END IF;

    -- MATCHING LOOP
    WHILE v_remaining_size > 0 LOOP
        -- Find best opposite order (price-time priority)
        IF p_side = 'buy' THEN
            SELECT * INTO v_counterparty
            FROM public.order_book
            WHERE market_id = p_market_id
              AND side = 'sell'
              AND status IN ('open', 'partially_filled')
              AND price <= p_price
            ORDER BY price ASC, created_at ASC
            LIMIT 1
            FOR UPDATE;
        ELSE
            SELECT * INTO v_counterparty
            FROM public.order_book
            WHERE market_id = p_market_id
              AND side = 'buy'
              AND status IN ('open', 'partially_filled')
              AND price >= p_price
            ORDER BY price DESC, created_at ASC
            LIMIT 1
            FOR UPDATE;
        END IF;

        EXIT WHEN NOT FOUND;

        -- Self-trade prevention
        IF v_counterparty.user_id = p_user_id THEN
            IF p_stp_flag = 'cancel_matching' THEN
                UPDATE public.order_book SET status = 'cancelled' WHERE id = v_order_id;
                INSERT INTO public.order_activity (order_id, user_id, market_id, action, price, size, reason)
                VALUES (v_order_id, p_user_id, p_market_id, 'cancel', p_price, p_remaining_size, 'Self-trade prevented');
                EXIT;
            ELSIF p_stp_flag = 'cancel_passive' THEN
                UPDATE public.order_book SET status = 'cancelled' WHERE id = v_counterparty.id;
                INSERT INTO public.order_activity (order_id, user_id, market_id, action, price, size, reason)
                VALUES (v_counterparty.id, v_counterparty.user_id, p_market_id, 'cancel', v_counterparty.price, v_counterparty.size - v_counterparty.filled, 'Self-trade: passive cancelled');
                CONTINUE;
            ELSIF p_stp_flag = 'abort' THEN
                DELETE FROM public.order_book WHERE id = v_order_id;
                IF p_side = 'buy' THEN
                    PERFORM public.unfreeze_funds(p_user_id, p_price * p_size / 1000000.0);
                END IF;
                RAISE EXCEPTION 'Self-trade detected, order aborted';
            END IF;
            -- 'none': allow self-trades
        END IF;

        -- Determine trade size
        v_trade_size := LEAST(v_remaining_size, v_counterparty.size - v_counterparty.filled);
        v_trade_price := v_counterparty.price; -- Maker's price

        -- Inversion fee: 0.1% for crossing spread
        IF v_is_crossed THEN
            v_inversion_fee := ROUND((v_trade_price * v_trade_size / 1000000.0) * 0.001, 4);
        ELSE
            v_inversion_fee := 0;
        END IF;

        -- Record fill
        INSERT INTO public.fill_records (
            market_id, buy_order_id, sell_order_id, buyer_id, seller_id,
            price, size, taker_side, inversion_fee, trade_number
        ) VALUES (
            p_market_id,
            CASE WHEN p_side = 'buy' THEN v_order_id ELSE v_counterparty.id END,
            CASE WHEN p_side = 'sell' THEN v_order_id ELSE v_counterparty.id END,
            CASE WHEN p_side = 'buy' THEN p_user_id ELSE v_counterparty.user_id END,
            CASE WHEN p_side = 'sell' THEN p_user_id ELSE v_counterparty.user_id END,
            v_trade_price, v_trade_size, p_side, v_inversion_fee, v_trade_num
        );

        v_fill_count := v_fill_count + 1;
        v_total_filled := v_total_filled + v_trade_size;

        -- Build fill JSON
        v_fills := v_fills || jsonb_build_array(jsonb_build_object(
            'id', gen_random_uuid(),
            'price', v_trade_price,
            'size', v_trade_size,
            'maker_order_id', CASE WHEN p_side = 'buy' THEN v_counterparty.id ELSE v_order_id END,
            'taker_order_id', CASE WHEN p_side = 'buy' THEN v_order_id ELSE v_counterparty.id END,
            'side', p_side
        ));

        -- Update taker order
        UPDATE public.order_book
        SET filled = filled + v_trade_size,
            avg_fill_price = CASE WHEN filled + v_trade_size > 0
                THEN (avg_fill_price * filled + v_trade_price * v_trade_size) / (filled + v_trade_size)
                ELSE v_trade_price END,
            updated_at = now(),
            status = CASE WHEN filled + v_trade_size >= size THEN 'filled' ELSE 'partially_filled' END
        WHERE id = v_order_id;

        -- Update maker order
        UPDATE public.order_book
        SET filled = filled + v_trade_size,
            updated_at = now(),
            status = CASE WHEN filled + v_trade_size >= size THEN 'filled' ELSE 'partially_filled' END
        WHERE id = v_counterparty.id;

        -- Update positions (taker side)
        UPDATE public.positions
        SET quantity = quantity + v_trade_size,
            average_price = CASE WHEN quantity + v_trade_size > 0
                THEN (average_price * quantity + v_trade_price * v_trade_size) / (quantity + v_trade_size)
                ELSE v_trade_price END,
            updated_at = now()
        WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = CASE WHEN p_side = 'buy' THEN 'YES' ELSE 'NO' END;

        IF NOT FOUND THEN
            INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price)
            VALUES (p_user_id, p_market_id, CASE WHEN p_side = 'buy' THEN 'YES' ELSE 'NO' END, v_trade_size, v_trade_price);
        END IF;

        -- Update maker position
        UPDATE public.positions
        SET quantity = quantity + v_trade_size,
            average_price = CASE WHEN quantity + v_trade_size > 0
                THEN (average_price * quantity + v_trade_price * v_trade_size) / (quantity + v_trade_size)
                ELSE v_trade_price END,
            updated_at = now()
        WHERE user_id = v_counterparty.user_id AND market_id = p_market_id AND outcome = CASE WHEN p_side = 'buy' THEN 'NO' ELSE 'YES' END;

        IF NOT FOUND THEN
            INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price)
            VALUES (v_counterparty.user_id, p_market_id, CASE WHEN p_side = 'buy' THEN 'NO' ELSE 'YES' END, v_trade_size, v_trade_price);
        END IF;

        -- Settle cash for buyer/seller
        IF p_side = 'buy' THEN
            -- Deduct from buyer, credit seller
            UPDATE public.wallets
            SET balance = balance - (v_trade_price * v_trade_size / 1000000.0),
                locked_balance = GREATEST(0, locked_balance - (v_trade_price * v_trade_size / 1000000.0)),
                updated_at = now()
            WHERE user_id = p_user_id;

            UPDATE public.wallets
            SET balance = balance + (v_trade_price * v_trade_size / 1000000.0),
                updated_at = now()
            WHERE user_id = v_counterparty.user_id;
        ELSE
            -- For sell: credit buyer, deduct from seller
            UPDATE public.wallets
            SET balance = balance + (v_trade_price * v_trade_size / 1000000.0),
                updated_at = now()
            WHERE user_id = p_user_id;

            UPDATE public.wallets
            SET locked_balance = GREATEST(0, locked_balance - (v_trade_price * v_trade_size / 1000000.0)),
                updated_at = now()
            WHERE user_id = v_counterparty.user_id;
        END IF;

        v_remaining_size := v_remaining_size - v_trade_size;
        v_trade_num := v_trade_num + 1;
    END LOOP;

    -- Handle unfilled remainder
    IF v_remaining_size > 0 THEN
        IF p_order_type IN ('FOK', 'IOC') THEN
            UPDATE public.order_book SET status = 'cancelled', updated_at = now() WHERE id = v_order_id;
            v_unfilled := v_remaining_size;
            IF p_side = 'buy' THEN
                PERFORM public.unfreeze_funds(p_user_id, p_price * v_unfilled / 1000000.0);
            END IF;
            INSERT INTO public.order_activity (order_id, user_id, market_id, action, price, size, reason)
            VALUES (v_order_id, p_user_id, p_market_id, 'cancel', p_price, v_unfilled, p_order_type || ' order could not fill');
        ELSIF p_order_type = 'limit' THEN
            -- Resting limit order stays open
            UPDATE public.order_book SET status = CASE WHEN v_total_filled > 0 THEN 'partially_filled' ELSE 'open' END, updated_at = now() WHERE id = v_order_id;
        END IF;
    ELSE
        UPDATE public.order_book SET status = 'filled', updated_at = now() WHERE id = v_order_id;
    END IF;

    -- Calculate avg fill price
    IF v_total_filled > 0 THEN
        SELECT ROUND(SUM(price * size) / SUM(size), 4) INTO v_avg_price
        FROM public.fill_records
        WHERE (buy_order_id = v_order_id OR sell_order_id = v_order_id)
          AND market_id = p_market_id;
    END IF;

    RETURN QUERY SELECT v_order_id, v_fills, v_fill_count, v_total_filled, v_avg_price;
END;
$$;


--
-- Name: place_order_atomic(uuid, uuid, public.order_side, public.outcome_type, numeric, bigint, public.order_type, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.place_order_atomic(p_user_id uuid, p_market_id uuid, p_side public.order_side, p_outcome public.outcome_type, p_price numeric, p_quantity bigint, p_order_type public.order_type DEFAULT 'limit'::public.order_type, p_idempotency_key text DEFAULT NULL::text) RETURNS TABLE(order_id uuid, error text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id UUID;
    v_required_funds NUMERIC;
    v_balance NUMERIC;
    v_locked NUMERIC;
    v_available NUMERIC;
BEGIN
    -- Check idempotency (if key provided)
    IF p_idempotency_key IS NOT NULL THEN
        SELECT o.id INTO v_order_id
        FROM public.orders o
        WHERE o.user_id = p_user_id
          AND o.market_id = p_market_id
          AND o.idempotency_key = p_idempotency_key
        LIMIT 1;

        IF v_order_id IS NOT NULL THEN
            RETURN QUERY SELECT v_order_id, NULL::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Check market is active
    IF NOT EXISTS (SELECT 1 FROM public.markets WHERE id = p_market_id AND status = 'active') THEN
        RETURN QUERY SELECT NULL::UUID, 'Market is not active'::TEXT;
        RETURN;
    END IF;

    -- For BUY orders: check and freeze funds
    IF p_side = 'buy' THEN
        -- Get balance
        SELECT COALESCE(balance, 0), COALESCE(locked_balance, 0)
        INTO v_balance, v_locked
        FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

        v_available := v_balance - v_locked;
        v_required_funds := p_price * p_quantity / 1000000.0;

        IF v_available < v_required_funds THEN
            RETURN QUERY SELECT NULL::UUID, 'Insufficient balance'::TEXT;
            RETURN;
        END IF;

        -- Freeze funds
        UPDATE public.wallets
        SET locked_balance = locked_balance + v_required_funds,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;

    -- Create order
    v_order_id := gen_random_uuid();
    INSERT INTO public.orders (id, market_id, user_id, order_type, side, outcome, price, quantity, filled_quantity, status, idempotency_key)
    VALUES (v_order_id, p_market_id, p_user_id, p_order_type, p_side, p_outcome, p_price, p_quantity, 0, 'open', p_idempotency_key);

    RETURN QUERY SELECT v_order_id, NULL::TEXT;
END;
$$;


--
-- Name: plokymarket_create_wallet_on_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plokymarket_create_wallet_on_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Check if wallet already exists
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        VALUES (NEW.id, 0, 0);
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: plokymarket_get_market_prices(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plokymarket_get_market_prices(p_market_id uuid) RETURNS TABLE(yes_price numeric, no_price numeric, yes_volume bigint, no_volume bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH yes_orders AS (
        SELECT 
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_yes_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_yes_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id 
            AND outcome = 'YES'
            AND status IN ('open', 'partially_filled')
    ),
    no_orders AS (
        SELECT 
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_no_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_no_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as no_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as no_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id 
            AND outcome = 'NO'
            AND status IN ('open', 'partially_filled')
    )
    SELECT 
        CASE 
            WHEN y.best_yes_ask > 0 THEN LEAST(y.best_yes_ask, 1 - COALESCE(n.best_no_bid, 0))
            ELSE 0.5
        END as yes_price,
        CASE 
            WHEN n.best_no_ask > 0 THEN LEAST(n.best_no_ask, 1 - COALESCE(y.best_yes_bid, 0))
            ELSE 0.5
        END as no_price,
        COALESCE(y.yes_buy_volume, 0) + COALESCE(y.yes_sell_volume, 0) as yes_volume,
        COALESCE(n.no_buy_volume, 0) + COALESCE(n.no_sell_volume, 0) as no_volume
    FROM yes_orders y, no_orders n;
END;
$$;


--
-- Name: plokymarket_get_orderbook(uuid, public.outcome_type, public.order_side); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plokymarket_get_orderbook(p_market_id uuid, p_outcome public.outcome_type, p_side public.order_side) RETURNS TABLE(price numeric, quantity bigint, total bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.price,
        SUM(o.quantity - o.filled_quantity)::BIGINT as quantity,
        SUM((o.quantity - o.filled_quantity) * o.price)::BIGINT as total
    FROM public.orders o
    WHERE o.market_id = p_market_id
        AND o.outcome = p_outcome
        AND o.side = p_side
        AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY 
        o.price ASC,
        o.created_at ASC;
END;
$$;


--
-- Name: plokymarket_update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.plokymarket_update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: process_trade_settlement(uuid, uuid, bigint, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.process_trade_settlement(p_buy_order_id uuid, p_sell_order_id uuid, p_quantity bigint, p_price numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_total_cost NUMERIC(12, 2);
BEGIN
    SELECT user_id INTO v_buyer_id FROM public.orders WHERE id = p_buy_order_id;
    SELECT user_id INTO v_seller_id FROM public.orders WHERE id = p_sell_order_id;
    
    v_total_cost := p_quantity * p_price;
    
    -- Update buyer wallet (deduct from available balance)
    UPDATE public.wallets SET 
        balance = balance - v_total_cost
    WHERE user_id = v_buyer_id;
    
    -- Update seller wallet (add to available balance)
    UPDATE public.wallets SET 
        balance = balance + v_total_cost
    WHERE user_id = v_seller_id;
    
    -- Log transactions
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, order_id)
    SELECT user_id, 'trade_buy'::transaction_type, -v_total_cost, 
           balance + v_total_cost, balance, p_buy_order_id
    FROM public.wallets WHERE user_id = v_buyer_id;
    
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, order_id)
    SELECT user_id, 'trade_sell'::transaction_type, v_total_cost, 
           balance - v_total_cost, balance, p_sell_order_id
    FROM public.wallets WHERE user_id = v_seller_id;
END;
$$;


--
-- Name: record_matching_latency(text, bigint, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_matching_latency(p_operation text, p_latency_us bigint, p_market_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO public.matching_latency (operation, latency_us, market_id)
    VALUES (p_operation, p_latency_us, p_market_id);
END;
$$;


--
-- Name: record_workflow_complete(text, character varying, jsonb, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_workflow_complete(p_workflow_run_id text, p_status character varying, p_result jsonb DEFAULT '{}'::jsonb, p_error_message text DEFAULT NULL::text, p_execution_time_ms integer DEFAULT NULL::integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.upstash_workflow_runs
    SET 
        status = p_status,
        result = p_result,
        error_message = p_error_message,
        completed_at = NOW(),
        execution_time_ms = p_execution_time_ms,
        updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
END;
$$;


--
-- Name: record_workflow_start(text, character varying, uuid, uuid, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_workflow_start(p_workflow_run_id text, p_workflow_type character varying, p_event_id uuid DEFAULT NULL::uuid, p_market_id uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_message_id text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.upstash_workflow_runs (
        workflow_run_id, message_id, workflow_type, event_id, market_id,
        status, payload, started_at
    ) VALUES (
        p_workflow_run_id, p_message_id, p_workflow_type, p_event_id, p_market_id,
        'RUNNING', p_payload, NOW()
    )
    ON CONFLICT (workflow_run_id) 
    DO UPDATE SET 
        status = 'RUNNING',
        started_at = NOW(),
        retry_count = public.upstash_workflow_runs.retry_count + 1,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;


--
-- Name: release_margin_for_order(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.release_margin_for_order(p_user_id uuid, p_order_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_lock_id UUID;
    v_amount NUMERIC;
BEGIN
    -- Find the active lock
    SELECT id, amount INTO v_lock_id, v_amount
    FROM margin_locks
    WHERE order_id = p_order_id AND status = 'active'
    FOR UPDATE;

    IF v_lock_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Release the margin
    UPDATE wallets
    SET locked_balance = locked_balance - v_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Update lock status
    UPDATE margin_locks
    SET status = 'released',
        released_at = NOW()
    WHERE id = v_lock_id;

    RETURN TRUE;
END;
$$;


--
-- Name: remove_pmf_liquidity(uuid, uuid, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_pmf_liquidity(p_pool_id uuid, p_user_id uuid, p_shares_to_burn numeric, p_min_amount0 numeric DEFAULT 0, p_min_amount1 numeric DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
    v_user_shares public.pmf_pool_shares;
    v_amount0 NUMERIC(20, 8);
    v_amount1 NUMERIC(20, 8);
    v_share_ratio NUMERIC(20, 8);
BEGIN
    -- Get pool info with lock
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    IF v_pool.status != 'active' AND v_pool.status != 'draining' THEN
        RAISE EXCEPTION 'Pool does not allow removal. Current status: %', v_pool.status;
    END IF;
    
    -- Get user shares
    SELECT * INTO v_user_shares FROM public.pmf_pool_shares 
    WHERE pool_id = p_pool_id AND user_id = p_user_id FOR UPDATE;
    
    IF v_user_shares IS NULL OR v_user_shares.shares_count < p_shares_to_burn THEN
        RAISE EXCEPTION 'Insufficient shares. Available: %, Requested: %', 
            COALESCE(v_user_shares.shares_count, 0), p_shares_to_burn;
    END IF;
    
    -- Calculate amounts to return
    v_share_ratio := p_shares_to_burn / v_pool.total_shares;
    v_amount0 := v_pool.reserve0 * v_share_ratio;
    v_amount1 := v_pool.reserve1 * v_share_ratio;
    
    IF v_amount0 < p_min_amount0 OR v_amount1 < p_min_amount1 THEN
        RAISE EXCEPTION 'Slippage too high. Min amount0: %, Got: %, Min amount1: %, Got: %',
            p_min_amount0, v_amount0, p_min_amount1, v_amount1;
    END IF;
    
    -- Update pool
    UPDATE public.pmf_liquidity_pools
    SET reserve0 = reserve0 - v_amount0,
        reserve1 = reserve1 - v_amount1,
        total_shares = total_shares - p_shares_to_burn,
        current_liquidity = current_liquidity - (v_amount0 + v_amount1),
        updated_at = NOW()
    WHERE id = p_pool_id;
    
    -- Update user shares
    UPDATE public.pmf_pool_shares
    SET shares_count = shares_count - p_shares_to_burn,
        updated_at = NOW()
    WHERE pool_id = p_pool_id AND user_id = p_user_id;
    
    -- Record the removal
    INSERT INTO public.pmf_liquidity_removals (pool_id, user_id, shares_burned, amount0, amount1)
    VALUES (p_pool_id, p_user_id, p_shares_to_burn, v_amount0, v_amount1);
    
    RETURN jsonb_build_object(
        'success', true,
        'shares_burned', p_shares_to_burn,
        'amount0_returned', v_amount0,
        'amount1_returned', v_amount1,
        'pool_id', p_pool_id,
        'user_id', p_user_id
    );
END;
$$;


--
-- Name: settle_market(uuid, public.outcome_type); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.settle_market(p_market_id uuid, p_winning_outcome public.outcome_type) RETURNS TABLE(users_settled integer, total_payout numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_position RECORD;
    v_payout NUMERIC(12, 2);
    v_count INT := 0;
    v_total NUMERIC(12, 2) := 0;
BEGIN
    UPDATE public.markets SET 
        status = 'resolved'::market_status,
        winning_outcome = p_winning_outcome,
        resolved_at = NOW()
    WHERE id = p_market_id;
    
    FOR v_position IN
        SELECT user_id, outcome, quantity
        FROM public.positions
        WHERE market_id = p_market_id AND quantity > 0
    LOOP
        IF v_position.outcome = p_winning_outcome THEN
            v_payout := v_position.quantity * 1.00;
            
            UPDATE public.wallets SET balance = balance + v_payout
            WHERE user_id = v_position.user_id;
            
            INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, market_id)
            SELECT user_id, 'settlement'::transaction_type, v_payout,
                   balance - v_payout, balance, p_market_id
            FROM public.wallets WHERE user_id = v_position.user_id;
            
            v_total := v_total + v_payout;
        END IF;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_count, v_total;
END;
$$;


--
-- Name: settle_market(uuid, public.outcome_type, numeric, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.settle_market(p_market_id uuid, p_winning_outcome public.outcome_type, p_final_price numeric, p_resolved_by uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_position RECORD;
    v_payout NUMERIC;
    v_total_volume BIGINT := 0;
    v_record_count INTEGER := 0;
BEGIN
    -- Mark market as resolved
    UPDATE public.markets
    SET status = 'resolved',
        winning_outcome = p_winning_outcome,
        resolved_at = now(),
        updated_at = now()
    WHERE id = p_market_id;

    -- Record settlement
    INSERT INTO public.settlement_records (market_id, final_price, winning_outcome, settlement_strategy, resolved_by, resolved_at)
    VALUES (p_market_id, p_final_price, p_winning_outcome, 'manual', p_resolved_by, now());

    -- Calculate total volume
    SELECT SUM(size) INTO v_total_volume FROM public.fill_records WHERE market_id = p_market_id;

    -- Update settlement_records with volume
    UPDATE public.settlement_records SET total_volume = v_total_volume WHERE market_id = p_market_id;

    -- Snapshot all positions
    FOR v_position IN
        SELECT user_id, outcome, quantity, average_price
        FROM public.positions
        WHERE market_id = p_market_id AND quantity > 0
    LOOP
        INSERT INTO public.position_snapshots (market_id, user_id, outcome, quantity, avg_price, settlement_price)
        VALUES (p_market_id, v_position.user_id, v_position.outcome, v_position.quantity, v_position.average_price, p_final_price)
        ON CONFLICT (market_id, user_id, outcome) DO UPDATE
        SET quantity = v_position.quantity, avg_price = v_position.average_price, settlement_price = p_final_price;

        -- Calculate and add realized PnL for winners
        IF v_position.outcome = p_winning_outcome THEN
            v_payout := ROUND(v_position.quantity * p_final_price / 1000000.0 * (1 - 0.01), 2); -- 1% fee
            UPDATE public.wallets SET balance = balance + v_payout, updated_at = now()
            WHERE user_id = v_position.user_id;

            UPDATE public.positions SET realized_pnl = realized_pnl + v_payout
            WHERE user_id = v_position.user_id AND market_id = p_market_id AND outcome = p_winning_outcome;
        END IF;

        v_record_count := v_record_count + 1;
    END LOOP;

    -- Cancel all open orders
    UPDATE public.order_book SET status = 'cancelled', updated_at = now()
    WHERE market_id = p_market_id AND status IN ('open', 'partially_filled');

    RAISE NOTICE 'Settled market % with outcome %. % positions processed.', p_market_id, p_winning_outcome, v_record_count;
END;
$$;


--
-- Name: sync_event_title_question(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_event_title_question() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.title IS DISTINCT FROM OLD.title AND NEW.question IS NULL THEN
        NEW.question := NEW.title;
    END IF;
    IF NEW.question IS DISTINCT FROM OLD.question AND NEW.title IS NULL THEN
        NEW.title := NEW.question;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: trigger_release_margin_on_cancel(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_release_margin_on_cancel() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status = 'open' THEN
        PERFORM release_margin_for_order(NEW.user_id, NEW.id);
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: unfreeze_funds(uuid, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.unfreeze_funds(p_user_id uuid, p_amount numeric) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.wallets
    SET locked_balance = GREATEST(0, locked_balance - p_amount), updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;


--
-- Name: update_maker_volume(uuid, bigint, boolean, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_maker_volume(p_user_id uuid, p_volume bigint, p_is_maker boolean DEFAULT true, p_spread_contribution numeric DEFAULT 0, p_resting_seconds integer DEFAULT 0) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO public.maker_stats (user_id, total_maker_volume, spread_contribution)
    VALUES (p_user_id, p_volume, p_spread_contribution)
    ON CONFLICT (user_id) DO UPDATE SET
        total_maker_volume = maker_stats.total_maker_volume + p_volume,
        spread_contribution = maker_stats.spread_contribution + p_spread_contribution,
        last_updated = now();
END;
$$;


--
-- Name: update_pmf_pool_status(uuid, public.pmf_pool_status); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pmf_pool_status(p_pool_id uuid, p_new_status public.pmf_pool_status) RETURNS public.pmf_liquidity_pools
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_pool public.pmf_liquidity_pools;
BEGIN
    SELECT * INTO v_pool FROM public.pmf_liquidity_pools WHERE id = p_pool_id FOR UPDATE;
    IF v_pool IS NULL THEN
        RAISE EXCEPTION 'Pool not found: %', p_pool_id;
    END IF;
    
    -- Validate state transitions
    IF v_pool.status = 'resolved' AND p_new_status != 'resolved' THEN
        RAISE EXCEPTION 'Cannot change status of resolved pool';
    END IF;
    
    UPDATE public.pmf_liquidity_pools
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_pool_id
    RETURNING * INTO v_pool;
    
    RETURN v_pool;
END;
$$;


--
-- Name: update_pmf_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pmf_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_position(uuid, uuid, public.outcome_type, bigint, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_position(p_user_id uuid, p_market_id uuid, p_outcome public.outcome_type, p_quantity_delta bigint, p_price numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_position RECORD;
BEGIN
    SELECT * INTO v_position
    FROM public.positions
    WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome
    FOR UPDATE;
    
    IF NOT FOUND THEN
        INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price)
        VALUES (p_user_id, p_market_id, p_outcome, p_quantity_delta, p_price);
    ELSE
        UPDATE public.positions SET 
            quantity = quantity + p_quantity_delta,
            average_price = CASE 
                WHEN p_quantity_delta > 0 THEN
                    (average_price * quantity + p_price * p_quantity_delta) / (quantity + p_quantity_delta)
                ELSE average_price
            END
        WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome;
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: who_am_i(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.who_am_i() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN current_user || ' search_path=' || current_setting('search_path', true);
END;
$$;


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    from_ip_address inet,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(14) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: activity_feed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_feed (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    activity_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    resource_type text,
    resource_id uuid,
    old_values jsonb,
    new_values jsonb,
    change_summary text,
    reason text,
    ip_address inet,
    user_agent text,
    workflow_id uuid,
    workflow_status text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_ai_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_ai_settings (
    id integer DEFAULT 1 NOT NULL,
    custom_instruction text DEFAULT 'Generate engaging prediction market topics relevant to Bangladesh users'::text,
    target_region character varying(50) DEFAULT 'Bangladesh'::character varying,
    default_categories character varying(50)[] DEFAULT ARRAY['Sports'::text, 'Politics'::text, 'Economy'::text, 'Entertainment'::text],
    auto_generate_enabled boolean DEFAULT false,
    auto_generate_time time without time zone DEFAULT '08:00:00'::time without time zone,
    max_daily_topics integer DEFAULT 5,
    gemini_model character varying(50) DEFAULT 'gemini-1.5-flash'::character varying,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    CONSTRAINT admin_ai_settings_id_check CHECK ((id = 1))
);


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    performed_by uuid NOT NULL,
    target_table text,
    target_id uuid,
    diff_jsonb jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_key text NOT NULL,
    config_value jsonb DEFAULT '{}'::jsonb,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    market_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id uuid,
    parent_id uuid,
    is_deleted boolean DEFAULT false
);


--
-- Name: conditional_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conditional_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    market_id uuid NOT NULL,
    type text NOT NULL,
    trigger_price numeric NOT NULL,
    order_side text NOT NULL,
    order_outcome text NOT NULL,
    quantity numeric NOT NULL,
    slippage_tolerance numeric DEFAULT 0.5,
    status text DEFAULT 'active'::text,
    triggered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    CONSTRAINT conditional_orders_order_outcome_check CHECK ((order_outcome = ANY (ARRAY['YES'::text, 'NO'::text]))),
    CONSTRAINT conditional_orders_order_side_check CHECK ((order_side = ANY (ARRAY['buy'::text, 'sell'::text]))),
    CONSTRAINT conditional_orders_quantity_check CHECK ((quantity > (0)::numeric)),
    CONSTRAINT conditional_orders_slippage_tolerance_check CHECK (((slippage_tolerance >= (0)::numeric) AND (slippage_tolerance <= (10)::numeric))),
    CONSTRAINT conditional_orders_status_check CHECK ((status = ANY (ARRAY['active'::text, 'triggered'::text, 'expired'::text, 'cancelled'::text, 'failed'::text]))),
    CONSTRAINT conditional_orders_trigger_price_check CHECK (((trigger_price > (0)::numeric) AND (trigger_price < (1)::numeric))),
    CONSTRAINT conditional_orders_type_check CHECK ((type = ANY (ARRAY['stop_loss'::text, 'stop_win'::text, 'take_profit'::text])))
);


--
-- Name: daily_topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_topics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    status character varying(20) DEFAULT 'pending'::character varying,
    generated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: deposit_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deposit_requests (
    id uuid NOT NULL,
    user_id uuid,
    usdt_amount numeric,
    status character varying,
    created_at timestamp with time zone,
    payment_method character varying,
    sender_number character varying,
    sender_name character varying,
    txn_id character varying,
    bdt_amount numeric,
    exchange_rate numeric,
    reviewed_at timestamp with time zone,
    reviewed_by uuid
);


--
-- Name: disputes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disputes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    dispute_id text,
    market_id uuid,
    pipeline_id uuid,
    level text DEFAULT 'initial'::text,
    status text DEFAULT 'open'::text,
    challenger_id uuid,
    proposer_id uuid,
    bond_amount numeric DEFAULT 0,
    bond_currency text DEFAULT 'USDT'::text,
    bond_locked_at timestamp with time zone,
    bond_released_at timestamp with time zone,
    challenge_reason text,
    evidence_urls jsonb DEFAULT '[]'::jsonb,
    expected_outcome text,
    resolution_method text,
    resolution_outcome text,
    final_outcome text,
    resolution_details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    deadline_at timestamp with time zone,
    resolved_at timestamp with time zone,
    reward_distributed boolean DEFAULT false,
    challenger_reward numeric DEFAULT 0,
    treasury_fee numeric DEFAULT 0,
    parent_dispute_id uuid,
    child_dispute_id uuid
);


--
-- Name: event_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    answer_type public.answer_type DEFAULT 'binary'::public.answer_type NOT NULL,
    description text,
    slug text,
    category_id uuid,
    resolution_source text,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public.market_status DEFAULT 'draft'::public.market_status NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    resolves_at timestamp with time zone,
    resolved_at timestamp with time zone,
    resolution_value text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'General'::text,
    image_url text,
    event_date timestamp with time zone,
    source_url text,
    event_id uuid,
    creator_id uuid
);


--
-- Name: markets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    question text NOT NULL,
    description text,
    category text DEFAULT 'General'::text NOT NULL,
    source_url text,
    image_url text,
    creator_id uuid,
    status public.market_status DEFAULT 'active'::public.market_status,
    resolution_source text,
    min_price numeric(5,4) DEFAULT 0.0001,
    max_price numeric(5,4) DEFAULT 0.9999,
    tick_size numeric(5,4) DEFAULT 0.01,
    created_at timestamp with time zone DEFAULT now(),
    trading_closes_at timestamp with time zone NOT NULL,
    event_date timestamp with time zone,
    resolved_at timestamp with time zone,
    winning_outcome public.outcome_type,
    resolution_details jsonb DEFAULT '{}'::jsonb,
    total_volume numeric(12,2) DEFAULT 0,
    yes_shares_outstanding bigint DEFAULT 0,
    no_shares_outstanding bigint DEFAULT 0,
    event_id uuid,
    resolution_source_type text,
    resolution_data jsonb,
    fee_percent numeric(10,4) DEFAULT 0.02,
    initial_liquidity numeric(20,8),
    maker_rebate_percent numeric(10,4) DEFAULT 0.01,
    market_category text,
    min_tick numeric(10,8),
    max_tick numeric(10,8),
    current_tick numeric(10,8),
    realized_volatility_24h numeric(10,8),
    pending_tick_change boolean DEFAULT false,
    resolution_source_url text,
    subcategory text,
    tags text[],
    slug text,
    answer_type text DEFAULT 'YES_NO'::text,
    answer1 text DEFAULT 'YES'::text,
    answer2 text DEFAULT 'NO'::text,
    is_featured boolean DEFAULT false,
    created_by text,
    name text,
    liquidity numeric(20,8) DEFAULT 0,
    resolution_delay integer,
    condition_id text,
    token1 text,
    token2 text,
    neg_risk boolean DEFAULT false,
    resolver_reference text,
    volume numeric(20,8) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    market_type text DEFAULT 'binary'::text,
    min_value numeric(10,4),
    max_value numeric(10,4),
    scalar_unit text,
    yes_price_change_24h numeric(10,8),
    no_price_change_24h numeric(10,8),
    unique_traders integer DEFAULT 0,
    close_warned boolean DEFAULT false,
    yes_price numeric(10,8),
    no_price numeric(10,8),
    trading_phase text DEFAULT 'open'::text,
    next_phase_time timestamp with time zone,
    auction_data jsonb,
    resolution_delay_hours integer DEFAULT 24,
    resolution_method text DEFAULT 'manual'::text,
    volume_24h numeric(20,8) DEFAULT 0,
    best_bid numeric(10,8),
    best_ask numeric(10,8),
    spread numeric(10,8),
    order_count integer DEFAULT 0,
    unique_traders_24h integer DEFAULT 0,
    last_trade_price numeric(10,8),
    last_trade_at timestamp with time zone,
    metadata jsonb,
    current_stage text DEFAULT 'open'::text,
    deployed_at timestamp with time zone,
    oracle_type text DEFAULT 'manual'::text,
    legal_review_status text DEFAULT 'not_required'::text,
    legal_review_notes text,
    legal_reviewed_at timestamp with time zone,
    liquidity_commitment numeric(20,8),
    liquidity_deposited boolean DEFAULT false,
    deployment_config jsonb,
    deployment_tx_hash text,
    resolution_deadline timestamp with time zone,
    resolution_criteria text,
    risk_score integer DEFAULT 0,
    stages_completed text[],
    trading_fee_percent numeric(10,4) DEFAULT 0.02,
    confidence numeric(5,4),
    trader_count integer DEFAULT 0,
    legal_reviewer_id uuid,
    simulation_config jsonb,
    simulation_results jsonb,
    admin_bypass_legal_review boolean DEFAULT false,
    admin_bypass_liquidity boolean DEFAULT false,
    trading_ends timestamp with time zone,
    name_bn text,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    question_bn text,
    creator_address text,
    current_price_yes numeric(10,8),
    current_price_no numeric(10,8),
    event_title text,
    event_description text,
    event_tags jsonb DEFAULT '[]'::jsonb,
    event_answer_type text DEFAULT 'binary'::text,
    event_source_url text,
    event_slug text,
    event_category text,
    CONSTRAINT markets_max_price_check CHECK ((max_price < (1)::numeric)),
    CONSTRAINT markets_min_price_check CHECK ((min_price > (0)::numeric)),
    CONSTRAINT plokymarket_valid_dates CHECK (((event_date IS NULL) OR (trading_closes_at IS NULL) OR (event_date > trading_closes_at)))
);


--
-- Name: events; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.events AS
 SELECT m.id,
    m.slug,
    (m.status)::text AS status,
    COALESCE(m.event_title, m.question, m.name) AS title,
    m.question,
    m.event_title,
    COALESCE(m.event_description, m.description) AS description,
    COALESCE(m.event_category, m.category) AS category,
    m.subcategory,
    m.starts_at,
    m.ends_at,
    m.trading_closes_at,
    m.event_date,
    m.resolved_at,
    COALESCE(m.event_tags, to_jsonb(COALESCE(m.tags, '{}'::text[])), '[]'::jsonb) AS tags,
    m.event_answer_type AS answer_type,
    m.event_source_url AS source_url,
    m.event_slug,
    m.image_url,
    NULL::text AS thumbnail_url,
    NULL::text AS banner_url,
    m.creator_id,
    m.created_at,
    m.updated_at,
    m.question AS market_question,
    COALESCE(m.current_price_yes, m.yes_price, 0.5) AS current_yes_price,
    COALESCE(m.current_price_no, m.no_price, 0.5) AS current_no_price,
    COALESCE(m.total_volume, (0)::numeric) AS total_volume,
    COALESCE(m.volume_24h, (0)::numeric) AS volume_24h,
    COALESCE(m.liquidity, m.initial_liquidity, (0)::numeric) AS liquidity,
    COALESCE(m.initial_liquidity, (1000)::numeric) AS initial_liquidity,
    (0)::bigint AS total_trades,
    (COALESCE(m.unique_traders, 0))::bigint AS unique_traders,
    m.resolution_method,
    m.winning_outcome,
    m.resolution_source,
    m.resolution_details,
    m.is_featured,
    m.answer1,
    m.answer2,
    m.answer_type AS market_answer_type,
    m.tick_size,
    m.min_price,
    m.max_price,
    m.event_id,
    m.condition_id,
    m.token1,
    m.token2,
    m.neg_risk,
    m.market_type,
    m.fee_percent,
    m.maker_rebate_percent,
    m.resolver_reference,
    m.yes_price_change_24h,
    m.no_price_change_24h,
    NULL::numeric AS price_change_24h,
    m.current_stage,
    m.trading_phase,
    m.close_warned,
    NULL::boolean AS is_verified,
    NULL::boolean AS is_trending,
    m.resolution_delay_hours,
    NULL::jsonb AS ai_keywords,
    NULL::jsonb AS ai_sources,
    NULL::numeric AS ai_confidence_threshold
   FROM public.markets m;


--
-- Name: events_simple; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.events_simple AS
 SELECT event_definitions.id,
    event_definitions.title
   FROM public.event_definitions;


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    base_currency character varying(10) DEFAULT 'USDT'::character varying NOT NULL,
    quote_currency character varying(10) DEFAULT 'BDT'::character varying NOT NULL,
    rate numeric NOT NULL,
    source text DEFAULT 'manual'::text,
    fetched_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bdt_to_usdt numeric(20,10),
    usdt_to_bdt numeric(20,10),
    effective_from timestamp with time zone,
    effective_until timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now(),
    previous_rate numeric(20,10),
    change_percentage numeric(10,6)
);


--
-- Name: fill_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fill_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    buy_order_id uuid,
    sell_order_id uuid,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    price numeric(5,4) NOT NULL,
    size bigint NOT NULL,
    taker_side public.order_side NOT NULL,
    maker_fee numeric(10,4) DEFAULT 0,
    taker_fee numeric(10,4) DEFAULT 0,
    inversion_fee numeric(10,4) DEFAULT 0,
    is_self_trade boolean DEFAULT false,
    trade_number bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    order_id uuid,
    quantity numeric(20,8),
    total_value numeric(20,8),
    counterparty_order_id uuid,
    counterparty_user_id uuid,
    trade_id uuid,
    fill_number integer DEFAULT 1,
    is_maker boolean DEFAULT false,
    transaction_hash text,
    blockchain_reference text,
    filled_at timestamp with time zone DEFAULT now(),
    CONSTRAINT fill_records_size_check CHECK ((size > 0))
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: frozen_funds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frozen_funds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    amount numeric(12,2) NOT NULL,
    reason text NOT NULL,
    released_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT frozen_funds_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: kyc_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    document_type text,
    document_front_url text,
    document_back_url text,
    selfie_url text,
    status text DEFAULT 'pending'::text,
    rejection_reason text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: kyc_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    submitted_data jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: leaderboard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    score numeric DEFAULT 0 NOT NULL,
    rank bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    username text,
    total_pnl numeric(20,8) DEFAULT 0,
    win_count integer DEFAULT 0,
    loss_count integer DEFAULT 0,
    trade_count integer DEFAULT 0,
    win_rate numeric(5,4) DEFAULT 0,
    best_trade numeric(20,8),
    worst_trade numeric(20,8),
    streak integer DEFAULT 0,
    rank_tier text DEFAULT 'bronze'::text,
    badge_ids uuid[],
    season text
);


--
-- Name: leaderboard_rank_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.leaderboard ALTER COLUMN rank ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.leaderboard_rank_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: maker_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maker_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_maker_volume bigint DEFAULT 0 NOT NULL,
    total_maker_rebate numeric(12,2) DEFAULT 0 NOT NULL,
    spread_contribution numeric(12,2) DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: margin_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.margin_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    market_id uuid,
    order_id uuid,
    event_type public.margin_event_type NOT NULL,
    margin_before numeric DEFAULT 0,
    margin_after numeric DEFAULT 0,
    pnl_realized numeric DEFAULT 0,
    notes text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: margin_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.margin_locks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    order_id uuid,
    market_id uuid,
    amount numeric NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    released_at timestamp with time zone
);


--
-- Name: margin_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.margin_snapshots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    snapshot_type character varying(20) NOT NULL,
    total_margin_required numeric DEFAULT 0,
    total_margin_available numeric DEFAULT 0,
    margin_utilization_pct numeric DEFAULT 0,
    positions_count integer DEFAULT 0,
    positions_at_risk integer DEFAULT 0,
    snapshot_data jsonb,
    recorded_at timestamp with time zone DEFAULT now()
);


--
-- Name: market_followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_followers (
    user_id uuid NOT NULL,
    market_id uuid NOT NULL,
    notify_on_trade boolean DEFAULT true,
    notify_on_resolve boolean DEFAULT true,
    notify_on_price_change boolean DEFAULT false,
    price_alert_threshold numeric,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: matching_latency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matching_latency (
    id bigint NOT NULL,
    operation text NOT NULL,
    latency_us bigint NOT NULL,
    market_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: matching_latency_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matching_latency_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matching_latency_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matching_latency_id_seq OWNED BY public.matching_latency.id;


--
-- Name: matching_wal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matching_wal (
    id bigint NOT NULL,
    market_id uuid NOT NULL,
    sequence_number bigint NOT NULL,
    operation_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: matching_wal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matching_wal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matching_wal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matching_wal_id_seq OWNED BY public.matching_wal.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    notifications_enabled boolean DEFAULT true,
    order_fills_channels jsonb DEFAULT '["push"]'::jsonb,
    market_resolution_channels jsonb DEFAULT '["push", "email"]'::jsonb,
    price_alerts_channels jsonb DEFAULT '["push"]'::jsonb,
    position_risk_channels jsonb DEFAULT '["push", "email"]'::jsonb,
    social_channels jsonb DEFAULT '["push"]'::jsonb,
    system_maintenance_channels jsonb DEFAULT '["push", "email"]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text,
    message text,
    data jsonb DEFAULT '{}'::jsonb,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb,
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    market_id uuid,
    trade_id uuid,
    sender_id uuid,
    read_at timestamp with time zone
);


--
-- Name: oracle_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oracle_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    resolution_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    request_type text DEFAULT 'resolve'::text,
    proposer_id uuid,
    proposed_outcome text,
    confidence_score numeric(5,4),
    evidence_text text,
    evidence_urls text[],
    ai_analysis jsonb,
    bond_amount numeric(20,8) DEFAULT 100,
    bond_currency text DEFAULT 'USDT'::text,
    challenge_window_ends_at timestamp with time zone,
    processed_at timestamp with time zone,
    resolved_at timestamp with time zone,
    finalized_at timestamp with time zone,
    reasoning text,
    dispute_count integer DEFAULT 0,
    is_disputed boolean DEFAULT false,
    resolution text
);


--
-- Name: oracle_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oracle_verifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid,
    ai_result public.outcome_type,
    ai_confidence numeric(3,2),
    ai_reasoning text,
    scraped_data jsonb DEFAULT '{}'::jsonb,
    admin_id uuid,
    admin_decision public.outcome_type,
    admin_notes text,
    status public.oracle_status DEFAULT 'pending'::public.oracle_status,
    created_at timestamp with time zone DEFAULT now(),
    finalized_at timestamp with time zone
);


--
-- Name: order_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    market_id uuid NOT NULL,
    action public.order_activity_action NOT NULL,
    price numeric(5,4),
    size bigint,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_book; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_book (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    user_id uuid,
    side public.order_side NOT NULL,
    price numeric(5,4) NOT NULL,
    size bigint NOT NULL,
    filled bigint DEFAULT 0 NOT NULL,
    status public.order_status DEFAULT 'open'::public.order_status NOT NULL,
    order_type public.order_type DEFAULT 'limit'::public.order_type NOT NULL,
    time_in_force public.order_tif DEFAULT 'GTC'::public.order_tif,
    post_only boolean DEFAULT false NOT NULL,
    stp_flag public.stp_mode DEFAULT 'none'::public.stp_mode,
    avg_fill_price numeric(10,4) DEFAULT 0,
    original_quantity bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    queue_sequence bigint NOT NULL,
    tif text DEFAULT 'GTC'::text,
    gtd_expiry timestamp with time zone,
    fill_count integer DEFAULT 0,
    last_fill_at timestamp with time zone,
    time_priority integer DEFAULT 0,
    is_re_entry boolean DEFAULT false,
    parent_order_id uuid,
    quantity numeric(20,8) DEFAULT 0,
    filled_quantity numeric(20,8) DEFAULT 0,
    CONSTRAINT order_book_check CHECK (((filled >= 0) AND (filled <= size))),
    CONSTRAINT order_book_fill_check CHECK ((filled <= size)),
    CONSTRAINT order_book_price_range CHECK (((price > (0)::numeric) AND (price < (1)::numeric))),
    CONSTRAINT order_book_size_check CHECK ((size > 0))
);


--
-- Name: order_book_queue_sequence_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.order_book ALTER COLUMN queue_sequence ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_book_queue_sequence_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: order_commitments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_commitments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commitment_hash text NOT NULL,
    market_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid,
    user_id uuid,
    order_type public.order_type NOT NULL,
    side public.order_side NOT NULL,
    outcome public.outcome_type NOT NULL,
    price numeric(5,4) NOT NULL,
    quantity bigint NOT NULL,
    filled_quantity bigint DEFAULT 0,
    status public.order_status DEFAULT 'open'::public.order_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    average_fill_price numeric,
    idempotency_key text,
    type text DEFAULT 'limit'::text,
    remaining_quantity numeric(20,8),
    total_cost numeric(20,8),
    fee_amount numeric(20,8) DEFAULT 0,
    fee_rate numeric(10,6),
    cancelled_at timestamp with time zone,
    filled_at timestamp with time zone,
    reject_reason text,
    source text DEFAULT 'web'::text,
    is_post_only boolean DEFAULT false,
    is_reduce_only boolean DEFAULT false,
    CONSTRAINT orders_check CHECK ((filled_quantity <= quantity)),
    CONSTRAINT orders_price_check CHECK (((price > (0)::numeric) AND (price < (1)::numeric))),
    CONSTRAINT orders_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT plokymarket_valid_fill CHECK ((filled_quantity <= quantity))
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    method public.payment_method NOT NULL,
    amount numeric(12,2) NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status,
    transaction_id text,
    sender_number text,
    receiver_number text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT payment_transactions_amount_check CHECK ((amount > (0)::numeric))
);


--
-- Name: pmf_accrued_fees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pmf_accrued_fees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pool_id uuid,
    trade_id uuid,
    fee_amount numeric(20,8) NOT NULL,
    fee_type text DEFAULT 'trade'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE pmf_accrued_fees; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pmf_accrued_fees IS 'Trade fees accrued in PMF pools';


--
-- Name: pmf_distributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pmf_distributions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pool_id uuid,
    user_id uuid,
    shares_count numeric(20,8) NOT NULL,
    total_distribution numeric(20,8) NOT NULL,
    claimed_amount numeric(20,8) DEFAULT 0,
    status public.pmf_distribution_status DEFAULT 'pending'::public.pmf_distribution_status,
    distribution_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    claimed_at timestamp with time zone
);


--
-- Name: TABLE pmf_distributions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pmf_distributions IS 'Final distributions to LPs when pool is resolved';


--
-- Name: pmf_liquidity_additions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pmf_liquidity_additions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pool_id uuid,
    user_id uuid,
    amount0 numeric(20,8) NOT NULL,
    amount1 numeric(20,8) NOT NULL,
    shares_minted numeric(20,8) NOT NULL,
    price0 numeric(20,8),
    price1 numeric(20,8),
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE pmf_liquidity_additions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pmf_liquidity_additions IS 'History of liquidity additions to PMF pools';


--
-- Name: pmf_liquidity_removals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pmf_liquidity_removals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pool_id uuid,
    user_id uuid,
    shares_burned numeric(20,8) NOT NULL,
    amount0 numeric(20,8) NOT NULL,
    amount1 numeric(20,8) NOT NULL,
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE pmf_liquidity_removals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pmf_liquidity_removals IS 'History of liquidity removals from PMF pools';


--
-- Name: pmf_pool_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pmf_pool_shares (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pool_id uuid,
    user_id uuid,
    shares_count numeric(20,8) DEFAULT 0,
    liquidity_added numeric(20,8) DEFAULT 0,
    average_entry_price numeric(20,8),
    realized_pnl numeric(20,8) DEFAULT 0,
    pending_distribution numeric(20,8) DEFAULT 0,
    status public.pmf_position_status DEFAULT 'active'::public.pmf_position_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pmf_pool_shares_shares_count_check CHECK ((shares_count >= (0)::numeric))
);


--
-- Name: TABLE pmf_pool_shares; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pmf_pool_shares IS 'LP positions in PMF pools tracking shares and PnL';


--
-- Name: position_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.position_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    user_id uuid NOT NULL,
    outcome public.outcome_type NOT NULL,
    quantity bigint NOT NULL,
    avg_price numeric(5,4) NOT NULL,
    settlement_price numeric(5,4),
    realized_pnl numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid,
    user_id uuid,
    outcome public.outcome_type NOT NULL,
    quantity bigint DEFAULT 0,
    average_price numeric(5,4),
    realized_pnl numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    outcome_index integer,
    unrealized_pnl numeric(20,8) DEFAULT 0,
    side text DEFAULT 'buy'::text,
    CONSTRAINT positions_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: TABLE positions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.positions IS 'User positions - market_id references events.id (not markets.id)';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    balance numeric DEFAULT 0,
    total_deposited numeric DEFAULT 0,
    total_withdrawn numeric DEFAULT 0,
    kyc_status text DEFAULT 'none'::text,
    kyc_submitted_at timestamp with time zone,
    daily_withdrawal_limit numeric DEFAULT 50000,
    last_withdrawal_date date,
    referral_code text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_admin boolean DEFAULT false
);


--
-- Name: settlement_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settlement_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    market_id uuid NOT NULL,
    final_price numeric(5,4),
    winning_outcome public.outcome_type,
    total_volume bigint DEFAULT 0 NOT NULL,
    total_fees numeric(12,2) DEFAULT 0 NOT NULL,
    settlement_strategy public.settlement_strategy DEFAULT 'manual'::public.settlement_strategy,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trades (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid,
    buy_order_id uuid,
    sell_order_id uuid,
    outcome public.outcome_type NOT NULL,
    price numeric(5,4) NOT NULL,
    quantity bigint NOT NULL,
    buyer_id uuid,
    seller_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    maker_id uuid,
    maker_rebate_amount numeric(12,4) DEFAULT 0,
    maker_order_id uuid,
    taker_order_id uuid,
    taker_id uuid,
    executed_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    fee_amount numeric(20,8) DEFAULT 0,
    maker_fee numeric(20,8) DEFAULT 0,
    taker_fee numeric(20,8) DEFAULT 0,
    trade_type text DEFAULT 'external'::text,
    settlement_status text DEFAULT 'pending'::text,
    settled_at timestamp with time zone
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    type public.transaction_type NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_before numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    order_id uuid,
    trade_id uuid,
    market_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: upstash_workflow_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upstash_workflow_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_run_id text NOT NULL,
    message_id text,
    event_id uuid,
    market_id uuid,
    workflow_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    next_run_at timestamp with time zone,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    error_message text,
    error_details jsonb DEFAULT '{}'::jsonb,
    payload jsonb DEFAULT '{}'::jsonb,
    result jsonb DEFAULT '{}'::jsonb,
    execution_time_ms integer,
    steps_completed integer DEFAULT 0,
    total_steps integer DEFAULT 1,
    source character varying(20) DEFAULT 'upstash'::character varying,
    migrated_from_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT upstash_workflow_runs_source_check CHECK (((source)::text = ANY ((ARRAY['upstash'::character varying, 'n8n_migrated'::character varying, 'manual'::character varying])::text[]))),
    CONSTRAINT upstash_workflow_runs_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'RUNNING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'RETRYING'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT upstash_workflow_runs_workflow_type_check CHECK (((workflow_type)::text = ANY ((ARRAY['event_creation'::character varying, 'market_resolution'::character varying, 'deposit_notification'::character varying, 'withdrawal_processing'::character varying, 'daily_report'::character varying, 'auto_verification'::character varying, 'exchange_rate_update'::character varying, 'price_snapshot'::character varying, 'market_close_check'::character varying, 'settlement'::character varying, 'ai_oracle'::character varying, 'batch_markets'::character varying, 'cleanup'::character varying])::text[])))
);


--
-- Name: user_margin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_margin_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    auto_topup_enabled boolean DEFAULT false,
    auto_topup_threshold numeric DEFAULT 0.2,
    auto_topup_amount numeric DEFAULT 100,
    preferred_margin_ratio numeric DEFAULT 0.1,
    liquidation_protection_enabled boolean DEFAULT true,
    notifications_enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    avatar_url text,
    is_admin boolean DEFAULT false,
    is_super_admin boolean DEFAULT false,
    is_senior_counsel boolean DEFAULT false,
    last_admin_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    kyc_level integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    flags jsonb DEFAULT '{}'::jsonb,
    is_pro boolean DEFAULT false,
    can_create_events boolean DEFAULT false
);


--
-- Name: user_reputation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_reputation (
    user_id uuid NOT NULL,
    prediction_accuracy numeric DEFAULT 0,
    total_predictions integer DEFAULT 0,
    correct_predictions integer DEFAULT 0,
    reputation_score numeric DEFAULT 0,
    accuracy_tier text DEFAULT 'bronze'::text,
    volume_score numeric DEFAULT 0,
    consistency_score numeric DEFAULT 0,
    current_streak integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    rank_percentile numeric DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    phone text,
    full_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_admin boolean DEFAULT false,
    kyc_verified boolean DEFAULT false,
    privacy_tier text DEFAULT 'public'::text,
    follower_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    max_followers integer DEFAULT 1000,
    wallet_address text,
    display_name text,
    avatar_url text,
    kyc_status text DEFAULT 'none'::text,
    kyc_verified_at timestamp with time zone,
    is_super_admin boolean DEFAULT false
);


--
-- Name: v_pmf_active_pools; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_pmf_active_pools AS
 SELECT pp.id AS pool_id,
    pp.name AS pool_name,
    pp.market_id,
    m.question AS market_question,
    m.category AS market_category,
    pp.status,
    pp.current_liquidity,
    pp.total_shares,
    pp.fee_rate,
    pp.created_at,
    pp.activated_at
   FROM (public.pmf_liquidity_pools pp
     JOIN public.markets m ON ((pp.market_id = m.id)))
  WHERE (pp.status = ANY (ARRAY['active'::public.pmf_pool_status, 'initializing'::public.pmf_pool_status, 'paused'::public.pmf_pool_status, 'draining'::public.pmf_pool_status]));


--
-- Name: v_pmf_user_portfolio; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_pmf_user_portfolio AS
 SELECT ps.user_id,
    count(DISTINCT ps.pool_id) AS pools_count,
    sum(ps.shares_count) AS total_shares,
    sum(ps.liquidity_added) AS total_liquidity_added,
    sum(ps.realized_pnl) AS total_realized_pnl,
    sum(ps.pending_distribution) AS total_pending_distribution,
    count(
        CASE
            WHEN (ps.status = 'active'::public.pmf_position_status) THEN 1
            ELSE NULL::integer
        END) AS active_positions,
    count(
        CASE
            WHEN (ps.status = 'claimed'::public.pmf_position_status) THEN 1
            ELSE NULL::integer
        END) AS claimed_positions
   FROM public.pmf_pool_shares ps
  GROUP BY ps.user_id;


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type public.transaction_type NOT NULL,
    amount numeric NOT NULL,
    balance_after numeric NOT NULL,
    reference_id uuid,
    reference_type text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    balance numeric(12,2) DEFAULT 0,
    locked_balance numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    usdt_address text,
    usdc_address text,
    qr_code_url text,
    network_type text DEFAULT 'TRC20'::text,
    address_type text DEFAULT 'user'::text,
    is_active boolean DEFAULT true,
    version integer DEFAULT 1,
    asset text DEFAULT 'BDT'::text,
    total_deposited numeric(20,8) DEFAULT 0,
    total_withdrawn numeric(20,8) DEFAULT 0,
    total_earned numeric(20,8) DEFAULT 0,
    total_fees_paid numeric(20,8) DEFAULT 0,
    last_deposit_at timestamp with time zone,
    last_withdrawal_at timestamp with time zone,
    currency text DEFAULT 'BDT'::text,
    daily_withdrawal_limit numeric(20,8),
    monthly_withdrawal_limit numeric(20,8),
    risk_score integer DEFAULT 0,
    usdt_balance numeric(20,8) DEFAULT 0,
    locked_usdt numeric(20,8) DEFAULT 0,
    CONSTRAINT wallets_balance_check CHECK ((balance >= (0)::numeric)),
    CONSTRAINT wallets_locked_balance_check CHECK ((locked_balance >= (0)::numeric))
);


--
-- Name: withdrawal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawal_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    usdt_amount numeric(20,8) DEFAULT 0 NOT NULL,
    bdt_amount numeric(20,8),
    exchange_rate numeric(20,10),
    mfs_provider text,
    recipient_number text,
    recipient_name text,
    status text DEFAULT 'pending'::text,
    balance_hold_id uuid,
    processed_by uuid,
    processed_at timestamp with time zone,
    admin_notes text,
    transfer_proof_url text,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT withdrawal_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'processing'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: workflow_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint text NOT NULL,
    cron_expression text DEFAULT '0 */4 * * *'::text,
    is_active boolean DEFAULT true,
    last_run timestamp with time zone,
    next_run timestamp with time zone,
    last_status text,
    execution_time_ms integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: workflow_dlq; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_dlq (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_run_id text NOT NULL,
    error_message text NOT NULL,
    error_stack text,
    error_code character varying(50),
    failed_at timestamp with time zone DEFAULT now(),
    failed_step character varying(100),
    payload_snapshot jsonb DEFAULT '{}'::jsonb,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_action character varying(20),
    resolution_notes text,
    retry_attempts integer DEFAULT 0,
    last_retry_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT workflow_dlq_resolution_action_check CHECK (((resolution_action)::text = ANY ((ARRAY['retry'::character varying, 'discard'::character varying, 'manual_resolve'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: workflow_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id text,
    name character varying(100) NOT NULL,
    workflow_type character varying(50) NOT NULL,
    cron_expression text NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Dhaka'::character varying,
    endpoint_url text NOT NULL,
    method character varying(10) DEFAULT 'POST'::character varying,
    headers jsonb DEFAULT '{}'::jsonb,
    default_payload jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_run_at timestamp with time zone,
    last_run_status character varying(20),
    next_run_at timestamp with time zone,
    total_runs integer DEFAULT 0,
    successful_runs integer DEFAULT 0,
    failed_runs integer DEFAULT 0,
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: matching_latency id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matching_latency ALTER COLUMN id SET DEFAULT nextval('public.matching_latency_id_seq'::regclass);


--
-- Name: matching_wal id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matching_wal ALTER COLUMN id SET DEFAULT nextval('public.matching_wal_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (provider, id);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_feed activity_feed_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_feed
    ADD CONSTRAINT activity_feed_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_logs admin_activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_ai_settings admin_ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_settings
    ADD CONSTRAINT admin_ai_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--
-- Name: ai_configs ai_configs_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_configs
    ADD CONSTRAINT ai_configs_config_key_key UNIQUE (config_key);


--
-- Name: ai_configs ai_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_configs
    ADD CONSTRAINT ai_configs_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conditional_orders conditional_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conditional_orders
    ADD CONSTRAINT conditional_orders_pkey PRIMARY KEY (id);


--
-- Name: daily_topics daily_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_topics
    ADD CONSTRAINT daily_topics_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_dispute_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_dispute_id_key UNIQUE (dispute_id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: event_definitions events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_definitions
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: event_definitions events_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_definitions
    ADD CONSTRAINT events_slug_key UNIQUE (slug);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: fill_records fill_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fill_records
    ADD CONSTRAINT fill_records_pkey PRIMARY KEY (id);


--
-- Name: follows follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: frozen_funds frozen_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frozen_funds
    ADD CONSTRAINT frozen_funds_pkey PRIMARY KEY (id);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: kyc_submissions kyc_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_submissions
    ADD CONSTRAINT kyc_submissions_pkey PRIMARY KEY (id);


--
-- Name: leaderboard leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_pkey PRIMARY KEY (id);


--
-- Name: leaderboard leaderboard_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_user_id_key UNIQUE (user_id);


--
-- Name: maker_stats maker_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maker_stats
    ADD CONSTRAINT maker_stats_pkey PRIMARY KEY (id);


--
-- Name: maker_stats maker_stats_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maker_stats
    ADD CONSTRAINT maker_stats_user_id_key UNIQUE (user_id);


--
-- Name: margin_history margin_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_history
    ADD CONSTRAINT margin_history_pkey PRIMARY KEY (id);


--
-- Name: margin_locks margin_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_locks
    ADD CONSTRAINT margin_locks_pkey PRIMARY KEY (id);


--
-- Name: margin_snapshots margin_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_snapshots
    ADD CONSTRAINT margin_snapshots_pkey PRIMARY KEY (id);


--
-- Name: market_followers market_followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_followers
    ADD CONSTRAINT market_followers_pkey PRIMARY KEY (user_id, market_id);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: matching_latency matching_latency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matching_latency
    ADD CONSTRAINT matching_latency_pkey PRIMARY KEY (id);


--
-- Name: matching_wal matching_wal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matching_wal
    ADD CONSTRAINT matching_wal_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oracle_requests oracle_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracle_requests
    ADD CONSTRAINT oracle_requests_pkey PRIMARY KEY (id);


--
-- Name: oracle_verifications oracle_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracle_verifications
    ADD CONSTRAINT oracle_verifications_pkey PRIMARY KEY (id);


--
-- Name: order_activity order_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT order_activity_pkey PRIMARY KEY (id);


--
-- Name: order_book order_book_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_book
    ADD CONSTRAINT order_book_pkey PRIMARY KEY (id);


--
-- Name: order_commitments order_commitments_commitment_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_commitments
    ADD CONSTRAINT order_commitments_commitment_hash_key UNIQUE (commitment_hash);


--
-- Name: order_commitments order_commitments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_commitments
    ADD CONSTRAINT order_commitments_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_transaction_id_key UNIQUE (transaction_id);


--
-- Name: pmf_accrued_fees pmf_accrued_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_accrued_fees
    ADD CONSTRAINT pmf_accrued_fees_pkey PRIMARY KEY (id);


--
-- Name: pmf_distributions pmf_distributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_distributions
    ADD CONSTRAINT pmf_distributions_pkey PRIMARY KEY (id);


--
-- Name: pmf_distributions pmf_distributions_pool_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_distributions
    ADD CONSTRAINT pmf_distributions_pool_id_user_id_key UNIQUE (pool_id, user_id);


--
-- Name: pmf_liquidity_additions pmf_liquidity_additions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_additions
    ADD CONSTRAINT pmf_liquidity_additions_pkey PRIMARY KEY (id);


--
-- Name: pmf_liquidity_pools pmf_liquidity_pools_market_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_pools
    ADD CONSTRAINT pmf_liquidity_pools_market_id_key UNIQUE (market_id);


--
-- Name: pmf_liquidity_pools pmf_liquidity_pools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_pools
    ADD CONSTRAINT pmf_liquidity_pools_pkey PRIMARY KEY (id);


--
-- Name: pmf_liquidity_removals pmf_liquidity_removals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_removals
    ADD CONSTRAINT pmf_liquidity_removals_pkey PRIMARY KEY (id);


--
-- Name: pmf_pool_shares pmf_pool_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_pool_shares
    ADD CONSTRAINT pmf_pool_shares_pkey PRIMARY KEY (id);


--
-- Name: pmf_pool_shares pmf_pool_shares_pool_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_pool_shares
    ADD CONSTRAINT pmf_pool_shares_pool_id_user_id_key UNIQUE (pool_id, user_id);


--
-- Name: position_snapshots position_snapshots_market_id_user_id_outcome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_snapshots
    ADD CONSTRAINT position_snapshots_market_id_user_id_outcome_key UNIQUE (market_id, user_id, outcome);


--
-- Name: position_snapshots position_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_snapshots
    ADD CONSTRAINT position_snapshots_pkey PRIMARY KEY (id);


--
-- Name: positions positions_market_id_user_id_outcome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_market_id_user_id_outcome_key UNIQUE (market_id, user_id, outcome);


--
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: settlement_records settlement_records_market_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_records
    ADD CONSTRAINT settlement_records_market_id_key UNIQUE (market_id);


--
-- Name: settlement_records settlement_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_records
    ADD CONSTRAINT settlement_records_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: upstash_workflow_runs upstash_workflow_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upstash_workflow_runs
    ADD CONSTRAINT upstash_workflow_runs_pkey PRIMARY KEY (id);


--
-- Name: upstash_workflow_runs upstash_workflow_runs_workflow_run_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upstash_workflow_runs
    ADD CONSTRAINT upstash_workflow_runs_workflow_run_id_key UNIQUE (workflow_run_id);


--
-- Name: user_margin_settings user_margin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_margin_settings
    ADD CONSTRAINT user_margin_settings_pkey PRIMARY KEY (id);


--
-- Name: user_margin_settings user_margin_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_margin_settings
    ADD CONSTRAINT user_margin_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_reputation user_reputation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reputation
    ADD CONSTRAINT user_reputation_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);


--
-- Name: withdrawal_requests withdrawal_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id);


--
-- Name: workflow_configs workflow_configs_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_configs
    ADD CONSTRAINT workflow_configs_name_key UNIQUE (name);


--
-- Name: workflow_configs workflow_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_configs
    ADD CONSTRAINT workflow_configs_pkey PRIMARY KEY (id);


--
-- Name: workflow_dlq workflow_dlq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_dlq
    ADD CONSTRAINT workflow_dlq_pkey PRIMARY KEY (id);


--
-- Name: workflow_schedules workflow_schedules_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT workflow_schedules_name_key UNIQUE (name);


--
-- Name: workflow_schedules workflow_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT workflow_schedules_pkey PRIMARY KEY (id);


--
-- Name: workflow_schedules workflow_schedules_schedule_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT workflow_schedules_schedule_id_key UNIQUE (schedule_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: schema_migrations_version_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX schema_migrations_version_idx ON auth.schema_migrations USING btree (version);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: idx_activities_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_created ON public.activities USING btree (created_at DESC);


--
-- Name: idx_activities_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activities_user ON public.activities USING btree (user_id);


--
-- Name: idx_activity_feed_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_feed_created_at ON public.activity_feed USING btree (created_at DESC);


--
-- Name: idx_activity_feed_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_feed_user_id ON public.activity_feed USING btree (user_id);


--
-- Name: idx_admin_activity_logs_admin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_activity_logs_admin ON public.admin_activity_logs USING btree (admin_id);


--
-- Name: idx_admin_activity_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_activity_logs_created ON public.admin_activity_logs USING btree (created_at DESC);


--
-- Name: idx_admin_audit_log_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_performed_by ON public.admin_audit_log USING btree (performed_by);


--
-- Name: idx_admin_audit_log_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_audit_log_target ON public.admin_audit_log USING btree (target_table, target_id);


--
-- Name: idx_comments_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_market_id ON public.comments USING btree (market_id);


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--
-- Name: idx_conditional_orders_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conditional_orders_active ON public.conditional_orders USING btree (market_id, status, trigger_price) WHERE (status = 'active'::text);


--
-- Name: idx_conditional_orders_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conditional_orders_expires ON public.conditional_orders USING btree (expires_at) WHERE (status = 'active'::text);


--
-- Name: idx_conditional_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conditional_orders_user ON public.conditional_orders USING btree (user_id, status, created_at DESC);


--
-- Name: idx_disputes_challenger; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_challenger ON public.disputes USING btree (challenger_id);


--
-- Name: idx_disputes_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_market ON public.disputes USING btree (market_id);


--
-- Name: idx_disputes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);


--
-- Name: idx_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_created_at ON public.event_definitions USING btree (created_at DESC);


--
-- Name: idx_events_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_events_slug ON public.event_definitions USING btree (slug);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status ON public.event_definitions USING btree (status);


--
-- Name: idx_events_status_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_events_status_category ON public.event_definitions USING btree (status, category_id);


--
-- Name: idx_exchange_rates_base; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_base ON public.exchange_rates USING btree (base_currency, quote_currency);


--
-- Name: idx_exchange_rates_currencies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates USING btree (base_currency, quote_currency);


--
-- Name: idx_fill_records_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fill_records_market ON public.fill_records USING btree (market_id, created_at DESC);


--
-- Name: idx_fill_records_trade_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fill_records_trade_number ON public.fill_records USING btree (market_id, trade_number);


--
-- Name: idx_follows_follower; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);


--
-- Name: idx_frozen_funds_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_frozen_funds_user ON public.frozen_funds USING btree (user_id, released_at);


--
-- Name: idx_kyc_documents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_documents_status ON public.kyc_documents USING btree (status);


--
-- Name: idx_kyc_documents_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_documents_user ON public.kyc_documents USING btree (user_id);


--
-- Name: idx_kyc_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_submissions_status ON public.kyc_submissions USING btree (status);


--
-- Name: idx_kyc_submissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kyc_submissions_user ON public.kyc_submissions USING btree (user_id);


--
-- Name: idx_leaderboard_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_score ON public.leaderboard USING btree (score DESC);


--
-- Name: idx_leaderboard_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_user_id ON public.leaderboard USING btree (user_id);


--
-- Name: idx_margin_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_history_created_at ON public.margin_history USING btree (created_at DESC);


--
-- Name: idx_margin_history_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_history_event_type ON public.margin_history USING btree (event_type);


--
-- Name: idx_margin_history_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_history_market_id ON public.margin_history USING btree (market_id);


--
-- Name: idx_margin_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_history_user_id ON public.margin_history USING btree (user_id);


--
-- Name: idx_margin_locks_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_locks_order_id ON public.margin_locks USING btree (order_id);


--
-- Name: idx_margin_locks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_locks_status ON public.margin_locks USING btree (status);


--
-- Name: idx_margin_locks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_locks_user_id ON public.margin_locks USING btree (user_id);


--
-- Name: idx_margin_snapshots_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_snapshots_recorded_at ON public.margin_snapshots USING btree (recorded_at DESC);


--
-- Name: idx_margin_snapshots_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_snapshots_type ON public.margin_snapshots USING btree (snapshot_type);


--
-- Name: idx_margin_snapshots_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_margin_snapshots_user_id ON public.margin_snapshots USING btree (user_id);


--
-- Name: idx_markets_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markets_category ON public.markets USING btree (category);


--
-- Name: idx_markets_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markets_creator ON public.markets USING btree (creator_id);


--
-- Name: idx_markets_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markets_event_id ON public.markets USING btree (event_id);


--
-- Name: idx_markets_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markets_slug ON public.markets USING btree (slug);


--
-- Name: idx_markets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_markets_status ON public.markets USING btree (status, created_at DESC);


--
-- Name: idx_matching_latency_ops; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matching_latency_ops ON public.matching_latency USING btree (operation, created_at DESC);


--
-- Name: idx_matching_wal_market_seq; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matching_wal_market_seq ON public.matching_wal USING btree (market_id, sequence_number);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (user_id, read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_oracle_requests_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oracle_requests_market_id ON public.oracle_requests USING btree (market_id);


--
-- Name: idx_order_activity_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_activity_market ON public.order_activity USING btree (market_id, created_at DESC);


--
-- Name: idx_order_activity_user_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_activity_user_market ON public.order_activity USING btree (user_id, market_id, created_at DESC);


--
-- Name: idx_order_book_market_side; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_book_market_side ON public.order_book USING btree (market_id, side);


--
-- Name: idx_order_book_market_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_book_market_user ON public.order_book USING btree (market_id, user_id);


--
-- Name: idx_order_book_matching; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_book_matching ON public.order_book USING btree (market_id, side, status, price, queue_sequence) WHERE (status = ANY (ARRAY['open'::public.order_status, 'partially_filled'::public.order_status]));


--
-- Name: idx_order_book_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_book_status ON public.order_book USING btree (status);


--
-- Name: idx_order_commitments_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_commitments_market ON public.order_commitments USING btree (market_id);


--
-- Name: idx_order_commitments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_commitments_user ON public.order_commitments USING btree (user_id);


--
-- Name: idx_orders_idempotency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_idempotency ON public.orders USING btree (user_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: idx_orders_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_market_id ON public.orders USING btree (market_id);


--
-- Name: idx_orders_market_side; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_market_side ON public.orders USING btree (market_id, side);


--
-- Name: idx_orders_market_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_market_user ON public.orders USING btree (market_id, user_id);


--
-- Name: idx_orders_matching; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_matching ON public.orders USING btree (market_id, outcome, side, status, price, created_at) WHERE (status = ANY (ARRAY['open'::public.order_status, 'partially_filled'::public.order_status]));


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id, status);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_pmf_additions_pool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_additions_pool ON public.pmf_liquidity_additions USING btree (pool_id);


--
-- Name: idx_pmf_distributions_pool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_distributions_pool ON public.pmf_distributions USING btree (pool_id);


--
-- Name: idx_pmf_pools_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_pools_market ON public.pmf_liquidity_pools USING btree (market_id);


--
-- Name: idx_pmf_pools_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_pools_status ON public.pmf_liquidity_pools USING btree (status);


--
-- Name: idx_pmf_removals_pool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_removals_pool ON public.pmf_liquidity_removals USING btree (pool_id);


--
-- Name: idx_pmf_shares_pool; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_shares_pool ON public.pmf_pool_shares USING btree (pool_id);


--
-- Name: idx_pmf_shares_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pmf_shares_user ON public.pmf_pool_shares USING btree (user_id);


--
-- Name: idx_positions_user_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_positions_user_market ON public.positions USING btree (user_id, market_id);


--
-- Name: idx_trades_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_created ON public.trades USING btree (created_at DESC);


--
-- Name: idx_trades_maker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_maker ON public.trades USING btree (market_id, maker_id);


--
-- Name: idx_trades_maker_rebate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_maker_rebate ON public.trades USING btree (maker_rebate_amount) WHERE (maker_rebate_amount > (0)::numeric);


--
-- Name: idx_trades_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_market ON public.trades USING btree (market_id, created_at DESC);


--
-- Name: idx_trades_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_market_id ON public.trades USING btree (market_id);


--
-- Name: idx_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);


--
-- Name: idx_transactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user ON public.transactions USING btree (user_id, created_at DESC);


--
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- Name: idx_upstash_workflow_runs_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upstash_workflow_runs_event_id ON public.upstash_workflow_runs USING btree (event_id) WHERE (event_id IS NOT NULL);


--
-- Name: idx_upstash_workflow_runs_market_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upstash_workflow_runs_market_id ON public.upstash_workflow_runs USING btree (market_id) WHERE (market_id IS NOT NULL);


--
-- Name: idx_upstash_workflow_runs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upstash_workflow_runs_status ON public.upstash_workflow_runs USING btree (status);


--
-- Name: idx_upstash_workflow_runs_workflow_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_upstash_workflow_runs_workflow_type ON public.upstash_workflow_runs USING btree (workflow_type);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: idx_wallet_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions USING btree (created_at DESC);


--
-- Name: idx_wallet_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions USING btree (user_id);


--
-- Name: idx_wallets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallets_user ON public.wallets USING btree (user_id);


--
-- Name: idx_wallets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id);


--
-- Name: idx_workflow_configs_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_configs_is_active ON public.workflow_configs USING btree (is_active);


--
-- Name: idx_workflow_dlq_resolved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_dlq_resolved ON public.workflow_dlq USING btree (resolved_at) WHERE (resolved_at IS NULL);


--
-- Name: idx_workflow_dlq_workflow_run_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_dlq_workflow_run_id ON public.workflow_dlq USING btree (workflow_run_id);


--
-- Name: plokymarket_idx_markets_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_markets_category ON public.markets USING btree (category);


--
-- Name: plokymarket_idx_markets_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_markets_status ON public.markets USING btree (status, created_at DESC);


--
-- Name: plokymarket_idx_orders_market_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_orders_market_user ON public.orders USING btree (market_id, user_id);


--
-- Name: plokymarket_idx_orders_matching; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_orders_matching ON public.orders USING btree (market_id, outcome, side, status, price, created_at) WHERE (status = ANY (ARRAY['open'::public.order_status, 'partially_filled'::public.order_status]));


--
-- Name: plokymarket_idx_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_orders_user ON public.orders USING btree (user_id, status);


--
-- Name: plokymarket_idx_positions_user_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_positions_user_market ON public.positions USING btree (user_id, market_id);


--
-- Name: plokymarket_idx_trades_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_trades_created ON public.trades USING btree (created_at DESC);


--
-- Name: plokymarket_idx_trades_market; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_trades_market ON public.trades USING btree (market_id, created_at DESC);


--
-- Name: plokymarket_idx_transactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_transactions_user ON public.transactions USING btree (user_id, created_at DESC);


--
-- Name: plokymarket_idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_users_email ON public.users USING btree (email);


--
-- Name: plokymarket_idx_wallets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX plokymarket_idx_wallets_user ON public.wallets USING btree (user_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: ai_configs ai_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_configs_updated_at BEFORE UPDATE ON public.ai_configs FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: event_definitions events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.event_definitions FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: kyc_documents kyc_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: leaderboard leaderboard_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER leaderboard_updated_at BEFORE UPDATE ON public.leaderboard FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: notification_preferences notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: conditional_orders on_conditional_order_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_conditional_order_created AFTER INSERT ON public.conditional_orders FOR EACH ROW EXECUTE FUNCTION public.log_conditional_order_created();


--
-- Name: conditional_orders on_conditional_order_triggered; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_conditional_order_triggered AFTER UPDATE OF status ON public.conditional_orders FOR EACH ROW EXECUTE FUNCTION public.log_conditional_order_triggered();


--
-- Name: orders on_order_cancelled; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_order_cancelled AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.trigger_release_margin_on_cancel();


--
-- Name: oracle_requests oracle_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER oracle_requests_updated_at BEFORE UPDATE ON public.oracle_requests FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: order_book plokymarket_order_book_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER plokymarket_order_book_updated_at BEFORE UPDATE ON public.order_book FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: orders plokymarket_update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER plokymarket_update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: positions plokymarket_update_positions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER plokymarket_update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: users plokymarket_update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER plokymarket_update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: wallets plokymarket_update_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER plokymarket_update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: users plokymarket_wallet_on_user; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER plokymarket_wallet_on_user AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.plokymarket_create_wallet_on_user();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: pmf_liquidity_pools trigger_pmf_pools_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_pmf_pools_timestamp BEFORE UPDATE ON public.pmf_liquidity_pools FOR EACH ROW EXECUTE FUNCTION public.update_pmf_timestamp();


--
-- Name: pmf_pool_shares trigger_pmf_shares_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_pmf_shares_timestamp BEFORE UPDATE ON public.pmf_pool_shares FOR EACH ROW EXECUTE FUNCTION public.update_pmf_timestamp();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: positions update_positions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: wallets update_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_profiles user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: user_reputation user_reputation_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_reputation_updated_at BEFORE UPDATE ON public.user_reputation FOR EACH ROW EXECUTE FUNCTION public.plokymarket_update_updated_at();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: activities activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: activity_feed activity_feed_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_feed
    ADD CONSTRAINT activity_feed_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: admin_activity_logs admin_activity_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: admin_ai_settings admin_ai_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_ai_settings
    ADD CONSTRAINT admin_ai_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: admin_audit_log admin_audit_log_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: comments comments_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conditional_orders conditional_orders_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conditional_orders
    ADD CONSTRAINT conditional_orders_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: conditional_orders conditional_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conditional_orders
    ADD CONSTRAINT conditional_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_challenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_challenger_id_fkey FOREIGN KEY (challenger_id) REFERENCES public.users(id);


--
-- Name: disputes disputes_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: disputes disputes_proposer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES public.users(id);


--
-- Name: fill_records fill_records_buy_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fill_records
    ADD CONSTRAINT fill_records_buy_order_id_fkey FOREIGN KEY (buy_order_id) REFERENCES public.order_book(id) ON DELETE SET NULL;


--
-- Name: fill_records fill_records_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fill_records
    ADD CONSTRAINT fill_records_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: fill_records fill_records_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fill_records
    ADD CONSTRAINT fill_records_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: fill_records fill_records_sell_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fill_records
    ADD CONSTRAINT fill_records_sell_order_id_fkey FOREIGN KEY (sell_order_id) REFERENCES public.order_book(id) ON DELETE SET NULL;


--
-- Name: fill_records fill_records_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fill_records
    ADD CONSTRAINT fill_records_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conditional_orders fk_market; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conditional_orders
    ADD CONSTRAINT fk_market FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: conditional_orders fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conditional_orders
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: frozen_funds frozen_funds_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frozen_funds
    ADD CONSTRAINT frozen_funds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_book(id) ON DELETE CASCADE;


--
-- Name: frozen_funds frozen_funds_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frozen_funds
    ADD CONSTRAINT frozen_funds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: kyc_documents kyc_documents_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: kyc_documents kyc_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: kyc_submissions kyc_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_submissions
    ADD CONSTRAINT kyc_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: kyc_submissions kyc_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_submissions
    ADD CONSTRAINT kyc_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leaderboard leaderboard_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard
    ADD CONSTRAINT leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: maker_stats maker_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maker_stats
    ADD CONSTRAINT maker_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: margin_history margin_history_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_history
    ADD CONSTRAINT margin_history_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE SET NULL;


--
-- Name: margin_history margin_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_history
    ADD CONSTRAINT margin_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: margin_history margin_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_history
    ADD CONSTRAINT margin_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: margin_locks margin_locks_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_locks
    ADD CONSTRAINT margin_locks_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: margin_locks margin_locks_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_locks
    ADD CONSTRAINT margin_locks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: margin_locks margin_locks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_locks
    ADD CONSTRAINT margin_locks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: margin_snapshots margin_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.margin_snapshots
    ADD CONSTRAINT margin_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: market_followers market_followers_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_followers
    ADD CONSTRAINT market_followers_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: market_followers market_followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_followers
    ADD CONSTRAINT market_followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: markets markets_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: markets markets_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_definitions(id) ON DELETE SET NULL;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oracle_requests oracle_requests_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracle_requests
    ADD CONSTRAINT oracle_requests_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: oracle_requests oracle_requests_proposer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracle_requests
    ADD CONSTRAINT oracle_requests_proposer_id_fkey FOREIGN KEY (proposer_id) REFERENCES public.users(id);


--
-- Name: oracle_verifications oracle_verifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracle_verifications
    ADD CONSTRAINT oracle_verifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: oracle_verifications oracle_verifications_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oracle_verifications
    ADD CONSTRAINT oracle_verifications_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: order_activity order_activity_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT order_activity_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: order_activity order_activity_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT order_activity_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_book(id) ON DELETE CASCADE;


--
-- Name: order_activity order_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_activity
    ADD CONSTRAINT order_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_book order_book_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_book
    ADD CONSTRAINT order_book_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: order_book order_book_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_book
    ADD CONSTRAINT order_book_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_commitments order_commitments_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_commitments
    ADD CONSTRAINT order_commitments_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: order_commitments order_commitments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_commitments
    ADD CONSTRAINT order_commitments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: orders orders_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pmf_accrued_fees pmf_accrued_fees_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_accrued_fees
    ADD CONSTRAINT pmf_accrued_fees_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE;


--
-- Name: pmf_accrued_fees pmf_accrued_fees_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_accrued_fees
    ADD CONSTRAINT pmf_accrued_fees_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id);


--
-- Name: pmf_distributions pmf_distributions_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_distributions
    ADD CONSTRAINT pmf_distributions_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE;


--
-- Name: pmf_distributions pmf_distributions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_distributions
    ADD CONSTRAINT pmf_distributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pmf_liquidity_additions pmf_liquidity_additions_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_additions
    ADD CONSTRAINT pmf_liquidity_additions_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE;


--
-- Name: pmf_liquidity_additions pmf_liquidity_additions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_additions
    ADD CONSTRAINT pmf_liquidity_additions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pmf_liquidity_pools pmf_liquidity_pools_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_pools
    ADD CONSTRAINT pmf_liquidity_pools_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: pmf_liquidity_pools pmf_liquidity_pools_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_pools
    ADD CONSTRAINT pmf_liquidity_pools_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: pmf_liquidity_removals pmf_liquidity_removals_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_removals
    ADD CONSTRAINT pmf_liquidity_removals_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE;


--
-- Name: pmf_liquidity_removals pmf_liquidity_removals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_liquidity_removals
    ADD CONSTRAINT pmf_liquidity_removals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pmf_pool_shares pmf_pool_shares_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_pool_shares
    ADD CONSTRAINT pmf_pool_shares_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES public.pmf_liquidity_pools(id) ON DELETE CASCADE;


--
-- Name: pmf_pool_shares pmf_pool_shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pmf_pool_shares
    ADD CONSTRAINT pmf_pool_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: position_snapshots position_snapshots_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_snapshots
    ADD CONSTRAINT position_snapshots_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: position_snapshots position_snapshots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.position_snapshots
    ADD CONSTRAINT position_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: positions positions_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: positions positions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: settlement_records settlement_records_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_records
    ADD CONSTRAINT settlement_records_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: settlement_records settlement_records_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlement_records
    ADD CONSTRAINT settlement_records_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: trades trades_buy_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_buy_order_id_fkey FOREIGN KEY (buy_order_id) REFERENCES public.orders(id);


--
-- Name: trades trades_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: trades trades_maker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_maker_id_fkey FOREIGN KEY (maker_id) REFERENCES public.users(id);


--
-- Name: trades trades_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: trades trades_sell_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_sell_order_id_fkey FOREIGN KEY (sell_order_id) REFERENCES public.orders(id);


--
-- Name: trades trades_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: transactions transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: transactions transactions_trade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id);


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: upstash_workflow_runs upstash_workflow_runs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upstash_workflow_runs
    ADD CONSTRAINT upstash_workflow_runs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_definitions(id) ON DELETE SET NULL;


--
-- Name: upstash_workflow_runs upstash_workflow_runs_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upstash_workflow_runs
    ADD CONSTRAINT upstash_workflow_runs_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE SET NULL;


--
-- Name: user_margin_settings user_margin_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_margin_settings
    ADD CONSTRAINT user_margin_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_reputation user_reputation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reputation
    ADD CONSTRAINT user_reputation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: withdrawal_requests withdrawal_requests_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: withdrawal_requests withdrawal_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawal_requests
    ADD CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: workflow_dlq workflow_dlq_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_dlq
    ADD CONSTRAINT workflow_dlq_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: workflow_dlq workflow_dlq_workflow_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_dlq
    ADD CONSTRAINT workflow_dlq_workflow_run_id_fkey FOREIGN KEY (workflow_run_id) REFERENCES public.upstash_workflow_runs(workflow_run_id);


--
-- Name: workflow_schedules workflow_schedules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT workflow_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ai_configs AI configs readable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "AI configs readable by authenticated" ON public.ai_configs FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: activity_feed Activity feed selectable by owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Activity feed selectable by owner" ON public.activity_feed FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: admin_ai_settings Admin AI settings service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin AI settings service role" ON public.admin_ai_settings TO service_role USING (true) WITH CHECK (true);


--
-- Name: settlement_records Admin can create settlements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can create settlements" ON public.settlement_records FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: markets Admin can insert markets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert markets" ON public.markets FOR INSERT TO authenticated WITH CHECK ((public.is_admin_user() = true));


--
-- Name: oracle_verifications Admin can insert oracle_verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert oracle_verifications" ON public.oracle_verifications FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: payment_transactions Admin can insert payment_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert payment_transactions" ON public.payment_transactions FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: trades Admin can insert trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can insert trades" ON public.trades FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: users Admin can select users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can select users" ON public.users FOR SELECT TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: orders Admin can update any order; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update any order" ON public.orders FOR UPDATE TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: markets Admin can update markets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update markets" ON public.markets FOR UPDATE TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: oracle_verifications Admin can update oracle_verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update oracle_verifications" ON public.oracle_verifications FOR UPDATE TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: payment_transactions Admin can update payment_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update payment_transactions" ON public.payment_transactions FOR UPDATE TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: users Admin can update users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can update users" ON public.users FOR UPDATE TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: payment_transactions Admin can view all payment_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all payment_transactions" ON public.payment_transactions FOR SELECT TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: oracle_verifications Admin can view oracle_verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view oracle_verifications" ON public.oracle_verifications FOR SELECT TO authenticated USING ((public.is_admin_user() = true));


--
-- Name: withdrawal_requests Admins can manage all withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawal_requests USING (public.is_admin_user());


--
-- Name: markets Admins can manage markets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage markets" ON public.markets USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: oracle_verifications Admins can manage oracle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage oracle" ON public.oracle_verifications USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: admin_activity_logs Admins can view admin activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view admin activity logs" ON public.admin_activity_logs FOR SELECT USING (true);


--
-- Name: admin_audit_log Admins can view admin audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view admin audit log" ON public.admin_audit_log FOR SELECT USING (public.is_admin_user());


--
-- Name: workflow_configs Admins can view workflow configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view workflow configs" ON public.workflow_configs FOR SELECT USING (public.is_admin_user());


--
-- Name: markets Anyone can read markets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read markets" ON public.markets FOR SELECT USING (true);


--
-- Name: trades Anyone can read trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can read trades" ON public.trades FOR SELECT USING (true);


--
-- Name: markets Anyone can view active markets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active markets" ON public.markets FOR SELECT TO anon, authenticated USING (((status = 'active'::public.market_status) OR (public.is_admin_user() = true)));


--
-- Name: fill_records Anyone can view fills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view fills" ON public.fill_records FOR SELECT TO anon, authenticated USING (true);


--
-- Name: maker_stats Anyone can view maker stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view maker stats" ON public.maker_stats FOR SELECT TO anon, authenticated USING (true);


--
-- Name: order_activity Anyone can view order activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view order activity" ON public.order_activity FOR SELECT TO anon, authenticated USING (true);


--
-- Name: order_book Anyone can view order_book; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view order_book" ON public.order_book FOR SELECT TO anon, authenticated USING (true);


--
-- Name: settlement_records Anyone can view settlements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view settlements" ON public.settlement_records FOR SELECT TO anon, authenticated USING (true);


--
-- Name: trades Anyone can view trades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view trades" ON public.trades FOR SELECT TO anon, authenticated USING (true);


--
-- Name: order_book Authenticated can insert order_book; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can insert order_book" ON public.order_book FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: comments Comments insertable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comments insertable by authenticated" ON public.comments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: comments Comments selectable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comments selectable by authenticated" ON public.comments FOR SELECT TO authenticated USING (true);


--
-- Name: comments Comments viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comments viewable by authenticated" ON public.comments FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: daily_topics Daily topics viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Daily topics viewable by authenticated" ON public.daily_topics FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: disputes Disputes viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Disputes viewable by authenticated" ON public.disputes FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: exchange_rates Exchange rates are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Exchange rates are public" ON public.exchange_rates FOR SELECT USING (true);


--
-- Name: follows Follows viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Follows viewable by authenticated" ON public.follows FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: leaderboard Leaderboard is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Leaderboard is public" ON public.leaderboard FOR SELECT USING (true);


--
-- Name: market_followers Market followers viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Market followers viewable by authenticated" ON public.market_followers FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: oracle_requests Oracle requests viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Oracle requests viewable by authenticated" ON public.oracle_requests FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: order_commitments Order commitments viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order commitments viewable by authenticated" ON public.order_commitments FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: fill_records Service can insert fills; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert fills" ON public.fill_records FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: transactions Service can insert transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can insert transactions" ON public.transactions FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: positions Service can manage positions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can manage positions" ON public.positions TO service_role USING (true);


--
-- Name: wallets Service can update wallets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service can update wallets" ON public.wallets FOR UPDATE TO service_role USING (true);


--
-- Name: workflow_dlq Service role full access DLQ; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access DLQ" ON public.workflow_dlq TO service_role USING (true) WITH CHECK (true);


--
-- Name: activities Service role full access activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access activities" ON public.activities TO service_role USING (true) WITH CHECK (true);


--
-- Name: admin_activity_logs Service role full access admin_activity_logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access admin_activity_logs" ON public.admin_activity_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: admin_ai_settings Service role full access admin_ai_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access admin_ai_settings" ON public.admin_ai_settings TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_configs Service role full access ai_configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access ai_configs" ON public.ai_configs TO service_role USING (true) WITH CHECK (true);


--
-- Name: disputes Service role full access disputes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access disputes" ON public.disputes TO service_role USING (true) WITH CHECK (true);


--
-- Name: kyc_documents Service role full access kyc_documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access kyc_documents" ON public.kyc_documents TO service_role USING (true) WITH CHECK (true);


--
-- Name: kyc_submissions Service role full access kyc_submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access kyc_submissions" ON public.kyc_submissions TO service_role USING (true) WITH CHECK (true);


--
-- Name: order_commitments Service role full access order_commitments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access order_commitments" ON public.order_commitments TO service_role USING (true) WITH CHECK (true);


--
-- Name: profiles Service role full access profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access profiles" ON public.profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_profiles Service role full access user_profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access user_profiles" ON public.user_profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_reputation Service role full access user_reputation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access user_reputation" ON public.user_reputation TO service_role USING (true) WITH CHECK (true);


--
-- Name: upstash_workflow_runs Service role full access workflow runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access workflow runs" ON public.upstash_workflow_runs TO service_role USING (true) WITH CHECK (true);


--
-- Name: workflow_configs Service role full access workflow_configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access workflow_configs" ON public.workflow_configs TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_reputation User reputation viewable by authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "User reputation viewable by authenticated" ON public.user_reputation FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: order_book Users can cancel own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cancel own orders" ON public.order_book FOR UPDATE TO authenticated USING (((user_id = auth.uid()) AND (status = ANY (ARRAY['open'::public.order_status, 'partially_filled'::public.order_status]))));


--
-- Name: orders Users can cancel own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can cancel own orders" ON public.orders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: orders Users can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: payment_transactions Users can create payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create payments" ON public.payment_transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: comments Users can insert own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own comments" ON public.comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: orders Users can insert own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK ((user_id = public.get_current_user_id()));


--
-- Name: follows Users can manage own follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own follows" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: notification_preferences Users can manage own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences USING ((auth.uid() = user_id));


--
-- Name: users Users can read own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: wallets Users can read own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own wallet" ON public.wallets FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: comments Users can update own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: orders Users can update own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE TO authenticated USING (((user_id = public.get_current_user_id()) AND (status = ANY (ARRAY['open'::public.order_status, 'partially_filled'::public.order_status]))));


--
-- Name: activities Users can view own activities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: activity_feed Users can view own activity feed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own activity feed" ON public.activity_feed FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: frozen_funds Users can view own frozen funds; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own frozen funds" ON public.frozen_funds FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: notification_preferences Users can view own notification preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: orders Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: payment_transactions Users can view own payment_transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own payment_transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (((user_id = public.get_current_user_id()) OR (public.is_admin_user() = true)));


--
-- Name: payment_transactions Users can view own payments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own payments" ON public.payment_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: position_snapshots Users can view own positions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own positions" ON public.position_snapshots FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (auth.uid() IS NOT NULL)));


--
-- Name: positions Users can view own positions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transactions Users can view own transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wallets Users can view own wallet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT TO authenticated USING ((user_id = public.get_current_user_id()));


--
-- Name: wallet_transactions Users can view own wallet transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: withdrawal_requests Users can view own withdrawals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: workflow_configs Workflow configs service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Workflow configs service role" ON public.workflow_configs TO service_role USING (true) WITH CHECK (true);


--
-- Name: activities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_feed; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_ai_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_ai_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_topics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_topics ENABLE ROW LEVEL SECURITY;

--
-- Name: disputes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

--
-- Name: event_definitions events_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_admin_all ON public.event_definitions TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))));


--
-- Name: event_definitions events_authenticated_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_authenticated_read ON public.event_definitions FOR SELECT TO authenticated USING (true);


--
-- Name: event_definitions events_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_public_read ON public.event_definitions FOR SELECT USING ((status = ANY (ARRAY['active'::public.market_status, 'closed'::public.market_status, 'resolved'::public.market_status])));


--
-- Name: exchange_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: fill_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fill_records ENABLE ROW LEVEL SECURITY;

--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

--
-- Name: frozen_funds; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frozen_funds ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_documents kyc_documents is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "kyc_documents is public" ON public.kyc_documents FOR SELECT USING (true);


--
-- Name: kyc_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_submissions kyc_submissions is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "kyc_submissions is public" ON public.kyc_submissions FOR SELECT USING (true);


--
-- Name: leaderboard; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

--
-- Name: maker_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.maker_stats ENABLE ROW LEVEL SECURITY;

--
-- Name: market_followers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_followers ENABLE ROW LEVEL SECURITY;

--
-- Name: markets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

--
-- Name: matching_latency; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matching_latency ENABLE ROW LEVEL SECURITY;

--
-- Name: matching_wal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matching_wal ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: oracle_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.oracle_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: oracle_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.oracle_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: order_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: order_book; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_book ENABLE ROW LEVEL SECURITY;

--
-- Name: order_commitments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_commitments ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: pmf_accrued_fees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pmf_accrued_fees ENABLE ROW LEVEL SECURITY;

--
-- Name: pmf_distributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pmf_distributions ENABLE ROW LEVEL SECURITY;

--
-- Name: pmf_liquidity_additions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pmf_liquidity_additions ENABLE ROW LEVEL SECURITY;

--
-- Name: pmf_liquidity_pools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pmf_liquidity_pools ENABLE ROW LEVEL SECURITY;

--
-- Name: pmf_liquidity_removals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pmf_liquidity_removals ENABLE ROW LEVEL SECURITY;

--
-- Name: pmf_pool_shares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pmf_pool_shares ENABLE ROW LEVEL SECURITY;

--
-- Name: position_snapshots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.position_snapshots ENABLE ROW LEVEL SECURITY;

--
-- Name: positions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "profiles is public" ON public.profiles FOR SELECT USING (true);


--
-- Name: settlement_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settlement_records ENABLE ROW LEVEL SECURITY;

--
-- Name: trades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: upstash_workflow_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.upstash_workflow_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles user_profiles is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user_profiles is public" ON public.user_profiles FOR SELECT USING (true);


--
-- Name: user_reputation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: wallet_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

--
-- Name: withdrawal_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_dlq; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_dlq ENABLE ROW LEVEL SECURITY;

--
-- Name: workflow_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict SnLQaDHJXx89a8anq7yrgxPlS2rr51edW858ztAGYUIRpErgYW2uZRgdMUnEEgl

