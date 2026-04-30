


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'accuracy_tier' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.accuracy_tier AS ENUM (
            'novice',
            'apprentice',
            'analyst',
            'expert',
            'master',
            'oracle'
        ); 
    END IF; 
END $$;


ALTER TYPE "public"."accuracy_tier" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'activity_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.activity_type AS ENUM (
    'TRADE',
    'MARKET_CREATE',
    'MARKET_RESOLVE',
    'LEAGUE_UP',
    'LEAGUE_DOWN',
    'COMMENT',
    'USER_JOIN'
); 
    END IF; 
END $$;


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'answer_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.answer_type AS ENUM (
    'binary',
    'categorical',
    'scalar'
); 
    END IF; 
END $$;


ALTER TYPE "public"."answer_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'attachment_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.attachment_type AS ENUM (
    'image',
    'link',
    'gif',
    'file'
); 
    END IF; 
END $$;


ALTER TYPE "public"."attachment_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'badge_category' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.badge_category AS ENUM (
    'accuracy',
    'volume',
    'streak',
    'community',
    'special',
    'expert'
); 
    END IF; 
END $$;


ALTER TYPE "public"."badge_category" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'badge_rarity' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.badge_rarity AS ENUM (
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary'
); 
    END IF; 
END $$;


ALTER TYPE "public"."badge_rarity" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'content_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.content_type AS ENUM (
    'market_movement',
    'trader_activity',
    'system_notification',
    'social_interaction',
    'trending_market',
    'comment_reply',
    'mention',
    'follow',
    'badge_earned',
    'market_resolve'
); 
    END IF; 
END $$;


ALTER TYPE "public"."content_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'deposit_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.deposit_status AS ENUM (
    'pending',
    'under_review',
    'verified',
    'rejected',
    'auto_approved',
    'completed'
); 
    END IF; 
END $$;


ALTER TYPE "public"."deposit_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'event_tags_domain' AND n.nspname = 'public'
    ) THEN 
        CREATE DOMAIN public.event_tags_domain AS jsonb;
    END IF; 
END $$;


ALTER DOMAIN "public"."event_tags_domain" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'flag_reason' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.flag_reason AS ENUM (
    'spam',
    'harassment',
    'hate_speech',
    'misinformation',
    'off_topic',
    'trolling',
    'other'
); 
    END IF; 
END $$;


ALTER TYPE "public"."flag_reason" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'kyc_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.kyc_status AS ENUM (
    'not_started',
    'pending',
    'approved',
    'rejected',
    'expired'
); 
    END IF; 
END $$;


ALTER TYPE "public"."kyc_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'market_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.market_status AS ENUM (
    'active',
    'closed',
    'resolved',
    'cancelled',
    'draft',
    'paused',
    'rejected'
); 
    END IF; 
END $$;


ALTER TYPE "public"."market_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'market_type_enum' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.market_type_enum AS ENUM (
    'binary',
    'multi_outcome',
    'scalar'
); 
    END IF; 
END $$;


ALTER TYPE "public"."market_type_enum" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'mfs_provider' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.mfs_provider AS ENUM (
    'bkash',
    'nagad',
    'rocket',
    'upay'
); 
    END IF; 
END $$;


ALTER TYPE "public"."mfs_provider" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'moderation_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.moderation_status AS ENUM (
    'clean',
    'pending_review',
    'flagged',
    'removed',
    'appealed'
); 
    END IF; 
END $$;


ALTER TYPE "public"."moderation_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'notification_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.notification_type AS ENUM (
    'market_resolved',
    'trade_filled',
    'price_alert',
    'market_closing_soon',
    'follower_trade',
    'ai_suggestion',
    'position_profit',
    'position_loss',
    'system',
    'order_filled'
); 
    END IF; 
END $$;


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'oracle_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.oracle_status AS ENUM (
    'pending',
    'verified',
    'disputed',
    'finalized'
); 
    END IF; 
END $$;


ALTER TYPE "public"."oracle_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'order_side' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.order_side AS ENUM (
    'buy',
    'sell'
); 
    END IF; 
END $$;


ALTER TYPE "public"."order_side" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'order_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.order_status AS ENUM (
    'open',
    'partially_filled',
    'filled',
    'cancelled',
    'expired'
); 
    END IF; 
END $$;


ALTER TYPE "public"."order_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'order_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.order_type AS ENUM (
    'limit',
    'market',
    'stop_loss',
    'take_profit',
    'trailing_stop',
    'iceberg'
); 
    END IF; 
END $$;


ALTER TYPE "public"."order_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'outcome_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.outcome_type AS ENUM (
    'YES',
    'NO'
); 
    END IF; 
END $$;


ALTER TYPE "public"."outcome_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'payment_method' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.payment_method AS ENUM (
    'bkash',
    'nagad',
    'bank_transfer'
); 
    END IF; 
END $$;


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'payment_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
); 
    END IF; 
END $$;


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'sentiment_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.sentiment_type AS ENUM (
    'positive',
    'negative',
    'neutral',
    'mixed'
); 
    END IF; 
END $$;


ALTER TYPE "public"."sentiment_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'tif_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.tif_type AS ENUM (
    'FOK',
    'IOC',
    'GTC',
    'GTD',
    'AON'
); 
    END IF; 
END $$;


ALTER TYPE "public"."tif_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'trading_phase_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.trading_phase_type AS ENUM (
    'PRE_OPEN',
    'CONTINUOUS',
    'AUCTION',
    'HALTED',
    'CLOSED'
); 
    END IF; 
END $$;


ALTER TYPE "public"."trading_phase_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'transaction_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'reversed'
); 
    END IF; 
END $$;


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'transaction_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'trade_buy',
    'trade_sell',
    'settlement',
    'refund'
); 
    END IF; 
END $$;


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'user_account_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.user_account_status AS ENUM (
    'active',
    'restricted',
    'dormant',
    'banned'
); 
    END IF; 
END $$;


ALTER TYPE "public"."user_account_status" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'vote_type' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.vote_type AS ENUM (
    'upvote',
    'downvote',
    'none'
); 
    END IF; 
END $$;


ALTER TYPE "public"."vote_type" OWNER TO "postgres";


DO $$ BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typname = 'withdrawal_status' AND n.nspname = 'public'
    ) THEN 
        CREATE TYPE public.withdrawal_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'rejected',
    'cancelled'
); 
    END IF; 
END $$;


ALTER TYPE "public"."withdrawal_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_to_workflow_dlq"("p_workflow_run_id" "text", "p_error_message" "text", "p_error_stack" "text" DEFAULT NULL::"text", "p_failed_step" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Get payload snapshot from workflow run
    INSERT INTO public.workflow_dlq (
        workflow_run_id,
        error_message,
        error_stack,
        failed_step,
        payload_snapshot
    )
    SELECT 
        p_workflow_run_id,
        p_error_message,
        p_error_stack,
        p_failed_step,
        COALESCE(payload, '{}'::jsonb)
    FROM public.upstash_workflow_runs
    WHERE workflow_run_id = p_workflow_run_id
    RETURNING id INTO v_id;
    
    -- Update workflow run status to FAILED
    UPDATE public.upstash_workflow_runs
    SET 
        status = 'FAILED',
        error_message = p_error_message,
        updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
    
    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."add_to_workflow_dlq"("p_workflow_run_id" "text", "p_error_message" "text", "p_error_stack" "text", "p_failed_step" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text" DEFAULT 'Admin credit'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance NUMERIC(20, 2);
    v_transaction_id UUID;
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin access required'
        );
    END IF;

    -- Get wallet
    SELECT id, balance INTO v_wallet_id, v_new_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Wallet not found'
        );
    END IF;

    -- Update wallet balance
    UPDATE wallets
    SET 
        balance = balance + p_amount,
        available_balance = available_balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    v_new_balance := v_new_balance + p_amount;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        status,
        description,
        created_at
    ) VALUES (
        p_user_id,
        'admin_credit',
        p_amount,
        'completed',
        p_reason || ' - Admin: ' || p_admin_id,
        NOW()
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'wallet', jsonb_build_object(
            'id', v_wallet_id,
            'user_id', p_user_id,
            'balance', v_new_balance,
            'available_balance', v_new_balance
        ),
        'transaction_id', v_transaction_id
    );
END;
$$;


ALTER FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying DEFAULT 'BDT'::character varying, "p_reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_wallet RECORD;
BEGIN
    IF p_amount <= 0 THEN
        RAISE NOTICE 'Amount must be positive';
        RETURN FALSE;
    END IF;
    
    -- Get or create wallet
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        VALUES (p_user_id, p_amount, 0)
        RETURNING * INTO v_wallet;
    ELSE
        UPDATE public.wallets 
        SET balance = balance + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Log admin action
    INSERT INTO public.admin_activity_logs (
        admin_id, action, target_user_id, details, created_at
    ) VALUES (
        p_admin_id, 'credit_wallet', p_user_id, 
        jsonb_build_object('amount', p_amount, 'currency', p_currency, 'reason', p_reason),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error crediting wallet: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text" DEFAULT 'Admin debit'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_wallet_id UUID;
    v_available_balance NUMERIC(20, 2);
    v_new_balance NUMERIC(20, 2);
    v_transaction_id UUID;
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin access required'
        );
    END IF;

    -- Get wallet
    SELECT id, balance, available_balance INTO v_wallet_id, v_new_balance, v_available_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Wallet not found'
        );
    END IF;

    -- Check if sufficient balance
    IF v_available_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance'
        );
    END IF;

    -- Update wallet balance
    UPDATE wallets
    SET 
        balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    v_new_balance := v_new_balance - p_amount;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        status,
        description,
        created_at
    ) VALUES (
        p_user_id,
        'admin_debit',
        p_amount,
        'completed',
        p_reason || ' - Admin: ' || p_admin_id,
        NOW()
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'wallet', jsonb_build_object(
            'id', v_wallet_id,
            'user_id', p_user_id,
            'balance', v_new_balance,
            'available_balance', v_new_balance
        ),
        'transaction_id', v_transaction_id
    );
END;
$$;


ALTER FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying DEFAULT 'BDT'::character varying, "p_reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_wallet RECORD;
BEGIN
    IF p_amount <= 0 THEN
        RAISE NOTICE 'Amount must be positive';
        RETURN FALSE;
    END IF;
    
    -- Get wallet
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Wallet not found';
        RETURN FALSE;
    END IF;
    
    IF v_wallet.balance < p_amount THEN
        RAISE NOTICE 'Insufficient balance';
        RETURN FALSE;
    END IF;
    
    -- Deduct from wallet
    UPDATE public.wallets 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log admin action
    INSERT INTO public.admin_activity_logs (
        admin_id, action, target_user_id, details, created_at
    ) VALUES (
        p_admin_id, 'debit_wallet', p_user_id, 
        jsonb_build_object('amount', p_amount, 'currency', p_currency, 'reason', p_reason),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error debiting wallet: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_user_wallet"("p_admin_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "balance" numeric, "locked_balance" numeric, "available_balance" numeric, "currency" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "transactions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    RETURN QUERY
    SELECT 
        w.id,
        w.user_id,
        w.balance,
        w.locked_balance,
        w.available_balance,
        w.currency,
        w.created_at,
        w.updated_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', t.id,
                        'transaction_type', t.transaction_type,
                        'amount', t.amount,
                        'status', t.status,
                        'description', t.description,
                        'created_at', t.created_at
                    )
                )
                FROM transactions t
                WHERE t.user_id = p_user_id
                ORDER BY t.created_at DESC
                LIMIT 50
            ),
            '[]'::jsonb
        ) as transactions
    FROM wallets w
    WHERE w.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_get_user_wallet"("p_admin_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_kyc_action"("p_admin_id" "uuid", "p_user_id" "uuid", "p_action" character varying, "p_reason" "text" DEFAULT NULL::"text", "p_rejection_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
    v_prev_status VARCHAR;
BEGIN
    -- Get current status for logging
    SELECT verification_status INTO v_prev_status
    FROM user_kyc_profiles WHERE id = p_user_id;

    CASE p_action
        WHEN 'approve' THEN
            -- Update KYC profile
            UPDATE user_kyc_profiles SET
                verification_status = 'verified',
                verification_tier = 'intermediate',
                verified_at = NOW(),
                verified_by = p_admin_id,
                daily_withdrawal_limit = 50000,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            -- Sync kyc_level
            UPDATE user_profiles SET kyc_level = 1 WHERE id = p_user_id;

            -- Update submission (Fix: Use subquery for ORDER BY LIMIT)
            UPDATE kyc_submissions
            SET
                status = 'approved',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                review_notes = p_reason
            WHERE id = (
                SELECT id FROM kyc_submissions 
                WHERE user_id = p_user_id AND status = 'pending' 
                ORDER BY created_at DESC LIMIT 1
            );
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'approved');
            
        WHEN 'reject' THEN
            UPDATE user_kyc_profiles SET
                verification_status = 'rejected',
                rejection_reason = p_rejection_reason,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            -- Sync kyc_level
            UPDATE user_profiles SET kyc_level = 0 WHERE id = p_user_id;

            UPDATE kyc_submissions
            SET
                status = 'rejected',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                rejection_reason = p_rejection_reason,
                review_notes = p_reason
            WHERE id = (
                SELECT id FROM kyc_submissions 
                WHERE user_id = p_user_id AND status = 'pending' 
                ORDER BY created_at DESC LIMIT 1
            );
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'rejected');
            
        WHEN 'force_kyc' THEN
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
            VALUES (p_user_id, 'force_kyc', p_admin_id, COALESCE(p_reason, 'Admin forced KYC requirement'));
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'force_kyc');
            
        WHEN 'waive_kyc' THEN
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
            VALUES (p_user_id, 'waive_kyc', p_admin_id, COALESCE(p_reason, 'Admin waived KYC requirement'));
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'waive_kyc');
            
        WHEN 'revoke_override' THEN
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'revoke_override');
            
        ELSE
            RAISE EXCEPTION 'Invalid KYC action: %', p_action;
    END CASE;
    
    -- Log admin action
    PERFORM log_admin_action(
        p_admin_id,
        'kyc_' || p_action,
        'kyc',
        p_user_id,
        jsonb_build_object('verification_status', v_prev_status),
        v_result,
        COALESCE(p_reason, p_rejection_reason, p_action)
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."admin_kyc_action"("p_admin_id" "uuid", "p_user_id" "uuid", "p_action" character varying, "p_reason" "text", "p_rejection_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_market_fields"("p_market_id" "uuid", "p_fields" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update only the fields provided in p_fields
  UPDATE public.markets
  SET
    initial_liquidity = COALESCE((p_fields->>'initial_liquidity')::NUMERIC, initial_liquidity),
    volume            = COALESCE((p_fields->>'volume')::NUMERIC, volume),
    condition_id      = COALESCE(p_fields->>'condition_id', condition_id),
    token1            = COALESCE(p_fields->>'token1', token1),
    token2            = COALESCE(p_fields->>'token2', token2),
    neg_risk          = COALESCE((p_fields->>'neg_risk')::BOOLEAN, neg_risk),
    resolver_reference = COALESCE(p_fields->>'resolver_reference', resolver_reference),
    updated_at        = NOW()
  WHERE id = p_market_id
  RETURNING jsonb_build_object(
    'id', id,
    'initial_liquidity', initial_liquidity,
    'volume', volume,
    'condition_id', condition_id,
    'token1', token1,
    'token2', token2,
    'neg_risk', neg_risk,
    'resolver_reference', resolver_reference,
    'updated_at', updated_at
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Market not found: %', p_market_id;
  END IF;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."admin_update_market_fields"("p_market_id" "uuid", "p_fields" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_trading_closes_at" timestamp with time zone, "p_initial_liquidity" numeric DEFAULT 1000) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_topic RECORD;
  v_market_id UUID;
BEGIN
  -- Get topic
  SELECT * INTO v_topic FROM public.ai_daily_topics WHERE id = p_topic_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Topic not found';
  END IF;
  
  IF v_topic.status != 'pending' THEN
    RAISE EXCEPTION 'Topic already processed';
  END IF;
  
  -- Create market
  INSERT INTO public.markets (
    question,
    description,
    category,
    trading_volume,
    liquidity,
    trading_closes_at,
    status,
    created_by
  ) VALUES (
    v_topic.suggested_question,
    v_topic.suggested_description,
    v_topic.suggested_category,
    0,
    p_initial_liquidity,
    p_trading_closes_at,
    'active',
    p_admin_id
  )
  RETURNING id INTO v_market_id;
  
  -- Update topic
  UPDATE public.ai_daily_topics
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_admin_id,
    market_id = v_market_id
  WHERE id = p_topic_id;
  
  RETURN v_market_id;
END;
$$;


ALTER FUNCTION "public"."approve_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_trading_closes_at" timestamp with time zone, "p_initial_liquidity" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."approve_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_trading_closes_at" timestamp with time zone, "p_initial_liquidity" numeric) IS 'Approves an AI topic and creates a market';



CREATE OR REPLACE FUNCTION "public"."approve_deposit"("p_admin_id" "uuid", "p_payment_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_deposit RECORD;
BEGIN
    -- 1. Verify Admin
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_admin_id AND is_admin = true) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;

    -- 2. Get Deposit Info
    SELECT * INTO v_deposit
    FROM public.payment_transactions
    WHERE id = p_payment_id;

    IF v_deposit IS NULL THEN
        RAISE EXCEPTION 'Deposit request not found.';
    END IF;

    IF v_deposit.status != 'pending' THEN
        RAISE EXCEPTION 'Deposit request is already processed.';
    END IF;

    -- 3. Update Payment Transaction Status
    UPDATE public.payment_transactions
    SET 
        status = 'approved',
        reviewed_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- 4. Credit User Wallet
    UPDATE public.wallets
    SET 
        balance = balance + v_deposit.amount,
        updated_at = NOW()
    WHERE user_id = v_deposit.user_id;

    -- 5. Log Wallet Transaction
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        network_type,
        wallet_address,
        status,
        description,
        metadata
    ) VALUES (
        v_deposit.user_id,
        'deposit',
        v_deposit.amount,
        'BDT',
        'MFS', -- Mobile Financial Service
        v_deposit.payment_method, -- e.g. Bkash
        'completed',
        'Deposit via ' || v_deposit.payment_method || ' (TrxID: ' || v_deposit.transaction_id || ')',
        jsonb_build_object('payment_id', p_payment_id, 'usdc_equivalent', v_deposit.usdc_equivalent)
    );

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."approve_deposit"("p_admin_id" "uuid", "p_payment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_complete_cancellation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- If this is a soft cancel, schedule/execute hard cancel after brief delay
  IF NEW.cancel_type = 'SOFT' AND NEW.hard_cancelled_at IS NULL THEN
    -- In production, this might use pg_cron or external scheduler
    -- For now, we rely on explicit hard cancel calls or matching engine completion
    PERFORM pg_notify('cancellation_requested', jsonb_build_object(
      'orderId', NEW.order_id,
      'cancelRecordId', NEW.id,
      'requestedAt', NEW.requested_at
    )::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_complete_cancellation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_log_market_resolution"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    PERFORM log_admin_action(
      COALESCE(NEW.created_by, auth.uid()), -- Fallback to creator if resolver not set
      'resolve_event',
      'market',
      NEW.id,
      jsonb_build_object('status', OLD.status, 'outcome', OLD.outcome),
      jsonb_build_object('status', NEW.status, 'outcome', NEW.outcome),
      'System/Admin resolution'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_log_market_resolution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_cancel_orders"("p_order_ids" "uuid"[], "p_user_id" "uuid") RETURNS TABLE("order_id" "uuid", "success" boolean, "message" "text", "sequence_number" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID;
  v_result RECORD;
BEGIN
  FOREACH v_order_id IN ARRAY p_order_ids
  LOOP
    SELECT * INTO v_result
    FROM soft_cancel_order(v_order_id, p_user_id);
    
    order_id := v_order_id;
    success := v_result.success;
    message := v_result.message;
    sequence_number := v_result.sequence_number;
    RETURN NEXT;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."batch_cancel_orders"("p_order_ids" "uuid"[], "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cache_top_experts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_top_experts JSONB;
    v_redis_url TEXT;
    v_redis_token TEXT;
BEGIN
    -- Get top 10 experts
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'expert_name', expert_name,
            'reputation_score', reputation_score,
            'accuracy_rate', accuracy_rate,
            'rank_tier', rank_tier,
            'specializations', specializations
        )
    )
    INTO v_top_experts
    FROM (
        SELECT id, expert_name, reputation_score, accuracy_rate, rank_tier, specializations
        FROM expert_panel
        WHERE is_active = TRUE AND is_verified = TRUE
        ORDER BY reputation_score DESC
        LIMIT 10
    ) sub;
    
    -- Note: Actual Redis cache update happens via Edge Function or n8n
    -- This trigger just logs the change
    INSERT INTO admin_activity_logs (
        action_type,
        resource_type,
        change_summary,
        new_values
    )
    VALUES (
        'update_oracle',
        'expert_panel',
        'Top experts ranking updated',
        jsonb_build_object('top_experts', v_top_experts)
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cache_top_experts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_daily_ohlc"("p_date" "date") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO market_daily_stats (
    market_id, date, open_price, high_price, low_price, close_price, volume, trade_count
  )
  SELECT
    market_id,
    p_date,
    -- Open: first price of the day
    (SELECT price FROM price_history 
     WHERE market_id = ph.market_id 
     AND DATE(recorded_at) = p_date 
     ORDER BY recorded_at ASC LIMIT 1),
    -- High: max price of the day
    MAX(price),
    -- Low: min price of the day
    MIN(price),
    -- Close: last price of the day
    (SELECT price FROM price_history 
     WHERE market_id = ph.market_id 
     AND DATE(recorded_at) = p_date 
     ORDER BY recorded_at DESC LIMIT 1),
    -- Volume from trades
    COALESCE((
      SELECT SUM(price * quantity) FROM trades 
      WHERE market_id = ph.market_id 
      AND DATE(created_at) = p_date
    ), 0),
    -- Trade count
    COALESCE((
      SELECT COUNT(*) FROM trades 
      WHERE market_id = ph.market_id 
      AND DATE(created_at) = p_date
    ), 0)
  FROM price_history ph
  WHERE DATE(ph.recorded_at) = p_date
  GROUP BY ph.market_id
  ON CONFLICT (market_id, date) DO UPDATE SET
    open_price = EXCLUDED.open_price,
    high_price = EXCLUDED.high_price,
    low_price = EXCLUDED.low_price,
    close_price = EXCLUDED.close_price,
    volume = EXCLUDED.volume,
    trade_count = EXCLUDED.trade_count;
END;
$$;


ALTER FUNCTION "public"."calculate_daily_ohlc"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_hourly_metrics"("p_hour" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_start TIMESTAMPTZ := date_trunc('hour', p_hour);
    v_end TIMESTAMPTZ := v_start + INTERVAL '1 hour';
    
    v_volume DECIMAL;
    v_count INTEGER;
    v_traders INTEGER;
    v_new_users INTEGER;
    v_revenue DECIMAL;
BEGIN
    -- Trading Metrics
    SELECT 
        COALESCE(SUM(total_value), 0),
        COUNT(*),
        COUNT(DISTINCT buyer_id) + COUNT(DISTINCT seller_id) -- Approx unique traders (naive)
    INTO v_volume, v_count, v_traders
    FROM trade_ledger
    WHERE executed_at_ns >= EXTRACT(EPOCH FROM v_start) * 1000000000
      AND executed_at_ns < EXTRACT(EPOCH FROM v_end) * 1000000000;
      
    -- User Metrics
    SELECT COUNT(*) INTO v_new_users
    FROM auth.users
    WHERE created_at >= v_start AND created_at < v_end;
    
    -- Financials (Accessing trades table for fee info if available, otherwise estimating 2% fee - example)
    -- Assuming standard fee of 2% for now if not in ledger.
    -- Better: Check `maker_rebates` system.
    v_revenue := v_volume * 0.02; -- Placeholder for demo, replace with real fee query
    
    -- Insert/Update
    INSERT INTO analytics_snapshots_hourly (
        bucket_start, total_volume, trade_count, active_traders_count, 
        new_users_count, gross_revenue
    ) VALUES (
        v_start, v_volume, v_count, v_traders,
        v_new_users, v_revenue
    )
    ON CONFLICT (bucket_start) DO UPDATE SET
        total_volume = EXCLUDED.total_volume,
        trade_count = EXCLUDED.trade_count,
        active_traders_count = EXCLUDED.active_traders_count,
        new_users_count = EXCLUDED.new_users_count,
        gross_revenue = EXCLUDED.gross_revenue,
        created_at = NOW();
END;
$$;


ALTER FUNCTION "public"."calculate_hourly_metrics"("p_hour" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_market_spread"("p_market_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_best_bid DECIMAL(12, 2);
    v_best_ask DECIMAL(12, 2);
    v_spread DECIMAL(8, 4);
    v_mid_price DECIMAL(12, 2);
BEGIN
    SELECT MAX(price) INTO v_best_bid
    FROM orders
    WHERE market_id = p_market_id 
      AND side = 'buy' 
      AND status = 'open';
    
    SELECT MIN(price) INTO v_best_ask
    FROM orders
    WHERE market_id = p_market_id 
      AND side = 'sell' 
      AND status = 'open';
    
    IF v_best_bid IS NULL OR v_best_ask IS NULL OR v_best_bid = 0 THEN
        RETURN NULL;
    END IF;
    
    v_mid_price := (v_best_bid + v_best_ask) / 2;
    v_spread := (v_best_ask - v_best_bid) / v_mid_price;
    
    RETURN v_spread;
END;
$$;


ALTER FUNCTION "public"."calculate_market_spread"("p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_remaining_quantity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.remaining_quantity := NEW.quantity - NEW.filled_quantity;
  IF NEW.remaining_quantity <= 0 THEN
    NEW.status := 'filled';
    NEW.filled_at := NOW();
  ELSIF NEW.filled_quantity > 0 THEN
    NEW.status := 'partially_filled';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_remaining_quantity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_reputation_score"("p_correct_votes" integer, "p_total_votes" integer) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    v_accuracy NUMERIC;
    v_log_factor NUMERIC;
    v_reputation NUMERIC;
BEGIN
    -- Handle edge case
    IF p_total_votes = 0 THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate accuracy
    v_accuracy := p_correct_votes::NUMERIC / p_total_votes;
    
    -- Calculate log factor: log(total_votes + 1)
    v_log_factor := LN(p_total_votes + 1);
    
    -- Reputation = Accuracy * Log(Total Votes + 1)
    v_reputation := v_accuracy * v_log_factor;
    
    RETURN ROUND(v_reputation, 4);
END;
$$;


ALTER FUNCTION "public"."calculate_reputation_score"("p_correct_votes" integer, "p_total_votes" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_reputation_score"("p_correct_votes" integer, "p_total_votes" integer) IS 'Calculates weighted reputation: accuracy * log(total_votes + 1)';



CREATE OR REPLACE FUNCTION "public"."calculate_spread_multiplier"("p_avg_spread" numeric, "p_avg_order_size" numeric) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_multiplier DECIMAL(4, 2);
    v_size_multiplier DECIMAL(4, 2);
BEGIN
    SELECT multiplier INTO v_multiplier
    FROM spread_multiplier_config
    WHERE is_active = TRUE
      AND min_spread <= p_avg_spread
      AND (max_spread IS NULL OR max_spread > p_avg_spread)
    ORDER BY id
    LIMIT 1;
    
    v_multiplier := COALESCE(v_multiplier, 0.5);
    
    IF p_avg_order_size >= 10000 THEN
        v_size_multiplier := 1.0;
    ELSIF p_avg_order_size >= 5000 THEN
        v_size_multiplier := 0.9;
    ELSIF p_avg_order_size >= 2000 THEN
        v_size_multiplier := 0.8;
    ELSE
        v_size_multiplier := 0.5;
    END IF;
    
    RETURN v_multiplier * v_size_multiplier;
END;
$$;


ALTER FUNCTION "public"."calculate_spread_multiplier"("p_avg_spread" numeric, "p_avg_order_size" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_vwap"("p_order_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_total_value DECIMAL(36, 18) := 0;
  v_total_quantity DECIMAL(36, 18) := 0;
  v_tick_size DECIMAL(36, 18) := 0.01; -- Default tick size
  v_raw_avg DECIMAL(36, 18);
  v_remainder DECIMAL(36, 18);
  v_rounded DECIMAL(36, 18);
  v_fill RECORD;
BEGIN
  -- Sum up all fills
  SELECT 
    COALESCE(SUM(total_value), 0),
    COALESCE(SUM(quantity), 0)
  INTO v_total_value, v_total_quantity
  FROM fill_records
  WHERE order_id = p_order_id;
  
  IF v_total_quantity = 0 THEN
    RETURN 0;
  END IF;
  
  -- Get tick size from market (optional enhancement)
  -- SELECT tick_size INTO v_tick_size FROM markets WHERE id = ...
  
  -- Calculate raw average with extra precision
  v_raw_avg := (v_total_value * 1000000) / v_total_quantity;
  v_remainder := v_raw_avg % 1000000;
  
  -- Round half-up to nearest tick
  IF v_remainder >= 500000 THEN
    v_rounded := (v_raw_avg / 1000000) + 1;
  ELSE
    v_rounded := v_raw_avg / 1000000;
  END IF;
  
  RETURN v_rounded;
END;
$$;


ALTER FUNCTION "public"."calculate_vwap"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_weekly_rebate"("p_user_id" "uuid", "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rebate_id UUID;
    v_year_month VARCHAR(7);
    v_volume_tracking RECORD;
    v_spread_reward RECORD;
    v_base_rate DECIMAL(8, 4);
    v_spread_multiplier DECIMAL(4, 2);
    v_final_rate DECIMAL(8, 4);
    v_gross_amount DECIMAL(20, 2);
    v_net_amount DECIMAL(20, 2);
    v_tier_info RECORD;
BEGIN
    v_year_month := TO_CHAR(p_period_start, 'YYYY-MM');
    
    SELECT * INTO v_volume_tracking
    FROM maker_volume_tracking
    WHERE user_id = p_user_id AND year_month = v_year_month;
    
    IF v_volume_tracking IS NULL THEN
        RETURN NULL;
    END IF;
    
    SELECT * INTO v_spread_reward
    FROM spread_rewards
    WHERE user_id = p_user_id 
      AND calculation_date BETWEEN p_period_start::DATE AND p_period_end::DATE
    ORDER BY bonus_amount DESC
    LIMIT 1;
    
    SELECT * INTO v_tier_info
    FROM rebate_tiers_config
    WHERE id = v_volume_tracking.rebate_tier;
    
    v_base_rate := v_tier_info.rebate_rate;
    v_spread_multiplier := COALESCE(v_spread_reward.final_multiplier, 1.0);
    v_final_rate := v_base_rate * v_spread_multiplier;
    v_gross_amount := v_volume_tracking.qualifying_volume * v_final_rate;
    v_net_amount := v_gross_amount;
    
    INSERT INTO maker_rebates (
        user_id, year_month, rebate_period_start, rebate_period_end,
        total_maker_volume, qualifying_volume, base_rebate_rate,
        spread_multiplier, final_rebate_rate, gross_rebate_amount,
        net_rebate_amount, tier_at_calculation, tier_benefits
    ) VALUES (
        p_user_id, v_year_month, p_period_start, p_period_end,
        v_volume_tracking.maker_volume, v_volume_tracking.qualifying_volume,
        v_base_rate, v_spread_multiplier, v_final_rate, v_gross_amount,
        v_net_amount, v_volume_tracking.rebate_tier, v_tier_info.benefits
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_rebate_id;
    
    RETURN v_rebate_id;
END;
$$;


ALTER FUNCTION "public"."calculate_weekly_rebate"("p_user_id" "uuid", "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_order"("p_order_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF p_user_id IS NULL THEN p_user_id := auth.uid(); END IF;
  RETURN public.cancel_order_v2(p_order_id, p_user_id);
END;
$$;


ALTER FUNCTION "public"."cancel_order"("p_order_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_order_batch"("p_batch_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_batch RECORD;
  v_released_amount DECIMAL(18,2);
BEGIN
  -- Get batch info
  SELECT * INTO v_batch
  FROM order_batches
  WHERE id = p_batch_id AND user_id = auth.uid();
  
  IF v_batch IS NULL THEN
    RAISE EXCEPTION 'Batch not found or access denied';
  END IF;
  
  IF v_batch.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Cannot cancel batch with status: %', v_batch.status;
  END IF;
  
  -- Calculate remaining locked amount
  SELECT COALESCE(SUM(price * (quantity - filled_quantity)), 0)
  INTO v_released_amount
  FROM orders
  WHERE batch_id = p_batch_id 
  AND status IN ('open', 'pending');
  
  -- Cancel all open orders in batch
  UPDATE orders
  SET status = 'cancelled', updated_at = now()
  WHERE batch_id = p_batch_id 
  AND status IN ('open', 'pending');
  
  -- Release locked balance
  IF v_released_amount > 0 THEN
    UPDATE wallets
    SET 
      available_balance = available_balance + v_released_amount,
      locked_balance = GREATEST(0, locked_balance - v_released_amount)
    WHERE user_id = auth.uid();
  END IF;
  
  -- Update batch status
  UPDATE order_batches
  SET 
    status = 'cancelled',
    completed_at = now(),
    error_message = 'Cancelled by user'
  WHERE id = p_batch_id;
  
  RETURN jsonb_build_object(
    'batch_id', p_batch_id,
    'status', 'cancelled',
    'released_amount', v_released_amount,
    'cancelled_at', now()
  );
END;
$$;


ALTER FUNCTION "public"."cancel_order_batch"("p_batch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_order_v2"("p_order_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD;
  v_refund NUMERIC;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND user_id = p_user_id FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or not yours');
  END IF;
  
  IF v_order.status NOT IN ('open', 'partially_filled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled: ' || v_order.status);
  END IF;

  -- Calculate refund for unfilled portion
  v_refund := (v_order.remaining_quantity * v_order.price) + 
              (v_order.remaining_quantity * v_order.price * v_order.fee_rate);

  -- Update order status
  UPDATE orders 
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  -- Release locked funds back to available
  UPDATE wallets 
  SET balance = balance + v_refund, 
      locked_balance = locked_balance - v_refund
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', p_order_id, 
    'refunded', v_refund,
    'filled_quantity', v_order.filled_quantity
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."cancel_order_v2"("p_order_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_ai_topics_health"() RETURNS TABLE("check_name" character varying, "status" character varying, "details" "text", "is_healthy" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_ai_settings' AND table_schema = 'public') THEN
        RETURN QUERY
        SELECT 
            'admin_ai_settings exists'::VARCHAR AS check_name,
            'OK'::VARCHAR AS status,
            'Table exists'::TEXT AS details,
            true::BOOLEAN AS is_healthy
        UNION ALL
        SELECT 
            'auto_generate_enabled'::VARCHAR,
            CASE WHEN (SELECT auto_generate_enabled FROM public.admin_ai_settings WHERE id = 1) = true THEN 'ENABLED' ELSE 'DISABLED' END,
            'Auto-generation setting'::TEXT,
            (SELECT auto_generate_enabled FROM public.admin_ai_settings WHERE id = 1) = true
        UNION ALL
        SELECT 
            'gemini_api_configured'::VARCHAR,
            CASE WHEN (SELECT gemini_model FROM public.admin_ai_settings WHERE id = 1) IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
            'AI model configuration'::TEXT,
            (SELECT gemini_model FROM public.admin_ai_settings WHERE id = 1) IS NOT NULL;
    ELSE
        RETURN QUERY
        SELECT 
            'admin_ai_settings'::VARCHAR AS check_name,
            'MISSING'::VARCHAR AS status,
            'Table does not exist'::TEXT AS details,
            false::BOOLEAN AS is_healthy;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_ai_topics_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_comment_edit_window"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF OLD.created_at < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Edit window (5 minutes) has expired';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_comment_edit_window"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_comment_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.comments
    WHERE user_id = NEW.user_id
    AND event_id = NEW.event_id
    AND created_at > NOW() - INTERVAL '1 minute'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: 1 comment per minute per market';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_comment_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_gtd_expiry"() RETURNS TABLE("expired_order_id" "uuid", "released_collateral" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD;
  v_remaining DECIMAL(36, 18);
BEGIN
  FOR v_order IN
    SELECT id, size, filled, price
    FROM order_book
    WHERE tif = 'GTD'
      AND gtd_expiry < NOW()
      AND status IN ('OPEN', 'PARTIAL')
  LOOP
    v_remaining := v_order.size - v_order.filled;
    
    -- Expire the order
    UPDATE order_book
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE id = v_order.id;
    
    -- Create expiry record
    INSERT INTO cancellation_records (
      order_id,
      cancel_type,
      filled_quantity_before,
      remaining_quantity,
      final_filled_quantity,
      final_cancelled_quantity,
      released_collateral,
      sequence_number,
      cancellation_reason
    )
    SELECT 
      v_order.id,
      'EXPIRY'::cancel_type,
      v_order.filled,
      v_remaining,
      v_order.filled,
      v_remaining,
      v_remaining * v_order.price,
      get_next_sequence(),
      'GTD_EXPIRED';
    
    RETURN QUERY SELECT v_order.id, (v_remaining * v_order.price);
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_gtd_expiry"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_gtd_expiry"() IS 'Call this function periodically (e.g., every minute) to expire GTD orders';



CREATE OR REPLACE FUNCTION "public"."check_kyc_withdrawal_gate"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_total DECIMAL := 0; v_thresh DECIMAL; v_status VARCHAR; v_glob BOOLEAN; v_override RECORD;
BEGIN
    SELECT withdrawal_threshold, kyc_globally_required INTO v_thresh, v_glob FROM kyc_settings WHERE id = 1;
    SELECT verification_status INTO v_status FROM user_kyc_profiles WHERE id = p_user_id;
    SELECT * INTO v_override FROM kyc_admin_overrides WHERE user_id = p_user_id AND is_active = TRUE LIMIT 1;
    
    IF v_status = 'verified' THEN RETURN jsonb_build_object('needs_kyc', FALSE, 'reason', 'verified'); END IF;
    IF v_override.override_type = 'waive_kyc' THEN RETURN jsonb_build_object('needs_kyc', FALSE, 'reason', 'admin_waived'); END IF;
    IF v_override.override_type = 'force_kyc' THEN RETURN jsonb_build_object('needs_kyc', TRUE, 'reason', 'admin_forced'); END IF;
    IF v_glob THEN RETURN jsonb_build_object('needs_kyc', TRUE, 'reason', 'globally_required'); END IF;
    
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total FROM wallet_transactions WHERE user_id = p_user_id AND transaction_type = 'withdrawal' AND status = 'completed';
    IF v_total >= v_thresh THEN RETURN jsonb_build_object('needs_kyc', TRUE, 'reason', 'threshold_exceeded'); END IF;
    
    RETURN jsonb_build_object('needs_kyc', FALSE, 'reason', 'under_threshold');
END;
$$;


ALTER FUNCTION "public"."check_kyc_withdrawal_gate"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_sensitive_topics"("p_text" "text") RETURNS TABLE("keyword" character varying, "category" character varying, "risk_level" character varying, "requires_review" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT st.keyword, st.category, st.risk_level, st.requires_review
    FROM sensitive_topics st
    WHERE p_text ILIKE '%' || st.keyword || '%'
    AND st.is_active = TRUE;
END;
$$;


ALTER FUNCTION "public"."check_sensitive_topics"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_trading_eligibility"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_status user_account_status;
    v_kyc_level INTEGER;
    v_trading_halted BOOLEAN;
BEGIN
    -- Check Global Trading Halt
    SELECT (value->>'trading_halted')::boolean INTO v_trading_halted
    FROM public.admin_settings
    WHERE key = 'risk_controls';

    IF v_trading_halted = TRUE THEN
        RAISE EXCEPTION 'মার্কেট বর্তমানে রক্ষণাবেক্ষণের জন্য বন্ধ আছে। সাময়িক অসুবিধার জন্য আমরা দুঃখিত। (Trading is temporarily halted by admin)';
    END IF;

    -- Get user status and KYC level
    SELECT status, kyc_level INTO v_user_status, v_kyc_level
    FROM public.user_profiles
    WHERE id = NEW.user_id;

    -- Check 1: Is user banned or restricted?
    IF v_user_status != 'active' THEN
        RAISE EXCEPTION 'আপনার অ্যাকাউন্টটি বর্তমানে লেনদেনের জন্য সচল নয়। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন। (Account status: %)', v_user_status;
    END IF;

    -- Check 2: KYC Level check for high-value trades (e.g., > 500 BDT)
    IF TG_TABLE_NAME = 'order_book' THEN
        IF v_kyc_level < 1 AND (NEW.size * NEW.price) > 500 THEN
            RAISE EXCEPTION '৫০০ টাকার বেশি ট্রেড করতে হলে KYC লেভেল ১ সম্পন্ন করুন। বর্তমান লেভেল: %', v_kyc_level;
        END IF;
    END IF;

    -- Check 3: Deposit check (if manual_deposits)
    IF TG_TABLE_NAME = 'manual_deposits' THEN
        IF v_kyc_level < 1 THEN
            RAISE EXCEPTION 'ডিপোজিট করতে হলে নূন্যতম KYC লেভেল ১ সম্পন্ন করুন।';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_trading_eligibility"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_withdrawal_eligibility"("p_user_id" "uuid", "p_amount" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_kyc_level INTEGER;
BEGIN
    -- Get user KYC level
    SELECT COALESCE(kyc_level, 0) INTO v_kyc_level
    FROM public.user_profiles
    WHERE id = p_user_id;

    -- Check limit
    IF p_amount > 5000 AND v_kyc_level < 1 THEN
        RAISE EXCEPTION 'Withdrawal of % BDT requires KYC Level 1 verification (Limit: 5000 BDT for Unverified).', p_amount;
    END IF;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."check_withdrawal_eligibility"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_workflow_health"() RETURNS TABLE("workflow_key" character varying, "current_status" character varying, "next_run" timestamp with time zone, "last_run" timestamp with time zone, "is_healthy" boolean, "issues" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_schedule_configs' AND table_schema = 'public') THEN
        RETURN QUERY
        SELECT 
            w.workflow_key,
            w.status::VARCHAR,
            w.next_run_at,
            w.last_run_at,
            CASE 
                WHEN w.status = 'active' AND w.is_enabled = true AND w.is_auto_run = true THEN true
                ELSE false
            END AS is_healthy,
            CASE 
                WHEN w.status != 'active' THEN 'Workflow is not active'
                WHEN w.is_enabled = false THEN 'Workflow is disabled'
                WHEN w.is_auto_run = false THEN 'Auto-run is disabled'
                WHEN w.next_run_at < NOW() - INTERVAL '1 hour' THEN 'Next run is overdue'
                ELSE NULL
            END AS issues
        FROM public.workflow_schedule_configs w
        ORDER BY w.workflow_key;
    ELSE
        RETURN QUERY
        SELECT 
            'N/A'::VARCHAR AS workflow_key,
            'table_missing'::VARCHAR AS current_status,
            NULL::TIMESTAMPTZ AS next_run,
            NULL::TIMESTAMPTZ AS last_run,
            false::BOOLEAN AS is_healthy,
            'workflow_schedule_configs table does not exist'::TEXT AS issues;
    END IF;
END;
$$;


ALTER FUNCTION "public"."check_workflow_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_rebate"("p_rebate_id" "uuid", "p_user_id" "uuid", "p_payment_method" character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rebate RECORD;
BEGIN
    SELECT * INTO v_rebate
    FROM maker_rebates
    WHERE id = p_rebate_id AND user_id = p_user_id;
    
    IF v_rebate IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Rebate not found');
    END IF;
    
    IF v_rebate.claim_status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Rebate already claimed or expired');
    END IF;
    
    UPDATE maker_rebates
    SET 
        claim_status = 'claimed',
        claimed_at = NOW(),
        claimed_by_user_id = p_user_id,
        payment_method = p_payment_method,
        updated_at = NOW()
    WHERE id = p_rebate_id;
    
    UPDATE maker_volume_tracking
    SET claimed_rebate = claimed_rebate + v_rebate.net_rebate_amount
    WHERE user_id = p_user_id AND year_month = v_rebate.year_month;
    
    RETURN jsonb_build_object(
        'success', true,
        'rebate_id', p_rebate_id,
        'amount', v_rebate.net_rebate_amount,
        'payment_method', p_payment_method
    );
END;
$$;


ALTER FUNCTION "public"."claim_rebate"("p_rebate_id" "uuid", "p_user_id" "uuid", "p_payment_method" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_dormant_accounts"() RETURNS TABLE("user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    UPDATE user_status
    SET account_status = 'dormant',
        updated_at = NOW()
    FROM user_profiles
    WHERE user_status.id = user_profiles.id
      AND user_profiles.last_login_at < NOW() - INTERVAL '90 days'
      AND user_status.account_status = 'active'
    RETURNING user_status.id;
END;
$$;


ALTER FUNCTION "public"."cleanup_dormant_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_batches"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_batch RECORD;
  v_released_amount DECIMAL(18,2);
  v_count INT := 0;
BEGIN
  FOR v_batch IN
    SELECT * FROM order_batches
    WHERE status IN ('pending', 'processing')
    AND expires_at < now()
  LOOP
    -- Calculate remaining locked amount
    SELECT COALESCE(SUM(price * (quantity - filled_quantity)), 0)
    INTO v_released_amount
    FROM orders
    WHERE batch_id = v_batch.id 
    AND status IN ('open', 'pending');
    
    -- Cancel open orders
    UPDATE orders
    SET status = 'cancelled', updated_at = now()
    WHERE batch_id = v_batch.id 
    AND status IN ('open', 'pending');
    
    -- Release locked balance
    IF v_released_amount > 0 THEN
      UPDATE wallets
      SET 
        available_balance = available_balance + v_released_amount,
        locked_balance = GREATEST(0, locked_balance - v_released_amount)
      WHERE user_id = v_batch.user_id;
    END IF;
    
    -- Update batch status
    UPDATE order_batches
    SET 
      status = 'failed',
      completed_at = now(),
      error_message = 'Batch expired'
    WHERE id = v_batch.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'expired_batches', v_count,
    'timestamp', now()
  );
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_batches"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"("p_days" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - (p_days || ' days')::INTERVAL
  AND read = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'deleted_count', v_deleted,
    'older_than_days', p_days,
    'timestamp', now()
  );
END;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"("p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_legal_review"("p_draft_id" "uuid", "p_reviewer_id" "uuid", "p_status" character varying, "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE market_creation_drafts SET
        legal_review_status = p_status,
        legal_reviewer_id = p_reviewer_id,
        legal_review_notes = p_notes,
        legal_reviewed_at = NOW(),
        status = CASE 
            WHEN p_status = 'approved' THEN 'approved'
            WHEN p_status = 'rejected' THEN 'rejected'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    UPDATE legal_review_queue SET
        status = 'completed',
        completed_at = NOW()
    WHERE draft_id = p_draft_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."complete_legal_review"("p_draft_id" "uuid", "p_reviewer_id" "uuid", "p_status" character varying, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_complete"("p_event_data" "jsonb", "p_admin_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
    v_market_id UUID;
    v_slug TEXT;
    v_result JSONB;
    v_initial_liquidity NUMERIC;
    v_system_user_id UUID;
    v_category TEXT;
    v_is_custom_category BOOLEAN;
    v_tags TEXT[];
    v_ai_keywords TEXT[];
    v_ai_sources TEXT[];
    v_title TEXT;
    v_spread NUMERIC := 0.04;  -- 4% spread (0.48 - 0.52)
    v_liquidity_per_side NUMERIC;
    v_order_id UUID;
BEGIN
    -- Extract title
    v_title := COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question', 'Untitled Event');
    
    -- Generate slug
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    v_is_custom_category := COALESCE((p_event_data->>'is_custom_category')::BOOLEAN, FALSE);
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    -- Handle custom category
    IF v_is_custom_category AND v_category != 'general' THEN
        BEGIN
            INSERT INTO public.custom_categories (name, slug, icon, display_order, created_by)
            VALUES (
                v_category,
                lower(regexp_replace(v_category, '[^a-zA-Z0-9]+', '-', 'g')),
                '📌',
                999,
                p_admin_id
            );
        EXCEPTION WHEN unique_violation THEN
            NULL;
        END;
    END IF;
    
    -- Convert JSONB arrays to TEXT[]
    IF p_event_data->'tags' IS NOT NULL AND jsonb_array_length(p_event_data->'tags') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')) INTO v_tags;
    ELSE
        v_tags := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_keywords' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_keywords') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords')) INTO v_ai_keywords;
    ELSE
        v_ai_keywords := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_sources' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_sources') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources')) INTO v_ai_sources;
    ELSE
        v_ai_sources := ARRAY[]::TEXT[];
    END IF;
    
    -- Insert event
    INSERT INTO public.events (
        title,
        name,
        name_en,
        slug,
        question,
        description,
        category,
        subcategory,
        tags,
        image_url,
        answer_type,
        answer1,
        answer2,
        status,
        starts_at,
        trading_opens_at,
        trading_closes_at,
        resolution_method,
        resolution_delay_hours,
        resolution_source,
        initial_liquidity,
        current_liquidity,
        is_featured,
        ai_keywords,
        ai_sources,
        ai_confidence_threshold,
        created_by
    ) VALUES (
        v_title,
        v_title,
        v_title,
        v_slug,
        COALESCE(p_event_data->>'question', v_title),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_tags,
        p_event_data->>'image_url',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE(p_event_data->>'status', 'active'),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        p_event_data->>'resolution_source',
        v_initial_liquidity,
        v_initial_liquidity,
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        v_ai_keywords,
        v_ai_sources,
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- Create market
    INSERT INTO public.markets (
        event_id,
        name,
        question,
        description,
        category,
        subcategory,
        tags,
        trading_closes_at,
        resolution_delay_hours,
        initial_liquidity,
        liquidity,
        status,
        slug,
        answer_type,
        answer1,
        answer2,
        is_featured,
        created_by,
        image_url
    ) VALUES (
        v_event_id,
        v_title,
        COALESCE(p_event_data->>'question', v_title),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_tags,
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        'active',
        v_slug || '-market',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        p_admin_id,
        p_event_data->>'image_url'
    )
    RETURNING id INTO v_market_id;
    
    -- Create resolution config
    BEGIN
        INSERT INTO resolution_systems (
            event_id,
            primary_method,
            ai_keywords,
            ai_sources,
            confidence_threshold,
            status
        ) VALUES (
            COALESCE(v_market_id, v_event_id),
            COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
            v_ai_keywords,
            v_ai_sources,
            COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
            'pending'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Resolution config creation skipped: %', SQLERRM;
    END;
    
    -- =============================================
    -- SEED ORDERBOOK WITH PROPER SPREAD (ATOMIC)
    -- =============================================
    IF COALESCE(p_event_data->>'status', 'active') = 'active' AND v_initial_liquidity > 0 THEN
        -- Get system user for liquidity provision
        SELECT id INTO v_system_user_id
        FROM public.user_profiles
        WHERE is_admin = true
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If no admin user, use null user_id for system-generated liquidity orders
        -- This is now allowed since user_id is nullable in order_book
        -- No action needed - v_system_user_id remains NULL
        
        -- Calculate liquidity per side
        v_liquidity_per_side := v_initial_liquidity / 4;  -- Split into 4 levels
        
        -- YES Outcome: Create BIDS (Buy orders at lower prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        -- YES Outcome: Create ASKS (Sell orders at higher prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        -- NO Outcome: Create BIDS (Buy orders at lower prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        -- NO Outcome: Create ASKS (Sell orders at higher prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        RAISE NOTICE 'Orderbook seeded with 8 orders for event %', v_event_id;
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully with orderbook liquidity'
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_event_complete"("p_event_data" "jsonb", "p_admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_complete"("p_title" character varying, "p_description" "text", "p_category_id" "uuid", "p_tags" "text"[], "p_answer_type" "text" DEFAULT 'binary'::"text", "p_resolution_src" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN create_event_complete_v3(
    p_title             := p_title,
    p_description       := p_description,
    p_answer_type       := p_answer_type::answer_type,
    p_tags              := to_jsonb(p_tags),
    p_category_id       := p_category_id,
    p_resolution_source := p_resolution_src,
    p_starts_at         := NULL,
    p_ends_at           := NULL
  );
END;
$$;


ALTER FUNCTION "public"."create_event_complete"("p_title" character varying, "p_description" "text", "p_category_id" "uuid", "p_tags" "text"[], "p_answer_type" "text", "p_resolution_src" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_complete_v1"("event_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.create_event_complete_v3(event_data);
END;
$$;


ALTER FUNCTION "public"."create_event_complete_v1"("event_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_complete_v2"("title" character varying, "description" "text", "category_id" "uuid", "tags" "text"[], "answer_type" "text" DEFAULT 'binary'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN create_event_complete_v3(
    p_title             := title,
    p_description       := description,
    p_answer_type       := answer_type::answer_type,
    p_tags              := to_jsonb(tags),
    p_category_id       := category_id,
    p_resolution_source := NULL,
    p_starts_at         := NULL,
    p_ends_at           := NULL
  );
END;
$$;


ALTER FUNCTION "public"."create_event_complete_v2"("title" character varying, "description" "text", "category_id" "uuid", "tags" "text"[], "answer_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_complete_v3"("p_title" character varying, "p_description" "text", "p_answer_type" "public"."answer_type", "p_tags" "jsonb", "p_category_id" "uuid", "p_resolution_source" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (
    title, description, answer_type, tags, 
    category_id, resolution_source, starts_at, ends_at
  ) VALUES (
    p_title, p_description, p_answer_type, p_tags,
    p_category_id, p_resolution_source, p_starts_at, p_ends_at
  ) RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('success', true, 'event_id', v_event_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_event_complete_v3"("p_title" character varying, "p_description" "text", "p_answer_type" "public"."answer_type", "p_tags" "jsonb", "p_category_id" "uuid", "p_resolution_source" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_debug"("p_event_data" "jsonb", "p_admin_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
    v_market_id UUID;
    v_slug TEXT;
    v_result JSONB;
    v_initial_liquidity NUMERIC := 1000;
    v_category TEXT := 'general';
    v_title TEXT;
    v_question TEXT;
    v_trading_closes_at TIMESTAMPTZ;
BEGIN
    -- Extract key values with defaults
    v_title := COALESCE(p_event_data->>'title', p_event_data->>'name', 'Untitled Event');
    v_question := COALESCE(p_event_data->>'question', v_title);
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    -- Parse trading closes at
    BEGIN
        v_trading_closes_at := (p_event_data->>'trading_closes_at')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        v_trading_closes_at := NOW() + INTERVAL '7 days';
    END;
    
    -- Get initial liquidity
    BEGIN
        v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    EXCEPTION WHEN OTHERS THEN
        v_initial_liquidity := 1000;
    END;
    
    -- Get category
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    RAISE NOTICE 'Creating event: title=%, slug=%, category=%', v_title, v_slug, v_category;

    -- STEP 1: Insert Event (simplified)
    BEGIN
        INSERT INTO public.events (
            title,
            slug,
            question,
            description,
            category,
            subcategory,
            status,
            starts_at,
            trading_opens_at,
            trading_closes_at,
            resolution_method,
            resolution_delay_hours,
            initial_liquidity,
            current_liquidity,
            is_featured,
            answer_type,
            answer1,
            answer2,
            created_by
        ) VALUES (
            v_title,
            v_slug,
            v_question,
            p_event_data->>'description',
            v_category,
            p_event_data->>'subcategory',
            'active',
            NOW(),
            NOW(),
            v_trading_closes_at,
            COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
            COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
            v_initial_liquidity,
            v_initial_liquidity,
            COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
            'binary',
            'হ্যাঁ (Yes)',
            'না (No)',
            p_admin_id
        )
        RETURNING id INTO v_event_id;
        
        RAISE NOTICE 'Event created with ID: %', v_event_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Failed to create event: ' || SQLERRM,
            'detail', SQLSTATE
        );
    END;
    
    -- STEP 2: Create Market
    BEGIN
        INSERT INTO public.markets (
            event_id,
            name,
            question,
            description,
            category,
            subcategory,
            trading_closes_at,
            resolution_delay_hours,
            initial_liquidity,
            liquidity,
            status,
            slug,
            answer_type,
            answer1,
            answer2,
            is_featured,
            created_by
        ) VALUES (
            v_event_id,
            v_title,
            v_question,
            p_event_data->>'description',
            v_category,
            p_event_data->>'subcategory',
            v_trading_closes_at,
            COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
            v_initial_liquidity,
            v_initial_liquidity,
            'active',
            v_slug,
            'binary',
            'হ্যাঁ (Yes)',
            'না (No)',
            COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
            p_admin_id
        )
        RETURNING id INTO v_market_id;
        
        RAISE NOTICE 'Market created with ID: %', v_market_id;
    EXCEPTION WHEN OTHERS THEN
        -- Don't fail if market creation fails
        RAISE WARNING 'Market creation failed: %', SQLERRM;
        v_market_id := NULL;
    END;
    
    -- STEP 3: Return success
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully'
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;


ALTER FUNCTION "public"."create_event_debug"("p_event_data" "jsonb", "p_admin_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_with_markets"("p_event_data" "jsonb", "p_markets_data" "jsonb"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_event_id UUID;
    new_market_id UUID;
    market_record JSONB;
    result JSONB;
    event_title TEXT;
    event_slug TEXT;
    outcome_label TEXT;
    outcome_labels TEXT[];
    v_tags TEXT[];
    v_ai_keywords TEXT[];
    v_ai_sources TEXT[];
    i INT;
BEGIN
    event_title := COALESCE(p_event_data->>'title', p_event_data->>'name');
    event_slug  := p_event_data->>'slug';

    RAISE NOTICE 'Creating event: % with slug: %', event_title, event_slug;

    -- Convert JSONB arrays to TEXT[] safely
    IF p_event_data->'tags' IS NOT NULL AND jsonb_array_length(p_event_data->'tags') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')) INTO v_tags;
    ELSE
        v_tags := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_keywords' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_keywords') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords')) INTO v_ai_keywords;
    ELSE
        v_ai_keywords := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_sources' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_sources') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources')) INTO v_ai_sources;
    ELSE
        v_ai_sources := ARRAY[]::TEXT[];
    END IF;

    INSERT INTO events (
        title,
        question,
        description,
        category,
        subcategory,
        tags,
        slug,
        image_url,
        trading_closes_at,
        resolution_method,
        status,
        is_featured,
        created_by,
        initial_liquidity,
        starts_at,
        trading_opens_at,
        resolution_delay_hours,
        answer_type,
        answer1,
        answer2,
        ai_keywords,
        ai_sources,
        ai_confidence_threshold
    ) VALUES (
        event_title,
        COALESCE(p_event_data->>'question', event_title),
        p_event_data->>'description',
        COALESCE(p_event_data->>'category', 'general'),
        p_event_data->>'subcategory',
        v_tags,
        event_slug,
        p_event_data->>'image_url',
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', p_event_data->>'primary_method', 'manual_admin'),
        COALESCE(p_event_data->>'status', 'active'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
        (p_event_data->>'created_by')::UUID,
        COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        v_ai_keywords,
        v_ai_sources,
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85)
    )
    RETURNING id INTO new_event_id;

    RAISE NOTICE 'Event created with ID: %', new_event_id;

    -- Create markets
    IF p_markets_data IS NOT NULL AND array_length(p_markets_data, 1) > 0 THEN
        FOREACH market_record IN ARRAY p_markets_data
        LOOP
            RAISE NOTICE 'Creating market for event: %', new_event_id;

            INSERT INTO markets (
                event_id,
                name,
                question,
                description,
                category,
                subcategory,
                tags,
                trading_closes_at,
                resolution_delay_hours,
                initial_liquidity,
                liquidity,
                status,
                slug,
                answer_type,
                answer1,
                answer2,
                is_featured,
                created_by,
                image_url
            ) VALUES (
                new_event_id,
                COALESCE(market_record->>'name', event_title),
                COALESCE(market_record->>'question', market_record->>'name', event_title),
                COALESCE(market_record->>'description', p_event_data->>'description'),
                COALESCE(market_record->>'category', p_event_data->>'category', 'general'),
                p_event_data->>'subcategory',
                v_tags,
                COALESCE(
                    (market_record->>'trading_closes_at')::TIMESTAMPTZ,
                    (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
                ),
                COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
                COALESCE((market_record->>'liquidity')::DECIMAL, 1000),
                COALESCE((market_record->>'liquidity')::DECIMAL, 1000),
                'active',
                event_slug || '-market-' || gen_random_uuid()::TEXT,
                COALESCE(p_event_data->>'answer_type', 'binary'),
                COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
                COALESCE(p_event_data->>'answer2', 'না (No)'),
                COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
                (p_event_data->>'created_by')::UUID,
                p_event_data->>'image_url'
            )
            RETURNING id INTO new_market_id;

            -- Create outcomes in separate outcomes table
            BEGIN
                IF market_record->'outcomes' IS NOT NULL AND jsonb_array_length(market_record->'outcomes') > 0 THEN
                    FOR i IN 0..jsonb_array_length(market_record->'outcomes')-1
                    LOOP
                        outcome_label := market_record->'outcomes'->>i;
                        INSERT INTO outcomes (market_id, label, display_order, current_price)
                        VALUES (
                            new_market_id,
                            outcome_label,
                            i,
                            1.0 / jsonb_array_length(market_record->'outcomes')
                        );
                    END LOOP;
                END IF;
            EXCEPTION WHEN undefined_table THEN
                RAISE NOTICE 'outcomes table not found, skipping outcome creation';
            WHEN OTHERS THEN
                RAISE NOTICE 'Outcome creation skipped: %', SQLERRM;
            END;
        END LOOP;
    ELSE
        -- Default single market
        INSERT INTO markets (
            event_id,
            name,
            question,
            description,
            category,
            subcategory,
            tags,
            trading_closes_at,
            resolution_delay_hours,
            initial_liquidity,
            liquidity,
            status,
            slug,
            answer_type,
            answer1,
            answer2,
            is_featured,
            created_by,
            image_url
        ) VALUES (
            new_event_id,
            event_title,
            COALESCE(p_event_data->>'question', event_title),
            p_event_data->>'description',
            COALESCE(p_event_data->>'category', 'general'),
            p_event_data->>'subcategory',
            v_tags,
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
            COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
            COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
            COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
            'active',
            event_slug,
            COALESCE(p_event_data->>'answer_type', 'binary'),
            COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
            COALESCE(p_event_data->>'answer2', 'না (No)'),
            COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
            (p_event_data->>'created_by')::UUID,
            p_event_data->>'image_url'
        )
        RETURNING id INTO new_market_id;
    END IF;

    -- Create resolution config
    BEGIN
        INSERT INTO resolution_systems (
            event_id,
            primary_method,
            ai_keywords,
            ai_sources,
            confidence_threshold,
            status
        ) VALUES (
            new_market_id,
            COALESCE(p_event_data->>'resolution_method', p_event_data->>'primary_method', 'manual_admin'),
            v_ai_keywords,
            v_ai_sources,
            COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
            'pending'
        )
        ON CONFLICT (event_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Resolution config skipped: %', SQLERRM;
    END;

    -- Activity log
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_activity_logs') THEN
            INSERT INTO admin_activity_logs (admin_id, action_type, resource_type, resource_id, change_summary, new_values)
            VALUES (
                (p_event_data->>'created_by')::UUID,
                'create_event',
                'market',
                new_market_id,
                'Event created: ' || event_title,
                p_event_data
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Activity log skipped: %', SQLERRM;
    END;

    result := jsonb_build_object(
        'success',    true,
        'event_id',   new_event_id,
        'market_id',  new_market_id,
        'slug',       event_slug,
        'message',    'Event and market created successfully'
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Transaction failed: % | Event: % | Slug: %',
        SQLERRM, event_title, event_slug;
END;
$$;


ALTER FUNCTION "public"."create_event_with_markets"("p_event_data" "jsonb", "p_markets_data" "jsonb"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_event_with_markets"("p_event_data" "jsonb", "p_markets_data" "jsonb"[]) IS 'Atomic event + markets creation. Fixed column mapping for resolution_date.
Updated: 2026-02-28';



CREATE OR REPLACE FUNCTION "public"."create_event_with_resolution"("p_event_data" "jsonb", "p_resolution_config" "jsonb", "p_admin_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_market_id UUID;
  v_result JSONB;
BEGIN
  -- Insert market
  INSERT INTO markets (
    question,
    description,
    category,
    subcategory,
    tags,
    trading_closes_at,
    resolution_delay_hours,
    initial_liquidity,
    liquidity,
    answer_type,
    answer1,
    answer2,
    status,
    created_by,
    slug,
    image_url,
    is_featured
  ) VALUES (
    p_event_data->>'question',
    p_event_data->>'description',
    p_event_data->>'category',
    p_event_data->>'subcategory',
    COALESCE((p_event_data->'tags')::TEXT[], '{}'),
    (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
    COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
    COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000),
    COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000),
    COALESCE(p_event_data->>'answer_type', 'binary'),
    COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
    COALESCE(p_event_data->>'answer2', 'না (No)'),
    'pending',
    p_admin_id,
    p_event_data->>'slug',
    p_event_data->>'image_url',
    COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE)
  )
  RETURNING id INTO v_market_id;
  
  -- Insert resolution config
  INSERT INTO resolution_systems (
    market_id,
    primary_method,
    ai_keywords,
    ai_sources,
    confidence_threshold
  ) VALUES (
    v_market_id,
    COALESCE(p_resolution_config->>'primary_method', 'manual_admin'),
    COALESCE((p_resolution_config->'ai_keywords')::TEXT[], '{}'),
    COALESCE((p_resolution_config->'ai_sources')::TEXT[], '{}'),
    COALESCE((p_resolution_config->>'confidence_threshold')::INTEGER, 85)
  );
  
  -- Log action
  PERFORM log_admin_action(
    p_admin_id,
    'create_event',
    'market',
    v_market_id,
    NULL,
    p_event_data,
    'Manual event creation'
  );
  
  v_result := jsonb_build_object(
    'success', TRUE,
    'market_id', v_market_id,
    'message', 'Event created successfully'
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  v_result := jsonb_build_object(
    'success', FALSE,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_event_with_resolution"("p_event_data" "jsonb", "p_resolution_config" "jsonb", "p_admin_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_event_with_resolution"("p_event_data" "jsonb", "p_resolution_config" "jsonb", "p_admin_id" "uuid") IS 'Creates event with resolution config in single transaction';



CREATE OR REPLACE FUNCTION "public"."create_follower_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Create notification for the user being followed
    INSERT INTO notifications (
        user_id,
        sender_id,
        type,
        data
    ) VALUES (
        NEW.following_id,
        NEW.follower_id,
        'new_follower',
        jsonb_build_object(
            'followerId', NEW.follower_id,
            'followedAt', NEW.created_at
        )
    );
    
    -- Create activity for the followed user
    INSERT INTO activities (
        user_id,
        type,
        priority,
        algorithmic_weight,
        data,
        is_global,
        source_user_id
    ) VALUES (
        NEW.following_id,
        'follow',
        'medium',
        50,
        jsonb_build_object(
            'followerId', NEW.follower_id,
            'followType', 'new_follower'
        ),
        false,
        NEW.follower_id
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_follower_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_market"("p_event_id" "uuid", "p_slug" "text", "p_ends_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN create_market_v2(
    p_event_id    := p_event_id,
    p_slug        := p_slug,
    p_min_tick    := 0.01,
    p_max_tick    := 0.99,
    p_fee_percent := 0.02,
    p_market_type := 'binary',
    p_ends_at     := p_ends_at
  );
END;
$$;


ALTER FUNCTION "public"."create_market"("p_event_id" "uuid", "p_slug" "text", "p_ends_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_draft_id UUID;
BEGIN
    INSERT INTO market_creation_drafts (
        creator_id,
        market_type,
        template_id,
        current_stage,
        stages_completed
    ) VALUES (
        p_creator_id,
        p_market_type,
        p_template_id,
        'template_selection',
        '[]'::jsonb
    )
    RETURNING id INTO v_draft_id;
    
    RETURN v_draft_id;
END;
$$;


ALTER FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying DEFAULT NULL::character varying, "p_event_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_draft_id UUID;
    v_event_category VARCHAR(100);
BEGIN
    -- If event_id is provided, fetch category from event to pre-fill
    IF p_event_id IS NOT NULL THEN
        SELECT category INTO v_event_category FROM events WHERE id = p_event_id;
    END IF;

    INSERT INTO market_creation_drafts (
        creator_id,
        market_type,
        template_id,
        event_id,
        category, -- Pre-fill category if available from event
        current_stage,
        stages_completed
    ) VALUES (
        p_creator_id,
        p_market_type,
        p_template_id,
        p_event_id,
        v_event_category,
        'template_selection',
        '[]'::jsonb
    )
    RETURNING id INTO v_draft_id;
    
    RETURN v_draft_id;
END;
$$;


ALTER FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying, "p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_market_v2"("p_event_id" "uuid", "p_slug" "text", "p_min_tick" numeric, "p_max_tick" numeric, "p_fee_percent" numeric, "p_market_type" "text", "p_ends_at" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_market_id UUID;
BEGIN
  INSERT INTO markets (
    event_id, slug, min_tick, max_tick, fee_percent, market_type, ends_at
  ) VALUES (
    p_event_id, p_slug, p_min_tick, p_max_tick, p_fee_percent, p_market_type, p_ends_at
  ) RETURNING id INTO v_market_id;

  RETURN jsonb_build_object('success', true, 'market_id', v_market_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_market_v2"("p_event_id" "uuid", "p_slug" "text", "p_min_tick" numeric, "p_max_tick" numeric, "p_fee_percent" numeric, "p_market_type" "text", "p_ends_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order_batch"("p_orders" "jsonb", "p_total_cost" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_batch_id UUID;
  v_order_count INT;
  v_wallet_balance DECIMAL(18,2);
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_order_count := jsonb_array_length(p_orders);
  
  -- Validate max orders per batch (prevent abuse)
  IF v_order_count > 20 THEN
    RAISE EXCEPTION 'Maximum 20 orders per batch allowed';
  END IF;
  
  IF v_order_count = 0 THEN
    RAISE EXCEPTION 'No orders provided';
  END IF;
  
  -- Check wallet balance
  SELECT available_balance INTO v_wallet_balance
  FROM wallets WHERE user_id = v_user_id;
  
  IF v_wallet_balance IS NULL OR v_wallet_balance < p_total_cost THEN
    RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', 
      p_total_cost, COALESCE(v_wallet_balance, 0);
  END IF;
  
  -- Lock the balance (will be released as orders fill)
  UPDATE wallets 
  SET 
    available_balance = available_balance - p_total_cost,
    locked_balance = locked_balance + p_total_cost
  WHERE user_id = v_user_id;
  
  -- Create batch record
  INSERT INTO order_batches (
    user_id, status, total_cost, metadata, expires_at
  ) VALUES (
    v_user_id, 'processing', p_total_cost, 
    jsonb_build_object('orders', p_orders),
    now() + INTERVAL '1 hour'
  )
  RETURNING id INTO v_batch_id;
  
  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'status', 'processing',
    'total_cost', p_total_cost,
    'order_count', v_order_count
  );
END;
$$;


ALTER FUNCTION "public"."create_order_batch"("p_orders" "jsonb", "p_total_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_price_alert_notification"("p_user_id" "uuid", "p_market_id" "uuid", "p_price_change_percent" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id UUID;
  market_name TEXT;
  market_name_bn TEXT;
BEGIN
  -- Get market name
  SELECT name, name_bn INTO market_name, market_name_bn
  FROM markets WHERE id = p_market_id;
  
  INSERT INTO notifications (
    user_id, type, title, title_bn, body, body_bn,
    market_id, action_url, metadata
  ) VALUES (
    p_user_id,
    'price_alert',
    'দাম পরিবর্তন সতর্কতা',
    'দাম পরিবর্তন সতর্কতা',
    market_name || ' এর দাম ' || ROUND(p_price_change_percent, 2) || '% পরিবর্তিত হয়েছে',
    COALESCE(market_name_bn, market_name) || ' এর দাম ' || ROUND(p_price_change_percent, 2) || '% পরিবর্তিত হয়েছে',
    p_market_id,
    '/markets/' || p_market_id,
    jsonb_build_object('price_change_percent', p_price_change_percent)
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_price_alert_notification"("p_user_id" "uuid", "p_market_id" "uuid", "p_price_change_percent" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_withdrawal_hold"("p_user_id" "uuid", "p_amount" numeric, "p_withdrawal_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_hold_id UUID;
  v_row_count INTEGER;
BEGIN
  -- Atomic check & deduction from profiles
  UPDATE profiles
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id AND balance >= p_amount;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'Insufficient balance or user not found for withdrawal.';
  END IF;
  
  -- Create hold logging
  INSERT INTO balance_holds (
    user_id,
    amount,
    reason,
    reference_id,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'withdrawal',
    p_withdrawal_id,
    NOW()
  ) RETURNING id INTO v_hold_id;
  
  RETURN v_hold_id;
END;
$$;


ALTER FUNCTION "public"."create_withdrawal_hold"("p_user_id" "uuid", "p_amount" numeric, "p_withdrawal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_workflow_execution"("p_workflow_type" "text", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_max_retries" integer DEFAULT 3) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_execution_id UUID;
BEGIN
    INSERT INTO workflow_executions (
        workflow_type,
        payload,
        max_retries,
        status,
        started_at
    ) VALUES (
        p_workflow_type,
        p_payload,
        p_max_retries,
        'running',
        NOW()
    ) RETURNING id INTO v_execution_id;

    RETURN v_execution_id;
END;
$$;


ALTER FUNCTION "public"."create_workflow_execution"("p_workflow_type" "text", "p_payload" "jsonb", "p_max_retries" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."credit_wallet"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.deposit_funds_v2(p_user_id, p_amount, 'system');
END;
$$;


ALTER FUNCTION "public"."credit_wallet"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debit_wallet"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.withdraw_funds_v2(p_user_id, p_amount, 'system');
END;
$$;


ALTER FUNCTION "public"."debit_wallet"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deploy_market_full"("p_draft_id" "uuid", "p_deployer_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_draft RECORD;
  v_market_id UUID;
  v_bypass_liquidity BOOLEAN;
  v_bypass_legal BOOLEAN;
BEGIN
  -- Get draft with all fields
  SELECT * INTO v_draft
  FROM market_creation_drafts
  WHERE id = p_draft_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft not found: %', p_draft_id;
  END IF;

  -- Check bypass flags
  v_bypass_liquidity := COALESCE(v_draft.admin_bypass_liquidity, FALSE);
  v_bypass_legal := COALESCE(v_draft.admin_bypass_legal_review, FALSE);

  -- Validate: question is required
  IF v_draft.question IS NULL OR v_draft.question = '' THEN
    RAISE EXCEPTION 'Market question is required';
  END IF;

  -- Validate: liquidity (unless bypassed)
  IF NOT v_bypass_liquidity AND COALESCE(v_draft.liquidity_amount, 0) < 1000 THEN
    RAISE EXCEPTION 'Minimum liquidity of $1,000 required (or use admin bypass)';
  END IF;

  -- Validate: legal review (unless bypassed)
  IF NOT v_bypass_legal AND v_draft.legal_review_status != 'approved' THEN
    RAISE EXCEPTION 'Legal review approval required (or use admin bypass)';
  END IF;

  -- Create market in production markets table, INCLUDING event_id
  INSERT INTO public.markets (
    question,
    description,
    category,
    image_url,
    trading_closes_at,
    event_date,
    resolution_source,
    resolution_source_type,
    resolution_source_url,
    status,
    creator_id,
    event_id
  ) VALUES (
    v_draft.question,
    v_draft.description,
    COALESCE(v_draft.category, 'General'),
    v_draft.image_url,
    v_draft.resolution_deadline,
    v_draft.resolution_deadline,
    v_draft.resolution_source,
    COALESCE(v_draft.oracle_type, 'MANUAL'),
    v_draft.resolution_source_url,
    'active',
    v_draft.creator_id,
    v_draft.event_id  -- Link to parent event!
  )
  RETURNING id INTO v_market_id;

  -- For categorical markets, create outcomes
  IF v_draft.market_type = 'categorical' AND v_draft.outcomes IS NOT NULL THEN
    BEGIN
      INSERT INTO public.categorical_markets (
        market_id,
        outcomes,
        outcome_count
      ) VALUES (
        v_market_id,
        v_draft.outcomes,
        jsonb_array_length(v_draft.outcomes)
      );
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END IF;

  -- For scalar markets, create range config
  IF v_draft.market_type = 'scalar' AND v_draft.min_value IS NOT NULL THEN
    BEGIN
      INSERT INTO public.scalar_markets (
        market_id,
        min_value,
        max_value,
        unit
      ) VALUES (
        v_market_id,
        v_draft.min_value,
        v_draft.max_value,
        COALESCE(v_draft.unit, 'USD')
      );
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END IF;

  -- Record deployment in drafts
  UPDATE market_creation_drafts SET
    status = 'deployed',
    deployed_market_id = v_market_id,
    deployed_at = NOW(),
    completed_at = NOW(),
    deployment_config = jsonb_build_object(
      'deployer_id', p_deployer_id,
      'event_id', v_draft.event_id,
      'verification_method', v_draft.verification_method,
      'required_confirmations', v_draft.required_confirmations,
      'confidence_threshold', v_draft.confidence_threshold,
      'trading_fee_percent', v_draft.trading_fee_percent,
      'trading_end_type', v_draft.trading_end_type,
      'admin_bypasses', jsonb_build_object(
        'liquidity', v_draft.admin_bypass_liquidity,
        'legal_review', v_draft.admin_bypass_legal_review,
        'simulation', v_draft.admin_bypass_simulation
      )
    ),
    updated_at = NOW()
  WHERE id = p_draft_id;

  RETURN v_market_id;
END;
$_$;


ALTER FUNCTION "public"."deploy_market_full"("p_draft_id" "uuid", "p_deployer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deposit_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text" DEFAULT 'bank_transfer'::"text", "p_reference" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  UPDATE wallets SET
    balance = balance + p_amount,
    total_deposited = total_deposited + p_amount,
    last_deposit_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, metadata)
  VALUES (
    p_user_id, 'deposit', p_amount, v_wallet.balance, v_wallet.balance + p_amount,
    jsonb_build_object('method', p_method, 'reference', p_reference)
  );

  RETURN jsonb_build_object(
    'success', true, 'new_balance', v_wallet.balance + p_amount,
    'total_deposited', v_wallet.total_deposited + p_amount
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."deposit_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."determine_rebate_tier"("p_monthly_volume" numeric) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_tier INTEGER;
BEGIN
    SELECT id INTO v_tier
    FROM rebate_tiers_config
    WHERE is_active = TRUE
      AND min_volume <= p_monthly_volume
      AND (max_volume IS NULL OR max_volume > p_monthly_volume)
    ORDER BY id DESC
    LIMIT 1;
    
    RETURN COALESCE(v_tier, 1);
END;
$$;


ALTER FUNCTION "public"."determine_rebate_tier"("p_monthly_volume" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dispute_resolution_v2"("p_request_id" "uuid", "p_reason" "text", "p_evidence_url" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_dispute_id UUID;
  v_market_id UUID;
BEGIN
  SELECT market_id INTO v_market_id FROM oracle_requests WHERE id = p_request_id;
  IF v_market_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oracle request not found');
  END IF;

  INSERT INTO oracle_disputes (request_id, disputer_id, reason, evidence_urls, status)
  VALUES (p_request_id, auth.uid(), p_reason, 
    CASE WHEN p_evidence_url IS NOT NULL THEN jsonb_build_array(p_evidence_url) ELSE '[]'::JSONB END,
    'open')
  RETURNING id INTO v_dispute_id;

  UPDATE oracle_requests SET 
    is_disputed = true, 
    dispute_count = dispute_count + 1,
    status = 'under_review'
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'dispute_id', v_dispute_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."dispute_resolution_v2"("p_request_id" "uuid", "p_reason" "text", "p_evidence_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_uppercase_outcome"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.outcome := UPPER(NEW.outcome::text);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_uppercase_outcome"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."event_tags_as_text_array"("p_event_id" "uuid") RETURNS "text"[]
    LANGUAGE "sql" STABLE
    AS $$
  SELECT ARRAY(SELECT jsonb_array_elements_text(tags))
  FROM events WHERE id = p_event_id;
$$;


ALTER FUNCTION "public"."event_tags_as_text_array"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_trade_v2"("p_market_id" "uuid", "p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_maker_id" "uuid", "p_taker_id" "uuid", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_trade_id UUID;
  v_maker_fee NUMERIC;
  v_taker_fee NUMERIC;
BEGIN
  -- Maker rebate: -0.5% (negative = rebate)
  -- Taker fee: +1.5%
  v_maker_fee := p_price * p_quantity * (-0.005); -- rebate
  v_taker_fee := p_price * p_quantity * 0.015;

  -- Insert trade record
  INSERT INTO trades (
    market_id, buy_order_id, sell_order_id, outcome, price, quantity,
    maker_id, taker_id, fee_amount, maker_fee, taker_fee, trade_type
  ) VALUES (
    p_market_id, p_buy_order_id, p_sell_order_id, p_outcome, p_price, p_quantity,
    p_maker_id, p_taker_id, v_maker_fee + v_taker_fee, v_maker_fee, v_taker_fee, 'limit'
  ) RETURNING id INTO v_trade_id;

  -- Update filled quantities on both orders
  UPDATE orders SET filled_quantity = filled_quantity + p_quantity WHERE id = p_buy_order_id;
  UPDATE orders SET filled_quantity = filled_quantity + p_quantity WHERE id = p_sell_order_id;

  -- Update or create positions for both parties
  PERFORM upsert_position_v2(p_maker_id, p_market_id, p_outcome, p_quantity, p_price, 'buy');
  PERFORM upsert_position_v2(p_taker_id, p_market_id, p_outcome, p_quantity, p_price, 'sell');

  -- Release locked funds for filled portion and apply fees
  -- Maker gets rebate
  UPDATE wallets SET 
    locked_balance = locked_balance - (p_price * p_quantity * 1.02),
    balance = balance + ABS(v_maker_fee) -- rebate back to available
  WHERE user_id = p_maker_id;

  -- Taker pays fee
  UPDATE wallets SET 
    locked_balance = locked_balance - (p_price * p_quantity * 1.02)
  WHERE user_id = p_taker_id;

  -- Update market current_tick to last trade price
  UPDATE markets SET current_tick = p_price WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true, 
    'trade_id', v_trade_id,
    'price', p_price,
    'quantity', p_quantity,
    'maker_fee', v_maker_fee,
    'taker_fee', v_taker_fee
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."execute_trade_v2"("p_market_id" "uuid", "p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_maker_id" "uuid", "p_taker_id" "uuid", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_order"("p_order_id" "uuid", "p_expiry_reason" character varying DEFAULT 'GTD_EXPIRED'::character varying) RETURNS TABLE("success" boolean, "cancel_record_id" "uuid", "released_collateral" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD;
  v_seq BIGINT;
  v_cancel_id UUID;
  v_released DECIMAL(36, 18);
BEGIN
  SELECT * INTO v_order
  FROM order_book
  WHERE id = p_order_id
    AND status IN ('OPEN', 'PARTIAL', 'CANCELLING')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL;
    RETURN;
  END IF;
  
  v_seq := get_next_sequence();
  v_released := (v_order.size - v_order.filled) * v_order.price;
  
  -- Create expiry record
  INSERT INTO cancellation_records (
    order_id,
    cancel_type,
    filled_quantity_before,
    remaining_quantity,
    final_filled_quantity,
    final_cancelled_quantity,
    released_collateral,
    sequence_number,
    cancellation_reason
  ) VALUES (
    p_order_id,
    'EXPIRY',
    v_order.filled,
    v_order.size - v_order.filled,
    v_order.filled,
    v_order.size - v_order.filled,
    v_released,
    v_seq,
    p_expiry_reason
  )
  RETURNING id INTO v_cancel_id;
  
  -- Mark order as expired
  UPDATE order_book
  SET status = 'EXPIRED',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN QUERY SELECT TRUE, v_cancel_id, v_released;
END;
$$;


ALTER FUNCTION "public"."expire_order"("p_order_id" "uuid", "p_expiry_reason" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_stale_orders"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INT;
BEGIN
  WITH expired AS (
    UPDATE orders 
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE status = 'open' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
    RETURNING id, user_id, remaining_quantity, price, fee_rate
  )
  -- Release locked funds for each expired order
  UPDATE wallets w
  SET balance = w.balance + (e.remaining_quantity * e.price * (1 + e.fee_rate)),
      locked_balance = w.locked_balance - (e.remaining_quantity * e.price * (1 + e.fee_rate))
  FROM expired e
  WHERE w.user_id = e.user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'expired_count', v_count);
END;
$$;


ALTER FUNCTION "public"."expire_stale_orders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fetch_leaderboard"("limit_count" integer DEFAULT 100) RETURNS TABLE("user_id" "uuid", "username" "text", "pnl" numeric, "score" numeric, "win_count" integer, "loss_count" integer, "trade_count" integer, "win_rate" numeric, "rank_tier" "text", "streak" integer, "rank" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_leaderboard_v2(limit_count, 0);
END;
$$;


ALTER FUNCTION "public"."fetch_leaderboard"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."follow_market"("p_user_id" "uuid", "p_market_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO market_follows (user_id, market_id)
    VALUES (p_user_id, p_market_id)
    ON CONFLICT (user_id, market_id) DO NOTHING;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Already following this market');
    END IF;
END;
$$;


ALTER FUNCTION "public"."follow_market"("p_user_id" "uuid", "p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."follow_user"("p_follower_id" "uuid", "p_following_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_target_privacy VARCHAR(20);
    v_follower_count INTEGER;
    v_max_followers INTEGER;
    v_existing_request UUID;
    v_result JSONB;
BEGIN
    -- Check if target user exists and get their privacy setting
    SELECT privacy_tier, follower_count, max_followers 
    INTO v_target_privacy, v_follower_count, v_max_followers
    FROM users WHERE id = p_following_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check follower limit
    IF v_follower_count >= v_max_followers THEN
        RETURN jsonb_build_object('success', false, 'error', 'User has reached follower limit');
    END IF;
    
    -- Handle based on privacy tier
    CASE v_target_privacy
        WHEN 'private' THEN
            RETURN jsonb_build_object('success', false, 'error', 'User does not accept followers');
            
        WHEN 'approved' THEN
            -- Check for existing pending request
            SELECT id INTO v_existing_request
            FROM follow_requests
            WHERE requester_id = p_follower_id 
              AND target_id = p_following_id 
              AND status = 'pending';
              
            IF v_existing_request IS NOT NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Follow request already pending');
            END IF;
            
            -- Create follow request
            INSERT INTO follow_requests (requester_id, target_id)
            VALUES (p_follower_id, p_following_id);
            
            RETURN jsonb_build_object('success', true, 'status', 'pending_approval');
            
        ELSE -- public or anonymous
            -- Direct follow
            INSERT INTO user_follows (follower_id, following_id)
            VALUES (p_follower_id, p_following_id)
            ON CONFLICT (follower_id, following_id) DO NOTHING;
            
            -- Update counts
            UPDATE users SET follower_count = follower_count + 1 WHERE id = p_following_id;
            UPDATE users SET following_count = following_count + 1 WHERE id = p_follower_id;
            
            RETURN jsonb_build_object('success', true, 'status', 'following');
    END CASE;
END;
$$;


ALTER FUNCTION "public"."follow_user"("p_follower_id" "uuid", "p_following_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."freeze_funds"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN freeze_funds_v2(p_user_id, p_amount);
END;
$$;


ALTER FUNCTION "public"."freeze_funds"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."freeze_funds_v2"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_wallet_id UUID; v_balance NUMERIC;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance 
  FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  UPDATE wallets SET balance = balance - p_amount, locked_balance = locked_balance + p_amount WHERE id = v_wallet_id;
  RETURN jsonb_build_object('success', true, 'wallet_id', v_wallet_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."freeze_funds_v2"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."freeze_wallet_v2"("p_user_id" "uuid", "p_freeze" boolean DEFAULT true, "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE wallets SET is_active = NOT p_freeze, updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'frozen', p_freeze, 'reason', p_reason);
END;
$$;


ALTER FUNCTION "public"."freeze_wallet_v2"("p_user_id" "uuid", "p_freeze" boolean, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_cancellation_confirmation"("p_cancel_record_id" "uuid") RETURNS TABLE("confirmation_data" "jsonb", "signature_payload" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'orderId', cr.order_id,
      'cancellationTimestamp', EXTRACT(EPOCH FROM cr.hard_cancelled_at) * 1000000000, -- nanoseconds
      'filledQuantity', cr.final_filled_quantity::TEXT,
      'remainingQuantity', cr.final_cancelled_quantity::TEXT,
      'averageFillPrice', COALESCE(cr.average_fill_price, 0)::TEXT,
      'releasedCollateral', cr.released_collateral::TEXT,
      'sequenceNumber', cr.sequence_number,
      'cancelType', cr.cancel_type,
      'raceCondition', cr.race_condition_detected,
      'timestamp', cr.hard_cancelled_at
    ) AS confirmation_data,
    format('%s:%s:%s:%s:%s:%s:%s',
      cr.order_id,
      EXTRACT(EPOCH FROM cr.hard_cancelled_at) * 1000000000,
      COALESCE(cr.final_filled_quantity, 0),
      COALESCE(cr.final_cancelled_quantity, 0),
      COALESCE(cr.average_fill_price, 0),
      cr.released_collateral,
      cr.sequence_number
    ) AS signature_payload
  FROM cancellation_records cr
  WHERE cr.id = p_cancel_record_id;
END;
$$;


ALTER FUNCTION "public"."generate_cancellation_confirmation"("p_cancel_record_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_event_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Generate slug from title if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(
            COALESCE(NEW.title, NEW.name, 'event'), 
            '[^a-zA-Z0-9]+', 
            '-', 
            'g'
        )) || '-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_event_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_market_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Generate slug from name/question if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(
            COALESCE(NEW.name, NEW.question, 'market'), 
            '[^a-zA-Z0-9]+', 
            '-', 
            'g'
        )) || '-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_market_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_activity_summary"("p_admin_id" "uuid" DEFAULT NULL::"uuid", "p_start_date" timestamp with time zone DEFAULT ("now"() - '7 days'::interval), "p_end_date" timestamp with time zone DEFAULT "now"()) RETURNS TABLE("action_type" character varying, "action_count" bigint, "last_action_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aal.action_type,
    COUNT(*)::BIGINT as action_count,
    MAX(aal.created_at) as last_action_at
  FROM admin_activity_logs aal
  WHERE 
    (p_admin_id IS NULL OR aal.admin_id = p_admin_id)
    AND aal.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY aal.action_type
  ORDER BY action_count DESC;
END;
$$;


ALTER FUNCTION "public"."get_admin_activity_summary"("p_admin_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_activity_summary"("p_admin_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) IS 'Returns admin activity summary for reporting';



CREATE OR REPLACE FUNCTION "public"."get_admin_events"("p_status" character varying DEFAULT NULL::character varying, "p_category" character varying DEFAULT NULL::character varying, "p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "question" "text", "description" "text", "category" character varying, "subcategory" character varying, "tags" "text"[], "image_url" "text", "status" character varying, "is_featured" boolean, "is_trending" boolean, "answer_type" character varying, "answer1" character varying, "answer2" character varying, "starts_at" timestamp with time zone, "trading_closes_at" timestamp with time zone, "resolution_method" character varying, "resolution_delay" integer, "initial_liquidity" numeric, "total_volume" numeric, "total_trades" integer, "unique_traders" integer, "current_yes_price" numeric, "current_no_price" numeric, "resolver_reference" "text", "created_by" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "market_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id, e.title, e.slug, e.question, e.description,
    e.category, e.subcategory, e.tags, e.image_url,
    e.status, e.is_featured, e.is_trending,
    e.answer_type, e.answer1, e.answer2,
    e.starts_at, e.trading_closes_at,
    e.resolution_method, e.resolution_delay,
    e.initial_liquidity, e.total_volume,
    e.total_trades, e.unique_traders,
    e.current_yes_price, e.current_no_price,
    e.resolution_source AS resolver_reference,
    e.created_by, e.created_at, e.updated_at,
    COALESCE((SELECT COUNT(*) FROM public.markets m WHERE m.event_id = e.id), 0) AS market_count
  FROM public.events e
  WHERE
    (p_status IS NULL OR e.status = p_status)
    AND (p_category IS NULL OR e.category = p_category)
    AND (
      p_search IS NULL
      OR e.title ILIKE '%' || p_search || '%'
      OR e.question ILIKE '%' || p_search || '%'
    )
  ORDER BY e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_admin_events"("p_status" character varying, "p_category" character varying, "p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_topics_summary"() RETURNS TABLE("total_pending" bigint, "total_approved" bigint, "total_rejected" bigint, "today_generated" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'pending')::BIGINT as total_pending,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'approved')::BIGINT as total_approved,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'rejected')::BIGINT as total_rejected,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE generated_at >= CURRENT_DATE)::BIGINT as today_generated;
END;
$$;


ALTER FUNCTION "public"."get_ai_topics_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_categories"() RETURNS TABLE("name" "text", "slug" "text", "icon" "text", "display_order" integer, "is_custom" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT 
        cc.name, cc.slug, cc.icon, cc.display_order, false AS is_custom
    FROM public.custom_categories cc
    WHERE cc.is_active = TRUE
    ORDER BY cc.display_order, cc.name;
$$;


ALTER FUNCTION "public"."get_all_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_batch_details"("p_batch_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_batch RECORD;
  v_orders JSONB;
BEGIN
  SELECT * INTO v_batch
  FROM order_batches
  WHERE id = p_batch_id AND user_id = auth.uid();
  
  IF v_batch IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get orders in batch
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'market_id', o.market_id,
      'outcome', o.outcome,
      'side', o.side,
      'price', o.price,
      'quantity', o.quantity,
      'filled_quantity', o.filled_quantity,
      'status', o.status,
      'created_at', o.created_at
    )
  ) INTO v_orders
  FROM orders o
  WHERE o.batch_id = p_batch_id;
  
  RETURN jsonb_build_object(
    'id', v_batch.id,
    'status', v_batch.status,
    'total_cost', v_batch.total_cost,
    'order_count', v_batch.order_count,
    'filled_count', v_batch.filled_count,
    'failed_count', v_batch.failed_count,
    'created_at', v_batch.created_at,
    'completed_at', v_batch.completed_at,
    'orders', COALESCE(v_orders, '[]'::jsonb)
  );
END;
$$;


ALTER FUNCTION "public"."get_batch_details"("p_batch_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_events_with_resolution"("p_status" character varying DEFAULT NULL::character varying, "p_category" character varying DEFAULT NULL::character varying, "p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "name" "text", "question" "text", "category" character varying, "subcategory" character varying, "tags" "text"[], "trading_closes_at" timestamp with time zone, "status" character varying, "resolution_method" character varying, "resolution_status" character varying, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.question,
    m.category,
    m.subcategory,
    m.tags,
    m.trading_closes_at,
    m.status,
    COALESCE(rs.primary_method, 'manual_admin') as resolution_method,
    COALESCE(rs.status, 'pending') as resolution_status,
    m.created_at
  FROM markets m
  LEFT JOIN resolution_systems rs ON rs.event_id = m.id
  WHERE 
    (p_status IS NULL OR m.status = p_status)
    AND (p_category IS NULL OR m.category = p_category)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_events_with_resolution"("p_status" character varying, "p_category" character varying, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exchange_rate_v2"("p_currency_pair" "text" DEFAULT 'USDT/BDT'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE v_rate RECORD;
BEGIN
  SELECT * INTO v_rate FROM exchange_rates WHERE currency_pair = p_currency_pair;
  IF v_rate IS NULL THEN
    RETURN jsonb_build_object('found', false, 'pair', p_currency_pair);
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'pair', v_rate.currency_pair,
    'rate', v_rate.rate,
    'previous_rate', v_rate.previous_rate,
    'change_pct', v_rate.change_percentage,
    'recorded_at', v_rate.recorded_at
  );
END;
$$;


ALTER FUNCTION "public"."get_exchange_rate_v2"("p_currency_pair" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_follow_status"("p_follower_id" "uuid", "p_following_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_is_following BOOLEAN;
    v_has_pending_request BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM user_follows 
        WHERE follower_id = p_follower_id AND following_id = p_following_id
    ) INTO v_is_following;
    
    SELECT EXISTS(
        SELECT 1 FROM follow_requests 
        WHERE requester_id = p_follower_id 
          AND target_id = p_following_id 
          AND status = 'pending'
    ) INTO v_has_pending_request;
    
    RETURN jsonb_build_object(
        'is_following', v_is_following,
        'has_pending_request', v_has_pending_request
    );
END;
$$;


ALTER FUNCTION "public"."get_follow_status"("p_follower_id" "uuid", "p_following_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaderboard"("p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS TABLE("user_id" "uuid", "username" "text", "pnl" numeric, "score" numeric, "win_count" integer, "loss_count" integer, "trade_count" integer, "win_rate" numeric, "rank_tier" "text", "streak" integer, "rank" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_leaderboard_v2(p_limit, p_offset);
END;
$$;


ALTER FUNCTION "public"."get_leaderboard"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_leaderboard_v2"("p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0, "p_tier" "text" DEFAULT NULL::"text", "p_season" "text" DEFAULT NULL::"text") RETURNS TABLE("user_id" "uuid", "username" "text", "pnl" numeric, "score" numeric, "win_count" integer, "loss_count" integer, "trade_count" integer, "win_rate" numeric, "rank_tier" "text", "streak" integer, "rank" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT mv.user_id, mv.username, mv.pnl, mv.score,
    mv.win_count::INT, mv.loss_count::INT, mv.trade_count::INT, mv.win_rate,
    mv.rank_tier, mv.streak::INT, mv.rank
  FROM leaderboard_mv mv
  WHERE (p_tier IS NULL OR mv.rank_tier = p_tier)
  ORDER BY mv.rank ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_leaderboard_v2"("p_limit" integer, "p_offset" integer, "p_tier" "text", "p_season" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_legal_review_queue"("p_assignee_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("draft_id" "uuid", "question" "text", "category" character varying, "risk_level" character varying, "priority" character varying, "requires_senior" boolean, "sensitive_topics" "text"[], "submitted_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.question,
        d.category,
        d.regulatory_risk_level,
        q.priority,
        d.requires_senior_counsel,
        d.sensitive_topics,
        d.submitted_at
    FROM market_creation_drafts d
    JOIN legal_review_queue q ON q.draft_id = d.id
    WHERE d.legal_review_status = 'pending'
    AND (p_assignee_id IS NULL OR q.assigned_to = p_assignee_id)
    ORDER BY 
        CASE q.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            ELSE 4 
        END,
        d.submitted_at;
END;
$$;


ALTER FUNCTION "public"."get_legal_review_queue"("p_assignee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_comments_threaded"("p_market_id" "uuid", "p_sort_by" "text" DEFAULT 'score'::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "market_id" "uuid", "user_id" "uuid", "parent_id" "uuid", "content" "text", "depth_level" integer, "is_collapsed" boolean, "upvotes" integer, "downvotes" integer, "score" numeric, "sentiment" "text", "is_flagged" boolean, "is_deleted" boolean, "created_at" timestamp with time zone, "edited_at" timestamp with time zone, "author_reputation" numeric, "reply_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        SELECT mc.*, COALESCE(ur.reputation_score, 0) as author_reputation
        FROM public.market_comments mc
        LEFT JOIN public.user_reputation ur ON mc.user_id = ur.user_id
        WHERE mc.market_id = p_market_id AND mc.parent_id IS NULL AND mc.is_deleted = FALSE
        UNION ALL
        SELECT mc.*, COALESCE(ur.reputation_score, 0) as author_reputation
        FROM public.market_comments mc
        INNER JOIN comment_tree ct ON mc.parent_id = ct.id
        LEFT JOIN public.user_reputation ur ON mc.user_id = ur.user_id
        WHERE mc.is_deleted = FALSE AND mc.depth_level < 10
    ),
    reply_counts AS (
        SELECT parent_id, COUNT(*) as count
        FROM public.market_comments
        WHERE parent_id IS NOT NULL AND is_deleted = FALSE
        GROUP BY parent_id
    )
    SELECT ct.*, COALESCE(rc.count, 0)::BIGINT as reply_count
    FROM comment_tree ct
    LEFT JOIN reply_counts rc ON ct.id = rc.parent_id
    ORDER BY 
        CASE WHEN p_sort_by = 'score' THEN ct.score ELSE EXTRACT(EPOCH FROM ct.created_at) END DESC,
        ct.created_at ASC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_market_comments_threaded"("p_market_id" "uuid", "p_sort_by" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_prices"("p_market_id" "uuid") RETURNS TABLE("yes_price" numeric, "no_price" numeric, "yes_volume" bigint, "no_volume" bigint)
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_market_prices"("p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_stats_summary"("p_market_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_result JSONB;
  v_volume DECIMAL(18,2);
  v_volume_24h DECIMAL(18,2);
  v_trade_count INT;
  v_unique_traders INT;
  v_follower_count INT;
  v_bookmark_count INT;
BEGIN
  -- Total volume
  SELECT COALESCE(SUM(price * quantity), 0) INTO v_volume
  FROM trades WHERE market_id = p_market_id;
  
  -- 24h volume
  SELECT COALESCE(SUM(price * quantity), 0) INTO v_volume_24h
  FROM trades 
  WHERE market_id = p_market_id 
  AND created_at >= now() - INTERVAL '24 hours';
  
  -- Trade count
  SELECT COUNT(*) INTO v_trade_count
  FROM trades WHERE market_id = p_market_id;
  
  -- Unique traders
  SELECT COUNT(DISTINCT user_id) INTO v_unique_traders
  FROM positions WHERE market_id = p_market_id;
  
  -- Followers
  SELECT COUNT(*) INTO v_follower_count
  FROM market_followers WHERE market_id = p_market_id;
  
  -- Bookmarks
  SELECT COUNT(*) INTO v_bookmark_count
  FROM user_bookmarks WHERE market_id = p_market_id;
  
  v_result := jsonb_build_object(
    'market_id', p_market_id,
    'volume', v_volume,
    'volume_24h', v_volume_24h,
    'trade_count', v_trade_count,
    'unique_traders', v_unique_traders,
    'follower_count', v_follower_count,
    'bookmark_count', v_bookmark_count,
    'updated_at', now()
  );
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_market_stats_summary"("p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_stats_v2"("p_market_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_volume', COALESCE(SUM(t.price * t.quantity), 0),
    'trade_count', COUNT(t.id),
    'last_price', (SELECT price FROM trades WHERE market_id = p_market_id ORDER BY created_at DESC LIMIT 1),
    'high_24h', (SELECT MAX(price) FROM trades WHERE market_id = p_market_id AND created_at > NOW() - INTERVAL '24 hours'),
    'low_24h', (SELECT MIN(price) FROM trades WHERE market_id = p_market_id AND created_at > NOW() - INTERVAL '24 hours'),
    'open_interest', (SELECT COALESCE(SUM(remaining_quantity), 0) FROM orders WHERE market_id = p_market_id AND status IN ('open', 'partially_filled')),
    'active_orders', (SELECT COUNT(*) FROM orders WHERE market_id = p_market_id AND status IN ('open', 'partially_filled'))
  ) INTO v_stats
  FROM trades t
  WHERE t.market_id = p_market_id;

  RETURN v_stats;
END;
$$;


ALTER FUNCTION "public"."get_market_stats_v2"("p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_trades"("p_market_id" "uuid", "p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "price" numeric, "quantity" bigint, "outcome" "public"."outcome_type", "created_at" timestamp with time zone, "trade_type" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_market_trades_v2(p_market_id, p_limit, 0);
END;
$$;


ALTER FUNCTION "public"."get_market_trades"("p_market_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_trades_v2"("p_market_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "price" numeric, "quantity" bigint, "outcome" "public"."outcome_type", "created_at" timestamp with time zone, "trade_type" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.price, t.quantity, t.outcome, t.created_at, t.trade_type
  FROM trades t
  WHERE t.market_id = p_market_id
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_market_trades_v2"("p_market_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_sequence"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_next BIGINT;
BEGIN
  UPDATE global_sequence 
  SET last_sequence = last_sequence + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING last_sequence INTO v_next;
  
  RETURN v_next;
END;
$$;


ALTER FUNCTION "public"."get_next_sequence"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_oracle_status_v2"("p_market_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'request_id', r.id,
    'market_id', r.market_id,
    'status', r.status,
    'resolution', r.resolution,
    'proposed_outcome', r.proposed_outcome,
    'confidence', r.confidence_score,
    'reasoning', COALESCE(r.reasoning, r.ai_analysis),
    'evidence', r.evidence_urls,
    'is_disputed', r.is_disputed,
    'dispute_count', r.dispute_count,
    'bond_amount', r.bond_amount,
    'created_at', r.created_at,
    'disputes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', d.id, 'reason', d.reason, 'status', d.status,
        'resolution_outcome', d.resolution_outcome,
        'admin_response', d.admin_response, 'created_at', d.created_at
      )), '[]'::JSONB)
      FROM oracle_disputes d WHERE d.request_id = r.id
    )
  ) INTO v_result
  FROM oracle_requests r
  WHERE r.market_id = p_market_id
  ORDER BY r.created_at DESC LIMIT 1;

  RETURN COALESCE(v_result, jsonb_build_object('found', false));
END;
$$;


ALTER FUNCTION "public"."get_oracle_status_v2"("p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_book"("p_market_id" "uuid", "p_depth" integer DEFAULT 20) RETURNS TABLE("side" "text", "price" numeric, "total_quantity" numeric, "order_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_order_book_v2(p_market_id, 'YES', p_depth);
END;
$$;


ALTER FUNCTION "public"."get_order_book"("p_market_id" "uuid", "p_depth" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_book_depth"("p_market_id" "uuid", "p_depth" integer DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_bids JSONB;
  v_asks JSONB;
BEGIN
  -- Aggregate bids (buy orders)
  SELECT jsonb_agg(jsonb_build_object(
    'price', price,
    'size', total_size,
    'order_count', order_count
  ) ORDER BY price DESC)
  INTO v_bids
  FROM (
    SELECT 
      price,
      SUM(quantity - filled_quantity) as total_size,
      COUNT(*) as order_count
    FROM public.orders
    WHERE market_id = p_market_id
      AND side = 'buy'
      AND status IN ('open', 'partially_filled')
    GROUP BY price
    ORDER BY price DESC
    LIMIT p_depth
  ) bids;

  -- Aggregate asks (sell orders)
  SELECT jsonb_agg(jsonb_build_object(
    'price', price,
    'size', total_size,
    'order_count', order_count
  ) ORDER BY price ASC)
  INTO v_asks
  FROM (
    SELECT 
      price,
      SUM(quantity - filled_quantity) as total_size,
      COUNT(*) as order_count
    FROM public.orders
    WHERE market_id = p_market_id
      AND side = 'sell'
      AND status IN ('open', 'partially_filled')
    GROUP BY price
    ORDER BY price ASC
    LIMIT p_depth
  ) asks;

  RETURN jsonb_build_object(
    'market_id', p_market_id,
    'bids', COALESCE(v_bids, '[]'::jsonb),
    'asks', COALESCE(v_asks, '[]'::jsonb),
    'timestamp', NOW()
  );
END;
$$;


ALTER FUNCTION "public"."get_order_book_depth"("p_market_id" "uuid", "p_depth" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_order_book_v2"("p_market_id" "uuid", "p_outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type", "p_depth" integer DEFAULT 20) RETURNS TABLE("side" "text", "price" numeric, "total_quantity" numeric, "order_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 'buy'::TEXT, o.price, SUM(o.remaining_quantity), COUNT(*)
    FROM orders o
    WHERE o.market_id = p_market_id 
      AND o.outcome = p_outcome
      AND o.side = 'buy'
      AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY o.price DESC
    LIMIT p_depth
  )
  UNION ALL
  (
    SELECT 'sell'::TEXT, o.price, SUM(o.remaining_quantity), COUNT(*)
    FROM orders o
    WHERE o.market_id = p_market_id 
      AND o.outcome = p_outcome
      AND o.side = 'sell'
      AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY o.price ASC
    LIMIT p_depth
  );
END;
$$;


ALTER FUNCTION "public"."get_order_book_v2"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_depth" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_orderbook"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_side" "public"."order_side") RETURNS TABLE("price" numeric, "quantity" bigint, "total" bigint)
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."get_orderbook"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_side" "public"."order_side") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_orphaned_event_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT id FROM public.orphaned_events;
$$;


ALTER FUNCTION "public"."get_orphaned_event_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_platform_analytics"("p_period" character varying DEFAULT '24h'::character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.get_platform_stats_v2();
END;
$$;


ALTER FUNCTION "public"."get_platform_analytics"("p_period" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_platform_analytics"("p_period" character varying DEFAULT '24h'::character varying, "p_metric_type" character varying DEFAULT 'trading'::character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_result JSONB;
    v_is_admin BOOLEAN;
BEGIN
    -- Check Admin Access
    SELECT is_admin INTO v_is_admin
    FROM user_profiles
    WHERE id = auth.uid();
    
    IF v_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    -- Determine time range
    CASE p_period
        WHEN '24h' THEN v_start_time := NOW() - INTERVAL '24 hours';
        WHEN '7d' THEN v_start_time := NOW() - INTERVAL '7 days';
        WHEN '30d' THEN v_start_time := NOW() - INTERVAL '30 days';
        WHEN 'all' THEN v_start_time := '2020-01-01'::TIMESTAMPTZ;
        ELSE v_start_time := NOW() - INTERVAL '24 hours';
    END CASE;

    -- Return JSON based on metric type
    IF p_metric_type = 'trading' THEN
        SELECT jsonb_build_object(
            'summary', (
                SELECT jsonb_build_object(
                    'total_volume', COALESCE(SUM(total_volume), 0),
                    'total_trades', COALESCE(SUM(trade_count), 0),
                    'avg_volume', COALESCE(AVG(total_volume), 0)
                )
                FROM analytics_snapshots_hourly
                WHERE bucket_start >= v_start_time
            ),
            'series', (
                SELECT jsonb_agg(jsonb_build_object(
                    'time', bucket_start,
                    'volume', total_volume,
                    'trades', trade_count,
                    'active_traders', active_traders_count
                ) ORDER BY bucket_start ASC)
                FROM analytics_snapshots_hourly
                WHERE bucket_start >= v_start_time
            )
        ) INTO v_result;
        
    ELSIF p_metric_type = 'users' THEN
        SELECT jsonb_build_object(
            'summary', (
                SELECT jsonb_build_object(
                    'new_users', COALESCE(SUM(new_users_count), 0),
                    'active_traders', COALESCE(MAX(active_traders_count), 0)
                )
                FROM analytics_snapshots_hourly
                WHERE bucket_start >= v_start_time
            ),
            'series', (
                SELECT jsonb_agg(jsonb_build_object(
                    'time', bucket_start,
                    'new_users', new_users_count,
                    'active_traders', active_traders_count
                ) ORDER BY bucket_start ASC)
                FROM analytics_snapshots_hourly
                WHERE bucket_start >= v_start_time
            )
        ) INTO v_result;
        
    ELSIF p_metric_type = 'financial' THEN
        SELECT jsonb_build_object(
            'summary', (
                SELECT jsonb_build_object(
                    'gross_revenue', COALESCE(SUM(gross_revenue), 0),
                    'net_revenue', COALESCE(SUM(net_revenue), 0)
                )
                FROM analytics_snapshots_hourly
                WHERE bucket_start >= v_start_time
            ),
            'series', (
                SELECT jsonb_agg(jsonb_build_object(
                    'time', bucket_start,
                    'revenue', gross_revenue,
                    'net_revenue', net_revenue
                ) ORDER BY bucket_start ASC)
                FROM analytics_snapshots_hourly
                WHERE bucket_start >= v_start_time
            )
        ) INTO v_result;

    ELSE
        v_result := '{}'::JSONB;
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_platform_analytics"("p_period" character varying, "p_metric_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_platform_stats_v2"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users_24h', (SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours'),
    'total_markets', (SELECT COUNT(*) FROM markets),
    'active_markets', (SELECT COUNT(*) FROM markets WHERE status = 'active'),
    'resolved_markets', (SELECT COUNT(*) FROM markets WHERE status = 'resolved'),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'open_orders', (SELECT COUNT(*) FROM orders WHERE status IN ('open', 'partially_filled')),
    'total_trades', (SELECT COUNT(*) FROM trades),
    'total_volume', (SELECT COALESCE(SUM(price * quantity), 0) FROM trades),
    'volume_24h', (SELECT COALESCE(SUM(price * quantity), 0) FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'),
    'total_deposits', (SELECT COALESCE(SUM(total_deposited), 0) FROM wallets),
    'total_withdrawals', (SELECT COALESCE(SUM(total_withdrawn), 0) FROM wallets),
    'total_wallet_balance', (SELECT COALESCE(SUM(balance + locked_balance), 0) FROM wallets),
    'leaderboard_players', (SELECT COUNT(*) FROM leaderboard),
    'timestamp', NOW()
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;


ALTER FUNCTION "public"."get_platform_stats_v2"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_interval_hours" integer DEFAULT 24) RETURNS TABLE("timestamp_bucket" timestamp with time zone, "open_price" numeric, "high_price" numeric, "low_price" numeric, "close_price" numeric, "volume" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', recorded_at),
    (array_agg(price ORDER BY recorded_at ASC))[1],
    MAX(price), MIN(price),
    (array_agg(price ORDER BY recorded_at DESC))[1],
    COUNT(*) * 10.0
  FROM price_history
  WHERE market_id = p_market_id
    AND recorded_at >= NOW() - (p_interval_hours || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', recorded_at)
  ORDER BY 1 ASC;
END;
$$;


ALTER FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_interval_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_hours" integer DEFAULT 24, "p_outcome" "text" DEFAULT 'YES'::"text") RETURNS TABLE("price" numeric, "volume_at_time" numeric, "recorded_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT ph.price, ph.volume_at_time, ph.recorded_at
  FROM price_history ph
  WHERE ph.market_id = p_market_id
    AND ph.outcome = p_outcome
    AND ph.recorded_at >= now() - (p_hours || ' hours')::INTERVAL
  ORDER BY ph.recorded_at ASC
  LIMIT 500;
END;
$$;


ALTER FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_hours" integer, "p_outcome" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_price_history_ohlc"("p_market_id" "uuid", "p_interval" "text" DEFAULT '1h'::"text", "p_limit" integer DEFAULT 168) RETURNS TABLE("bucket" timestamp with time zone, "open_price" numeric, "high_price" numeric, "low_price" numeric, "close_price" numeric, "volume" numeric, "trade_count" bigint)
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_interval INTERVAL;
BEGIN
  v_interval := CASE p_interval
    WHEN '5m' THEN INTERVAL '5 minutes'
    WHEN '15m' THEN INTERVAL '15 minutes'
    WHEN '1h' THEN INTERVAL '1 hour'
    WHEN '4h' THEN INTERVAL '4 hours'  
    WHEN '1d' THEN INTERVAL '1 day'
    ELSE INTERVAL '1 hour'
  END;

  RETURN QUERY
  SELECT
    date_trunc('hour', ph.recorded_at) AS bucket,
    (array_agg(ph.price ORDER BY ph.recorded_at ASC))[1] AS open_price,
    MAX(ph.price) AS high_price,
    MIN(ph.price) AS low_price,
    (array_agg(ph.price ORDER BY ph.recorded_at DESC))[1] AS close_price,
    COALESCE(SUM(ph.volume_at_time), 0) AS volume,
    COUNT(*) AS trade_count
  FROM price_history ph
  WHERE ph.market_id = p_market_id
    AND ph.recorded_at >= NOW() - (p_limit * v_interval)
  GROUP BY date_trunc('hour', ph.recorded_at)
  ORDER BY bucket ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_price_history_ohlc"("p_market_id" "uuid", "p_interval" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = auth.uid() AND read = false;
  
  RETURN jsonb_build_object(
    'unread_count', v_count,
    'timestamp', now()
  );
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_admin_profile"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (SELECT row_to_json(p) FROM public.profiles p WHERE id = p_user_id);
END;
$$;


ALTER FUNCTION "public"."get_user_admin_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_analytics_v2"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id),
    'open_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND status IN ('open', 'partially_filled')),
    'filled_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND status = 'filled'),
    'cancelled_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND status = 'cancelled'),
    'total_trades_as_maker', (SELECT COUNT(*) FROM trades WHERE maker_id = p_user_id),
    'total_trades_as_taker', (SELECT COUNT(*) FROM trades WHERE taker_id = p_user_id),
    'total_volume', (
      SELECT COALESCE(SUM(price * quantity), 0) FROM trades 
      WHERE maker_id = p_user_id OR taker_id = p_user_id
    ),
    'active_positions', (SELECT COUNT(*) FROM positions WHERE user_id = p_user_id AND quantity > 0),
    'total_pnl', (SELECT COALESCE(SUM(realized_pnl), 0) FROM positions WHERE user_id = p_user_id),
    'wallet', (SELECT get_wallet_summary_v2(p_user_id)),
    'rank', (SELECT get_user_rank_v2(p_user_id)),
    'member_since', (SELECT created_at FROM users WHERE id = p_user_id)
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$;


ALTER FUNCTION "public"."get_user_analytics_v2"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_orders"("p_user_id" "uuid", "p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "market_id" "uuid", "side" "public"."order_side", "order_type" "public"."order_type", "outcome" "public"."outcome_type", "price" numeric, "quantity" bigint, "filled_quantity" bigint, "remaining_quantity" numeric, "status" "public"."order_status", "total_cost" numeric, "fee_amount" numeric, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_user_orders_v2(p_user_id, NULL, NULL, p_limit, 0);
END;
$$;


ALTER FUNCTION "public"."get_user_orders"("p_user_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_orders_v2"("p_user_id" "uuid", "p_market_id" "uuid" DEFAULT NULL::"uuid", "p_status" "public"."order_status" DEFAULT NULL::"public"."order_status", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "market_id" "uuid", "side" "public"."order_side", "order_type" "public"."order_type", "outcome" "public"."outcome_type", "price" numeric, "quantity" bigint, "filled_quantity" bigint, "remaining_quantity" numeric, "status" "public"."order_status", "total_cost" numeric, "fee_amount" numeric, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.market_id, o.side, o.order_type, o.outcome, o.price, 
    o.quantity, o.filled_quantity, o.remaining_quantity,
    o.status, o.total_cost, o.fee_amount, o.created_at, o.updated_at
  FROM orders o
  WHERE o.user_id = p_user_id
    AND (p_market_id IS NULL OR o.market_id = p_market_id)
    AND (p_status IS NULL OR o.status = p_status)
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_user_orders_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_status" "public"."order_status", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_positions_v2"("p_user_id" "uuid") RETURNS TABLE("market_id" "uuid", "outcome" "public"."outcome_type", "quantity" bigint, "average_price" numeric, "realized_pnl" numeric, "current_value" numeric)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.market_id,
    p.outcome,
    p.quantity,
    p.average_price,
    p.realized_pnl,
    (p.quantity * COALESCE(
      CASE WHEN p.outcome = 'YES' THEN e.current_yes_price ELSE e.current_no_price END,
      p.average_price
    )) as current_value
  FROM positions p
  JOIN events e ON e.id = p.market_id
  WHERE p.user_id = p_user_id AND p.quantity > 0
  ORDER BY p.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_positions_v2"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_rank_v2"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', mv.user_id,
    'username', mv.username,
    'rank', mv.rank,
    'score', mv.score,
    'pnl', mv.pnl,
    'tier', mv.rank_tier,
    'win_rate', mv.win_rate,
    'streak', mv.streak,
    'trade_count', mv.trade_count,
    'total_players', (SELECT COUNT(*) FROM leaderboard_mv)
  ) INTO v_result
  FROM leaderboard_mv mv
  WHERE mv.user_id = p_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('found', false));
END;
$$;


ALTER FUNCTION "public"."get_user_rank_v2"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_wallet_summary_v2"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'balance', w.balance,
    'locked_balance', w.locked_balance,
    'total_equity', w.balance + w.locked_balance,
    'total_deposited', w.total_deposited,
    'total_withdrawn', w.total_withdrawn,
    'total_earned', w.total_earned,
    'total_fees_paid', w.total_fees_paid,
    'is_active', w.is_active,
    'currency', w.currency,
    'usdt_address', w.usdt_address,
    'network_type', w.network_type,
    'daily_withdrawal_limit', w.daily_withdrawal_limit,
    'monthly_withdrawal_limit', w.monthly_withdrawal_limit,
    'recent_transactions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id, 'type', t.type, 'amount', t.amount,
        'balance_after', t.balance_after, 'created_at', t.created_at
      ) ORDER BY t.created_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 10) t
    )
  ) INTO v_result
  FROM wallets w WHERE w.user_id = p_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'Wallet not found'));
END;
$$;


ALTER FUNCTION "public"."get_wallet_summary_v2"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_weighted_expert_consensus"("p_event_id" "uuid") RETURNS TABLE("outcome" integer, "total_weight" numeric, "vote_count" integer, "avg_confidence" numeric, "consensus_percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH weighted_votes AS (
        SELECT 
            ev.vote_outcome,
            ep.reputation_score * (ev.confidence_level / 100.0) as vote_weight,
            ev.confidence_level
        FROM expert_votes ev
        JOIN expert_panel ep ON ev.expert_id = ep.id
        WHERE ev.event_id = p_event_id
        AND ep.is_verified = TRUE
        AND ep.is_active = TRUE
    )
    SELECT 
        wv.vote_outcome,
        SUM(wv.vote_weight) as total_weight,
        COUNT(*)::INTEGER as vote_count,
        AVG(wv.confidence_level) as avg_confidence,
        ROUND(
            SUM(wv.vote_weight) * 100.0 / NULLIF(SUM(SUM(wv.vote_weight)) OVER (), 0),
            2
        ) as consensus_percentage
    FROM weighted_votes wv
    GROUP BY wv.vote_outcome
    ORDER BY total_weight DESC;
END;
$$;


ALTER FUNCTION "public"."get_weighted_expert_consensus"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_weighted_expert_consensus"("p_event_id" "uuid") IS 'Returns weighted consensus for an event based on expert reputation';



CREATE OR REPLACE FUNCTION "public"."handle_market_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_market_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        full_name, 
        email, 
        is_admin,
        kyc_level,
        status,
        flags
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE),
        0,         -- Default KYC Level 0 (Unverified)
        'active',  -- Default status 'active'
        '{}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_trade_volume_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Increment volume on the associated market
  -- Note: We update both 'volume' (spec field) and 'total_volume' (existing field) for compatibility
  UPDATE public.markets
  SET 
    volume = COALESCE(volume, 0) + NEW.size,
    total_volume = COALESCE(total_volume, 0) + NEW.size,
    total_trades = COALESCE(total_trades, 0) + 1
  WHERE id = NEW.market_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_trade_volume_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hard_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_is_system" boolean DEFAULT false) RETURNS TABLE("success" boolean, "cancel_record_id" "uuid", "sequence_number" bigint, "released_collateral" numeric, "final_status" character varying, "filled_during_cancel" numeric, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD;
  v_cancel_record RECORD;
  v_seq BIGINT;
  v_old_filled DECIMAL(36, 18);
  v_new_filled DECIMAL(36, 18);
  v_released DECIMAL(36, 18);
  v_race_detected BOOLEAN := FALSE;
  v_race_resolution VARCHAR(20);
  v_final_cancelled_qty DECIMAL(36, 18);
BEGIN
  -- Lock the order
  SELECT * INTO v_order
  FROM order_book
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 0::DECIMAL, NULL::VARCHAR(20), 0::DECIMAL, 'Order not found'::TEXT;
    RETURN;
  END IF;
  
  -- Authorization check (skip if system call)
  IF NOT p_is_system AND v_order.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 0::DECIMAL, NULL::VARCHAR(20), 0::DECIMAL, 'Unauthorized'::TEXT;
    RETURN;
  END IF;
  
  -- Can only hard cancel from CANCELLING state
  IF v_order.status != 'CANCELLING' AND NOT p_is_system THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 0::DECIMAL, v_order.status, 0::DECIMAL, 
      'Order not in cancellable state: ' || v_order.status::TEXT;
    RETURN;
  END IF;
  
  -- Get the cancellation record
  SELECT * INTO v_cancel_record
  FROM cancellation_records
  WHERE order_id = p_order_id
  ORDER BY requested_at DESC
  LIMIT 1;
  
  v_old_filled := COALESCE(v_cancel_record.filled_quantity_before, v_order.filled);
  v_new_filled := v_order.filled;
  
  -- Detect race condition: fill occurred during cancellation
  IF v_new_filled > v_old_filled THEN
    v_race_detected := TRUE;
    
    IF v_new_filled >= v_order.size THEN
      -- Fully filled before cancel completed
      v_race_resolution := 'FILL_WON';
      v_final_cancelled_qty := 0;
      
      -- Update order to FILLED
      UPDATE order_book
      SET status = 'FILLED',
          updated_at = NOW()
      WHERE id = p_order_id;
      
      RETURN QUERY SELECT FALSE, v_cancel_record.id, v_cancel_record.sequence_number, 0::DECIMAL, 
        'FILLED'::VARCHAR(20), (v_new_filled - v_old_filled),
        'Order filled during cancellation, cancel rejected'::TEXT;
      RETURN;
    ELSE
      -- Partial fill
      v_race_resolution := 'PARTIAL_FILL';
      v_final_cancelled_qty := v_order.size - v_new_filled;
    END IF;
  ELSE
    v_race_resolution := 'CANCEL_WON';
    v_final_cancelled_qty := v_order.size - v_new_filled;
  END IF;
  
  -- Calculate released collateral
  v_released := v_final_cancelled_qty * v_order.price;
  
  -- Get new sequence number
  v_seq := get_next_sequence();
  
  -- Finalize order status
  UPDATE order_book
  SET status = 'CANCELLED',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Update cancellation record
  UPDATE cancellation_records
  SET hard_cancelled_at = NOW(),
      cancel_type = CASE 
        WHEN cancel_type = 'SOFT' AND v_race_detected THEN 'SOFT'
        WHEN cancel_type = 'SOFT' THEN 'HARD'
        ELSE cancel_type
      END,
      final_filled_quantity = v_new_filled,
      final_cancelled_quantity = v_final_cancelled_qty,
      released_collateral = v_released,
      race_condition_detected = v_race_detected,
      race_resolution = v_race_resolution,
      sequence_number = v_seq
  WHERE id = v_cancel_record.id;
  
  -- Release locked funds (simplified - actual implementation depends on wallet system)
  -- This would call a wallet release function
  
  RETURN QUERY SELECT TRUE, v_cancel_record.id, v_seq, v_released, 
    CASE WHEN v_race_resolution = 'PARTIAL_FILL' THEN 'PARTIAL'::VARCHAR(20) ELSE 'CANCELLED'::VARCHAR(20) END,
    (v_new_filled - v_old_filled),
    CASE 
      WHEN v_race_resolution = 'FILL_WON' THEN 'Order filled, cancel rejected'
      WHEN v_race_resolution = 'PARTIAL_FILL' THEN 'Partial fill occurred, remainder cancelled'
      ELSE 'Order successfully cancelled'
    END::TEXT;
END;
$$;


ALTER FUNCTION "public"."hard_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_is_system" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_agent_usage"("p_agent_key" "text", "p_tokens" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE ai_agent_configs
    SET total_tokens_spent = total_tokens_spent + p_tokens,
        last_run_at = NOW(), updated_at = NOW()
    WHERE agent_key = p_agent_key;

    INSERT INTO ai_usage_logs (agent_key, usage_date, tokens_used, calls_count, estimated_cost)
    VALUES (p_agent_key, CURRENT_DATE, p_tokens, 1, (p_tokens::DECIMAL / 1000000) * 0.075)
    ON CONFLICT (agent_key, usage_date) DO UPDATE
    SET tokens_used = ai_usage_logs.tokens_used + p_tokens,
        calls_count = ai_usage_logs.calls_count + 1,
        estimated_cost = ai_usage_logs.estimated_cost + ((p_tokens::DECIMAL / 1000000) * 0.075);
END;
$$;


ALTER FUNCTION "public"."increment_agent_usage"("p_agent_key" "text", "p_tokens" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_filled"("p_order_id" "uuid", "p_amount" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_size DECIMAL;
  v_filled DECIMAL;
  v_new_filled DECIMAL;
BEGIN
  -- Lock the row
  SELECT size, filled INTO v_size, v_filled
  FROM order_book
  WHERE id = p_order_id
  FOR UPDATE;

  v_new_filled := v_filled + p_amount;

  UPDATE order_book
  SET 
    filled = v_new_filled,
    updated_at = NOW(),
    status = CASE 
      WHEN v_new_filled >= v_size THEN 'FILLED'
      ELSE 'PARTIAL'
    END
  WHERE id = p_order_id;
END;
$$;


ALTER FUNCTION "public"."increment_filled"("p_order_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(is_admin, false) FROM public.users WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _is_admin boolean;
  _is_super_admin boolean;
BEGIN
  SELECT is_admin, is_super_admin INTO _is_admin, _is_super_admin
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(_is_admin, false) OR COALESCE(_is_super_admin, false);
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_secure"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _is_admin boolean;
  _is_super_admin boolean;
BEGIN
  SELECT is_admin, is_super_admin INTO _is_admin, _is_super_admin
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(_is_admin, false) OR COALESCE(_is_super_admin, false);
END;
$$;


ALTER FUNCTION "public"."is_admin_secure"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_dispute_bond"("p_user_id" "uuid", "p_amount" numeric, "p_dispute_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    -- Atomic deduction
    UPDATE wallets
    SET balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND balance >= p_amount;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'Insufficient balance or user not found for dispute bond.';
    END IF;
    
    INSERT INTO transactions (
        user_id, transaction_type, amount, description, metadata, status
    )
    VALUES (
        p_user_id, 'dispute_bond', -p_amount, 'Dispute bond locked',
        jsonb_build_object('dispute_id', p_dispute_id, 'amount', p_amount, 'type', 'bond_lock'),
        'completed'
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."lock_dispute_bond"("p_user_id" "uuid", "p_amount" numeric, "p_dispute_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.freeze_funds_v2(p_user_id, p_amount);
END;
$$;


ALTER FUNCTION "public"."lock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_details" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- We parse text into diff_jsonb to fit the new v2 schema smoothly
  RETURN log_admin_action_v2(
    p_admin_id     := p_admin_id,
    p_action       := p_action,
    p_diff_jsonb   := CASE WHEN p_details IS NOT NULL THEN jsonb_build_object('legacy_details', p_details) ELSE NULL END
  );
END;
$$;


ALTER FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_details" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action_type" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb" DEFAULT NULL::"jsonb", "p_new_values" "jsonb" DEFAULT NULL::"jsonb", "p_reason" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_workflow_id" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id UUID;
  v_change_summary TEXT;
BEGIN
  -- Generate change summary
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    v_change_summary := format('Changed %s from %s to %s', 
      p_resource_type, p_old_values::TEXT, p_new_values::TEXT);
  ELSIF p_new_values IS NOT NULL THEN
    v_change_summary := format('Created new %s: %s', p_resource_type, p_new_values::TEXT);
  ELSE
    v_change_summary := format('Action: %s on %s', p_action_type, p_resource_type);
  END IF;

  -- Insert log
  INSERT INTO admin_activity_logs (
    admin_id, action_type, resource_type, resource_id,
    old_values, new_values, change_summary, reason,
    ip_address, user_agent, workflow_id, workflow_status
  )
  VALUES (
    p_admin_id, p_action_type, p_resource_type, p_resource_id,
    p_old_values, p_new_values, v_change_summary, p_reason,
    p_ip_address, p_user_agent, p_workflow_id,
    CASE WHEN p_workflow_id IS NOT NULL THEN 'pending' ELSE 'completed' END
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action_type" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_reason" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_workflow_id" character varying) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action_type" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_reason" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_workflow_id" character varying) IS 'Logs admin activity with change tracking';



CREATE OR REPLACE FUNCTION "public"."log_admin_action_v2"("p_admin_id" "uuid", "p_action" "text", "p_target_table" "text" DEFAULT NULL::"text", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_diff_jsonb" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO admin_audit_log (action, performed_by, target_table, target_id, diff_jsonb, ip_address)
  VALUES (p_action, p_admin_id, p_target_table, p_target_id, p_diff_jsonb, p_ip_address)
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."log_admin_action_v2"("p_admin_id" "uuid", "p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_diff_jsonb" "jsonb", "p_ip_address" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_entity_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        previous_state,
        new_state,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."log_entity_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_market_movement_activity"("p_market_id" "uuid", "p_user_id" "uuid", "p_movement_type" character varying, "p_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_activity_id UUID;
    v_follower_id UUID;
BEGIN
    -- Create activity for the user who triggered it
    INSERT INTO activities (
        user_id,
        type,
        priority,
        algorithmic_weight,
        data,
        is_global
    ) VALUES (
        p_user_id,
        'market_movement',
        'high',
        90,
        p_data || jsonb_build_object('marketId', p_market_id, 'movementType', p_movement_type),
        false
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_activity_id;
    
    -- Create activities for followers of this market
    FOR v_follower_id IN 
        SELECT user_id FROM market_follows WHERE market_id = p_market_id
    LOOP
        INSERT INTO activities (
            user_id,
            type,
            priority,
            algorithmic_weight,
            data,
            is_global,
            source_user_id
        ) VALUES (
            v_follower_id,
            'market_movement',
            'high',
            90,
            p_data || jsonb_build_object('marketId', p_market_id, 'movementType', p_movement_type),
            false,
            p_user_id
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_market_movement_activity"("p_market_id" "uuid", "p_user_id" "uuid", "p_movement_type" character varying, "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_trader_activity"("p_trader_id" "uuid", "p_activity_type" character varying, "p_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_follower_id UUID;
BEGIN
    -- Create activities for followers of this trader
    FOR v_follower_id IN 
        SELECT follower_id FROM user_follows WHERE following_id = p_trader_id
    LOOP
        INSERT INTO activities (
            user_id,
            type,
            priority,
            algorithmic_weight,
            data,
            is_global,
            source_user_id
        ) VALUES (
            v_follower_id,
            'trader_activity',
            'medium',
            60,
            p_data || jsonb_build_object('traderId', p_trader_id, 'activityType', p_activity_type),
            false,
            p_trader_id
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."log_trader_activity"("p_trader_id" "uuid", "p_activity_type" character varying, "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_workflow_step"("p_execution_id" "uuid", "p_step_name" "text", "p_step_status" "text", "p_step_data" "jsonb" DEFAULT '{}'::"jsonb", "p_error_details" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_step_id UUID;
    v_existing_step_id UUID;
BEGIN
    -- Check if step already exists
    SELECT id INTO v_existing_step_id
    FROM workflow_steps
    WHERE execution_id = p_execution_id AND step_name = p_step_name
    ORDER BY started_at DESC
    LIMIT 1;

    IF v_existing_step_id IS NOT NULL THEN
        -- Update existing step
        UPDATE workflow_steps
        SET 
            step_status = p_step_status,
            step_data = p_step_data,
            error_details = p_error_details,
            completed_at = CASE 
                WHEN p_step_status IN ('completed', 'failed') THEN NOW() 
                ELSE NULL 
            END
        WHERE id = v_existing_step_id
        RETURNING id INTO v_step_id;
    ELSE
        -- Insert new step
        INSERT INTO workflow_steps (
            execution_id,
            step_name,
            step_status,
            step_data,
            error_details
        ) VALUES (
            p_execution_id,
            p_step_name,
            p_step_status,
            p_step_data,
            p_error_details
        ) RETURNING id INTO v_step_id;
    END IF;

    RETURN v_step_id;
END;
$$;


ALTER FUNCTION "public"."log_workflow_step"("p_execution_id" "uuid", "p_step_name" "text", "p_step_status" "text", "p_step_data" "jsonb", "p_error_details" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manual_resolve_market"("p_market_id" "uuid", "p_winning_outcome" character varying, "p_admin_id" "uuid", "p_resolution_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_market RECORD;
BEGIN
    -- Get market
    SELECT * INTO v_market 
    FROM public.markets 
    WHERE id = p_market_id;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Market not found';
        RETURN FALSE;
    END IF;
    
    IF v_market.status NOT IN ('active', 'closed') THEN
        RAISE NOTICE 'Market cannot be resolved';
        RETURN FALSE;
    END IF;
    
    -- Update market status
    UPDATE public.markets 
    SET status = 'resolved',
        winning_outcome = p_winning_outcome,
        resolved_at = NOW(),
        resolution_notes = p_resolution_notes,
        resolved_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_market_id;
    
    -- Log admin action
    INSERT INTO public.admin_activity_logs (
        admin_id, action, target_market_id, details, created_at
    ) VALUES (
        p_admin_id, 'resolve_market', p_market_id, 
        jsonb_build_object('winning_outcome', p_winning_outcome, 'notes', p_resolution_notes),
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error resolving market: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."manual_resolve_market"("p_market_id" "uuid", "p_winning_outcome" character varying, "p_admin_id" "uuid", "p_resolution_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[] DEFAULT NULL::"uuid"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    -- Mark all as read
    UPDATE notifications 
    SET read = true, read_at = now()
    WHERE user_id = auth.uid() AND read = false;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET read = true, read_at = now()
    WHERE user_id = auth.uid() 
    AND id = ANY(p_notification_ids)
    AND read = false;
  END IF;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'marked_read', v_count,
    'timestamp', now()
  );
END;
$$;


ALTER FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_order"("p_order_id" "uuid") RETURNS TABLE("matched" boolean, "trades_created" integer, "remaining_quantity" bigint)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_order RECORD;
    v_match RECORD;
    v_trade_quantity BIGINT;
    v_trade_price NUMERIC(5, 4);
    v_trades_count INT := 0;
    v_remaining BIGINT;
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
        ELSE
            v_trade_price := v_match.price;
        END IF;
        
        -- Create trade
        INSERT INTO public.trades (
            market_id, buy_order_id, sell_order_id, outcome,
            price, quantity, buyer_id, seller_id
        ) VALUES (
            v_order.market_id,
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_order.outcome,
            v_trade_price,
            v_trade_quantity,
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END
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


ALTER FUNCTION "public"."match_order"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_binary_market_outcomes"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  m RECORD;
BEGIN
  FOR m IN SELECT id, name, yes_price, no_price, total_volume 
           FROM markets 
           WHERE market_type = 'binary' 
           OR market_type IS NULL
  LOOP
    -- Check if outcomes already exist for this market
    IF NOT EXISTS (SELECT 1 FROM outcomes WHERE market_id = m.id) THEN
      -- Create YES outcome
      INSERT INTO outcomes (market_id, label, label_bn, current_price, total_volume, display_order)
      VALUES (m.id, 'YES', 'হ্যাঁ', COALESCE(m.yes_price, 0.5), COALESCE(m.total_volume, 0) / 2, 0);
      
      -- Create NO outcome
      INSERT INTO outcomes (market_id, label, label_bn, current_price, total_volume, display_order)
      VALUES (m.id, 'NO', 'না', COALESCE(m.no_price, 0.5), COALESCE(m.total_volume, 0) / 2, 1);
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."migrate_binary_market_outcomes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_market_followers_on_trade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  follower RECORD;
  trade_value DECIMAL;
  market_name TEXT;
  market_name_bn TEXT;
BEGIN
  -- Calculate trade value
  trade_value := NEW.price * NEW.quantity;

  -- Only notify for significant trades (value > 100 BDT)
  IF trade_value < 100 THEN 
    RETURN NEW; 
  END IF;
  
  -- Get market name
  SELECT name, name_bn INTO market_name, market_name_bn
  FROM markets WHERE id = NEW.market_id;

  -- Notify followers who opted in
  FOR follower IN
    SELECT mf.user_id
    FROM market_followers mf
    WHERE mf.market_id = NEW.market_id
      AND mf.notify_on_trade = true
      AND mf.user_id != NEW.maker_id
      AND mf.user_id != NEW.taker_id
  LOOP
    BEGIN
      INSERT INTO notifications (
        user_id, type, title, title_bn, body, body_bn, 
        market_id, trade_id, action_url
      ) VALUES (
        follower.user_id,
        'follower_trade',
        'বড় ট্রেড হয়েছে',
        'বড় ট্রেড হয়েছে',
        '৳' || ROUND(trade_value, 2)::TEXT || ' এর ট্রেড হয়েছে আপনার ফলো করা মার্কেটে',
        '৳' || ROUND(trade_value, 2)::TEXT || ' এর ট্রেড হয়েছে আপনার ফলো করা মার্কেটে',
        NEW.market_id,
        NEW.id,
        '/markets/' || NEW.market_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the trade
      RAISE WARNING 'Failed to create notification: %', SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_market_followers_on_trade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_market_resolve"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  resolution_text TEXT;
  resolution_text_bn TEXT;
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    -- Build resolution text
    resolution_text := COALESCE(NEW.resolution_outcome, 'নির্ধারিত');
    resolution_text_bn := CASE 
      WHEN NEW.resolution_outcome = 'YES' THEN 'হ্যাঁ'
      WHEN NEW.resolution_outcome = 'NO' THEN 'না'
      ELSE COALESCE(NEW.resolution_outcome, 'নির্ধারিত')
    END;
    
    -- Notify users with positions
    INSERT INTO notifications (
      user_id, type, title, title_bn, body, body_bn, 
      market_id, action_url
    )
    SELECT DISTINCT
      p.user_id,
      'market_resolved',
      'মার্কেট সমাধান হয়েছে',
      'মার্কেট সমাধান হয়েছে',
      NEW.name || ' — ফলাফল: ' || resolution_text,
      COALESCE(NEW.name_bn, NEW.name) || ' — ফলাফল: ' || resolution_text_bn,
      NEW.id,
      '/markets/' || NEW.id
    FROM positions p
    WHERE p.market_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_market_resolve"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_atomic_order"("p_market_id" "uuid", "p_side" "public"."order_side", "p_outcome" "public"."outcome_type", "p_price" numeric, "p_quantity" bigint, "p_order_type" "public"."order_type" DEFAULT 'limit'::"public"."order_type") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_total_cost NUMERIC(12, 2);
    v_wallet_balance NUMERIC(12, 2);
    v_order_id UUID;
BEGIN
    -- 1. Get current user ID from session
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Calculate required collateral
    v_total_cost := p_price * p_quantity;

    -- 3. Lock wallet row and verify balance (Defensive check)
    -- Using FOR UPDATE for row-level locking
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_wallet_balance < v_total_cost THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0002';
    END IF;

    -- 4. Lock collateral atomically
    UPDATE public.wallets
    SET 
        balance = balance - v_total_cost,
        locked_balance = locked_balance + v_total_cost,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- 5. Insert order with 'open' status
    INSERT INTO public.orders (
        market_id,
        user_id,
        order_type,
        side,
        outcome,
        price,
        quantity,
        filled_quantity,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_market_id,
        v_user_id,
        p_order_type,
        p_side,
        p_outcome,
        p_price,
        p_quantity,
        0,
        'open',
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;

    -- 6. Immediately trigger matching engine within the same transaction
    -- If matching succeeds/fails, it will commit/rollback as one unit
    PERFORM public.match_order(v_order_id);

    RETURN v_order_id;
END;
$$;


ALTER FUNCTION "public"."place_atomic_order"("p_market_id" "uuid", "p_side" "public"."order_side", "p_outcome" "public"."outcome_type", "p_price" numeric, "p_quantity" bigint, "p_order_type" "public"."order_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric, "p_order_type" "text" DEFAULT 'limit'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.place_order_atomic_v2(
    p_user_id, p_market_id, p_side::order_side, p_order_type::order_type,
    p_price, p_size
  );
END;
$$;


ALTER FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric, "p_order_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_outcome" "text", "p_price" numeric, "p_quantity" numeric, "p_order_type" "text" DEFAULT 'limit'::"text", "p_idempotency_key" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_balance     DECIMAL;
  v_required    DECIMAL;
  v_order_id    UUID;
  v_existing    JSONB;
BEGIN
  -- Idempotency check: has this key been used before for an order?
  IF p_idempotency_key IS NOT NULL THEN
    SELECT result INTO v_existing FROM idempotency_keys
      WHERE key = p_idempotency_key AND user_id = p_user_id;
    IF FOUND THEN RETURN v_existing; END IF;
  END IF;

  v_required := p_price * p_quantity;

  -- Row-level lock before balance check
  SELECT balance INTO v_balance
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_required THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;

  -- Fund freeze (no race condition here, row is already locked)
  IF p_side = 'buy' THEN
    UPDATE wallets
      SET balance        = balance - v_required,
          locked_balance = locked_balance + v_required,
          updated_at     = NOW()
      WHERE user_id = p_user_id;
  END IF;

  -- Order insert
  INSERT INTO orders
    (user_id, market_id, side, outcome, order_type,
     price, quantity, filled_quantity, status)
  VALUES
    (p_user_id, p_market_id, p_side, p_outcome, p_order_type,
     p_price, p_quantity, 0, 'open')
  RETURNING id INTO v_order_id;

  -- Idempotency key save
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO idempotency_keys (key, user_id, operation, result)
    VALUES (p_idempotency_key, p_user_id, 'place_order',
      jsonb_build_object('success', true, 'order_id', v_order_id))
    ON CONFLICT (key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;


ALTER FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_outcome" "text", "p_price" numeric, "p_quantity" numeric, "p_order_type" "text", "p_idempotency_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_order_id UUID;
  v_cost NUMERIC;
  v_freeze_res JSONB;
BEGIN
  v_cost := p_price * p_quantity;
  
  -- Atomically deduct wallet balances holding the pessimistic lock
  v_freeze_res := freeze_funds_v2(p_user_id, v_cost);
  IF NOT COALESCE((v_freeze_res->>'success')::BOOLEAN, false) THEN
    RETURN v_freeze_res;
  END IF;

  INSERT INTO orders (
    user_id, market_id, side, type, price, quantity, status
  ) VALUES (
    p_user_id, p_market_id, p_side, p_type, p_price, p_quantity, 'open'
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type", "p_tif" "text" DEFAULT 'GTC'::"text", "p_stop_price" numeric DEFAULT NULL::numeric, "p_post_only" boolean DEFAULT false, "p_client_id" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID;
  v_cost NUMERIC;
  v_market_status TEXT;
  v_fee NUMERIC;
BEGIN
  -- Validate market is open
  SELECT status INTO v_market_status FROM markets WHERE id = p_market_id;
  IF v_market_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market not found');
  END IF;
  IF v_market_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market is not active: ' || v_market_status);
  END IF;

  -- Validate price range (0.01 - 0.99 for binary markets)
  IF p_price < 0.01 OR p_price > 0.99 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price must be between 0.01 and 0.99');
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  -- Calculate cost and fee
  v_cost := p_price * p_quantity;
  v_fee := v_cost * 0.02; -- 2% fee

  -- Freeze funds atomically (pessimistic lock)
  PERFORM 1 FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF (SELECT balance FROM wallets WHERE user_id = p_user_id) < (v_cost + v_fee) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds', 
      'required', v_cost + v_fee,
      'available', (SELECT balance FROM wallets WHERE user_id = p_user_id));
  END IF;

  -- Deduct from available, add to locked
  UPDATE wallets 
  SET balance = balance - (v_cost + v_fee), 
      locked_balance = locked_balance + (v_cost + v_fee)
  WHERE user_id = p_user_id;

  -- Insert order
  INSERT INTO orders (
    user_id, market_id, side, order_type, outcome, price, quantity,
    filled_quantity, remaining_quantity, status, total_cost, fee_amount, fee_rate,
    time_in_force, stop_price, is_post_only, client_order_id, source
  ) VALUES (
    p_user_id, p_market_id, p_side, p_type, p_outcome, p_price, p_quantity,
    0, p_quantity, 'open', v_cost, v_fee, 0.02,
    p_tif, p_stop_price, p_post_only, p_client_id, 'web'
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_order_id,
    'cost', v_cost,
    'fee', v_fee,
    'total', v_cost + v_fee
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type", "p_tif" "text", "p_stop_price" numeric, "p_post_only" boolean, "p_client_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_analytics_last_24h"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 0..23 LOOP
        PERFORM calculate_hourly_metrics(NOW() - (i || ' hours')::INTERVAL);
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."populate_analytics_last_24h"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_aon_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) RETURNS TABLE("can_proceed" boolean, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_available_depth DECIMAL(36, 18);
BEGIN
  -- Check if full size can be filled
  SELECT COALESCE(SUM(size - filled), 0)
  INTO v_available_depth
  FROM order_book
  WHERE market_id = p_market_id
    AND side != p_side
    AND status IN ('OPEN', 'PARTIAL')
    AND CASE 
      WHEN p_side = 'BUY' THEN price <= p_price
      ELSE price >= p_price
    END;
  
  IF v_available_depth < p_size THEN
    -- Cancel - cannot fill completely
    UPDATE order_book
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT FALSE, 'AON order cancelled: complete fill impossible'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, 'AON order accepted'::TEXT;
  END IF;
END;
$$;


ALTER FUNCTION "public"."process_aon_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_deposit_tx"("p_user_id" "uuid", "p_amount" numeric, "p_txid" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  -- Idempotency: check if this txid was already processed
  IF EXISTS (
    SELECT 1 FROM idempotency_keys
    WHERE key = 'deposit-' || p_txid
  ) THEN
    RETURN TRUE;  -- Already processed, safe to return
  END IF;

  -- Balance lock and update
  SELECT balance INTO v_balance
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  UPDATE wallets
    SET balance    = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO wallet_transactions
    (user_id, amount, type, reference_id, balance_before, balance_after)
  VALUES
    (p_user_id, p_amount, 'deposit', p_txid,
     v_balance, v_balance + p_amount);

  -- Idempotency key save
  INSERT INTO idempotency_keys (key, user_id, operation, result)
  VALUES ('deposit-' || p_txid, p_user_id, 'deposit',
    jsonb_build_object('amount', p_amount))
  ON CONFLICT (key) DO NOTHING;

  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."process_deposit_tx"("p_user_id" "uuid", "p_amount" numeric, "p_txid" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_expert_vote"("p_expert_id" "uuid", "p_event_id" "uuid", "p_vote_outcome" integer, "p_confidence_level" numeric, "p_reasoning" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_vote_id UUID;
BEGIN
    -- Insert the vote
    INSERT INTO expert_votes (
        expert_id,
        event_id,
        vote_outcome,
        confidence_level,
        reasoning,
        ai_verification_status
    )
    VALUES (
        p_expert_id,
        p_event_id,
        p_vote_outcome,
        p_confidence_level,
        p_reasoning,
        'pending' -- Will be verified by AI
    )
    RETURNING id INTO v_vote_id;
    
    -- Update expert's last vote timestamp
    UPDATE expert_panel
    SET last_vote_at = NOW()
    WHERE id = p_expert_id;
    
    RETURN v_vote_id;
END;
$$;


ALTER FUNCTION "public"."process_expert_vote"("p_expert_id" "uuid", "p_event_id" "uuid", "p_vote_outcome" integer, "p_confidence_level" numeric, "p_reasoning" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_fok_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) RETURNS TABLE("success" boolean, "message" "text", "fills" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_available_depth DECIMAL(36, 18);
  v_fills JSONB := '[]'::JSONB;
BEGIN
  -- Check if full size can be filled immediately
  SELECT COALESCE(SUM(size - filled), 0)
  INTO v_available_depth
  FROM order_book
  WHERE market_id = p_market_id
    AND side != p_side
    AND status IN ('OPEN', 'PARTIAL')
    AND CASE 
      WHEN p_side = 'BUY' THEN price <= p_price
      ELSE price >= p_price
    END;
  
  IF v_available_depth < p_size THEN
    -- Kill the order
    UPDATE order_book
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT FALSE, 'FOK order killed: insufficient liquidity'::TEXT, '[]'::JSONB;
    RETURN;
  END IF;
  
  -- Return success - matching engine will handle fills
  RETURN QUERY SELECT TRUE, 'FOK order accepted, awaiting atomic fill'::TEXT, '[]'::JSONB;
END;
$$;


ALTER FUNCTION "public"."process_fok_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_ioc_order"("p_order_id" "uuid", "p_size" numeric) RETURNS TABLE("filled_quantity" numeric, "remaining_quantity" numeric, "cancelled" boolean, "avg_price" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_filled DECIMAL(36, 18);
  v_avg DECIMAL(36, 18);
BEGIN
  -- Wait briefly for matching to occur
  PERFORM pg_sleep(0.1);
  
  -- Get current fill state
  SELECT filled, avg_fill_price
  INTO v_filled, v_avg
  FROM order_book
  WHERE id = p_order_id;
  
  -- Cancel any remainder
  IF v_filled < p_size THEN
    UPDATE order_book
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT v_filled, (p_size - v_filled), TRUE, v_avg;
  ELSE
    RETURN QUERY SELECT v_filled, 0::DECIMAL, FALSE, v_avg;
  END IF;
END;
$$;


ALTER FUNCTION "public"."process_ioc_order"("p_order_id" "uuid", "p_size" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_order_with_tif"("p_market_id" "uuid", "p_user_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric, "p_order_type" character varying DEFAULT 'LIMIT'::character varying, "p_tif" "public"."tif_type" DEFAULT 'GTC'::"public"."tif_type", "p_gtd_expiry" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_time_in_force" character varying DEFAULT 'GTC'::character varying) RETURNS TABLE("order_id" "uuid", "status" character varying, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID;
  v_fok_result RECORD;
  v_aon_result RECORD;
  v_time_priority INTEGER;
BEGIN
  -- Calculate time priority
  v_time_priority := EXTRACT(EPOCH FROM NOW())::INTEGER;
  
  -- Insert base order
  INSERT INTO order_book (
    market_id,
    user_id,
    side,
    price,
    size,
    filled,
    status,
    order_type,
    tif,
    gtd_expiry,
    original_quantity,
    time_priority,
    time_in_force,
    created_at,
    updated_at
  ) VALUES (
    p_market_id,
    p_user_id,
    p_side,
    p_price,
    p_size,
    0,
    'OPEN',
    p_order_type,
    p_tif,
    p_gtd_expiry,
    p_size,
    v_time_priority,
    COALESCE(p_time_in_force, p_tif::VARCHAR),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;
  
  -- Apply TIF-specific logic
  CASE p_tif
    WHEN 'FOK' THEN
      SELECT * INTO v_fok_result
      FROM process_fok_order(v_order_id, p_market_id, p_side, p_price, p_size);
      
      IF NOT v_fok_result.success THEN
        RETURN QUERY SELECT v_order_id, 'CANCELLED'::VARCHAR(20), v_fok_result.message;
        RETURN;
      END IF;
      
    WHEN 'AON' THEN
      SELECT * INTO v_aon_result
      FROM process_aon_order(v_order_id, p_market_id, p_side, p_price, p_size);
      
      IF NOT v_aon_result.can_proceed THEN
        RETURN QUERY SELECT v_order_id, 'CANCELLED'::VARCHAR(20), v_aon_result.message;
        RETURN;
      END IF;
      
    WHEN 'GTD' THEN
      IF p_gtd_expiry IS NULL OR p_gtd_expiry <= NOW() THEN
        UPDATE order_book SET status = 'EXPIRED' WHERE id = v_order_id;
        RETURN QUERY SELECT v_order_id, 'EXPIRED'::VARCHAR(20), 'GTD expiry in past'::TEXT;
        RETURN;
      END IF;
      
    ELSE
      -- GTC, IOC - no special pre-processing
      NULL;
  END CASE;
  
  RETURN QUERY SELECT v_order_id, 'OPEN'::VARCHAR(20), 
    format('%s order placed successfully', p_tif)::TEXT;
END;
$$;


ALTER FUNCTION "public"."process_order_with_tif"("p_market_id" "uuid", "p_user_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric, "p_order_type" character varying, "p_tif" "public"."tif_type", "p_gtd_expiry" timestamp with time zone, "p_time_in_force" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_rebate_payment"("p_rebate_id" "uuid", "p_tx_hash" character varying) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE maker_rebates
    SET 
        claim_status = 'paid',
        payment_tx_hash = p_tx_hash,
        payment_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_rebate_id AND claim_status = 'claimed';
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Rebate not in claimable state');
    END IF;
END;
$$;


ALTER FUNCTION "public"."process_rebate_payment"("p_rebate_id" "uuid", "p_tx_hash" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_trade_settlement"("p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_quantity" bigint, "p_price" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_total_cost NUMERIC(12, 2);
BEGIN
    SELECT user_id INTO v_buyer_id FROM public.orders WHERE id = p_buy_order_id;
    SELECT user_id INTO v_seller_id FROM public.orders WHERE id = p_sell_order_id;
    
    v_total_cost := p_quantity * p_price;
    
    -- Update buyer wallet
    UPDATE public.wallets SET 
        balance = balance - v_total_cost
    WHERE user_id = v_buyer_id;
    
    -- Update seller wallet
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


ALTER FUNCTION "public"."process_trade_settlement"("p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_quantity" bigint, "p_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_withdrawal"("p_withdrawal_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_withdrawal RECORD;
    v_wallet RECORD;
BEGIN
    -- Get withdrawal record
    SELECT * INTO v_withdrawal 
    FROM public.payment_transactions 
    WHERE id = p_withdrawal_id AND type = 'withdrawal' AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Withdrawal not found or already processed';
        RETURN FALSE;
    END IF;
    
    -- Get wallet
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE user_id = v_withdrawal.user_id;
    
    IF NOT FOUND OR v_wallet.balance < v_withdrawal.amount THEN
        RAISE NOTICE 'Insufficient balance';
        RETURN FALSE;
    END IF;
    
    -- Deduct from wallet
    UPDATE public.wallets 
    SET balance = balance - v_withdrawal.amount,
        updated_at = NOW()
    WHERE user_id = v_withdrawal.user_id;
    
    -- Update withdrawal status
    UPDATE public.payment_transactions 
    SET status = 'completed',
        processed_at = NOW()
    WHERE id = p_withdrawal_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error processing withdrawal: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."process_withdrawal"("p_withdrawal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."re_enter_gtc_order"("p_order_id" "uuid", "p_new_price" numeric) RETURNS TABLE("new_order_id" "uuid", "preserved_priority" boolean, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_old_order RECORD;
  v_remaining DECIMAL(36, 18);
  v_new_order_id UUID;
  v_preserve_priority BOOLEAN;
BEGIN
  -- Get original order
  SELECT * INTO v_old_order
  FROM order_book
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Order not found'::TEXT;
    RETURN;
  END IF;
  
  v_remaining := v_old_order.size - v_old_order.filled;
  
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'No remaining quantity'::TEXT;
    RETURN;
  END IF;
  
  -- Determine if priority can be preserved
  -- Price unchanged: maintain original time priority
  -- Price improved (better for market): new time priority at new price
  -- Price worsened: rejected as queue jumping
  
  IF p_new_price = v_old_order.price THEN
    v_preserve_priority := TRUE;
  ELSIF (v_old_order.side = 'BUY' AND p_new_price > v_old_order.price) OR
        (v_old_order.side = 'SELL' AND p_new_price < v_old_order.price) THEN
    -- Price improved
    v_preserve_priority := FALSE;
  ELSE
    -- Price worsened - reject
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Re-entry rejected: price worsening constitutes queue jumping'::TEXT;
    RETURN;
  END IF;
  
  -- Cancel old order
  UPDATE order_book
  SET status = 'CANCELLED',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Create new order
  INSERT INTO order_book (
    market_id,
    user_id,
    side,
    price,
    size,
    filled,
    status,
    order_type,
    tif,
    original_quantity,
    avg_fill_price,
    time_priority,
    is_re_entry,
    parent_order_id,
    created_at
  ) VALUES (
    v_old_order.market_id,
    v_old_order.user_id,
    v_old_order.side,
    p_new_price,
    v_remaining,
    0,
    'OPEN',
    v_old_order.order_type,
    'GTC',
    v_old_order.original_quantity,
    v_old_order.avg_fill_price,
    CASE WHEN v_preserve_priority THEN v_old_order.time_priority ELSE EXTRACT(EPOCH FROM NOW())::INTEGER END,
    TRUE,
    p_order_id,
    v_old_order.created_at -- Preserve original creation time
  )
  RETURNING id INTO v_new_order_id;
  
  RETURN QUERY SELECT 
    v_new_order_id, 
    v_preserve_priority,
    CASE 
      WHEN v_preserve_priority THEN 'Re-entry with preserved time priority'
      ELSE 'Re-entry with new time priority (price improved)'
    END::TEXT;
END;
$$;


ALTER FUNCTION "public"."re_enter_gtc_order"("p_order_id" "uuid", "p_new_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reconcile_order_state"("p_order_ids" "uuid"[], "p_client_last_sequence" bigint DEFAULT 0) RETURNS TABLE("order_id" "uuid", "current_status" character varying, "filled_quantity" numeric, "cancelled_quantity" numeric, "sequence_number" bigint, "changes_since_sequence" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ob.id AS order_id,
    ob.status::VARCHAR(20) AS current_status,
    ob.filled AS filled_quantity,
    COALESCE(cr.final_cancelled_quantity, 0) AS cancelled_quantity,
    COALESCE(cr.sequence_number, 0) AS sequence_number,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'sequence', sub_cr.sequence_number,
          'type', sub_cr.cancel_type,
          'timestamp', sub_cr.requested_at,
          'filled_before', sub_cr.filled_quantity_before,
          'remaining', sub_cr.remaining_quantity
        )
        ORDER BY sub_cr.sequence_number
      )
      FROM cancellation_records sub_cr
      WHERE sub_cr.order_id = ob.id
        AND sub_cr.sequence_number > p_client_last_sequence
      ),
      '[]'::jsonb
    ) AS changes_since_sequence
  FROM order_book ob
  LEFT JOIN LATERAL (
    SELECT *
    FROM cancellation_records cr
    WHERE cr.order_id = ob.id
    ORDER BY cr.sequence_number DESC
    LIMIT 1
  ) cr ON true
  WHERE ob.id = ANY(p_order_ids)
  ORDER BY COALESCE(cr.sequence_number, 0);
END;
$$;


ALTER FUNCTION "public"."reconcile_order_state"("p_order_ids" "uuid"[], "p_client_last_sequence" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_fill"("p_order_id" "uuid", "p_quantity" numeric, "p_price" numeric, "p_counterparty_order_id" "uuid", "p_counterparty_user_id" "uuid", "p_trade_id" "uuid", "p_is_maker" boolean DEFAULT false, "p_transaction_hash" character varying DEFAULT NULL::character varying) RETURNS TABLE("fill_id" "uuid", "new_avg_price" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_fill_id UUID;
  v_fill_number INTEGER;
  v_new_avg DECIMAL(36, 18);
  v_new_filled DECIMAL(36, 18);
  v_status VARCHAR(20);
BEGIN
  -- Get next fill number
  SELECT COALESCE(MAX(fill_number), 0) + 1
  INTO v_fill_number
  FROM fill_records
  WHERE order_id = p_order_id;
  
  -- Insert fill record
  INSERT INTO fill_records (
    order_id,
    quantity,
    price,
    total_value,
    counterparty_order_id,
    counterparty_user_id,
    trade_id,
    fill_number,
    is_maker,
    transaction_hash
  ) VALUES (
    p_order_id,
    p_quantity,
    p_price,
    p_quantity * p_price,
    p_counterparty_order_id,
    p_counterparty_user_id,
    p_trade_id,
    v_fill_number,
    p_is_maker,
    p_transaction_hash
  )
  RETURNING id INTO v_fill_id;
  
  -- Update order with new fill info
  SELECT filled + p_quantity INTO v_new_filled
  FROM order_book WHERE id = p_order_id;
  
  -- Calculate new VWAP
  v_new_avg := calculate_vwap(p_order_id);
  
  -- Determine new status
  SELECT 
    CASE 
      WHEN v_new_filled >= size THEN 'FILLED'
      ELSE 'PARTIAL'
    END
  INTO v_status
  FROM order_book WHERE id = p_order_id;
  
  -- Update order book
  UPDATE order_book
  SET 
    filled = v_new_filled,
    avg_fill_price = v_new_avg,
    fill_count = v_fill_number,
    last_fill_at = NOW(),
    status = v_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN QUERY SELECT v_fill_id, v_new_avg;
END;
$$;


ALTER FUNCTION "public"."record_fill"("p_order_id" "uuid", "p_quantity" numeric, "p_price" numeric, "p_counterparty_order_id" "uuid", "p_counterparty_user_id" "uuid", "p_trade_id" "uuid", "p_is_maker" boolean, "p_transaction_hash" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_liquidity_deposit"("p_draft_id" "uuid", "p_tx_hash" character varying, "p_amount" numeric) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE market_creation_drafts SET
        liquidity_deposited = TRUE,
        liquidity_tx_hash = p_tx_hash,
        liquidity_commitment = p_amount,
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."record_liquidity_deposit"("p_draft_id" "uuid", "p_tx_hash" character varying, "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_market_deployment"("p_draft_id" "uuid", "p_market_id" "uuid", "p_tx_hash" character varying, "p_deployment_config" "jsonb" DEFAULT NULL::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE market_creation_drafts SET
        status = 'deployed',
        deployed_market_id = p_market_id,
        deployment_tx_hash = p_tx_hash,
        deployment_config = p_deployment_config,
        deployed_at = NOW(),
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."record_market_deployment"("p_draft_id" "uuid", "p_market_id" "uuid", "p_tx_hash" character varying, "p_deployment_config" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_price_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Binary markets: snapshot YES price
  INSERT INTO price_history (market_id, outcome, price, volume_at_time)
  SELECT
    m.id,
    'YES',
    COALESCE(m.yes_price, 0.5),
    COALESCE(m.total_volume, 0)
  FROM markets m
  WHERE m.status = 'active';

  -- Multi-outcome: snapshot each outcome
  INSERT INTO price_history (market_id, outcome_id, outcome, price, volume_at_time)
  SELECT
    o.market_id,
    o.id,
    o.label,
    o.current_price,
    COALESCE(m.total_volume, 0)
  FROM outcomes o
  JOIN markets m ON m.id = o.market_id
  WHERE m.status = 'active';
END;
$$;


ALTER FUNCTION "public"."record_price_snapshots"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_trade_price_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.price_history (market_id, outcome, price, recorded_at)
  VALUES (NEW.market_id, NEW.outcome::TEXT, NEW.price, NEW.created_at)
  ON CONFLICT DO NOTHING;

  IF NEW.outcome::TEXT = 'YES' THEN
    UPDATE public.markets SET yes_price = NEW.price WHERE id = NEW.market_id;
  ELSIF NEW.outcome::TEXT = 'NO' THEN
    UPDATE public.markets SET no_price  = NEW.price WHERE id = NEW.market_id;
  END IF;

  UPDATE public.markets
  SET total_volume = COALESCE(total_volume, 0) + (NEW.quantity * NEW.price)
  WHERE id = NEW.market_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_trade_price_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_trade_result_v2"("p_user_id" "uuid", "p_pnl" numeric, "p_is_win" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tier TEXT;
  v_score_delta NUMERIC;
BEGIN
  -- Score calculation: wins give 10 + PnL%, losses subtract 5
  v_score_delta := CASE WHEN p_is_win THEN 10 + ABS(p_pnl) ELSE -5 END;

  INSERT INTO leaderboard (user_id, score, total_pnl, win_count, loss_count, trade_count, best_trade, worst_trade, streak, username)
  VALUES (
    p_user_id, GREATEST(v_score_delta, 0), p_pnl,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN p_is_win THEN 0 ELSE 1 END,
    1,
    CASE WHEN p_pnl > 0 THEN p_pnl ELSE 0 END,
    CASE WHEN p_pnl < 0 THEN p_pnl ELSE 0 END,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    (SELECT COALESCE(display_name, email) FROM users WHERE id = p_user_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score = GREATEST(leaderboard.score + v_score_delta, 0),
    total_pnl = leaderboard.total_pnl + p_pnl,
    win_count = leaderboard.win_count + CASE WHEN p_is_win THEN 1 ELSE 0 END,
    loss_count = leaderboard.loss_count + CASE WHEN p_is_win THEN 0 ELSE 1 END,
    trade_count = leaderboard.trade_count + 1,
    best_trade = GREATEST(leaderboard.best_trade, p_pnl),
    worst_trade = LEAST(leaderboard.worst_trade, p_pnl),
    streak = CASE WHEN p_is_win THEN leaderboard.streak + 1 ELSE 0 END,
    updated_at = NOW();

  -- Update rank tier based on new score
  SELECT CASE
    WHEN score >= 1000 THEN 'diamond'
    WHEN score >= 500 THEN 'platinum'
    WHEN score >= 200 THEN 'gold'
    WHEN score >= 50 THEN 'silver'
    ELSE 'bronze'
  END INTO v_tier
  FROM leaderboard WHERE user_id = p_user_id;

  UPDATE leaderboard SET rank_tier = v_tier WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'score_delta', v_score_delta, 'tier', v_tier);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."record_trade_result_v2"("p_user_id" "uuid", "p_pnl" numeric, "p_is_win" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_workflow_complete"("p_workflow_run_id" "text", "p_status" character varying, "p_result" "jsonb" DEFAULT '{}'::"jsonb", "p_error_message" "text" DEFAULT NULL::"text", "p_execution_time_ms" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."record_workflow_complete"("p_workflow_run_id" "text", "p_status" character varying, "p_result" "jsonb", "p_error_message" "text", "p_execution_time_ms" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_workflow_start"("p_workflow_run_id" "text", "p_workflow_type" character varying, "p_event_id" "uuid" DEFAULT NULL::"uuid", "p_market_id" "uuid" DEFAULT NULL::"uuid", "p_payload" "jsonb" DEFAULT '{}'::"jsonb", "p_message_id" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.upstash_workflow_runs (
        workflow_run_id,
        message_id,
        workflow_type,
        event_id,
        market_id,
        status,
        payload,
        started_at
    ) VALUES (
        p_workflow_run_id,
        p_message_id,
        p_workflow_type,
        p_event_id,
        p_market_id,
        'RUNNING',
        p_payload,
        NOW()
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


ALTER FUNCTION "public"."record_workflow_start"("p_workflow_run_id" "text", "p_workflow_type" character varying, "p_event_id" "uuid", "p_market_id" "uuid", "p_payload" "jsonb", "p_message_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_market_metrics"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Refresh the materialized view concurrently so we don't block reads
  REFRESH MATERIALIZED VIEW public.market_metrics;
END;
$$;


ALTER FUNCTION "public"."refresh_market_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_price_ohlc"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.price_ohlc_1h;
END;
$$;


ALTER FUNCTION "public"."refresh_price_ohlc"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.ai_daily_topics
  SET 
    status = 'rejected',
    rejected_reason = COALESCE(p_reason, 'Rejected by admin'),
    approved_by = p_admin_id,
    approved_at = NOW()
  WHERE id = p_topic_id AND status = 'pending';
END;
$$;


ALTER FUNCTION "public"."reject_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reject_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") IS 'Rejects an AI topic with optional reason';



CREATE OR REPLACE FUNCTION "public"."reject_deposit_v2"("p_deposit_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_deposit RECORD;
BEGIN
  SELECT * INTO v_deposit
  FROM public.deposit_requests
  WHERE id = p_deposit_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit already processed';
  END IF;

  UPDATE public.deposit_requests
  SET
    status = 'rejected',
    admin_notes = p_reason,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = p_deposit_id;

  RETURN jsonb_build_object('success', TRUE, 'deposit_id', p_deposit_id);
END;
$$;


ALTER FUNCTION "public"."reject_deposit_v2"("p_deposit_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_withdrawal"("p_id" "uuid", "p_note" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_withdrawal RECORD;
    v_hold_amount DECIMAL(12,2);
BEGIN
    -- Get the withdrawal request
    SELECT * INTO v_withdrawal 
    FROM public.withdrawal_requests 
    WHERE id = p_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF v_withdrawal.status != 'pending' AND v_withdrawal.status != 'processing' THEN
        RAISE EXCEPTION 'Withdrawal cannot be rejected in its current status (%)', v_withdrawal.status;
    END IF;

    -- Get and release the hold amount
    SELECT amount INTO v_hold_amount
    FROM public.balance_holds
    WHERE id = v_withdrawal.balance_hold_id
    FOR UPDATE;

    IF FOUND THEN
        -- Refund the user's balance in the profiles table
        UPDATE public.profiles
        SET balance = balance + v_hold_amount,
            updated_at = NOW()
        WHERE id = v_withdrawal.user_id;

        -- Mark the hold as released
        UPDATE public.balance_holds
        SET released_at = NOW(),
            released_by = auth.uid(),
            released_reason = 'withdrawal_rejected'
        WHERE id = v_withdrawal.balance_hold_id;
    END IF;

    -- Update the withdrawal request status
    UPDATE public.withdrawal_requests
    SET status = 'rejected',
        processed_at = NOW(),
        processed_by = auth.uid(),
        admin_notes = p_note,
        updated_at = NOW()
    WHERE id = p_id;

    -- Record transaction as a refund
    INSERT INTO public.wallet_transactions (
        user_id,
        amount,
        type,
        description,
        status,
        reference_id,
        created_at
    ) VALUES (
        v_withdrawal.user_id,
        v_withdrawal.usdt_amount,
        'refund',
        format('Withdrawal rejected: %s refunded', v_withdrawal.usdt_amount),
        'completed',
        p_id,
        NOW()
    );
END;
$$;


ALTER FUNCTION "public"."reject_withdrawal"("p_id" "uuid", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_balance_hold"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_withdrawal RECORD;
BEGIN
    -- Get the withdrawal and its associated hold
    SELECT * INTO v_withdrawal FROM public.withdrawal_requests WHERE id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found';
    END IF;

    IF v_withdrawal.balance_hold_id IS NULL THEN
        RAISE EXCEPTION 'No balance hold associated with this withdrawal';
    END IF;

    -- Release the hold in the balance_holds table
    UPDATE public.balance_holds
    SET released_at = NOW(),
        released_by = auth.uid(),
        released_reason = 'withdrawal_approved'
    WHERE id = v_withdrawal.balance_hold_id;
    
END;
$$;


ALTER FUNCTION "public"."release_balance_hold"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_funds_v2"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_wallet RECORD;
BEGIN
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF v_wallet.locked_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient locked balance');
  END IF;

  UPDATE wallets SET
    locked_balance = locked_balance - p_amount,
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'released', p_amount);
END;
$$;


ALTER FUNCTION "public"."release_funds_v2"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_withdrawal"("p_user_id" "uuid", "p_amount" numeric, "p_address" "text", "p_network" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_kyc_level INTEGER;
    v_tx_id UUID;
    v_status VARCHAR(20);
    v_row_count INTEGER;
BEGIN
    -- 1. Input Validation
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be positive.';
    END IF;

    -- 2. Check KYC Limit and Determine Status
    SELECT COALESCE(kyc_level, 0) INTO v_kyc_level
    FROM public.user_profiles
    WHERE id = p_user_id;

    IF p_amount >= 5000 THEN
        IF v_kyc_level < 1 THEN
            RAISE EXCEPTION 'Withdrawal of % BDT requires KYC Level 1 verification.', p_amount;
        END IF;
        v_status := 'pending'; -- Manual Review
    ELSE
        -- Small amount, set to processing for automation
        v_status := 'processing';
    END IF;

    -- 3. Atomic Balance Check & Lock Funds
    -- Deduct from Available, Add to Locked atomically
    UPDATE public.wallets
    SET 
        balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND balance >= p_amount;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'Insufficient balance or user not found for withdrawal.';
    END IF;

    -- 4. Create Transaction Record
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        network_type,
        wallet_address,
        status,
        description
    ) VALUES (
        p_user_id,
        'withdrawal',
        p_amount,
        'BDT',
        p_network,
        p_address,
        v_status,
        'Withdrawal request via ' || p_network
    )
    RETURNING id INTO v_tx_id;

    RETURN v_tx_id;
END;
$$;


ALTER FUNCTION "public"."request_withdrawal"("p_user_id" "uuid", "p_amount" numeric, "p_address" "text", "p_network" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_dispute_v2"("p_dispute_id" "uuid", "p_admin_response" "text", "p_override_resolution" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_dispute RECORD;
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_dispute FROM oracle_disputes WHERE id = p_dispute_id FOR UPDATE;
  IF v_dispute IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dispute not found');
  END IF;

  UPDATE oracle_disputes SET
    status = 'resolved', 
    admin_response = p_admin_response, 
    resolution_outcome = COALESCE(p_override_resolution, 'upheld'),
    resolved_by = auth.uid(),
    resolved_at = NOW()
  WHERE id = p_dispute_id;

  IF p_override_resolution IS NOT NULL THEN
    UPDATE oracle_requests SET
      resolution = p_override_resolution, 
      proposed_outcome = p_override_resolution,
      status = 'admin_override',
      resolved_at = NOW()
    WHERE id = v_dispute.request_id;

    PERFORM settle_market_v2(
      (SELECT market_id FROM oracle_requests WHERE id = v_dispute.request_id), 
      p_override_resolution
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'overridden', p_override_resolution IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."resolve_dispute_v2"("p_dispute_id" "uuid", "p_admin_response" "text", "p_override_resolution" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_market"("p_market_id" "uuid", "p_resolution" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
      BEGIN
        IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
          RAISE EXCEPTION 'Unauthorized';
        END IF;
        RETURN public.settle_market_v2(p_market_id, p_resolution);
      END;
      $$;


ALTER FUNCTION "public"."resolve_market"("p_market_id" "uuid", "p_resolution" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_market"("p_event_id" "uuid", "p_winner" integer, "p_resolver_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_event RECORD;
  v_winning_token VARCHAR(255);
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT * INTO v_event FROM public.events 
  WHERE id = p_event_id AND trading_status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or not in active trading status';
  END IF;
  
  -- Determine the winning token/side
  v_winning_token := CASE p_winner 
    WHEN 1 THEN v_event.token1 
    WHEN 2 THEN v_event.token2 
    ELSE NULL 
  END;
  
  -- Update Event Status (Atomic change)
  UPDATE public.events SET
    trading_status = 'resolved',
    resolved_outcome = p_winner,
    resolved_at = NOW(),
    resolved_by = p_resolver_id,
    winning_token = v_winning_token,
    updated_at = NOW()
  WHERE id = p_event_id;

  -- Sync with linked markets (if any)
  UPDATE public.markets SET
    status = 'resolved',
    outcome = p_winner,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE event_id = p_event_id AND status != 'resolved';
  
  -- Trigger payout calculation (separate async process via QStash/Upstash)
  -- This notification is picked up by a webhook listener or poller
  PERFORM pg_notify('market_resolved', json_build_object(
    'event_id', p_event_id,
    'winner', p_winner,
    'winning_token', v_winning_token,
    'timestamp', NOW()
  )::text);

  -- Log the resolution in audit trail
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    change_summary
  ) VALUES (
    p_resolver_id,
    'resolve_event',
    'event',
    p_event_id,
    'Event resolved with winner: ' || p_winner
  );
END;
$$;


ALTER FUNCTION "public"."resolve_market"("p_event_id" "uuid", "p_winner" integer, "p_resolver_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."resolve_market"("p_event_id" "uuid", "p_winner" integer, "p_resolver_id" "uuid") IS 'Executes atomic market resolution and triggers payout workflow';



CREATE OR REPLACE FUNCTION "public"."resolve_market_v2"("p_market_id" "uuid", "p_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_req_id UUID;
BEGIN
  INSERT INTO oracle_requests (market_id, resolution_data, status)
  VALUES (p_market_id, p_data, 'resolved')
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."resolve_market_v2"("p_market_id" "uuid", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_follow_request"("p_request_id" "uuid", "p_target_id" "uuid", "p_approve" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_requester_id UUID;
BEGIN
    SELECT requester_id INTO v_requester_id
    FROM follow_requests
    WHERE id = p_request_id AND target_id = p_target_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;
    
    IF p_approve THEN
        -- Update request status
        UPDATE follow_requests 
        SET status = 'approved', responded_at = NOW()
        WHERE id = p_request_id;
        
        -- Create follow relationship
        INSERT INTO user_follows (follower_id, following_id)
        VALUES (v_requester_id, p_target_id)
        ON CONFLICT (follower_id, following_id) DO NOTHING;
        
        -- Update counts
        UPDATE users SET follower_count = follower_count + 1 WHERE id = p_target_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = v_requester_id;
        
        RETURN jsonb_build_object('success', true, 'status', 'approved');
    ELSE
        UPDATE follow_requests 
        SET status = 'rejected', responded_at = NOW()
        WHERE id = p_request_id;
        
        RETURN jsonb_build_object('success', true, 'status', 'rejected');
    END IF;
END;
$$;


ALTER FUNCTION "public"."respond_to_follow_request"("p_request_id" "uuid", "p_target_id" "uuid", "p_approve" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_kyc_document"("p_admin_id" "uuid", "p_document_id" "uuid", "p_status" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Validate Admin
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_admin_id AND is_admin = true) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;

    -- 2. Get User ID from document
    SELECT user_id INTO v_user_id
    FROM public.kyc_documents
    WHERE id = p_document_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Document not found.';
    END IF;

    -- 3. Update Document Status
    UPDATE public.kyc_documents
    SET 
        status = p_status,
        rejection_reason = p_reason,
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_document_id;

    -- 4. If Approved, Upgrade User
    IF p_status = 'approved' THEN
        -- Link logic: Standard KYC Document Approval = Level 1
        UPDATE public.user_profiles
        SET kyc_level = 1, updated_at = NOW()
        WHERE id = v_user_id;

        -- Also update legacy kyc_profiles if exists
        UPDATE public.user_kyc_profiles
        SET verification_status = 'verified', verification_tier = 'intermediate', verified_at = NOW(), verified_by = p_admin_id
        WHERE id = v_user_id;
    END IF;

    -- 5. If Rejected, Downgrade User (optional, strict mode)
    IF p_status = 'rejected' THEN
        UPDATE public.user_profiles
        SET kyc_level = 0
        WHERE id = v_user_id;

        UPDATE public.user_kyc_profiles
        SET verification_status = 'rejected', rejection_reason = p_reason
        WHERE id = v_user_id;
    END IF;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."review_kyc_document"("p_admin_id" "uuid", "p_document_id" "uuid", "p_status" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_users"("p_query" "text", "p_status_filter" character varying DEFAULT NULL::character varying, "p_kyc_filter" character varying DEFAULT NULL::character varying, "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "email" character varying, "full_name" character varying, "created_at" timestamp with time zone, "account_status" character varying, "verification_status" character varying, "total_matches" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH filtered_users AS (
        SELECT 
            up.id,
            up.email,
            up.full_name,
            up.created_at,
            us.account_status,
            ukp.verification_status
        FROM user_profiles up
        LEFT JOIN user_status us ON up.id = us.id
        LEFT JOIN user_kyc_profiles ukp ON up.id = ukp.id
        WHERE 
            (p_query IS NULL OR p_query = '' OR 
             up.email ILIKE '%' || p_query || '%' OR 
             up.full_name ILIKE '%' || p_query || '%')
            AND
            (p_status_filter IS NULL OR us.account_status = p_status_filter)
            AND
            (p_kyc_filter IS NULL OR ukp.verification_status = p_kyc_filter)
    )
    SELECT 
        *,
        (SELECT COUNT(*) FROM filtered_users) AS total_matches
    FROM filtered_users
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_users"("p_query" "text", "p_status_filter" character varying, "p_kyc_filter" character varying, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."seed_event_orderbook"("p_event_id" "uuid", "p_initial_liquidity" numeric DEFAULT 1000, "p_spread" numeric DEFAULT 0.02) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_yes_price NUMERIC := 0.50;
    v_no_price NUMERIC := 0.50;
    v_liquidity_per_side NUMERIC;
    v_order_id UUID;
BEGIN
    -- Calculate liquidity per side
    v_liquidity_per_side := p_initial_liquidity / 2;
    
    -- Insert YES buy orders (bids) at various price levels (system orders have NULL user_id)
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', v_yes_price - p_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', v_yes_price - p_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    -- Insert YES sell orders (asks) at various price levels
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', v_yes_price + p_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', v_yes_price + p_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    -- Insert NO buy orders (bids)
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', v_no_price - p_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', v_no_price - p_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    -- Insert NO sell orders (asks)
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', v_no_price + p_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', v_no_price + p_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Orderbook seeded for event % with liquidity %', p_event_id, p_initial_liquidity;
END;
$$;


ALTER FUNCTION "public"."seed_event_orderbook"("p_event_id" "uuid", "p_initial_liquidity" numeric, "p_spread" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_exchange_rate"("pair" "text", "new_rate" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM update_exchange_rate_v2(pair, new_rate, NOW());
END;
$$;


ALTER FUNCTION "public"."set_exchange_rate"("pair" "text", "new_rate" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") RETURNS TABLE("users_settled" integer, "total_payout" numeric)
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_outcome" "text", "p_resolved_by" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN public.settle_market_v2(p_market_id, p_outcome);
END;
$$;


ALTER FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_outcome" "text", "p_resolved_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_resolution" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_pos RECORD;
  v_total_payout NUMERIC := 0;
  v_settled_count INT := 0;
BEGIN
  -- 1. Update market status
  UPDATE markets 
  SET status = 'resolved', 
      resolution_value = p_resolution, 
      resolved_at = NOW()
  WHERE id = p_market_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market not found or not active');
  END IF;

  -- 2. Cancel all open orders for this market and refund
  WITH cancelled AS (
    UPDATE orders 
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE market_id = p_market_id AND status IN ('open', 'partially_filled')
    RETURNING user_id, remaining_quantity, price, fee_rate
  )
  UPDATE wallets w
  SET balance = w.balance + (c.remaining_quantity * c.price * (1 + c.fee_rate)),
      locked_balance = w.locked_balance - (c.remaining_quantity * c.price * (1 + c.fee_rate))
  FROM cancelled c
  WHERE w.user_id = c.user_id;

  -- 3. Settle positions: winners get $1 per share, losers get $0
  FOR v_pos IN 
    SELECT user_id, outcome, quantity, average_price 
    FROM positions 
    WHERE market_id = p_market_id AND quantity > 0
  LOOP
    IF v_pos.outcome::TEXT = p_resolution THEN
      -- Winner: payout = quantity * $1.00
      UPDATE wallets SET balance = balance + v_pos.quantity WHERE user_id = v_pos.user_id;
      v_total_payout := v_total_payout + v_pos.quantity;
    END IF;
    -- Losers get nothing (their cost was already deducted at order time)
    
    -- Record realized PnL
    UPDATE positions SET 
      realized_pnl = CASE 
        WHEN v_pos.outcome::TEXT = p_resolution THEN v_pos.quantity - (v_pos.quantity * v_pos.average_price)
        ELSE -(v_pos.quantity * v_pos.average_price)
      END,
      updated_at = NOW()
    WHERE user_id = v_pos.user_id AND market_id = p_market_id AND outcome = v_pos.outcome;

    v_settled_count := v_settled_count + 1;
  END LOOP;

  -- 4. Mark all trades as settled
  UPDATE trades SET settlement_status = 'settled', settled_at = NOW()
  WHERE market_id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'resolution', p_resolution,
    'positions_settled', v_settled_count,
    'total_payout', v_total_payout
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$_$;


ALTER FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_resolution" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_market_record RECORD;
    v_total_distributed NUMERIC := 0;
    v_affected_positions INTEGER := 0;
BEGIN
    -- Validate market exists and is in correct state
    SELECT id, status, question INTO v_market_record
    FROM markets
    WHERE id = p_market_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found: %', p_market_id;
    END IF;

    IF v_market_record.status = 'resolved' THEN
        RAISE EXCEPTION 'Market already resolved: %', p_market_id;
    END IF;

    IF v_market_record.status NOT IN ('closed', 'active') THEN
        RAISE EXCEPTION 'Market must be closed or active to resolve. Current status: %', v_market_record.status;
    END IF;

    -- Validate winning outcome
    IF p_winning_outcome NOT IN ('YES', 'NO') THEN
        RAISE EXCEPTION 'Invalid winning outcome: %. Must be YES or NO', p_winning_outcome;
    END IF;

    -- Start transaction logging
    RAISE NOTICE 'Starting settlement for market: %, winning outcome: %', p_market_id, p_winning_outcome;

    -- Update winning positions and distribute funds
    WITH winning_positions AS (
        SELECT 
            p.user_id,
            p.quantity,
            p.outcome,
            w.balance as current_balance
        FROM positions p
        JOIN wallets w ON w.user_id = p.user_id
        WHERE p.market_id = p_market_id
        AND p.outcome = p_winning_outcome
        AND p.quantity > 0
        FOR UPDATE OF w
    ),
    distribution AS (
        UPDATE wallets w
        SET 
            balance = w.balance + (wp.quantity * 1.00),
            updated_at = NOW()
        FROM winning_positions wp
        WHERE w.user_id = wp.user_id
        RETURNING w.user_id, wp.quantity, w.balance as new_balance
    )
    SELECT 
        COUNT(*),
        COALESCE(SUM(quantity), 0)
    INTO v_affected_positions, v_total_distributed
    FROM distribution;

    -- Log the distribution
    RAISE NOTICE 'Distributed % to % winning positions', v_total_distributed, v_affected_positions;

    -- Insert transaction records for audit trail
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        description,
        metadata,
        status
    )
    SELECT 
        p.user_id,
        'settlement',
        p.quantity,
        'Market settlement: ' || v_market_record.question,
        jsonb_build_object(
            'market_id', p_market_id,
            'winning_outcome', p_winning_outcome,
            'position_outcome', p.outcome,
            'quantity', p.quantity
        ),
        'completed'
    FROM positions p
    WHERE p.market_id = p_market_id
    AND p.outcome = p_winning_outcome
    AND p.quantity > 0;

    -- Update market status to resolved
    UPDATE markets 
    SET 
        status = 'resolved',
        outcome = CASE 
            WHEN p_winning_outcome = 'YES' THEN 1
            WHEN p_winning_outcome = 'NO' THEN 2
        END,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_market_id;

    -- Update resolution_systems record
    UPDATE resolution_systems
    SET 
        resolution_status = 'resolved',
        proposed_outcome = CASE 
            WHEN p_winning_outcome = 'YES' THEN 1
            WHEN p_winning_outcome = 'NO' THEN 2
        END,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE event_id = p_market_id;

    -- Log admin activity
    INSERT INTO admin_activity_logs (
        admin_id,
        action_type,
        resource_type,
        resource_id,
        change_summary,
        new_values,
        reason
    )
    VALUES (
        auth.uid(),
        'resolve_event',
        'market',
        p_market_id,
        'Market resolved with outcome: ' || p_winning_outcome,
        jsonb_build_object(
            'winning_outcome', p_winning_outcome,
            'total_distributed', v_total_distributed,
            'winning_positions', v_affected_positions
        ),
        'Manual admin resolution'
    );

    RAISE NOTICE 'Market settlement completed for: %', p_market_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Settlement failed for market %: %', p_market_id, SQLERRM;
END;
$$;


ALTER FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") IS 'Atomically settles a market by distributing funds to winning positions and updating market status.
Parameters:
  - p_market_id: UUID of the market to settle
  - p_winning_outcome: The winning outcome (YES or NO)
Returns: VOID
Raises exception if market not found, already resolved, or invalid outcome.';



CREATE OR REPLACE FUNCTION "public"."settle_trade_cash"("p_buyer_id" "uuid", "p_seller_id" "uuid", "p_amount" numeric, "p_trade_id" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_buyer_locked  DECIMAL;
  v_seller_bal    DECIMAL;
BEGIN
  -- Prevent deadlocks by always locking the smaller user_id first
  IF p_buyer_id < p_seller_id THEN
    SELECT locked_balance INTO v_buyer_locked
      FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
    SELECT balance INTO v_seller_bal
      FROM wallets WHERE user_id = p_seller_id FOR UPDATE;
  ELSE
    SELECT balance INTO v_seller_bal
      FROM wallets WHERE user_id = p_seller_id FOR UPDATE;
    SELECT locked_balance INTO v_buyer_locked
      FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
  END IF;

  -- Buyer: deduct from locked_balance (balance was already frozen)
  UPDATE wallets
    SET locked_balance = locked_balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_buyer_id;

  -- Seller: increase balance
  UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_seller_id;

  -- Audit log
  INSERT INTO wallet_transactions
    (user_id, amount, type, reference_id, balance_before, balance_after)
  VALUES
    (p_buyer_id,  -p_amount, 'trade_settle', p_trade_id,
     v_buyer_locked, v_buyer_locked - p_amount),
    (p_seller_id,  p_amount, 'trade_settle', p_trade_id,
     v_seller_bal,  v_seller_bal + p_amount);
END;
$$;


ALTER FUNCTION "public"."settle_trade_cash"("p_buyer_id" "uuid", "p_seller_id" "uuid", "p_amount" numeric, "p_trade_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_client_request_id" character varying DEFAULT NULL::character varying) RETURNS TABLE("success" boolean, "cancel_record_id" "uuid", "sequence_number" bigint, "message" "text", "current_status" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_order RECORD;
  v_seq BIGINT;
  v_cancel_id UUID;
  v_updated INTEGER;
BEGIN
  -- Get and lock the order
  SELECT * INTO v_order
  FROM order_book
  WHERE id = p_order_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 'Order not found'::TEXT, NULL::VARCHAR(20);
    RETURN;
  END IF;
  
  -- Verify ownership
  IF v_order.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 'Unauthorized: not order owner'::TEXT, v_order.status;
    RETURN;
  END IF;
  
  -- Check if order can be cancelled
  IF v_order.status IN ('CANCELLED', 'FILLED', 'EXPIRED') THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 
      'Order already in terminal state: ' || v_order.status::TEXT, 
      v_order.status;
    RETURN;
  END IF;
  
  IF v_order.status = 'CANCELLING' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 
      'Cancellation already in progress'::TEXT, 
      v_order.status;
    RETURN;
  END IF;
  
  -- Get sequence number
  v_seq := get_next_sequence();
  
  -- Attempt optimistic soft cancel
  UPDATE order_book
  SET status = 'CANCELLING',
      updated_at = NOW()
  WHERE id = p_order_id
    AND status IN ('OPEN', 'PARTIAL');
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated = 0 THEN
    -- Order state changed during check
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 
      'Order state changed, retry required'::TEXT, 
      (SELECT status FROM order_book WHERE id = p_order_id);
    RETURN;
  END IF;
  
  -- Create cancellation record
  INSERT INTO cancellation_records (
    order_id,
    cancel_type,
    requested_at,
    soft_cancelled_at,
    filled_quantity_before,
    remaining_quantity,
    average_fill_price,
    sequence_number,
    cancelled_by,
    client_request_id
  ) VALUES (
    p_order_id,
    'SOFT',
    NOW(),
    NOW(),
    v_order.filled,
    v_order.size - v_order.filled,
    NULL,
    v_seq,
    p_user_id,
    p_client_request_id
  )
  RETURNING id INTO v_cancel_id;
  
  RETURN QUERY SELECT TRUE, v_cancel_id, v_seq, 
    'Soft cancel accepted, pending hard cancel'::TEXT, 
    'CANCELLING'::VARCHAR(20);
END;
$$;


ALTER FUNCTION "public"."soft_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_client_request_id" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_resting_order_tracking"("p_order_id" "uuid", "p_user_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_quantity" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_spread DECIMAL(8, 4);
    v_tracking_id UUID;
BEGIN
    v_spread := calculate_market_spread(p_market_id);
    
    INSERT INTO resting_orders (
        order_id, user_id, market_id, side, price, quantity,
        spread_at_placement, resting_start_time, is_active
    ) VALUES (
        p_order_id, p_user_id, p_market_id, p_side, p_price, p_quantity,
        v_spread, NOW(), TRUE
    )
    RETURNING id INTO v_tracking_id;
    
    RETURN v_tracking_id;
END;
$$;


ALTER FUNCTION "public"."start_resting_order_tracking"("p_order_id" "uuid", "p_user_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stop_resting_order_tracking"("p_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_start_time TIMESTAMPTZ;
    v_resting_seconds INTEGER;
BEGIN
    SELECT resting_start_time INTO v_start_time
    FROM resting_orders
    WHERE order_id = p_order_id AND is_active = TRUE;
    
    IF v_start_time IS NOT NULL THEN
        v_resting_seconds := EXTRACT(EPOCH FROM (NOW() - v_start_time))::INTEGER;
        
        UPDATE resting_orders
        SET 
            resting_end_time = NOW(),
            total_resting_seconds = v_resting_seconds,
            is_active = FALSE
        WHERE order_id = p_order_id AND is_active = TRUE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."stop_resting_order_tracking"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_deposit_request"("p_user_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_transaction_id" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_usdc_rate DECIMAL := 120.0; -- Default rate, can be fetched from settings later
    v_usdc_equiv DECIMAL;
    v_id UUID;
BEGIN
    -- Validation
    IF p_amount < 100 THEN
         RAISE EXCEPTION 'Minimum deposit amount is 100 BDT.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.payment_transactions WHERE transaction_id = p_transaction_id) THEN
        RAISE EXCEPTION 'Transaction ID already used.';
    END IF;

    -- Calculate USDC
    v_usdc_equiv := p_amount / v_usdc_rate;

    -- Insert
    INSERT INTO public.payment_transactions (
        user_id,
        amount,
        currency,
        usdc_equivalent,
        payment_method,
        transaction_id,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        'BDT',
        v_usdc_equiv,
        p_payment_method,
        p_transaction_id,
        'pending'
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."submit_deposit_request"("p_user_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_transaction_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_for_legal_review"("p_draft_id" "uuid", "p_submitter_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_risk_level VARCHAR(20) := 'low';
    v_requires_senior BOOLEAN := FALSE;
    v_sensitive_found TEXT[];
BEGIN
    -- Check for sensitive topics in question and description
    SELECT array_agg(st.keyword), MAX(st.risk_level)
    INTO v_sensitive_found, v_risk_level
    FROM market_creation_drafts d
    CROSS JOIN check_sensitive_topics(COALESCE(d.question, '') || ' ' || COALESCE(d.description, '')) st
    WHERE d.id = p_draft_id;
    
    -- Determine if senior counsel needed
    SELECT EXISTS (
        SELECT 1 FROM check_sensitive_topics(
            (SELECT COALESCE(question, '') || ' ' || COALESCE(description, '') 
             FROM market_creation_drafts WHERE id = p_draft_id)
        ) st WHERE st.risk_level = 'high'
    ) INTO v_requires_senior;
    
    -- Update draft
    UPDATE market_creation_drafts SET
        sensitive_topics = v_sensitive_found,
        regulatory_risk_level = COALESCE(v_risk_level, 'low'),
        legal_review_status = 'pending',
        requires_senior_counsel = v_requires_senior,
        status = 'in_review',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    -- Add to review queue if requires review
    IF v_risk_level IN ('medium', 'high') OR v_requires_senior THEN
        INSERT INTO legal_review_queue (draft_id, priority, status)
        VALUES (p_draft_id, 
            CASE 
                WHEN v_requires_senior THEN 'high'
                WHEN v_risk_level = 'high' THEN 'high'
                WHEN v_risk_level = 'medium' THEN 'normal'
                ELSE 'low'
            END,
            'pending'
        );
    ELSE
        -- Auto-approve if low risk
        UPDATE market_creation_drafts SET
            legal_review_status = 'approved',
            legal_reviewed_at = NOW()
        WHERE id = p_draft_id;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."submit_for_legal_review"("p_draft_id" "uuid", "p_submitter_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_oracle_request_v2"("p_market_id" "uuid", "p_requested_by" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_req_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM oracle_requests WHERE market_id = p_market_id AND status = 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Resolution already pending');
  END IF;

  INSERT INTO oracle_requests (market_id, request_type, proposer_id, status)
  VALUES (p_market_id, 'resolution', COALESCE(p_requested_by, auth.uid()), 'pending')
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."submit_oracle_request_v2"("p_market_id" "uuid", "p_requested_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_oracle_verdict_v2"("p_request_id" "uuid", "p_resolution" "text", "p_confidence" numeric, "p_reasoning" "text", "p_evidence" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE oracle_requests SET
    proposed_outcome = p_resolution,
    resolution = p_resolution,
    confidence_score = p_confidence,
    reasoning = p_reasoning,
    ai_analysis = p_reasoning,
    evidence_urls = p_evidence,
    status = CASE 
      WHEN p_confidence >= 0.9 THEN 'auto_resolved'
      WHEN p_confidence >= 0.7 THEN 'pending_review'
      ELSE 'low_confidence'
    END,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Auto-settle if high confidence
  IF p_confidence >= 0.9 THEN
    PERFORM settle_market_v2(
      (SELECT market_id FROM oracle_requests WHERE id = p_request_id), 
      p_resolution
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'auto_settled', p_confidence >= 0.9,
    'status', CASE 
      WHEN p_confidence >= 0.9 THEN 'auto_resolved'
      WHEN p_confidence >= 0.7 THEN 'pending_review'
      ELSE 'low_confidence'
    END
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."submit_oracle_verdict_v2"("p_request_id" "uuid", "p_resolution" "text", "p_confidence" numeric, "p_reasoning" "text", "p_evidence" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_order"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.place_order_atomic_v2(
    p_user_id, p_market_id, p_side::order_side, 'limit'::order_type,
    p_price, p_size
  );
END;
$$;


ALTER FUNCTION "public"."submit_order"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_name_title"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- If name is not provided, copy from title
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name := NEW.title;
    END IF;
    -- If title is not provided, copy from name
    IF NEW.title IS NULL OR NEW.title = '' THEN
        NEW.title := NEW.name;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_event_name_title"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_title_question"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."sync_event_title_question"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_topic_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_topic_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_event_creation"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_event_id UUID;
    v_admin_id UUID;
BEGIN
    -- Find an admin user
    SELECT id INTO v_admin_id
    FROM public.user_profiles
    WHERE is_admin = TRUE
    LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'No admin user found'
        );
    END IF;
    
    -- Try to insert a test event directly
    BEGIN
        INSERT INTO public.events (
            title,
            slug,
            question,
            category,
            status,
            created_by
        ) VALUES (
            'Test Event',
            'test-event-' || substr(gen_random_uuid()::text, 1, 8),
            'Test Question?',
            'general',
            'active',
            v_admin_id
        )
        RETURNING id INTO v_event_id;
        
        -- Delete the test event immediately
        DELETE FROM public.events WHERE id = v_event_id;
        
        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Event insertion works correctly',
            'test_event_id', v_event_id
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Event insertion failed: ' || SQLERRM,
            'detail', SQLSTATE
        );
    END;
END;
$$;


ALTER FUNCTION "public"."test_event_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_bookmark"("p_market_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if bookmark exists
  SELECT EXISTS(
    SELECT 1 FROM user_bookmarks 
    WHERE user_id = auth.uid() AND market_id = p_market_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove bookmark
    DELETE FROM user_bookmarks 
    WHERE user_id = auth.uid() AND market_id = p_market_id;
    v_result := jsonb_build_object('bookmarked', false, 'market_id', p_market_id);
  ELSE
    -- Add bookmark
    INSERT INTO user_bookmarks (user_id, market_id)
    VALUES (auth.uid(), p_market_id);
    v_result := jsonb_build_object('bookmarked', true, 'market_id', p_market_id);
  END IF;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."toggle_bookmark"("p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM comment_likes 
    WHERE user_id = auth.uid() AND comment_id = p_comment_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unlike
    DELETE FROM comment_likes 
    WHERE user_id = auth.uid() AND comment_id = p_comment_id;
    v_result := jsonb_build_object('liked', false, 'comment_id', p_comment_id);
  ELSE
    -- Like
    INSERT INTO comment_likes (user_id, comment_id)
    VALUES (auth.uid(), p_comment_id);
    v_result := jsonb_build_object('liked', true, 'comment_id', p_comment_id);
  END IF;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_market_follow"("p_market_id" "uuid", "p_notify_on_trade" boolean DEFAULT false, "p_notify_on_resolve" boolean DEFAULT true) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if follow exists
  SELECT EXISTS(
    SELECT 1 FROM market_followers 
    WHERE user_id = auth.uid() AND market_id = p_market_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unfollow
    DELETE FROM market_followers 
    WHERE user_id = auth.uid() AND market_id = p_market_id;
    v_result := jsonb_build_object('following', false, 'market_id', p_market_id);
  ELSE
    -- Follow
    INSERT INTO market_followers (
      user_id, market_id, notify_on_trade, notify_on_resolve
    ) VALUES (
      auth.uid(), p_market_id, p_notify_on_trade, p_notify_on_resolve
    );
    v_result := jsonb_build_object('following', true, 'market_id', p_market_id);
  END IF;
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."toggle_market_follow"("p_market_id" "uuid", "p_notify_on_trade" boolean, "p_notify_on_resolve" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_user_activity"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_last_login TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current last login
    SELECT last_login_at INTO v_last_login
    FROM user_profiles
    WHERE id = p_user_id;

    -- Update last login
    UPDATE user_profiles
    SET last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- If the user was dormant, we could trigger a flag here, 
    -- but the logic says "if 90 days log-in not done, status becomes dormant".
    -- This is usually checked at login time or by a background cron.
    
    -- If user was dormant, and is logging in, we might want to keep it dormant 
    -- until email verification is done (handled by app logic).
END;
$$;


ALTER FUNCTION "public"."track_user_activity"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_seed_orderbook_on_event_activation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Seed orderbook when event status changes to 'active'
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        PERFORM seed_event_orderbook(NEW.id, NEW.initial_liquidity, 0.02);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_seed_orderbook_on_event_activation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unfollow_market"("p_user_id" "uuid", "p_market_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM market_follows 
    WHERE user_id = p_user_id AND market_id = p_market_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Not following this market');
    END IF;
END;
$$;


ALTER FUNCTION "public"."unfollow_market"("p_user_id" "uuid", "p_market_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unfollow_user"("p_follower_id" "uuid", "p_following_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM user_follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    IF FOUND THEN
        UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = p_following_id;
        UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = p_follower_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Not following this user');
    END IF;
END;
$$;


ALTER FUNCTION "public"."unfollow_user"("p_follower_id" "uuid", "p_following_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unfreeze_funds"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.release_funds_v2(p_user_id, p_amount);
END;
$$;


ALTER FUNCTION "public"."unfreeze_funds"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unlock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN public.release_funds_v2(p_user_id, p_amount);
END;
$$;


ALTER FUNCTION "public"."unlock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_admin_log_workflow"("p_log_id" "uuid", "p_workflow_status" character varying, "p_new_values" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE admin_activity_logs
  SET 
    workflow_status = p_workflow_status,
    new_values = COALESCE(p_new_values, new_values)
  WHERE id = p_log_id;
END;
$$;


ALTER FUNCTION "public"."update_admin_log_workflow"("p_log_id" "uuid", "p_workflow_status" character varying, "p_new_values" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_admin_log_workflow"("p_log_id" "uuid", "p_workflow_status" character varying, "p_new_values" "jsonb") IS 'Updates workflow status for async actions';



CREATE OR REPLACE FUNCTION "public"."update_ai_settings_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_settings_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_batch_on_order_fill"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_batch_id UUID;
  v_total_orders INT;
  v_filled_orders INT;
  v_batch_total_cost DECIMAL(18,2);
  v_user_id UUID;
BEGIN
  -- Only process if this order belongs to a batch
  IF NEW.batch_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_batch_id := NEW.batch_id;
  
  -- Get batch info
  SELECT user_id, order_count, total_cost 
  INTO v_user_id, v_total_orders, v_batch_total_cost
  FROM order_batches 
  WHERE id = v_batch_id;
  
  IF v_total_orders IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count filled orders in this batch
  SELECT COUNT(*) INTO v_filled_orders
  FROM orders
  WHERE batch_id = v_batch_id
  AND status IN ('filled', 'partially_filled');
  
  -- Update batch progress
  UPDATE order_batches
  SET 
    filled_count = v_filled_orders,
    status = CASE 
      WHEN v_filled_orders = v_total_orders THEN 'completed'
      WHEN v_filled_orders > 0 THEN 'partial'
      ELSE 'processing'
    END,
    completed_at = CASE 
      WHEN v_filled_orders = v_total_orders THEN now()
      ELSE completed_at
    END
  WHERE id = v_batch_id;
  
  -- Release unused locked balance
  IF v_filled_orders = v_total_orders THEN
    -- All filled - balance already moved to positions
    NULL;
  ELSIF NEW.status = 'filled' OR NEW.status = 'partially_filled' THEN
    -- Release the difference between locked and actual used
    UPDATE wallets
    SET 
      locked_balance = GREATEST(0, locked_balance - (NEW.price * NEW.quantity)),
      available_balance = available_balance + GREATEST(0, (NEW.price * NEW.quantity) - (NEW.filled_quantity * NEW.price))
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_batch_on_order_fill"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE market_comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE market_comments 
    SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_comment_like_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_score"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE v_up INTEGER; v_down INTEGER;
BEGIN
    SELECT COUNT(*) FILTER (WHERE vote_type='upvote'), COUNT(*) FILTER (WHERE vote_type='downvote')
    INTO v_up, v_down FROM public.comment_votes WHERE comment_id=COALESCE(NEW.comment_id, OLD.comment_id);
    UPDATE public.market_comments SET upvotes=v_up, downvotes=v_down, score=(v_up-v_down)
    WHERE id=COALESCE(NEW.comment_id, OLD.comment_id);
    RETURN COALESCE(NEW, OLD);
END; $$;


ALTER FUNCTION "public"."update_comment_score"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_draft_stage"("p_draft_id" "uuid", "p_stage" character varying, "p_stage_data" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_current_stage VARCHAR(50);
    v_stages_completed JSONB;
BEGIN
    -- Get current state
    SELECT current_stage, stages_completed 
    INTO v_current_stage, v_stages_completed
    FROM market_creation_drafts
    WHERE id = p_draft_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Add current stage to completed if not already there
    IF NOT v_stages_completed ? v_current_stage THEN
        v_stages_completed := v_stages_completed || to_jsonb(v_current_stage);
    END IF;
    
    -- Update the draft with all fields including new ones
    UPDATE market_creation_drafts SET
        current_stage = p_stage,
        stages_completed = v_stages_completed,
        updated_at = NOW(),
        -- Stage 2: Parameters
        question = COALESCE((p_stage_data->>'question'), question),
        description = COALESCE((p_stage_data->>'description'), description),
        category = COALESCE((p_stage_data->>'category'), category),
        subcategory = COALESCE((p_stage_data->>'subcategory'), subcategory),
        tags = COALESCE((p_stage_data->'tags')::text[], tags),
        min_value = COALESCE((p_stage_data->>'min_value')::decimal, min_value),
        max_value = COALESCE((p_stage_data->>'max_value')::decimal, max_value),
        unit = COALESCE((p_stage_data->>'unit'), unit),
        outcomes = COALESCE(p_stage_data->'outcomes', outcomes),
        resolution_source = COALESCE((p_stage_data->>'resolution_source'), resolution_source),
        resolution_source_url = COALESCE((p_stage_data->>'resolution_source_url'), resolution_source_url),
        resolution_criteria = COALESCE((p_stage_data->>'resolution_criteria'), resolution_criteria),
        resolution_deadline = COALESCE((p_stage_data->>'resolution_deadline')::timestamptz, resolution_deadline),
        oracle_type = COALESCE((p_stage_data->>'oracle_type'), oracle_type),
        oracle_config = COALESCE(p_stage_data->'oracle_config', oracle_config),
        -- Stage 3: Liquidity
        liquidity_commitment = COALESCE((p_stage_data->>'liquidity_commitment')::decimal, liquidity_commitment),
        liquidity_amount = COALESCE((p_stage_data->>'liquidity_amount')::decimal, liquidity_amount),
        -- Stage 5: Simulation
        simulation_config = COALESCE(p_stage_data->'simulation_config', simulation_config),
        -- New fields
        image_url = COALESCE((p_stage_data->>'image_url'), image_url),
        trading_fee_percent = COALESCE((p_stage_data->>'trading_fee_percent')::decimal, trading_fee_percent),
        trading_end_type = COALESCE((p_stage_data->>'trading_end_type'), trading_end_type),
        verification_method = COALESCE(p_stage_data->'verification_method', verification_method),
        required_confirmations = COALESCE((p_stage_data->>'required_confirmations')::integer, required_confirmations),
        confidence_threshold = COALESCE((p_stage_data->>'confidence_threshold')::decimal, confidence_threshold),
        -- Admin bypass flags
        admin_bypass_liquidity = COALESCE((p_stage_data->>'admin_bypass_liquidity')::boolean, admin_bypass_liquidity),
        admin_bypass_legal_review = COALESCE((p_stage_data->>'admin_bypass_legal_review')::boolean, admin_bypass_legal_review),
        admin_bypass_simulation = COALESCE((p_stage_data->>'admin_bypass_simulation')::boolean, admin_bypass_simulation)
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_draft_stage"("p_draft_id" "uuid", "p_stage" character varying, "p_stage_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_status"("p_event_id" "uuid", "p_new_status" character varying, "p_admin_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_status VARCHAR;
BEGIN
    SELECT status INTO v_current_status FROM public.events WHERE id = p_event_id;
    
    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Event not found');
    END IF;
    
    -- Handle different status transitions
    IF p_new_status = 'paused' THEN
        UPDATE public.events SET
            status = 'paused',
            pause_reason = p_reason,
            paused_at = NOW(),
            paused_by = p_admin_id
        WHERE id = p_event_id;
    ELSIF p_new_status = 'resolved' THEN
        UPDATE public.events SET
            status = 'resolved',
            resolved_at = NOW(),
            resolved_by = p_admin_id
        WHERE id = p_event_id;
    ELSE
        UPDATE public.events SET status = p_new_status WHERE id = p_event_id;
    END IF;
    
    RETURN jsonb_build_object('success', TRUE, 'message', 'Status updated to ' || p_new_status);
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."update_event_status"("p_event_id" "uuid", "p_new_status" character varying, "p_admin_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_event_status"("p_event_id" "uuid", "p_new_status" character varying, "p_admin_id" "uuid", "p_reason" "text") IS 'Updates event status with transition validation';



CREATE OR REPLACE FUNCTION "public"."update_events_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_events_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_events_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_events_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_exchange_rate"("currency_pair" "text", "rate" numeric, "recorded_at" timestamp with time zone DEFAULT "now"()) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM update_exchange_rate_v2(currency_pair, rate, recorded_at);
END;
$$;


ALTER FUNCTION "public"."update_exchange_rate"("currency_pair" "text", "rate" numeric, "recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_exchange_rate_v2"("p_currency_pair" "text", "p_rate" numeric, "p_recorded_at" timestamp with time zone DEFAULT "now"()) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO exchange_rates (currency_pair, rate, recorded_at)
  VALUES (p_currency_pair, p_rate, COALESCE(p_recorded_at, NOW()))
  ON CONFLICT (currency_pair) DO UPDATE 
  SET rate = EXCLUDED.rate, recorded_at = EXCLUDED.recorded_at;
END;
$$;


ALTER FUNCTION "public"."update_exchange_rate_v2"("p_currency_pair" "text", "p_rate" numeric, "p_recorded_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expert_after_vote"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_correct_count INTEGER;
    v_total_count INTEGER;
    v_new_reputation NUMERIC;
    v_new_rank VARCHAR;
BEGIN
    -- Count correct and total votes for this expert
    SELECT 
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        COUNT(*)
    INTO v_correct_count, v_total_count
    FROM expert_votes
    WHERE expert_id = NEW.expert_id;
    
    -- Calculate new reputation
    v_new_reputation := calculate_reputation_score(v_correct_count, v_total_count);
    
    -- Determine new rank
    v_new_rank := update_expert_rank_tier(v_new_reputation);
    
    -- Update expert panel record
    UPDATE expert_panel
    SET 
        total_votes = v_total_count,
        correct_votes = v_correct_count,
        incorrect_votes = v_total_count - v_correct_count,
        reputation_score = v_new_reputation,
        rank_tier = v_new_rank,
        updated_at = NOW()
    WHERE id = NEW.expert_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_expert_after_vote"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expert_rank_tier"("p_reputation_score" numeric) RETURNS character varying
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN CASE
        WHEN p_reputation_score >= 4.0 THEN 'diamond'
        WHEN p_reputation_score >= 3.0 THEN 'platinum'
        WHEN p_reputation_score >= 2.0 THEN 'gold'
        WHEN p_reputation_score >= 1.0 THEN 'silver'
        ELSE 'bronze'
    END;
END;
$$;


ALTER FUNCTION "public"."update_expert_rank_tier"("p_reputation_score" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leaderboard"("p_user_id" "uuid", "p_score_delta" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN update_leaderboard_v2(p_user_id, p_score_delta::NUMERIC);
END;
$$;


ALTER FUNCTION "public"."update_leaderboard"("p_user_id" "uuid", "p_score_delta" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_leaderboard_v2"("p_user_id" "uuid", "p_score_delta" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO leaderboard (user_id, score, username)
  VALUES (
    p_user_id, p_score_delta,
    (SELECT COALESCE(display_name, email) FROM users WHERE id = p_user_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score = leaderboard.score + EXCLUDED.score,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."update_leaderboard_v2"("p_user_id" "uuid", "p_score_delta" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_maker_volume"("p_user_id" "uuid", "p_volume" numeric, "p_is_maker" boolean, "p_spread_contribution" numeric DEFAULT 0, "p_resting_seconds" integer DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_year_month VARCHAR(7);
    v_current_volume DECIMAL(20, 2);
    v_new_tier INTEGER;
    v_rebate_rate DECIMAL(8, 4);
BEGIN
    v_year_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    INSERT INTO maker_volume_tracking (
        user_id, year_month, maker_volume, taker_volume,
        total_spread_contribution, resting_time_seconds
    ) VALUES (
        p_user_id, v_year_month,
        CASE WHEN p_is_maker THEN p_volume ELSE 0 END,
        CASE WHEN NOT p_is_maker THEN p_volume ELSE 0 END,
        p_spread_contribution, p_resting_seconds
    )
    ON CONFLICT (user_id, year_month) DO UPDATE SET
        maker_volume = maker_volume_tracking.maker_volume + 
            CASE WHEN p_is_maker THEN p_volume ELSE 0 END,
        taker_volume = maker_volume_tracking.taker_volume + 
            CASE WHEN NOT p_is_maker THEN p_volume ELSE 0 END,
        total_spread_contribution = maker_volume_tracking.total_spread_contribution + p_spread_contribution,
        resting_time_seconds = maker_volume_tracking.resting_time_seconds + p_resting_seconds,
        last_updated = NOW();
    
    SELECT maker_volume INTO v_current_volume
    FROM maker_volume_tracking
    WHERE user_id = p_user_id AND year_month = v_year_month;
    
    v_new_tier := determine_rebate_tier(v_current_volume);
    
    SELECT rebate_rate INTO v_rebate_rate
    FROM rebate_tiers_config
    WHERE id = v_new_tier;
    
    UPDATE maker_volume_tracking
    SET 
        rebate_tier = v_new_tier,
        rebate_rate = v_rebate_rate,
        estimated_rebate = v_current_volume * v_rebate_rate,
        last_updated = NOW()
    WHERE user_id = p_user_id AND year_month = v_year_month;
END;
$$;


ALTER FUNCTION "public"."update_maker_volume"("p_user_id" "uuid", "p_volume" numeric, "p_is_maker" boolean, "p_spread_contribution" numeric, "p_resting_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_market_best_quotes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_best_bid NUMERIC(5,4);
  v_best_ask NUMERIC(5,4);
BEGIN
  -- Only process open orders
  IF NEW.status NOT IN ('open', 'partially_filled') THEN
    RETURN NEW;
  END IF;

  -- Get best bid (highest buy price)
  SELECT MAX(price) INTO v_best_bid
  FROM public.orders
  WHERE market_id = NEW.market_id 
    AND side = 'buy' 
    AND status IN ('open', 'partially_filled');

  -- Get best ask (lowest sell price)
  SELECT MIN(price) INTO v_best_ask
  FROM public.orders
  WHERE market_id = NEW.market_id 
    AND side = 'sell' 
    AND status IN ('open', 'partially_filled');

  -- Update market
  UPDATE public.markets
  SET 
    best_bid = v_best_bid,
    best_ask = v_best_ask,
    spread = CASE 
      WHEN v_best_bid IS NOT NULL AND v_best_ask IS NOT NULL 
      THEN v_best_ask - v_best_bid 
      ELSE NULL 
    END
  WHERE id = NEW.market_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_market_best_quotes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_market_on_trade"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update last trade info
  UPDATE public.markets
  SET 
    last_trade_price = NEW.price,
    last_trade_at = NEW.created_at,
    total_volume = COALESCE(total_volume, 0) + (NEW.quantity * NEW.price),
    updated_at = NOW()
  WHERE id = NEW.market_id;

  -- Update price history
  INSERT INTO public.price_history (market_id, outcome, price, recorded_at)
  VALUES (NEW.market_id, NEW.outcome::TEXT, NEW.price, NEW.created_at);

  -- Update yes/no prices based on trade outcome
  IF NEW.outcome::TEXT = 'YES' THEN
    UPDATE public.markets SET yes_price = NEW.price WHERE id = NEW.market_id;
  ELSIF NEW.outcome::TEXT = 'NO' THEN
    UPDATE public.markets SET no_price = NEW.price WHERE id = NEW.market_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_market_on_trade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity_delta" bigint, "p_price" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity_delta" bigint, "p_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM public.upsert_position_v2(p_user_id, p_market_id, p_outcome, p_quantity, p_price, 'buy');
END;
$$;


ALTER FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_price_changes"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update YES price 24h change
  UPDATE markets m
  SET yes_price_change_24h = COALESCE((
    SELECT m.yes_price - ph.price
    FROM price_history ph
    WHERE ph.market_id = m.id
      AND ph.outcome = 'YES'
      AND ph.recorded_at <= now() - INTERVAL '24 hours'
    ORDER BY ph.recorded_at DESC
    LIMIT 1
  ), 0)
  WHERE m.status = 'active';
  
  -- Update NO price 24h change
  UPDATE markets m
  SET no_price_change_24h = COALESCE((
    SELECT m.no_price - ph.price
    FROM price_history ph
    WHERE ph.market_id = m.id
      AND ph.outcome = 'NO'
      AND ph.recorded_at <= now() - INTERVAL '24 hours'
    ORDER BY ph.recorded_at DESC
    LIMIT 1
  ), 0)
  WHERE m.status = 'active';
END;
$$;


ALTER FUNCTION "public"."update_price_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_resolution_system_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_resolution_system_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timestamp_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_timestamp_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_unique_traders"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_buyer_is_new BOOLEAN;
  v_seller_is_new BOOLEAN;
BEGIN
  -- Check if buyer has traded on this market before
  SELECT NOT EXISTS (
    SELECT 1 FROM public.trades 
    WHERE market_id = NEW.market_id 
    AND (buyer_id = NEW.buyer_id OR seller_id = NEW.buyer_id)
    AND id != NEW.id
  ) INTO v_buyer_is_new;

  -- Check if seller has traded on this market before
  SELECT NOT EXISTS (
    SELECT 1 FROM public.trades 
    WHERE market_id = NEW.market_id 
    AND (buyer_id = NEW.seller_id OR seller_id = NEW.seller_id)
    AND id != NEW.id
  ) INTO v_seller_is_new;

  IF v_buyer_is_new OR v_seller_is_new THEN
    UPDATE public.markets
    SET unique_traders = COALESCE(unique_traders, 0) + 
      (CASE WHEN v_buyer_is_new THEN 1 ELSE 0 END) +
      (CASE WHEN v_seller_is_new THEN 1 ELSE 0 END)
    WHERE id = NEW.market_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_unique_traders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_status"("p_admin_id" "uuid", "p_user_id" "uuid", "p_status" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles 
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating user status: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."update_user_status"("p_admin_id" "uuid", "p_user_id" "uuid", "p_status" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_workflow_status"("p_execution_id" "uuid", "p_status" "text", "p_error_message" "text" DEFAULT NULL::"text", "p_increment_retry" boolean DEFAULT false) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_retry_count INTEGER;
    v_max_retries INTEGER;
BEGIN
    -- Get current values
    SELECT retry_count, max_retries 
    INTO v_current_retry_count, v_max_retries
    FROM workflow_executions 
    WHERE id = p_execution_id;

    -- Update status
    UPDATE workflow_executions
    SET 
        status = p_status,
        error_message = p_error_message,
        retry_count = CASE 
            WHEN p_increment_retry THEN retry_count + 1 
            ELSE retry_count 
        END,
        completed_at = CASE 
            WHEN p_status IN ('completed', 'failed') THEN NOW() 
            ELSE NULL 
        END,
        updated_at = NOW()
    WHERE id = p_execution_id;

    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_workflow_status"("p_execution_id" "uuid", "p_status" "text", "p_error_message" "text", "p_increment_retry" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_position_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric, "p_side" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_existing RECORD;
  v_new_qty NUMERIC;
  v_new_avg NUMERIC;
BEGIN
  SELECT * INTO v_existing FROM positions 
  WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome
  FOR UPDATE;

  IF v_existing IS NULL THEN
    -- New position
    INSERT INTO positions (user_id, market_id, outcome, quantity, average_price)
    VALUES (p_user_id, p_market_id, p_outcome, 
      CASE WHEN p_side = 'buy' THEN p_quantity ELSE -p_quantity END,
      p_price);
  ELSE
    -- Update existing position with volume-weighted average price
    IF p_side = 'buy' THEN
      v_new_qty := v_existing.quantity + p_quantity;
      IF v_new_qty > 0 THEN
        v_new_avg := ((v_existing.quantity * v_existing.average_price) + (p_quantity * p_price)) / v_new_qty;
      ELSE
        v_new_avg := p_price;
      END IF;
    ELSE
      v_new_qty := v_existing.quantity - p_quantity;
      v_new_avg := v_existing.average_price; -- avg doesn't change on sell
    END IF;

    UPDATE positions 
    SET quantity = v_new_qty, average_price = v_new_avg, updated_at = NOW()
    WHERE id = v_existing.id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."upsert_position_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric, "p_side" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_event_timing"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- ends_at must be in the future for new events or during update if changed
  IF (TG_OP = 'INSERT' OR NEW.ends_at IS DISTINCT FROM OLD.ends_at) AND NEW.ends_at <= CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'Market end time must be in the future: %', NEW.ends_at;
  END IF;
  
  -- ends_at must be after starts_at
  IF NEW.ends_at <= NEW.starts_at THEN
    RAISE EXCEPTION 'Market must end after it starts: starts_at=%, ends_at=%', 
      NEW.starts_at, NEW.ends_at;
  END IF;
  
  -- resolution_delay validation (0 to 2 weeks)
  IF NEW.resolution_delay < 0 OR NEW.resolution_delay > 20160 THEN
    RAISE EXCEPTION 'Resolution delay must be between 0 and 20160 minutes (2 weeks): %', NEW.resolution_delay;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_event_timing"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_event_timing"() IS 'Prevents invalid event timestamps and unreasonable resolution delays';



CREATE OR REPLACE FUNCTION "public"."validate_outcome_probabilities"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  total_prob DECIMAL(10,4);
  market_type_val market_type_enum;
BEGIN
  -- Get market type
  SELECT market_type INTO market_type_val
  FROM markets WHERE id = NEW.market_id;
  
  -- Only validate for multi_outcome markets
  IF market_type_val = 'multi_outcome' THEN
    SELECT COALESCE(SUM(current_price), 0) INTO total_prob
    FROM outcomes
    WHERE market_id = NEW.market_id;
    
    -- Allow some tolerance for floating point (0.95 to 1.05)
    IF total_prob > 1.05 THEN
      RAISE WARNING 'Outcome probabilities sum to %, expected ~1.0 for market %', total_prob, NEW.market_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_outcome_probabilities"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_and_credit_deposit"("p_admin_id" "uuid", "p_deposit_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_deposit RECORD;
    v_wallet RECORD;
    v_success BOOLEAN := FALSE;
BEGIN
    -- Get deposit record
    SELECT * INTO v_deposit 
    FROM public.payment_transactions 
    WHERE id = p_deposit_id AND type = 'deposit' AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Deposit not found or already processed';
        RETURN FALSE;
    END IF;
    
    -- Get wallet
    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE user_id = v_deposit.user_id;
    
    IF NOT FOUND THEN
        -- Create wallet if not exists
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        VALUES (v_deposit.user_id, v_deposit.amount, 0)
        RETURNING * INTO v_wallet;
    ELSE
        -- Update wallet balance
        UPDATE public.wallets 
        SET balance = balance + v_deposit.amount,
            updated_at = NOW()
        WHERE user_id = v_deposit.user_id;
    END IF;
    
    -- Update deposit status
    UPDATE public.payment_transactions 
    SET status = 'completed',
        verified_at = NOW(),
        processed_at = NOW(),
        metadata = metadata || jsonb_build_object('verified_by', p_admin_id, 'verified_at', NOW())
    WHERE id = p_deposit_id;
    
    -- Record USDT transaction if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usdt_transactions') THEN
        INSERT INTO public.usdt_transactions (
            user_id, type, amount, status, payment_method, reference_id, verified_at, processed_at
        ) VALUES (
            v_deposit.user_id, 'deposit', v_deposit.amount, 'completed', 
            v_deposit.payment_method, v_deposit.id, NOW(), NOW()
        );
    END IF;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error verifying deposit: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."verify_and_credit_deposit"("p_admin_id" "uuid", "p_deposit_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_and_credit_deposit_v2"("p_deposit_id" "uuid", "p_admin_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_deposit RECORD;
  v_wallet RECORD;
  v_result JSONB;
BEGIN
  -- Get deposit with lock
  SELECT * INTO v_deposit
  FROM public.deposit_requests
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found: %', p_deposit_id;
  END IF;

  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit already processed. Status: %', v_deposit.status;
  END IF;

  -- Update deposit status
  UPDATE public.deposit_requests
  SET
    status = 'approved',
    admin_notes = p_admin_notes,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = p_deposit_id;

  -- Credit user wallet
  INSERT INTO public.wallets (user_id, usdt_balance)
  VALUES (v_deposit.user_id, v_deposit.usdt_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET
    usdt_balance = wallets.usdt_balance + v_deposit.usdt_amount,
    total_deposited = wallets.total_deposited + v_deposit.usdt_amount,
    updated_at = NOW();

  -- Log transaction
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, reference_id, description
  ) VALUES (
    v_deposit.user_id,
    'deposit',
    v_deposit.usdt_amount,
    p_deposit_id,
    'Deposit approved: ' || COALESCE(v_deposit.payment_method, 'usdt_p2p')
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'deposit_id', p_deposit_id,
    'user_id', v_deposit.user_id,
    'usdt_credited', v_deposit.usdt_amount
  );
END;
$$;


ALTER FUNCTION "public"."verify_and_credit_deposit_v2"("p_deposit_id" "uuid", "p_admin_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_expert_vote"("p_vote_id" "uuid", "p_ai_relevance_score" numeric, "p_ai_feedback" "text", "p_final_outcome" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_vote_record RECORD;
    v_is_correct BOOLEAN;
    v_points INTEGER;
BEGIN
    -- Get the vote record
    SELECT * INTO v_vote_record
    FROM expert_votes
    WHERE id = p_vote_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vote not found: %', p_vote_id;
    END IF;
    
    -- Determine if vote was correct
    v_is_correct := (v_vote_record.vote_outcome = p_final_outcome);
    
    -- Calculate points based on AI relevance and correctness
    v_points := CASE
        WHEN v_is_correct AND p_ai_relevance_score >= 7 THEN 10
        WHEN v_is_correct AND p_ai_relevance_score >= 5 THEN 5
        WHEN v_is_correct THEN 2
        WHEN p_ai_relevance_score >= 7 THEN -2
        ELSE -5
    END;
    
    -- Update the vote record
    UPDATE expert_votes
    SET 
        ai_relevance_score = p_ai_relevance_score,
        ai_feedback = p_ai_feedback,
        ai_verification_status = CASE 
            WHEN p_ai_relevance_score >= 5 THEN 'verified'
            ELSE 'flagged'
        END,
        is_correct = v_is_correct,
        points_earned = v_points,
        verified_at = NOW()
    WHERE id = p_vote_id;
    
END;
$$;


ALTER FUNCTION "public"."verify_expert_vote"("p_vote_id" "uuid", "p_ai_relevance_score" numeric, "p_ai_feedback" "text", "p_final_outcome" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."withdraw_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text" DEFAULT 'bank_transfer'::"text", "p_destination" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_wallet RECORD;
  v_daily_total NUMERIC;
  v_monthly_total NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF NOT v_wallet.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet is frozen');
  END IF;
  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds',
      'available', v_wallet.balance, 'requested', p_amount);
  END IF;

  -- Check daily withdrawal limit
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM transactions 
  WHERE user_id = p_user_id AND type = 'withdrawal' 
    AND created_at >= NOW() - INTERVAL '24 hours';
  IF v_daily_total + p_amount > v_wallet.daily_withdrawal_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily withdrawal limit exceeded',
      'limit', v_wallet.daily_withdrawal_limit, 'used', v_daily_total);
  END IF;

  -- Check monthly withdrawal limit
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_total
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal'
    AND created_at >= date_trunc('month', NOW());
  IF v_monthly_total + p_amount > v_wallet.monthly_withdrawal_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Monthly withdrawal limit exceeded',
      'limit', v_wallet.monthly_withdrawal_limit, 'used', v_monthly_total);
  END IF;

  -- Deduct
  UPDATE wallets SET
    balance = balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    last_withdrawal_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, metadata)
  VALUES (
    p_user_id, 'withdrawal', p_amount, v_wallet.balance, v_wallet.balance - p_amount,
    jsonb_build_object('method', p_method, 'destination', p_destination)
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_wallet.balance - p_amount);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."withdraw_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_destination" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."withdrawal_processing"("p_withdrawal_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN public.process_withdrawal(p_withdrawal_id);
END;
$$;


ALTER FUNCTION "public"."withdrawal_processing"("p_withdrawal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."workflow_health_check"() RETURNS TABLE("check_name" "text", "status" "text", "details" "text", "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check for stuck workflows (running > 1 hour)
    RETURN QUERY
    SELECT 
        'Stuck Workflows'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' workflows running > 1 hour'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 5 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.upstash_workflow_runs
    WHERE status = 'RUNNING'
    AND started_at < NOW() - INTERVAL '1 hour';

    -- Check for DLQ backlog
    RETURN QUERY
    SELECT 
        'DLQ Backlog'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 10 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' unresolved items in DLQ'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 10 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.workflow_dlq
    WHERE resolved_at IS NULL;

    -- Check for recent failures
    RETURN QUERY
    SELECT 
        'Recent Failures (24h)'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 10 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' failed workflows in last 24h'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 10 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.upstash_workflow_runs
    WHERE status = 'FAILED'
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Check for orphaned runs (no event_id or market_id)
    RETURN QUERY
    SELECT 
        'Orphaned Workflow Runs'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 20 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' runs without event/market linkage'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 20 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.upstash_workflow_runs
    WHERE event_id IS NULL 
    AND market_id IS NULL
    AND created_at > NOW() - INTERVAL '7 days';

    RETURN;
END;
$$;


ALTER FUNCTION "public"."workflow_health_check"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."workflow_health_check"() IS 'Returns workflow system health status';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cancellation_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "cancel_type" character varying(20) NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "soft_cancelled_at" timestamp with time zone,
    "hard_cancelled_at" timestamp with time zone,
    "filled_quantity_before" numeric(36,18) DEFAULT 0 NOT NULL,
    "remaining_quantity" numeric(36,18) NOT NULL,
    "average_fill_price" numeric(36,18),
    "final_filled_quantity" numeric(36,18),
    "final_cancelled_quantity" numeric(36,18),
    "released_collateral" numeric(36,18) DEFAULT 0 NOT NULL,
    "race_condition_detected" boolean DEFAULT false,
    "race_resolution" character varying(20),
    "sequence_number" bigint NOT NULL,
    "cancellation_signature" character varying(128),
    "cancelled_by" "uuid",
    "cancellation_reason" character varying(50),
    "client_request_id" character varying(64),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cancellation_records_cancel_type_check" CHECK ((("cancel_type")::"text" = ANY ((ARRAY['SOFT'::character varying, 'HARD'::character varying, 'EXPIRY'::character varying])::"text"[]))),
    CONSTRAINT "cancellation_records_race_resolution_check" CHECK ((("race_resolution")::"text" = ANY ((ARRAY['CANCEL_WON'::character varying, 'FILL_WON'::character varying, 'PARTIAL_FILL'::character varying])::"text"[])))
);


ALTER TABLE "public"."cancellation_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_book" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "side" character varying(4) NOT NULL,
    "price" numeric(36,18) NOT NULL,
    "size" numeric(36,18) NOT NULL,
    "filled" numeric(36,18) DEFAULT 0,
    "status" character varying(20) DEFAULT 'OPEN'::character varying,
    "order_type" character varying(20) DEFAULT 'LIMIT'::character varying,
    "time_in_force" character varying(10) DEFAULT 'GTC'::character varying,
    "post_only" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tif" "public"."tif_type" DEFAULT 'GTC'::"public"."tif_type",
    "gtd_expiry" timestamp with time zone,
    "original_quantity" numeric(36,18) DEFAULT 0 NOT NULL,
    "avg_fill_price" numeric(36,18) DEFAULT 0,
    "fill_count" integer DEFAULT 0,
    "last_fill_at" timestamp with time zone,
    "time_priority" integer DEFAULT 0,
    "is_re_entry" boolean DEFAULT false,
    "parent_order_id" "uuid",
    CONSTRAINT "order_book_order_type_check" CHECK ((("order_type")::"text" = ANY ((ARRAY['LIMIT'::character varying, 'MARKET'::character varying])::"text"[]))),
    CONSTRAINT "order_book_side_check" CHECK ((("side")::"text" = ANY ((ARRAY['BUY'::character varying, 'SELL'::character varying])::"text"[]))),
    CONSTRAINT "order_book_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['OPEN'::character varying, 'PARTIAL'::character varying, 'CANCELLING'::character varying, 'CANCELLED'::character varying, 'FILLED'::character varying, 'EXPIRED'::character varying])::"text"[])))
);


ALTER TABLE "public"."order_book" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_cancellations" AS
 SELECT "cr"."id",
    "cr"."order_id",
    "cr"."cancel_type",
    "cr"."requested_at",
    "cr"."soft_cancelled_at",
    "cr"."hard_cancelled_at",
    "cr"."filled_quantity_before",
    "cr"."remaining_quantity",
    "cr"."average_fill_price",
    "cr"."final_filled_quantity",
    "cr"."final_cancelled_quantity",
    "cr"."released_collateral",
    "cr"."race_condition_detected",
    "cr"."race_resolution",
    "cr"."sequence_number",
    "cr"."cancellation_signature",
    "cr"."cancelled_by",
    "cr"."cancellation_reason",
    "cr"."client_request_id",
    "cr"."created_at",
    "ob"."market_id",
    "ob"."user_id",
    "ob"."side",
    "ob"."price",
    "ob"."size",
    "ob"."filled",
    (EXTRACT(epoch FROM ("now"() - "cr"."requested_at")) * (1000)::numeric) AS "elapsed_ms"
   FROM ("public"."cancellation_records" "cr"
     JOIN "public"."order_book" "ob" ON (("ob"."id" = "cr"."order_id")))
  WHERE (("cr"."hard_cancelled_at" IS NULL) AND (("ob"."status")::"text" = 'CANCELLING'::"text"));


ALTER VIEW "public"."active_cancellations" OWNER TO "postgres";


COMMENT ON VIEW "public"."active_cancellations" IS 'Orders currently in soft-cancel state awaiting hard cancel';



CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "public"."activity_type" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_aggregations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "aggregation_type" "text" NOT NULL,
    "aggregation_key" "text" NOT NULL,
    "title" "text",
    "aggregated_count" integer DEFAULT 0,
    "activity_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "preview_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_aggregations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "resource_type" character varying(50),
    "resource_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "change_summary" "text",
    "reason" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "workflow_id" character varying(100),
    "workflow_status" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_activity_logs_action_type_check" CHECK ((("action_type")::"text" = ANY ((ARRAY['create_event'::character varying, 'update_event'::character varying, 'delete_event'::character varying, 'resolve_event'::character varying, 'create_atomic_event'::character varying, 'create_from_ai'::character varying, 'agent_workflow'::character varying, 'approve_topic'::character varying, 'reject_topic'::character varying, 'pause_market'::character varying, 'resume_market'::character varying, 'add_expert'::character varying, 'remove_expert'::character varying, 'resolve_dispute'::character varying, 'manual_override'::character varying, 'update_oracle'::character varying, 'emergency_action'::character varying, 'verify_expert'::character varying, 'create_dispute'::character varying, 'system_update'::character varying, 'login_success'::character varying])::"text"[])))
);


ALTER TABLE "public"."admin_activity_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_activity_logs" IS 'Tracks all admin actions for audit trail';



CREATE TABLE IF NOT EXISTS "public"."admin_ai_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "custom_instruction" "text" DEFAULT 'Generate engaging prediction market topics relevant to Bangladesh users'::"text",
    "target_region" character varying(50) DEFAULT 'Bangladesh'::character varying,
    "default_categories" character varying(50)[] DEFAULT ARRAY['Sports'::"text", 'Politics'::"text", 'Economy'::"text", 'Entertainment'::"text"],
    "auto_generate_enabled" boolean DEFAULT false,
    "auto_generate_time" time without time zone DEFAULT '08:00:00'::time without time zone,
    "max_daily_topics" integer DEFAULT 5,
    "gemini_model" character varying(50) DEFAULT 'gemini-1.5-flash'::character varying,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "admin_ai_settings_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."admin_ai_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_ai_settings" IS 'Admin configuration for AI topic generation';



CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "admin_name" character varying(255),
    "action" character varying(100) NOT NULL,
    "action_category" character varying(50),
    "target_user_id" "uuid",
    "target_user_email" character varying(255),
    "resource" "text",
    "details" "jsonb",
    "previous_value" "jsonb",
    "new_value" "jsonb",
    "reason" "text",
    "requires_dual_auth" boolean DEFAULT false,
    "dual_auth_admin_id" "uuid",
    "dual_auth_at" timestamp with time zone,
    "ip_address" "text",
    "user_agent" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "performed_by" "uuid",
    "target_table" "text",
    "target_id" "uuid",
    "diff_jsonb" "jsonb"
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "full_name" character varying(255),
    "email" character varying(255),
    "avatar_url" "text",
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_super_admin" boolean DEFAULT false NOT NULL,
    "is_senior_counsel" boolean DEFAULT false,
    "last_admin_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_login_at" timestamp with time zone,
    "kyc_level" integer DEFAULT 0,
    "status" "public"."user_account_status" DEFAULT 'active'::"public"."user_account_status",
    "flags" "jsonb" DEFAULT '{}'::"jsonb",
    "is_pro" boolean DEFAULT false,
    "can_create_events" boolean DEFAULT false
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_roles" AS
 SELECT "id" AS "user_id",
    "is_admin",
    "is_super_admin",
    "full_name",
    "email"
   FROM "public"."user_profiles" "up"
  WHERE (("is_admin" = true) OR ("is_super_admin" = true));


ALTER VIEW "public"."admin_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(50) NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_workflow_triggers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "workflow_name" character varying(100) NOT NULL,
    "endpoint" "text" NOT NULL,
    "status" character varying(20) NOT NULL,
    "response" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_workflow_triggers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['success'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."admin_workflow_triggers" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_workflow_triggers" IS 'Tracks manual workflow triggers by admins';



CREATE TABLE IF NOT EXISTS "public"."agent_wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "method" character varying(10),
    "wallet_type" character varying(20),
    "phone_number" character varying(15) NOT NULL,
    "account_name" character varying(100),
    "is_active" boolean DEFAULT true,
    "daily_limit_bdt" numeric(12,2) DEFAULT 100000,
    "used_today_bdt" numeric(12,2) DEFAULT 0,
    "last_reset_date" "date" DEFAULT CURRENT_DATE,
    "qr_code_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "agent_wallets_method_check" CHECK ((("method")::"text" = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying])::"text"[]))),
    CONSTRAINT "agent_wallets_wallet_type_check" CHECK ((("wallet_type")::"text" = ANY ((ARRAY['send_money'::character varying, 'cashout'::character varying, 'payment'::character varying])::"text"[])))
);


ALTER TABLE "public"."agent_wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_ab_tests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "model_a_id" "uuid" NOT NULL,
    "model_b_id" "uuid" NOT NULL,
    "traffic_split_a" integer NOT NULL,
    "traffic_split_b" integer NOT NULL,
    "status" character varying(20) DEFAULT 'running'::character varying,
    "start_date" timestamp with time zone DEFAULT "now"(),
    "end_date" timestamp with time zone,
    "model_a_metrics" "jsonb",
    "model_b_metrics" "jsonb",
    "winner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_ab_tests_check" CHECK ((("traffic_split_a" + "traffic_split_b") = 100)),
    CONSTRAINT "ai_ab_tests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['running'::character varying, 'completed'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "ai_ab_tests_traffic_split_a_check" CHECK ((("traffic_split_a" >= 0) AND ("traffic_split_a" <= 100))),
    CONSTRAINT "ai_ab_tests_traffic_split_b_check" CHECK ((("traffic_split_b" >= 0) AND ("traffic_split_b" <= 100)))
);


ALTER TABLE "public"."ai_ab_tests" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_ab_tests" IS 'A/B test configuration and results';



CREATE TABLE IF NOT EXISTS "public"."ai_agent_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_key" "text" NOT NULL,
    "agent_name" "text" NOT NULL,
    "description" "text",
    "system_prompt" "text" DEFAULT ''::"text" NOT NULL,
    "model_name" "text" DEFAULT 'gemini-2.5-flash'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "temperature" numeric DEFAULT 0.2,
    "daily_token_limit" integer DEFAULT 100000,
    "total_tokens_spent" bigint DEFAULT 0,
    "pipeline" "text",
    "last_run_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_agent_configs_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."ai_agent_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_circuit_breaker_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service" character varying(100) NOT NULL,
    "status" character varying(20) NOT NULL,
    "failure_count" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "threshold" integer DEFAULT 5 NOT NULL,
    "timeout_ms" integer DEFAULT 60000 NOT NULL,
    "last_failure_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_circuit_breaker_state_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['closed'::character varying, 'open'::character varying, 'half_open'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_circuit_breaker_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_daily_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "suggested_title" "text" NOT NULL,
    "suggested_question" "text" NOT NULL,
    "suggested_description" "text",
    "suggested_category" character varying(50),
    "ai_reasoning" "text",
    "ai_confidence" numeric(5,2) DEFAULT 0.00,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "market_id" "uuid",
    "rejected_reason" "text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_daily_topics_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_daily_topics" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_daily_topics" IS 'AI-generated daily prediction market topics';



CREATE TABLE IF NOT EXISTS "public"."ai_event_pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "pipeline_type" character varying(50) DEFAULT 'event_creation'::character varying NOT NULL,
    "input_data" "jsonb" DEFAULT '{}'::"jsonb",
    "output_data" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_event_pipelines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_evidence_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" character varying(500) NOT NULL,
    "query" "text" NOT NULL,
    "sources" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "source_types" "text"[],
    "total_sources" integer,
    "cross_verification_score" numeric(5,4),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_evidence_cache" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_evidence_cache" IS 'Cached evidence sources to reduce API calls';



CREATE TABLE IF NOT EXISTS "public"."ai_model_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_type" character varying(50) NOT NULL,
    "version" character varying(20) NOT NULL,
    "deployment_status" character varying(20) DEFAULT 'staging'::character varying,
    "accuracy" numeric(5,4),
    "precision" numeric(5,4),
    "recall" numeric(5,4),
    "f1_score" numeric(5,4),
    "avg_latency_ms" integer,
    "training_date" timestamp with time zone,
    "dataset_size" integer,
    "training_parameters" "jsonb",
    "is_canary" boolean DEFAULT false,
    "canary_traffic_percent" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_model_versions_canary_traffic_percent_check" CHECK ((("canary_traffic_percent" >= 0) AND ("canary_traffic_percent" <= 100))),
    CONSTRAINT "ai_model_versions_deployment_status_check" CHECK ((("deployment_status")::"text" = ANY ((ARRAY['staging'::character varying, 'active'::character varying, 'deprecated'::character varying])::"text"[]))),
    CONSTRAINT "ai_model_versions_model_type_check" CHECK ((("model_type")::"text" = ANY ((ARRAY['synthesis'::character varying, 'deliberation'::character varying, 'explanation'::character varying, 'retrieval'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_model_versions" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_model_versions" IS 'Model versioning and deployment tracking for A/B testing';



CREATE TABLE IF NOT EXISTS "public"."ai_prompts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_name" character varying(50) NOT NULL,
    "description" "text",
    "system_prompt" "text" NOT NULL,
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."ai_prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_providers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "provider_name" character varying(50) NOT NULL,
    "model" character varying(255) NOT NULL,
    "base_url" character varying(1000),
    "api_key_secret_name" character varying(255),
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 4000,
    "is_active" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."ai_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_rate_limit_state" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service" character varying(100) NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "request_count" integer DEFAULT 0,
    "request_limit" integer NOT NULL,
    "window_ms" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_rate_limit_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_resolution_pipelines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pipeline_id" character varying(100) NOT NULL,
    "market_id" "uuid" NOT NULL,
    "query" "text" NOT NULL,
    "retrieval_output" "jsonb",
    "synthesis_output" "jsonb",
    "deliberation_output" "jsonb",
    "explanation_output" "jsonb",
    "final_outcome" character varying(50),
    "final_confidence" numeric(5,4),
    "confidence_level" character varying(20),
    "recommended_action" character varying(50),
    "status" character varying(20) DEFAULT 'running'::character varying,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "total_execution_time_ms" integer,
    "synthesis_model_version" character varying(20),
    "deliberation_model_version" character varying(20),
    "explanation_model_version" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "bangladesh_context" "jsonb",
    "bangladesh_division" character varying(50),
    "detected_language" character varying(10),
    "is_bangladesh_context" boolean DEFAULT false,
    CONSTRAINT "ai_resolution_pipelines_confidence_level_check" CHECK ((("confidence_level")::"text" = ANY ((ARRAY['automated'::character varying, 'human_review'::character varying, 'escalation'::character varying])::"text"[]))),
    CONSTRAINT "ai_resolution_pipelines_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['running'::character varying, 'completed'::character varying, 'failed'::character varying, 'escalated'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_resolution_pipelines" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_resolution_pipelines" IS 'AI analysis pipeline results for event resolution';



CREATE TABLE IF NOT EXISTS "public"."ai_topic_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "context_type" character varying(50) DEFAULT 'bangladesh'::character varying NOT NULL,
    "news_sources" "jsonb" DEFAULT '[]'::"jsonb",
    "search_keywords" "text"[],
    "prompt_template" "text" DEFAULT 'You are a professional prediction market analyst for {context}.

Task: Create {count} binary outcome prediction market questions (Yes/No) based on current trending topics.

Requirements:
1. Questions must be verifiable after the suggested end date
2. Focus on: {focus_areas}
3. Categories to include: {categories}
4. Use these sources for context: {sources}

Validation Rules:
- Must have clear Yes/No outcome
- Must be verifiable by a specific date
- Should be relevant to {context}
- Avoid subjective/opinion-based questions

Return JSON format:
[
  {
    "title": "Will [event] happen by [date]?",
    "category": "Sports|Politics|Crypto|Tech|Entertainment",
    "description": "Detailed context...",
    "suggested_end_date": "YYYY-MM-DD",
    "source_keywords": ["keyword1", "keyword2"],
    "confidence_reasoning": "Why this is a good prediction market"
  }
]'::"text" NOT NULL,
    "ai_model" character varying(50) DEFAULT 'gemini-1.5-flash'::character varying,
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 2048,
    "topics_per_generation" integer DEFAULT 5,
    "focus_areas" "text"[],
    "is_active" boolean DEFAULT true,
    "generation_schedule" character varying(20) DEFAULT '0 6 * * *'::character varying,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_generated_at" timestamp with time zone,
    "generation_count" integer DEFAULT 0,
    CONSTRAINT "ai_topic_configs_context_type_check" CHECK ((("context_type")::"text" = ANY ((ARRAY['bangladesh'::character varying, 'international'::character varying, 'sports'::character varying, 'custom'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_topic_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_topic_generation_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_id" "uuid",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "sources_used" "jsonb",
    "keywords_used" "text"[],
    "prompt_sent" "text",
    "raw_response" "text",
    "topics_generated" "jsonb",
    "topics_count" integer DEFAULT 0,
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "execution_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_topic_generation_jobs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."ai_topic_generation_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_key" "text",
    "usage_date" "date" DEFAULT CURRENT_DATE,
    "tokens_used" integer DEFAULT 0,
    "calls_count" integer DEFAULT 0,
    "estimated_cost" numeric DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_snapshots_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "total_volume" numeric(36,18) DEFAULT 0,
    "trade_count" integer DEFAULT 0,
    "active_traders_daily" integer DEFAULT 0,
    "new_users_count" integer DEFAULT 0,
    "total_users_count" integer DEFAULT 0,
    "churned_users_estimate" integer DEFAULT 0,
    "retention_rate_d30" numeric(5,4) DEFAULT 0,
    "gross_revenue" numeric(36,18) DEFAULT 0,
    "net_revenue" numeric(36,18) DEFAULT 0,
    "burn_rate_estimate" numeric(36,18) DEFAULT 0,
    "runway_days_estimate" integer DEFAULT 0,
    "avg_risk_score" integer DEFAULT 0,
    "high_risk_users_count" integer DEFAULT 0,
    "system_leverage_ratio" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_snapshots_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_snapshots_hourly" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_start" timestamp with time zone NOT NULL,
    "total_volume" numeric(36,18) DEFAULT 0,
    "trade_count" integer DEFAULT 0,
    "active_traders_count" integer DEFAULT 0,
    "open_interest" numeric(36,18) DEFAULT 0,
    "velocity" numeric(20,4) DEFAULT 0,
    "gross_revenue" numeric(36,18) DEFAULT 0,
    "net_revenue" numeric(36,18) DEFAULT 0,
    "user_rewards_paid" numeric(36,18) DEFAULT 0,
    "new_users_count" integer DEFAULT 0,
    "active_users_session_count" integer DEFAULT 0,
    "avg_spread_bps" numeric(10,4) DEFAULT 0,
    "fill_rate_percent" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_snapshots_hourly" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid",
    "actor_name" "text",
    "action" character varying(100) NOT NULL,
    "entity_type" character varying(50),
    "entity_id" "uuid",
    "previous_state" "jsonb",
    "new_state" "jsonb",
    "description" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "audit_type" "text",
    "status" "text",
    "reserve_ratio" numeric,
    "variance" numeric,
    "details" "jsonb"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" character varying(50) NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "icon_url" "text",
    "condition_type" character varying(50),
    "condition_value" numeric(12,2),
    "rarity" character varying(20) DEFAULT 'COMMON'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."balance_holds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "reason" character varying(50) NOT NULL,
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "released_at" timestamp with time zone,
    "released_by" "uuid",
    "released_reason" "text",
    CONSTRAINT "balance_holds_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."balance_holds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bd_cricket_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_type" character varying(50) NOT NULL,
    "opponent" character varying(100) NOT NULL,
    "match_date" "date" NOT NULL,
    "venue" character varying(200),
    "is_home" boolean DEFAULT true,
    "bangladesh_result" character varying(20),
    "player_of_match" character varying(100),
    "key_players" "text"[],
    "market_relevance" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bd_cricket_events_bangladesh_result_check" CHECK ((("bangladesh_result")::"text" = ANY ((ARRAY['win'::character varying, 'loss'::character varying, 'draw'::character varying, 'tie'::character varying, 'upcoming'::character varying])::"text"[]))),
    CONSTRAINT "bd_cricket_events_match_type_check" CHECK ((("match_type")::"text" = ANY ((ARRAY['test'::character varying, 'odi'::character varying, 't20'::character varying, 't20i'::character varying])::"text"[])))
);


ALTER TABLE "public"."bd_cricket_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."bd_cricket_events" IS 'Bangladesh cricket match history for sports markets';



CREATE TABLE IF NOT EXISTS "public"."bd_divisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "name_bn" character varying(100),
    "headquarters" character varying(100),
    "population_2021" bigint,
    "area_sq_km" numeric(10,2),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."bd_divisions" OWNER TO "postgres";


COMMENT ON TABLE "public"."bd_divisions" IS 'Bangladesh administrative divisions for geographic context';



CREATE TABLE IF NOT EXISTS "public"."bd_economic_indicators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "indicator_name" character varying(100) NOT NULL,
    "indicator_date" "date" NOT NULL,
    "value" numeric(18,4) NOT NULL,
    "unit" character varying(50),
    "previous_value" numeric(18,4),
    "change_percent" numeric(8,4),
    "source" character varying(200),
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bd_economic_indicators" OWNER TO "postgres";


COMMENT ON TABLE "public"."bd_economic_indicators" IS 'Bangladesh economic data for financial markets';



CREATE TABLE IF NOT EXISTS "public"."bd_news_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "domain" character varying(200) NOT NULL,
    "source_type" character varying(50) NOT NULL,
    "category" character varying(50) NOT NULL,
    "authority_score" numeric(3,2) NOT NULL,
    "is_government" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "contact_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bd_news_sources_authority_score_check" CHECK ((("authority_score" >= (0)::numeric) AND ("authority_score" <= (1)::numeric))),
    CONSTRAINT "bd_news_sources_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['general'::character varying, 'business'::character varying, 'sports'::character varying, 'politics'::character varying])::"text"[]))),
    CONSTRAINT "bd_news_sources_source_type_check" CHECK ((("source_type")::"text" = ANY ((ARRAY['english'::character varying, 'bengali'::character varying, 'online_portal'::character varying])::"text"[])))
);


ALTER TABLE "public"."bd_news_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."bd_news_sources" IS 'Registry of Bangladesh news sources with authority scores for AI Oracle';



CREATE TABLE IF NOT EXISTS "public"."bd_political_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "event_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "parties_involved" "text"[],
    "locations" "text"[],
    "outcome_summary" "text",
    "market_impact_score" integer,
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bd_political_events_event_type_check" CHECK ((("event_type")::"text" = ANY ((ARRAY['election'::character varying, 'protest'::character varying, 'policy_change'::character varying, 'cabinet_reshuffle'::character varying, 'international_visit'::character varying])::"text"[]))),
    CONSTRAINT "bd_political_events_market_impact_score_check" CHECK ((("market_impact_score" >= 1) AND ("market_impact_score" <= 10)))
);


ALTER TABLE "public"."bd_political_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."bd_political_events" IS 'Historical political events in Bangladesh for pattern recognition';



CREATE TABLE IF NOT EXISTS "public"."burn_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "market_id" "uuid",
    "burned_amount" numeric DEFAULT 0 NOT NULL,
    "burn_rate" numeric DEFAULT 0.01 NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "tx_hash" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."burn_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."category_settings" (
    "category" character varying(100) NOT NULL,
    "trading_status" character varying(20) DEFAULT 'active'::character varying,
    "pause_reason" "text",
    "paused_at" timestamp with time zone,
    "paused_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "category_settings_trading_status_check" CHECK ((("trading_status")::"text" = ANY ((ARRAY['active'::character varying, 'paused'::character varying])::"text"[])))
);


ALTER TABLE "public"."category_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "type" "public"."attachment_type" NOT NULL,
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "title" "text",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "public"."flag_reason" NOT NULL,
    "details" "text",
    "is_resolved" boolean DEFAULT false,
    "resolved_by" "uuid",
    "resolution" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."comment_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "user_id" "uuid" NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


COMMENT ON TABLE "public"."comment_likes" IS 'Likes on market comments for engagement tracking';



CREATE OR REPLACE VIEW "public"."comment_like_counts" AS
 SELECT "comment_id",
    "count"(*) AS "like_count"
   FROM "public"."comment_likes"
  GROUP BY "comment_id";


ALTER VIEW "public"."comment_like_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_moderation_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "toxicity_score" numeric DEFAULT 0,
    "spam_score" numeric DEFAULT 0,
    "sentiment_mismatch" boolean DEFAULT false,
    "flagged_categories" "text"[] DEFAULT '{}'::"text"[],
    "ai_confidence" numeric DEFAULT 0,
    "ai_reasoning" "text",
    "status" "public"."moderation_status" DEFAULT 'pending_review'::"public"."moderation_status",
    "reviewed_by" "uuid",
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone
);


ALTER TABLE "public"."comment_moderation_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote_type" "public"."vote_type" NOT NULL,
    "user_reputation_at_vote" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    CONSTRAINT "comments_content_check" CHECK ((("length"("content") >= 10) AND ("length"("content") <= 2000)))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."comments" IS 'User comments for events/markets with threading and rate limiting';



CREATE TABLE IF NOT EXISTS "public"."copy_trading_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "is_active" boolean DEFAULT false,
    "allocation_type" character varying(20) DEFAULT 'PERCENTAGE'::character varying,
    "allocation_amount" numeric(12,2) DEFAULT 10,
    "max_position_size" numeric(12,2) DEFAULT 1000,
    "stop_loss_percent" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."copy_trading_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon" "text" DEFAULT '📌'::"text",
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 999,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deposit_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "method" character varying(10),
    "selected_seller_id" character varying(100),
    "affiliate_used" boolean DEFAULT false,
    "status" character varying(20) DEFAULT 'initiated'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deposit_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deposit_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "usdt_amount" numeric,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "payment_method" character varying(50) DEFAULT 'usdt_p2p'::character varying,
    "sender_number" character varying(20),
    "sender_name" character varying(100),
    "txn_id" character varying(100),
    "bdt_amount" numeric,
    "exchange_rate" numeric,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "deposit_requests_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying, 'rocket'::character varying, 'usdt_p2p'::character varying, 'agent'::character varying])::"text"[])))
);


ALTER TABLE "public"."deposit_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispute_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "resolution_system_id" "uuid",
    "disputed_by" "uuid" NOT NULL,
    "dispute_type" character varying(50),
    "dispute_reason" "text" NOT NULL,
    "evidence_urls" "text"[],
    "evidence_files" "text"[],
    "bond_amount" numeric(10,2) NOT NULL,
    "bond_locked_at" timestamp with time zone DEFAULT "now"(),
    "bond_status" character varying(20) DEFAULT 'locked'::character varying,
    "assigned_judge" "uuid",
    "judge_notes" "text",
    "ruling" character varying(50),
    "ruling_reason" "text",
    "ruling_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "community_votes_yes" integer DEFAULT 0,
    "community_votes_no" integer DEFAULT 0,
    "voting_ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."dispute_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispute_id" character varying(100) NOT NULL,
    "market_id" "uuid" NOT NULL,
    "pipeline_id" character varying(100),
    "level" character varying(20) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "challenger_id" "uuid" NOT NULL,
    "proposer_id" "uuid",
    "bond_amount" numeric(18,2) NOT NULL,
    "bond_currency" character varying(10) DEFAULT 'BDT'::character varying,
    "bond_locked_at" timestamp with time zone NOT NULL,
    "bond_released_at" timestamp with time zone,
    "challenge_reason" "text" NOT NULL,
    "evidence_urls" "text"[],
    "expected_outcome" character varying(50) NOT NULL,
    "resolution_method" character varying(50),
    "resolution_outcome" character varying(20),
    "final_outcome" character varying(50),
    "resolution_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deadline_at" timestamp with time zone NOT NULL,
    "resolved_at" timestamp with time zone,
    "reward_distributed" boolean DEFAULT false,
    "challenger_reward" numeric(18,2),
    "treasury_fee" numeric(18,2),
    "parent_dispute_id" "uuid",
    "child_dispute_id" "uuid",
    CONSTRAINT "disputes_level_check" CHECK ((("level")::"text" = ANY ((ARRAY['initial'::character varying, 'appeal'::character varying, 'final'::character varying])::"text"[]))),
    CONSTRAINT "disputes_resolution_outcome_check" CHECK ((("resolution_outcome")::"text" = ANY ((ARRAY['upheld'::character varying, 'overturned'::character varying, 'split'::character varying, 'timeout'::character varying])::"text"[]))),
    CONSTRAINT "disputes_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'resolved'::character varying, 'rejected'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


COMMENT ON TABLE "public"."disputes" IS 'Escalating bond dispute mechanism with 3 levels';



CREATE OR REPLACE VIEW "public"."dispute_statistics" AS
 SELECT "count"(*) AS "total_disputes",
    "count"(*) FILTER (WHERE (("level")::"text" = 'initial'::"text")) AS "initial_disputes",
    "count"(*) FILTER (WHERE (("level")::"text" = 'appeal'::"text")) AS "appeal_disputes",
    "count"(*) FILTER (WHERE (("level")::"text" = 'final'::"text")) AS "final_disputes",
    "count"(*) FILTER (WHERE (("status")::"text" = 'resolved'::"text")) AS "resolved_disputes",
    "count"(*) FILTER (WHERE (("resolution_outcome")::"text" = 'overturned'::"text")) AS "successful_challenges",
    COALESCE("avg"(
        CASE
            WHEN (("resolution_outcome")::"text" = 'overturned'::"text") THEN 1.0
            ELSE 0.0
        END), (0)::numeric) AS "success_rate",
    COALESCE("sum"("bond_amount"), (0)::numeric) AS "total_bonds_locked",
    COALESCE("sum"("challenger_reward"), (0)::numeric) AS "total_rewards_distributed",
    COALESCE("sum"("treasury_fee"), (0)::numeric) AS "total_treasury_fees"
   FROM "public"."disputes";


ALTER VIEW "public"."dispute_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" DEFAULT 'New Event'::"text" NOT NULL,
    "slug" "text" NOT NULL,
    "question" "text" NOT NULL,
    "description" "text",
    "ticker" character varying(20),
    "category" character varying(100) DEFAULT 'general'::character varying NOT NULL,
    "subcategory" character varying(100),
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "image_url" "text",
    "thumbnail_url" "text",
    "banner_url" "text",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "is_featured" boolean DEFAULT false,
    "is_trending" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "answer1" character varying(200) DEFAULT 'হ্যাঁ (Yes)'::character varying,
    "answer2" character varying(200) DEFAULT 'না (No)'::character varying,
    "answer_type" character varying(20) DEFAULT 'binary'::character varying,
    "starts_at" timestamp with time zone DEFAULT "now"(),
    "ends_at" timestamp with time zone,
    "trading_opens_at" timestamp with time zone DEFAULT "now"(),
    "trading_closes_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "resolution_source" "text",
    "resolution_method" character varying(50) DEFAULT 'manual_admin'::character varying,
    "resolution_delay_hours" integer DEFAULT 24,
    "resolved_outcome" integer,
    "resolved_by" "uuid",
    "winning_token" character varying(100),
    "initial_liquidity" numeric DEFAULT 1000,
    "current_liquidity" numeric DEFAULT 1000,
    "total_volume" numeric DEFAULT 0,
    "total_trades" integer DEFAULT 0,
    "unique_traders" integer DEFAULT 0,
    "current_yes_price" numeric(5,4) DEFAULT 0.5000,
    "current_no_price" numeric(5,4) DEFAULT 0.5000,
    "price_24h_change" numeric(5,4) DEFAULT 0.0000,
    "condition_id" character varying(100),
    "token1" character varying(100),
    "token2" character varying(100),
    "neg_risk" boolean DEFAULT false,
    "pause_reason" "text",
    "paused_at" timestamp with time zone,
    "paused_by" "uuid",
    "estimated_resume_at" timestamp with time zone,
    "ai_keywords" "text"[] DEFAULT '{}'::"text"[],
    "ai_sources" "text"[] DEFAULT '{}'::"text"[],
    "ai_confidence_threshold" integer DEFAULT 85,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "search_vector" "tsvector",
    "market_id" "uuid",
    "name" "text",
    "name_en" "text",
    "event_date" timestamp with time zone DEFAULT "now"(),
    "resolution_outcome" character varying(20),
    "resolution_delay" integer DEFAULT 1440 NOT NULL,
    "trading_volume_24h" numeric DEFAULT 0,
    "price_change_24h" numeric(5,4) DEFAULT 0.0000,
    "liquidity_score" numeric DEFAULT 0,
    "trending_score" numeric DEFAULT 0,
    "featured_until" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "current_stage" character varying(100) DEFAULT 'created'::character varying,
    "creator_id" "uuid",
    "category_id" "uuid",
    "resolves_at" timestamp with time zone,
    "resolution_value" "text",
    CONSTRAINT "chk_events_resolution_delay" CHECK ((("resolution_delay" >= 0) AND ("resolution_delay" <= 20160))),
    CONSTRAINT "events_ai_confidence_threshold_check" CHECK ((("ai_confidence_threshold" >= 50) AND ("ai_confidence_threshold" <= 99))),
    CONSTRAINT "events_answer_type_check" CHECK ((("answer_type")::"text" = ANY ((ARRAY['binary'::character varying, 'multiple'::character varying, 'scalar'::character varying])::"text"[]))),
    CONSTRAINT "events_current_liquidity_check" CHECK (("current_liquidity" >= (0)::numeric)),
    CONSTRAINT "events_initial_liquidity_check" CHECK (("initial_liquidity" >= (0)::numeric)),
    CONSTRAINT "events_resolution_delay_hours_check" CHECK ((("resolution_delay_hours" >= 0) AND ("resolution_delay_hours" <= 720))),
    CONSTRAINT "events_resolution_method_check" CHECK ((("resolution_method")::"text" = ANY ((ARRAY['manual_admin'::character varying, 'ai_oracle'::character varying, 'expert_panel'::character varying, 'external_api'::character varying, 'consensus'::character varying, 'community_vote'::character varying, 'hybrid'::character varying])::"text"[]))),
    CONSTRAINT "events_resolved_outcome_check" CHECK (("resolved_outcome" = ANY (ARRAY[1, 2]))),
    CONSTRAINT "events_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'active'::character varying, 'paused'::character varying, 'closed'::character varying, 'resolved'::character varying, 'cancelled'::character varying, 'published'::character varying])::"text"[]))),
    CONSTRAINT "events_total_trades_check" CHECK (("total_trades" >= 0)),
    CONSTRAINT "events_total_volume_check" CHECK (("total_volume" >= (0)::numeric)),
    CONSTRAINT "events_unique_traders_check" CHECK (("unique_traders" >= 0)),
    CONSTRAINT "valid_event_resolution_method" CHECK ((("resolution_method")::"text" = ANY ((ARRAY['manual_admin'::character varying, 'ai_oracle'::character varying, 'expert_panel'::character varying, 'external_api'::character varying, 'consensus'::character varying, 'community_vote'::character varying, 'hybrid'::character varying])::"text"[])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Core events table for prediction markets';



COMMENT ON COLUMN "public"."events"."title" IS 'Display title for the event (normalized from question)';



COMMENT ON COLUMN "public"."events"."question" IS 'The prediction question (kept for backward compatibility)';



COMMENT ON COLUMN "public"."events"."resolution_method" IS 'Resolution method: manual_admin, ai_oracle, expert_panel, external_api, community_vote, hybrid';



CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bdt_to_usdt" numeric(10,4) NOT NULL,
    "usdt_to_bdt" numeric(10,4) NOT NULL,
    "effective_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "effective_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" character varying(50),
    "rate" numeric(18,2),
    "previous_rate" numeric,
    "change_percentage" numeric
);


ALTER TABLE "public"."exchange_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assignment_reason" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "expert_assignments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'completed'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."expert_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."expert_assignments" IS 'Expert assignments to specific events';



CREATE TABLE IF NOT EXISTS "public"."expert_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "short_description" "text",
    "icon_url" "text",
    "icon_color" "text",
    "category" "public"."badge_category" NOT NULL,
    "rarity" "public"."badge_rarity" DEFAULT 'common'::"public"."badge_rarity",
    "min_accuracy" integer,
    "min_predictions" integer,
    "min_streak" integer,
    "min_reputation_score" integer DEFAULT 0,
    "verification_required" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expert_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expert_panel" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expert_name" character varying(100) NOT NULL,
    "credentials" "text",
    "specializations" character varying(50)[] NOT NULL,
    "bio" "text",
    "is_verified" boolean DEFAULT false,
    "verification_documents" "text"[],
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "total_votes" integer DEFAULT 0,
    "correct_votes" integer DEFAULT 0,
    "incorrect_votes" integer DEFAULT 0,
    "accuracy_rate" numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN ("total_votes" > 0) THEN ((("correct_votes")::numeric / ("total_votes")::numeric) * (100)::numeric)
    ELSE (0)::numeric
END) STORED,
    "expert_rating" numeric(3,2) DEFAULT 0.00,
    "reputation_score" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "availability_status" character varying(20) DEFAULT 'available'::character varying,
    "email" character varying(255),
    "phone" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_vote_at" timestamp with time zone
);


ALTER TABLE "public"."expert_panel" OWNER TO "postgres";


COMMENT ON TABLE "public"."expert_panel" IS 'Expert panel members with reputation tracking';



CREATE TABLE IF NOT EXISTS "public"."expert_panel_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" character varying(200) NOT NULL,
    "expertise" "text"[],
    "credibility_score" numeric(4,3) DEFAULT 0.80,
    "total_reviews" integer DEFAULT 0,
    "accuracy_rate" numeric(5,4) DEFAULT 0.80,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "expert_panel_members_accuracy_rate_check" CHECK ((("accuracy_rate" >= (0)::numeric) AND ("accuracy_rate" <= (1)::numeric))),
    CONSTRAINT "expert_panel_members_credibility_score_check" CHECK ((("credibility_score" >= (0)::numeric) AND ("credibility_score" <= (1)::numeric)))
);


ALTER TABLE "public"."expert_panel_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."expert_panel_members" IS 'Bangladesh domain experts for appeal-level disputes';



CREATE TABLE IF NOT EXISTS "public"."expert_panel_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dispute_id" "uuid" NOT NULL,
    "panel_members" "uuid"[] NOT NULL,
    "votes" "jsonb" DEFAULT '[]'::"jsonb",
    "consensus_outcome" character varying(50),
    "consensus_confidence" numeric(5,4),
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."expert_panel_reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."expert_panel_reviews" IS 'Expert panel voting records';



CREATE TABLE IF NOT EXISTS "public"."expert_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "vote_outcome" integer NOT NULL,
    "confidence_level" numeric(5,2),
    "reasoning" "text" NOT NULL,
    "ai_relevance_score" numeric(3,2),
    "ai_verification_status" character varying(20) DEFAULT 'pending'::character varying,
    "ai_feedback" "text",
    "is_correct" boolean,
    "points_earned" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "verified_at" timestamp with time zone,
    CONSTRAINT "expert_votes_ai_verification_status_check" CHECK ((("ai_verification_status")::"text" = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying, 'flagged'::character varying])::"text"[]))),
    CONSTRAINT "expert_votes_confidence_level_check" CHECK ((("confidence_level" >= (0)::numeric) AND ("confidence_level" <= (100)::numeric))),
    CONSTRAINT "expert_votes_vote_outcome_check" CHECK (("vote_outcome" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."expert_votes" OWNER TO "postgres";


COMMENT ON TABLE "public"."expert_votes" IS 'Individual votes cast by experts with AI verification';



CREATE TABLE IF NOT EXISTS "public"."feed_preferences" (
    "user_id" "uuid" NOT NULL,
    "market_movements_weight" integer DEFAULT 90,
    "trader_activity_weight" integer DEFAULT 60,
    "system_notifications_weight" integer DEFAULT 100,
    "social_interactions_weight" integer DEFAULT 50,
    "trending_markets_weight" integer DEFAULT 30,
    "muted_keywords" "text"[] DEFAULT '{}'::"text"[],
    "muted_users" "uuid"[] DEFAULT '{}'::"uuid"[],
    "muted_markets" "uuid"[] DEFAULT '{}'::"uuid"[],
    "notifications_paused" boolean DEFAULT false,
    "notifications_pause_until" timestamp with time zone,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "compact_mode" boolean DEFAULT false,
    "auto_expand_threads" boolean DEFAULT false,
    "default_thread_depth" integer DEFAULT 3,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feed_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fill_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "quantity" numeric(36,18) NOT NULL,
    "price" numeric(36,18) NOT NULL,
    "total_value" numeric(36,18) NOT NULL,
    "counterparty_order_id" "uuid",
    "counterparty_user_id" "uuid",
    "trade_id" "uuid",
    "fill_number" integer NOT NULL,
    "is_maker" boolean DEFAULT false,
    "transaction_hash" character varying(128),
    "blockchain_reference" character varying(256),
    "filled_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fill_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follow_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    CONSTRAINT "follow_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[]))),
    CONSTRAINT "no_self_request" CHECK (("requester_id" <> "target_id"))
);


ALTER TABLE "public"."follow_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."global_sequence" (
    "id" integer DEFAULT 1 NOT NULL,
    "last_sequence" bigint DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "global_sequence_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."global_sequence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."human_review_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pipeline_id" character varying(100) NOT NULL,
    "market_id" "uuid" NOT NULL,
    "market_question" "text" NOT NULL,
    "ai_outcome" character varying(50) NOT NULL,
    "ai_confidence" numeric(5,4) NOT NULL,
    "ai_explanation" "text",
    "evidence_summary" "jsonb",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "assigned_to" "uuid",
    "assigned_at" timestamp with time zone,
    "reviewer_decision" character varying(20),
    "final_outcome" character varying(50),
    "reviewer_notes" "text",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deadline_at" timestamp with time zone NOT NULL,
    CONSTRAINT "human_review_queue_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::"text"[]))),
    CONSTRAINT "human_review_queue_reviewer_decision_check" CHECK ((("reviewer_decision")::"text" = ANY ((ARRAY['accept'::character varying, 'modify'::character varying, 'escalate'::character varying])::"text"[]))),
    CONSTRAINT "human_review_queue_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'assigned'::character varying, 'completed'::character varying, 'escalated'::character varying])::"text"[])))
);


ALTER TABLE "public"."human_review_queue" OWNER TO "postgres";


COMMENT ON TABLE "public"."human_review_queue" IS 'Queue for human oversight of AI resolutions';



CREATE TABLE IF NOT EXISTS "public"."idempotency_keys" (
    "key" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."idempotency_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kyc_admin_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "override_type" character varying(20),
    "admin_id" "uuid",
    "reason" "text",
    "is_active" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid"
);


ALTER TABLE "public"."kyc_admin_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kyc_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_front_url" "text" NOT NULL,
    "document_back_url" "text",
    "selfie_url" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "rejection_reason" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "kyc_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['NID'::"text", 'Passport'::"text", 'Driving License'::"text"]))),
    CONSTRAINT "kyc_documents_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."kyc_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kyc_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "withdrawal_threshold" numeric(20,2) DEFAULT 5000.00,
    "required_documents" "jsonb" DEFAULT '["id_front", "selfie"]'::"jsonb",
    "auto_approve_enabled" boolean DEFAULT false,
    "auto_approve_max_risk_score" integer DEFAULT 30,
    "kyc_globally_required" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    CONSTRAINT "kyc_settings_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."kyc_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kyc_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "submitted_data" "jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."kyc_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboard" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "username" "text",
    "score" numeric DEFAULT 0 NOT NULL,
    "total_pnl" numeric DEFAULT 0 NOT NULL,
    "win_count" integer DEFAULT 0 NOT NULL,
    "loss_count" integer DEFAULT 0 NOT NULL,
    "trade_count" integer DEFAULT 0 NOT NULL,
    "win_rate" numeric GENERATED ALWAYS AS (
CASE
    WHEN (("win_count" + "loss_count") > 0) THEN "round"(((("win_count")::numeric / (("win_count" + "loss_count"))::numeric) * (100)::numeric), 2)
    ELSE (0)::numeric
END) STORED,
    "best_trade" numeric DEFAULT 0 NOT NULL,
    "worst_trade" numeric DEFAULT 0 NOT NULL,
    "streak" integer DEFAULT 0 NOT NULL,
    "rank_tier" "text" DEFAULT 'bronze'::"text" NOT NULL,
    "badge_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "season" "text" DEFAULT '2026-Q1'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."leaderboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboard_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "timeframe" character varying(20) NOT NULL,
    "trading_volume" bigint DEFAULT 0,
    "realized_pnl" bigint DEFAULT 0,
    "unrealized_pnl" bigint DEFAULT 0,
    "score" bigint DEFAULT 0,
    "period_start" "date" DEFAULT CURRENT_DATE NOT NULL,
    "period_end" "date" DEFAULT (CURRENT_DATE + '7 days'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "roi" numeric(10,2) DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "risk_score" numeric(5,2) DEFAULT 0
);


ALTER TABLE "public"."leaderboard_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "full_name" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false,
    "kyc_verified" boolean DEFAULT false,
    "privacy_tier" character varying(20) DEFAULT 'public'::character varying,
    "follower_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "max_followers" integer DEFAULT 1000,
    "wallet_address" "text",
    "display_name" "text",
    "avatar_url" "text",
    "kyc_status" "public"."kyc_status" DEFAULT 'not_started'::"public"."kyc_status" NOT NULL,
    "kyc_verified_at" timestamp with time zone,
    CONSTRAINT "users_privacy_tier_check" CHECK ((("privacy_tier")::"text" = ANY ((ARRAY['public'::character varying, 'approved'::character varying, 'private'::character varying, 'anonymous'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'leaderboard_mv' AND n.nspname = 'public' AND c.relkind = 'm'
    ) THEN
        CREATE MATERIALIZED VIEW "public"."leaderboard_mv" AS
         SELECT "l"."user_id",
            COALESCE("l"."username", "u"."display_name", "u"."email") AS "username",
            "l"."total_pnl" AS "pnl",
            "l"."score",
            "l"."win_count",
            "l"."loss_count",
            "l"."trade_count",
            "l"."win_rate",
            "l"."rank_tier",
            "l"."streak",
            "row_number"() OVER (ORDER BY "l"."score" DESC) AS "rank"
           FROM ("public"."leaderboard" "l"
             JOIN "public"."users" "u" ON (("u"."id" = "l"."user_id")))
          WITH NO DATA;

        ALTER MATERIALIZED VIEW "public"."leaderboard_mv" OWNER TO "postgres";
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS "public"."leagues" (
    "id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "tier_order" integer NOT NULL,
    "min_rank_percentile" integer,
    "icon_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leagues" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."leagues_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."leagues_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."leagues_id_seq" OWNED BY "public"."leagues"."id";



CREATE TABLE IF NOT EXISTS "public"."legal_review_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "draft_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "priority" character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_at" timestamp with time zone,
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."legal_review_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maker_rebates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year_month" character varying(7) NOT NULL,
    "rebate_period_start" timestamp with time zone NOT NULL,
    "rebate_period_end" timestamp with time zone NOT NULL,
    "total_maker_volume" numeric(20,2) DEFAULT 0,
    "qualifying_volume" numeric(20,2) DEFAULT 0,
    "base_rebate_rate" numeric(8,4) DEFAULT 0.0002,
    "spread_multiplier" numeric(4,2) DEFAULT 1.0,
    "final_rebate_rate" numeric(8,4) DEFAULT 0.0002,
    "gross_rebate_amount" numeric(20,2) DEFAULT 0,
    "adjustment_factor" numeric(4,2) DEFAULT 1.0,
    "net_rebate_amount" numeric(20,2) DEFAULT 0,
    "claim_status" character varying(20) DEFAULT 'pending'::character varying,
    "claimed_at" timestamp with time zone,
    "claimed_by_user_id" "uuid",
    "payment_method" character varying(10),
    "payment_tx_hash" character varying(100),
    "payment_completed_at" timestamp with time zone,
    "tier_at_calculation" integer DEFAULT 1,
    "tier_benefits" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "maker_rebates_claim_status_check" CHECK ((("claim_status")::"text" = ANY ((ARRAY['pending'::character varying, 'claimed'::character varying, 'processing'::character varying, 'paid'::character varying, 'expired'::character varying])::"text"[]))),
    CONSTRAINT "maker_rebates_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['USDC'::character varying, 'PLATFORM'::character varying])::"text"[])))
);


ALTER TABLE "public"."maker_rebates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maker_volume_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "year_month" character varying(7) NOT NULL,
    "maker_volume" numeric(20,2) DEFAULT 0,
    "taker_volume" numeric(20,2) DEFAULT 0,
    "total_spread_contribution" numeric(20,4) DEFAULT 0,
    "resting_time_seconds" integer DEFAULT 0,
    "qualifying_volume" numeric(20,2) DEFAULT 0,
    "rebate_tier" integer DEFAULT 1,
    "rebate_rate" numeric(8,4) DEFAULT 0.0002,
    "estimated_rebate" numeric(20,2) DEFAULT 0,
    "claimed_rebate" numeric(20,2) DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."maker_volume_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manual_deposits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "method" character varying(10),
    "amount_bdt" numeric(10,2),
    "agent_wallet_id" "uuid",
    "user_phone_number" character varying(15),
    "transaction_id" character varying(100),
    "screenshot_url" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "usdt_sent_to_user" numeric(18,6),
    "usdt_rate_used" numeric(18,6),
    "agent_notes" "text",
    "processing_started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "expiry_warning_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manual_deposits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid",
    "user_id" "uuid",
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "likes_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    "depth_level" integer DEFAULT 0,
    "content_html" "text",
    "sentiment_score" numeric DEFAULT 0,
    "is_collapsed" boolean DEFAULT false,
    "upvotes" integer DEFAULT 0,
    "downvotes" integer DEFAULT 0,
    "score" numeric DEFAULT 0,
    "sentiment" "text" DEFAULT 'neutral'::"text",
    "is_flagged" boolean DEFAULT false,
    "flag_count" integer DEFAULT 0,
    "edited_at" timestamp with time zone,
    "like_count" integer DEFAULT 0,
    CONSTRAINT "market_comments_content_check" CHECK (("length"("content") > 0)),
    CONSTRAINT "market_comments_depth_level_check" CHECK ((("depth_level" >= 0) AND ("depth_level" <= 10)))
);


ALTER TABLE "public"."market_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_creation_drafts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "current_stage" character varying(50) DEFAULT 'template_selection'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    "stages_completed" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "market_type" character varying(50),
    "template_id" character varying(100),
    "question" "text",
    "description" "text",
    "category" character varying(100),
    "subcategory" character varying(100),
    "tags" "text"[],
    "min_value" numeric(20,8),
    "max_value" numeric(20,8),
    "unit" character varying(50),
    "outcomes" "jsonb",
    "resolution_source" character varying(255),
    "resolution_source_url" "text",
    "resolution_criteria" "text",
    "resolution_deadline" timestamp with time zone,
    "oracle_type" character varying(50),
    "oracle_config" "jsonb",
    "liquidity_commitment" numeric(20,8) DEFAULT 0 NOT NULL,
    "liquidity_currency" character varying(10) DEFAULT 'USDC'::character varying NOT NULL,
    "liquidity_deposited" boolean DEFAULT false NOT NULL,
    "liquidity_tx_hash" character varying(100),
    "sensitive_topics" "text"[],
    "regulatory_risk_level" character varying(20),
    "legal_review_status" character varying(50),
    "legal_review_notes" "text",
    "legal_reviewer_id" "uuid",
    "legal_reviewed_at" timestamp with time zone,
    "requires_senior_counsel" boolean DEFAULT false NOT NULL,
    "simulation_config" "jsonb",
    "simulation_results" "jsonb",
    "deployment_config" "jsonb",
    "deployment_tx_hash" character varying(100),
    "deployed_market_id" "uuid",
    "deployed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "submitted_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "version" integer DEFAULT 1 NOT NULL,
    "previous_version_id" "uuid",
    "admin_bypass_liquidity" boolean DEFAULT false NOT NULL,
    "admin_bypass_legal_review" boolean DEFAULT false NOT NULL,
    "admin_bypass_simulation" boolean DEFAULT false NOT NULL,
    "verification_method" "jsonb" DEFAULT '{"type": "MANUAL", "sources": []}'::"jsonb",
    "required_confirmations" integer DEFAULT 1 NOT NULL,
    "confidence_threshold" numeric(5,2) DEFAULT 80.00,
    "trading_fee_percent" numeric(5,2) DEFAULT 2.00 NOT NULL,
    "image_url" "text",
    "trading_end_type" character varying(20) DEFAULT 'date'::character varying NOT NULL,
    "liquidity_amount" numeric(20,8) DEFAULT 0 NOT NULL,
    "event_id" "uuid",
    CONSTRAINT "chk_required_confirmations" CHECK ((("required_confirmations" >= 1) AND ("required_confirmations" <= 5))),
    CONSTRAINT "chk_trading_end_type" CHECK ((("trading_end_type")::"text" = ANY ((ARRAY['date'::character varying, 'manual'::character varying, 'event_triggered'::character varying])::"text"[]))),
    CONSTRAINT "chk_trading_fee_percent" CHECK ((("trading_fee_percent" >= (0)::numeric) AND ("trading_fee_percent" <= (10)::numeric)))
);


ALTER TABLE "public"."market_creation_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_daily_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "open_price" numeric(10,4),
    "close_price" numeric(10,4),
    "high_price" numeric(10,4),
    "low_price" numeric(10,4),
    "volume" numeric(18,2) DEFAULT 0,
    "trade_count" integer DEFAULT 0,
    "unique_traders" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."market_daily_stats" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_daily_stats" IS 'Daily OHLCV aggregates for market analytics';



CREATE TABLE IF NOT EXISTS "public"."market_followers" (
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "notify_on_trade" boolean DEFAULT false,
    "notify_on_resolve" boolean DEFAULT true,
    "notify_on_price_change" boolean DEFAULT false,
    "price_alert_threshold" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."market_followers" OWNER TO "postgres";


COMMENT ON TABLE "public"."market_followers" IS 'Users following markets with notification preferences';



CREATE TABLE IF NOT EXISTS "public"."market_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notification_preferences" "jsonb" DEFAULT '{"news": true, "resolutions": true, "volume_spikes": true, "price_movements": true}'::"jsonb"
);


ALTER TABLE "public"."market_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."markets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'General'::"text" NOT NULL,
    "source_url" "text",
    "image_url" "text",
    "creator_id" "uuid",
    "status" "public"."market_status" DEFAULT 'active'::"public"."market_status",
    "resolution_source" "text",
    "min_price" numeric(5,4) DEFAULT 0.0001,
    "max_price" numeric(5,4) DEFAULT 0.9999,
    "tick_size" numeric(5,4) DEFAULT 0.01,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "trading_closes_at" timestamp with time zone NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "resolved_at" timestamp with time zone,
    "winning_outcome" "public"."outcome_type",
    "resolution_details" "jsonb" DEFAULT '{}'::"jsonb",
    "total_volume" numeric(12,2) DEFAULT 0,
    "yes_shares_outstanding" bigint DEFAULT 0,
    "no_shares_outstanding" bigint DEFAULT 0,
    "resolution_source_type" character varying(20) DEFAULT 'MANUAL'::character varying,
    "resolution_data" "jsonb",
    "fee_percent" numeric(5,2) DEFAULT 2.0,
    "initial_liquidity" numeric DEFAULT 0,
    "maker_rebate_percent" numeric(5,2) DEFAULT 0.05,
    "market_category" character varying(50) DEFAULT 'binary'::character varying,
    "min_tick" bigint DEFAULT 100,
    "max_tick" bigint DEFAULT 10000,
    "current_tick" bigint DEFAULT 100,
    "realized_volatility_24h" numeric(10,6) DEFAULT 0.02,
    "pending_tick_change" "jsonb" DEFAULT '{}'::"jsonb",
    "event_id" "uuid" NOT NULL,
    "resolution_source_url" "text",
    "subcategory" character varying(50),
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "slug" character varying(100),
    "answer_type" character varying(20) DEFAULT 'binary'::character varying,
    "answer1" character varying(100) DEFAULT 'হ্যাঁ (Yes)'::character varying,
    "answer2" character varying(100) DEFAULT 'না (No)'::character varying,
    "is_featured" boolean DEFAULT false,
    "created_by" "uuid",
    "name" character varying(255),
    "liquidity" numeric DEFAULT 1000,
    "resolution_delay" integer DEFAULT 1440,
    "condition_id" character varying(255),
    "token1" character varying(255),
    "token2" character varying(255),
    "neg_risk" boolean DEFAULT false,
    "resolver_reference" "text",
    "volume" numeric DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "market_type" "public"."market_type_enum" DEFAULT 'binary'::"public"."market_type_enum",
    "min_value" numeric(18,4),
    "max_value" numeric(18,4),
    "scalar_unit" "text",
    "yes_price_change_24h" numeric(10,4) DEFAULT 0,
    "no_price_change_24h" numeric(10,4) DEFAULT 0,
    "unique_traders" integer DEFAULT 0,
    "close_warned" boolean DEFAULT false,
    "yes_price" numeric(10,4) DEFAULT 0.5,
    "no_price" numeric(10,4) DEFAULT 0.5,
    "trading_phase" "public"."trading_phase_type" DEFAULT 'CONTINUOUS'::"public"."trading_phase_type",
    "next_phase_time" timestamp with time zone,
    "auction_data" "jsonb",
    "resolution_delay_hours" integer DEFAULT 24,
    "resolution_method" character varying(50) DEFAULT 'manual_admin'::character varying,
    "volume_24h" numeric DEFAULT 0,
    "best_bid" numeric(5,4),
    "best_ask" numeric(5,4),
    "spread" numeric(5,4),
    "order_count" integer DEFAULT 0,
    "unique_traders_24h" integer DEFAULT 0,
    "last_trade_price" numeric(5,4),
    "last_trade_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "current_stage" character varying(100) DEFAULT 'created'::character varying,
    "deployed_at" timestamp with time zone,
    "oracle_type" character varying(50) DEFAULT 'MANUAL'::character varying,
    "legal_review_status" character varying(50),
    "legal_review_notes" "text",
    "legal_reviewed_at" timestamp with time zone,
    "liquidity_commitment" numeric,
    "liquidity_deposited" boolean DEFAULT false,
    "deployment_config" "jsonb",
    "deployment_tx_hash" character varying(100),
    "resolution_deadline" timestamp with time zone,
    "resolution_criteria" "text",
    "risk_score" integer DEFAULT 0,
    "stages_completed" "text"[] DEFAULT '{}'::"text"[],
    "trading_fee_percent" numeric(5,2) DEFAULT 2.0,
    "confidence" integer DEFAULT 0,
    "trader_count" integer DEFAULT 0,
    "legal_reviewer_id" "uuid",
    "simulation_config" "jsonb",
    "simulation_results" "jsonb",
    "admin_bypass_legal_review" boolean DEFAULT false,
    "admin_bypass_liquidity" boolean DEFAULT false,
    "trading_ends" timestamp with time zone,
    "name_bn" "text",
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "question_bn" "text",
    "creator_address" "text",
    "current_price_yes" numeric DEFAULT 0.5,
    "current_price_no" numeric DEFAULT 0.5,
    CONSTRAINT "markets_max_price_check" CHECK (("max_price" < (1)::numeric)),
    CONSTRAINT "markets_min_price_check" CHECK (("min_price" > (0)::numeric)),
    CONSTRAINT "markets_resolution_source_type_check" CHECK ((("resolution_source_type")::"text" = ANY ((ARRAY['AI'::character varying, 'ADMIN'::character varying, 'API'::character varying, 'UMA'::character varying, 'MANUAL'::character varying])::"text"[]))),
    CONSTRAINT "valid_market_resolution_method" CHECK ((("resolution_method")::"text" = ANY ((ARRAY['manual_admin'::character varying, 'ai_oracle'::character varying, 'expert_panel'::character varying, 'external_api'::character varying, 'consensus'::character varying, 'community_vote'::character varying, 'hybrid'::character varying])::"text"[])))
);


ALTER TABLE "public"."markets" OWNER TO "postgres";


COMMENT ON TABLE "public"."markets" IS 'Markets linked to events';



COMMENT ON COLUMN "public"."markets"."winning_outcome" IS 'The winning outcome after resolution';



COMMENT ON COLUMN "public"."markets"."resolution_source_type" IS 'Oracle strategy: AI, MANUAL, API, UMA, CENTRALIZED';



COMMENT ON COLUMN "public"."markets"."initial_liquidity" IS 'Seed funding in USDT for AMM price curve initialization';



COMMENT ON COLUMN "public"."markets"."condition_id" IS 'Conditional Token Framework identifier for on-chain settlement';



COMMENT ON COLUMN "public"."markets"."token1" IS 'YES outcome token contract address (0x-prefixed)';



COMMENT ON COLUMN "public"."markets"."token2" IS 'NO outcome token contract address (0x-prefixed)';



COMMENT ON COLUMN "public"."markets"."neg_risk" IS 'Negative risk flag: shared collateral pool for correlated markets';



COMMENT ON COLUMN "public"."markets"."resolver_reference" IS 'Oracle/contract address responsible for final resolution';



COMMENT ON COLUMN "public"."markets"."trading_phase" IS 'Current market state: PRE_OPEN, CONTINUOUS, AUCTION, HALTED, CLOSED';



COMMENT ON COLUMN "public"."markets"."next_phase_time" IS 'Scheduled time for the next phase transition';



COMMENT ON COLUMN "public"."markets"."auction_data" IS 'Real-time auction information like indicative clearing price/volume';



COMMENT ON COLUMN "public"."markets"."trading_ends" IS 'Timestamp when trading ends for this market (used by execute-sports, execute-crypto, execute-news workflows)';



COMMENT ON COLUMN "public"."markets"."name_bn" IS 'Bengali name for the market (used by market-close-check workflow)';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "side" "public"."order_side" NOT NULL,
    "type" "public"."order_type" DEFAULT 'limit'::"public"."order_type" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "filled_quantity" numeric DEFAULT 0 NOT NULL,
    "status" "public"."order_status" DEFAULT 'open'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remaining_quantity" numeric DEFAULT 0,
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type",
    "expires_at" timestamp with time zone,
    "average_fill_price" numeric DEFAULT 0,
    "total_cost" numeric DEFAULT 0,
    "fee_amount" numeric DEFAULT 0,
    "fee_rate" numeric DEFAULT 0.02,
    "cancelled_at" timestamp with time zone,
    "filled_at" timestamp with time zone,
    "reject_reason" "text",
    "source" "text" DEFAULT 'web'::"text",
    "is_post_only" boolean DEFAULT false,
    "is_reduce_only" boolean DEFAULT false
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "maker_order_id" "uuid" NOT NULL,
    "taker_order_id" "uuid" NOT NULL,
    "maker_id" "uuid" NOT NULL,
    "taker_id" "uuid" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fee_amount" numeric DEFAULT 0,
    "maker_fee" numeric DEFAULT 0,
    "taker_fee" numeric DEFAULT 0,
    "trade_type" "text" DEFAULT 'limit'::"text",
    "settlement_status" "text" DEFAULT 'pending'::"text",
    "settled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type"
)
PARTITION BY RANGE ("executed_at");


ALTER TABLE "public"."trades" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."market_metrics" AS
 SELECT "m"."id" AS "market_id",
    "m"."event_id",
    "m"."status",
    "m"."question",
    "m"."current_price_yes",
    "m"."current_price_no",
    "m"."volume_24h",
    "m"."liquidity",
    "count"(DISTINCT "o"."id") AS "order_count",
    "count"(DISTINCT "t"."id") AS "trade_count"
   FROM (("public"."markets" "m"
     LEFT JOIN "public"."orders" "o" ON (("o"."market_id" = "m"."id")))
     LEFT JOIN "public"."trades" "t" ON (("t"."market_id" = "m"."id")))
  GROUP BY "m"."id", "m"."event_id", "m"."status", "m"."question", "m"."current_price_yes", "m"."current_price_no", "m"."volume_24h", "m"."liquidity";


ALTER VIEW "public"."market_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_suggestions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "source_url" "text",
    "ai_confidence" numeric(3,2),
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."market_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_templates" (
    "id" character varying(100) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "market_type" character varying(50) NOT NULL,
    "category" character varying(100),
    "default_params" "jsonb",
    "validation_rules" "jsonb",
    "ui_config" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_premium" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."market_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_type" "text" NOT NULL,
    "target_user_id" "uuid",
    "target_comment_id" "uuid",
    "performed_by" "uuid" NOT NULL,
    "reason" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moderation_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_name" character varying(100) NOT NULL,
    "source_url" "text" NOT NULL,
    "source_type" character varying(50),
    "country_code" character(2) DEFAULT 'BD'::"bpchar",
    "language_code" character(2) DEFAULT 'bn'::"bpchar",
    "is_verified" boolean DEFAULT false,
    "trust_score" integer DEFAULT 50,
    "bias_rating" character varying(20),
    "api_endpoint" "text",
    "api_key_encrypted" "text",
    "requires_authentication" boolean DEFAULT false,
    "rate_limit_per_hour" integer DEFAULT 100,
    "rss_feed_url" "text",
    "categories_covered" character varying(50)[],
    "total_articles_fetched" integer DEFAULT 0,
    "successful_fetches" integer DEFAULT 0,
    "failed_fetches" integer DEFAULT 0,
    "last_fetch_at" timestamp with time zone,
    "last_fetch_status" character varying(20),
    "is_active" boolean DEFAULT true,
    "is_whitelisted" boolean DEFAULT false,
    "scraping_config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."news_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_channels" (
    "id" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notifications_enabled" boolean DEFAULT true,
    "order_fills_channels" "jsonb" DEFAULT "jsonb_build_array"('websocket', 'push', 'email'),
    "market_resolution_channels" "jsonb" DEFAULT "jsonb_build_array"('websocket', 'push', 'email', 'in_app'),
    "price_alerts_channels" "jsonb" DEFAULT "jsonb_build_array"('push', 'email'),
    "position_risk_channels" "jsonb" DEFAULT "jsonb_build_array"('websocket', 'push'),
    "social_channels" "jsonb" DEFAULT "jsonb_build_array"('in_app', 'email'),
    "system_maintenance_channels" "jsonb" DEFAULT "jsonb_build_array"('email', 'in_app'),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" character varying(100) NOT NULL,
    "name" character varying(200) NOT NULL,
    "category" character varying(50) NOT NULL,
    "title_en" "text" NOT NULL,
    "title_bn" "text",
    "body_en" "text" NOT NULL,
    "body_bn" "text",
    "default_channels" "jsonb" DEFAULT "jsonb_build_array"('websocket', 'in_app'),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" character varying(50) NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_dismissed" boolean DEFAULT false,
    "market_id" "uuid",
    "trade_id" "uuid",
    "sender_id" "uuid",
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notification system with Supabase Realtime support';



COMMENT ON COLUMN "public"."notifications"."metadata" IS 'Flexible JSON storage for notification-specific data';



CREATE TABLE IF NOT EXISTS "public"."oracle_assertions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "asserter_id" "uuid",
    "outcome" character varying(50) NOT NULL,
    "bond_amount" numeric(20,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_current_best" boolean DEFAULT false
);


ALTER TABLE "public"."oracle_assertions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oracle_disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "disputer_id" "uuid" NOT NULL,
    "bond_amount" numeric(20,2) NOT NULL,
    "reason" "text" NOT NULL,
    "evidence_urls" "text"[],
    "status" character varying(20) DEFAULT 'open'::character varying,
    "resolution_outcome" character varying(50),
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "admin_response" "text",
    CONSTRAINT "oracle_disputes_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'resolved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."oracle_disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oracle_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "request_type" character varying(50) NOT NULL,
    "proposer_id" "uuid",
    "proposed_outcome" character varying(50),
    "confidence_score" numeric(5,4),
    "evidence_text" "text",
    "evidence_urls" "text"[],
    "ai_analysis" "jsonb",
    "bond_amount" numeric(20,2) DEFAULT 0,
    "bond_currency" character varying(10) DEFAULT 'BDT'::character varying,
    "challenge_window_ends_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "finalized_at" timestamp with time zone,
    "reasoning" "text",
    "dispute_count" integer DEFAULT 0,
    "is_disputed" boolean DEFAULT false,
    "resolution" "text",
    CONSTRAINT "oracle_requests_request_type_check" CHECK ((("request_type")::"text" = ANY ((ARRAY['initial'::character varying, 'dispute'::character varying, 'confirmation'::character varying])::"text"[]))),
    CONSTRAINT "oracle_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'proposed'::character varying, 'challenged'::character varying, 'disputed'::character varying, 'resolved'::character varying, 'finalized'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."oracle_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oracle_verifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "market_id" "uuid",
    "ai_result" "public"."outcome_type",
    "ai_confidence" numeric(3,2),
    "ai_reasoning" "text",
    "scraped_data" "jsonb" DEFAULT '{}'::"jsonb",
    "admin_id" "uuid",
    "admin_decision" "public"."outcome_type",
    "admin_notes" "text",
    "status" "public"."oracle_status" DEFAULT 'pending'::"public"."oracle_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "finalized_at" timestamp with time zone
);


ALTER TABLE "public"."oracle_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "total_cost" numeric(18,2) DEFAULT 0 NOT NULL,
    "order_count" integer DEFAULT 0,
    "filled_count" integer DEFAULT 0,
    "failed_count" integer DEFAULT 0,
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    CONSTRAINT "order_batches_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'partial'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."order_batches" OWNER TO "postgres";


COMMENT ON TABLE "public"."order_batches" IS 'Batch order tracking for bet slip functionality';



COMMENT ON COLUMN "public"."order_batches"."metadata" IS 'Original order details for audit and replay';



CREATE TABLE IF NOT EXISTS "public"."order_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "commitment_hash" "text" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders_2026_03" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "side" "public"."order_side" NOT NULL,
    "type" "public"."order_type" DEFAULT 'limit'::"public"."order_type" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "filled_quantity" numeric DEFAULT 0 NOT NULL,
    "status" "public"."order_status" DEFAULT 'open'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remaining_quantity" numeric DEFAULT 0,
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type",
    "expires_at" timestamp with time zone,
    "average_fill_price" numeric DEFAULT 0,
    "total_cost" numeric DEFAULT 0,
    "fee_amount" numeric DEFAULT 0,
    "fee_rate" numeric DEFAULT 0.02,
    "cancelled_at" timestamp with time zone,
    "filled_at" timestamp with time zone,
    "reject_reason" "text",
    "source" "text" DEFAULT 'web'::"text",
    "is_post_only" boolean DEFAULT false,
    "is_reduce_only" boolean DEFAULT false
);


ALTER TABLE "public"."orders_2026_03" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders_2026_04" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "side" "public"."order_side" NOT NULL,
    "type" "public"."order_type" DEFAULT 'limit'::"public"."order_type" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "filled_quantity" numeric DEFAULT 0 NOT NULL,
    "status" "public"."order_status" DEFAULT 'open'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remaining_quantity" numeric DEFAULT 0,
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type",
    "expires_at" timestamp with time zone,
    "average_fill_price" numeric DEFAULT 0,
    "total_cost" numeric DEFAULT 0,
    "fee_amount" numeric DEFAULT 0,
    "fee_rate" numeric DEFAULT 0.02,
    "cancelled_at" timestamp with time zone,
    "filled_at" timestamp with time zone,
    "reject_reason" "text",
    "source" "text" DEFAULT 'web'::"text",
    "is_post_only" boolean DEFAULT false,
    "is_reduce_only" boolean DEFAULT false
);


ALTER TABLE "public"."orders_2026_04" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders_2026_05" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "side" "public"."order_side" NOT NULL,
    "type" "public"."order_type" DEFAULT 'limit'::"public"."order_type" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "filled_quantity" numeric DEFAULT 0 NOT NULL,
    "status" "public"."order_status" DEFAULT 'open'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remaining_quantity" numeric DEFAULT 0,
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type",
    "expires_at" timestamp with time zone,
    "average_fill_price" numeric DEFAULT 0,
    "total_cost" numeric DEFAULT 0,
    "fee_amount" numeric DEFAULT 0,
    "fee_rate" numeric DEFAULT 0.02,
    "cancelled_at" timestamp with time zone,
    "filled_at" timestamp with time zone,
    "reject_reason" "text",
    "source" "text" DEFAULT 'web'::"text",
    "is_post_only" boolean DEFAULT false,
    "is_reduce_only" boolean DEFAULT false
);


ALTER TABLE "public"."orders_2026_05" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders_legacy" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "market_id" "uuid",
    "user_id" "uuid",
    "order_type" "public"."order_type" NOT NULL,
    "side" "public"."order_side" NOT NULL,
    "outcome" "public"."outcome_type" NOT NULL,
    "price" numeric(5,4) NOT NULL,
    "quantity" bigint NOT NULL,
    "filled_quantity" bigint DEFAULT 0,
    "status" "public"."order_status" DEFAULT 'open'::"public"."order_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "batch_id" "uuid",
    "time_in_force" character varying(10) DEFAULT 'GTC'::character varying,
    "stop_price" numeric(5,4),
    "trigger_condition" character varying(20),
    "parent_order_id" "uuid",
    "oco_group_id" "uuid",
    "display_size" numeric,
    "refresh_size" numeric,
    "client_order_id" character varying(100),
    "ip_address" "inet",
    "user_agent" "text",
    "remaining_quantity" numeric DEFAULT 0,
    "average_fill_price" numeric DEFAULT 0,
    "total_cost" numeric DEFAULT 0,
    "fee_amount" numeric DEFAULT 0,
    "fee_rate" numeric DEFAULT 0.02,
    "cancelled_at" timestamp with time zone,
    "filled_at" timestamp with time zone,
    "reject_reason" "text",
    "source" "text" DEFAULT 'web'::"text",
    "is_post_only" boolean DEFAULT false,
    "is_reduce_only" boolean DEFAULT false,
    "type" "text" DEFAULT 'limit'::"text",
    CONSTRAINT "orders_price_check" CHECK ((("price" > (0)::numeric) AND ("price" < (1)::numeric))),
    CONSTRAINT "orders_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "orders_time_in_force_check" CHECK ((("time_in_force")::"text" = ANY ((ARRAY['GTC'::character varying, 'IOC'::character varying, 'FOK'::character varying, 'DAY'::character varying, 'GTD'::character varying])::"text"[])))
);


ALTER TABLE "public"."orders_legacy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "side" "public"."order_side" NOT NULL,
    "type" "public"."order_type" DEFAULT 'limit'::"public"."order_type" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "filled_quantity" numeric DEFAULT 0 NOT NULL,
    "status" "public"."order_status" DEFAULT 'open'::"public"."order_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("created_at");


ALTER TABLE "public"."orders_v2" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."orphaned_events" AS
 SELECT "e"."id",
    "e"."title",
    "e"."status",
    "e"."created_at"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."markets" "m" ON (("m"."event_id" = "e"."id")))
  WHERE (("m"."id" IS NULL) AND (("e"."status")::"text" = 'active'::"text"));


ALTER VIEW "public"."orphaned_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "label_bn" "text",
    "image_url" "text",
    "current_price" numeric(10,4) DEFAULT 0.5,
    "total_volume" numeric(18,2) DEFAULT 0,
    "price_change_24h" numeric(10,4) DEFAULT 0,
    "display_order" integer DEFAULT 0,
    "is_winning" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "outcomes_current_price_check" CHECK ((("current_price" >= (0)::numeric) AND ("current_price" <= (1)::numeric)))
);


ALTER TABLE "public"."outcomes" OWNER TO "postgres";


COMMENT ON TABLE "public"."outcomes" IS 'Multi-outcome support for prediction markets. Each outcome represents a possible result.';



COMMENT ON COLUMN "public"."outcomes"."label_bn" IS 'Bengali label for Bangladesh market localization';



COMMENT ON COLUMN "public"."outcomes"."current_price" IS 'Probability of this outcome (0.0 to 1.0). Sum of all outcomes for a market should be ~1.0';



CREATE TABLE IF NOT EXISTS "public"."p2p_seller_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "method" character varying(10),
    "sellers_data" "jsonb" NOT NULL,
    "scraped_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "affiliate_link" character varying(255),
    "active" boolean DEFAULT true,
    CONSTRAINT "p2p_seller_cache_method_check" CHECK ((("method")::"text" = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying])::"text"[])))
);


ALTER TABLE "public"."p2p_seller_cache" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."partial_fill_state" AS
 SELECT "id" AS "order_id",
    "user_id",
    "market_id",
    "side",
    "price",
    "original_quantity",
    "filled" AS "filled_quantity",
    ("original_quantity" - "filled") AS "remaining_quantity",
    "avg_fill_price",
    "fill_count",
    "last_fill_at",
    "tif",
    "gtd_expiry",
    "status",
    "time_priority",
    "is_re_entry",
    "parent_order_id",
    COALESCE(( SELECT "jsonb_agg"("jsonb_build_object"('fillId', "fr"."id", 'quantity', "fr"."quantity", 'price', "fr"."price", 'totalValue', "fr"."total_value", 'isMaker', "fr"."is_maker", 'filledAt', "fr"."filled_at", 'fillNumber', "fr"."fill_number") ORDER BY "fr"."fill_number") AS "jsonb_agg"
           FROM "public"."fill_records" "fr"
          WHERE ("fr"."order_id" = "ob"."id")), '[]'::"jsonb") AS "fill_history"
   FROM "public"."order_book" "ob";


ALTER VIEW "public"."partial_fill_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "method" "public"."payment_method" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "transaction_id" "text",
    "sender_number" "text",
    "receiver_number" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    CONSTRAINT "payment_transactions_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "outcome" character varying(10) DEFAULT 'YES'::character varying NOT NULL,
    "position_id" "uuid",
    "shares" numeric DEFAULT 0 NOT NULL,
    "purchase_price" numeric DEFAULT 0 NOT NULL,
    "current_price" numeric DEFAULT 0 NOT NULL,
    "payout_amount" numeric DEFAULT 0 NOT NULL,
    "profit_loss" numeric DEFAULT 0 NOT NULL,
    "calculation_type" character varying(50) DEFAULT 'settlement'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "calculated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payout_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "method" character varying(50) NOT NULL,
    "wallet_number" character varying(50) NOT NULL,
    "wallet_name" character varying(100),
    "instructions" "text",
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "platform_wallets_method_check" CHECK ((("method")::"text" = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying, 'rocket'::character varying, 'usdt_trc20'::character varying, 'usdt_erc20'::character varying, 'usdt_bep20'::character varying])::"text"[])))
);


ALTER TABLE "public"."platform_wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_interventions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid",
    "position_id" "uuid",
    "intervention_type" character varying(50) DEFAULT 'balance_adjustment'::character varying NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "reason" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "performed_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."position_interventions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."positions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "market_id" "uuid",
    "user_id" "uuid",
    "outcome" "public"."outcome_type" NOT NULL,
    "quantity" bigint DEFAULT 0,
    "average_price" numeric(5,4),
    "realized_pnl" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "outcome_index" integer,
    "unrealized_pnl" numeric DEFAULT 0,
    "side" "text",
    CONSTRAINT "positions_quantity_check" CHECK (("quantity" >= 0))
);


ALTER TABLE "public"."positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "outcome_id" "uuid",
    "outcome" "text" DEFAULT 'YES'::"text" NOT NULL,
    "price" numeric(10,4) NOT NULL,
    "volume_at_time" numeric(18,2) DEFAULT 0,
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "volume_24h" numeric DEFAULT 0,
    "open_price" numeric,
    "high_price" numeric,
    "low_price" numeric,
    "close_price" numeric,
    "interval_type" "text" DEFAULT 'tick'::"text"
);


ALTER TABLE "public"."price_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."price_history" IS 'Hourly price snapshots for sparklines and historical charts';



DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'price_ohlc_1h' AND n.nspname = 'public' AND c.relkind = 'm'
    ) THEN
        CREATE MATERIALIZED VIEW "public"."price_ohlc_1h" AS
         WITH "hourly" AS (
                 SELECT "price_history"."market_id",
                    "price_history"."outcome",
                    "date_trunc"('hour'::"text", "price_history"."recorded_at") AS "hour",
                    "min"("price_history"."price") AS "low_price",
                    "max"("price_history"."price") AS "high_price",
                    "sum"(COALESCE("price_history"."volume_24h", (0)::numeric)) AS "volume"
                   FROM "public"."price_history"
                  GROUP BY "price_history"."market_id", "price_history"."outcome", ("date_trunc"('hour'::"text", "price_history"."recorded_at"))
                )
         SELECT "market_id",
            "outcome",
            "hour",
            ( SELECT "ph"."price"
                   FROM "public"."price_history" "ph"
                  WHERE (("ph"."market_id" = "h"."market_id") AND ("ph"."outcome" = "h"."outcome") AND ("date_trunc"('hour'::"text", "ph"."recorded_at") = "h"."hour"))
                  ORDER BY "ph"."recorded_at"
                 LIMIT 1) AS "open_price",
            "high_price",
            "low_price",
            ( SELECT "ph"."price"
                   FROM "public"."price_history" "ph"
                  WHERE (("ph"."market_id" = "h"."market_id") AND ("ph"."outcome" = "h"."outcome") AND ("date_trunc"('hour'::"text", "ph"."recorded_at") = "h"."hour"))
                  ORDER BY "ph"."recorded_at" DESC
                 LIMIT 1) AS "close_price",
            "volume"
           FROM "hourly" "h"
          ORDER BY "hour" DESC
          WITH NO DATA;

        ALTER MATERIALIZED VIEW "public"."price_ohlc_1h" OWNER TO "postgres";
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "balance" numeric(12,2) DEFAULT 0.00 NOT NULL,
    "total_deposited" numeric(12,2) DEFAULT 0.00 NOT NULL,
    "total_withdrawn" numeric(12,2) DEFAULT 0.00 NOT NULL,
    "kyc_status" character varying(20) DEFAULT 'pending'::character varying,
    "kyc_submitted_at" timestamp with time zone,
    "daily_withdrawal_limit" numeric(12,2) DEFAULT 1000.00,
    "last_withdrawal_date" "date",
    "referral_code" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_admin" boolean DEFAULT false,
    CONSTRAINT "positive_balance" CHECK (("balance" >= (0)::numeric)),
    CONSTRAINT "profiles_balance_check" CHECK (("balance" >= (0)::numeric)),
    CONSTRAINT "profiles_kyc_status_check" CHECK ((("kyc_status")::"text" = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rebate_tiers_config" (
    "id" integer NOT NULL,
    "tier_name" character varying(50) NOT NULL,
    "min_volume" numeric(20,2) NOT NULL,
    "max_volume" numeric(20,2),
    "rebate_rate" numeric(8,4) NOT NULL,
    "min_spread" numeric(8,4) NOT NULL,
    "benefits" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rebate_tiers_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resolution_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pipeline_id" character varying(100) NOT NULL,
    "market_id" "uuid" NOT NULL,
    "was_disputed" boolean DEFAULT false,
    "dispute_outcome" character varying(20),
    "human_corrected_outcome" character varying(50),
    "human_reviewer_id" "uuid",
    "feedback_score" numeric(3,2),
    "error_type" character varying(50),
    "root_cause" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resolution_feedback_dispute_outcome_check" CHECK ((("dispute_outcome")::"text" = ANY ((ARRAY['upheld'::character varying, 'overturned'::character varying])::"text"[]))),
    CONSTRAINT "resolution_feedback_error_type_check" CHECK ((("error_type")::"text" = ANY ((ARRAY['false_positive'::character varying, 'false_negative'::character varying, 'confidence_miscalibration'::character varying, 'evidence_miss'::character varying])::"text"[])))
);


ALTER TABLE "public"."resolution_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."resolution_feedback" IS 'Feedback loop data for continuous model improvement';



CREATE TABLE IF NOT EXISTS "public"."resolution_systems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "market_id" "uuid",
    "primary_method" character varying(50) DEFAULT 'manual_admin'::character varying NOT NULL,
    "confidence_threshold" integer DEFAULT 85,
    "ai_keywords" "text"[] DEFAULT '{}'::"text"[],
    "ai_sources" "text"[] DEFAULT '{}'::"text"[],
    "resolver_reference" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "proposed_outcome" integer,
    "final_outcome" integer,
    "resolution_notes" "text",
    "evidence_urls" "text"[],
    "scheduled_resolution_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_resolution_method" CHECK ((("primary_method")::"text" = ANY ((ARRAY['manual_admin'::character varying, 'ai_oracle'::character varying, 'expert_panel'::character varying, 'external_api'::character varying, 'consensus'::character varying, 'community_vote'::character varying, 'hybrid'::character varying])::"text"[]))),
    CONSTRAINT "valid_resolution_status" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'disputed'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."resolution_systems" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resolvers" (
    "address" "text" NOT NULL,
    "name" character varying(255) NOT NULL,
    "type" character varying(50) NOT NULL,
    "description" "text",
    "website_url" "text",
    "is_active" boolean DEFAULT true,
    "success_count" integer DEFAULT 0,
    "dispute_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resolvers_address_check" CHECK (("address" ~ '^0x[a-fA-F0-9]{40}$'::"text")),
    CONSTRAINT "resolvers_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['UMA'::character varying, 'Chainlink'::character varying, 'Custom'::character varying, 'Multisig'::character varying, 'AI_ORACLE'::character varying, 'MANUAL_ADMIN'::character varying])::"text"[])))
);


ALTER TABLE "public"."resolvers" OWNER TO "postgres";


COMMENT ON TABLE "public"."resolvers" IS 'Centralized registry of authorized resolution authorities';



CREATE TABLE IF NOT EXISTS "public"."resting_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "side" character varying(10) NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "quantity" numeric(12,2) NOT NULL,
    "spread_at_placement" numeric(8,4),
    "resting_start_time" timestamp with time zone DEFAULT "now"(),
    "resting_end_time" timestamp with time zone,
    "total_resting_seconds" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resting_orders_side_check" CHECK ((("side")::"text" = ANY ((ARRAY['buy'::character varying, 'sell'::character varying])::"text"[])))
);


ALTER TABLE "public"."resting_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "risk_score" integer NOT NULL,
    "threat_type" "text" NOT NULL,
    "action_taken" "text" NOT NULL,
    "reasoning_bn" "text",
    "linked_accounts" "jsonb" DEFAULT '[]'::"jsonb",
    "suspicious_pattern" "text",
    "admin_instruction_bn" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sensitive_topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "keyword" character varying(100) NOT NULL,
    "category" character varying(100) NOT NULL,
    "risk_level" character varying(20) NOT NULL,
    "requires_review" boolean DEFAULT false NOT NULL,
    "auto_flag" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sensitive_topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settlement_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_id" character varying(100) NOT NULL,
    "market_id" "uuid" NOT NULL,
    "claim_ids" "text"[] NOT NULL,
    "total_amount" numeric(18,2) NOT NULL,
    "gas_estimate" integer,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    CONSTRAINT "settlement_batches_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."settlement_batches" OWNER TO "postgres";


COMMENT ON TABLE "public"."settlement_batches" IS 'Batch processing for gas optimization';



CREATE TABLE IF NOT EXISTS "public"."settlement_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_id" character varying(100) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "outcome" character varying(50) NOT NULL,
    "shares" numeric(18,8) NOT NULL,
    "payout_amount" numeric(18,2) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "opt_in_auto_settle" boolean DEFAULT false,
    "relayer_fee" numeric(18,4),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "claimed_at" timestamp with time zone,
    CONSTRAINT "settlement_claims_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'claimed'::character varying, 'auto_settled'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."settlement_claims" OWNER TO "postgres";


COMMENT ON TABLE "public"."settlement_claims" IS 'User redemption claims after market settlement';



CREATE TABLE IF NOT EXISTS "public"."settlement_escalations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "batch_id" character varying(100),
    "reason" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'open'::character varying,
    "resolved_by" "uuid",
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    CONSTRAINT "settlement_escalations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'resolved'::character varying])::"text"[])))
);


ALTER TABLE "public"."settlement_escalations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."settlement_statistics" AS
 SELECT "count"(*) FILTER (WHERE (("status")::"text" = 'claimed'::"text")) AS "manual_claims",
    "count"(*) FILTER (WHERE (("status")::"text" = 'auto_settled'::"text")) AS "auto_settled_claims",
    COALESCE("sum"("payout_amount") FILTER (WHERE (("status")::"text" = ANY ((ARRAY['claimed'::character varying, 'auto_settled'::character varying])::"text"[]))), (0)::numeric) AS "total_payout",
    COALESCE("sum"("relayer_fee") FILTER (WHERE (("status")::"text" = ANY ((ARRAY['claimed'::character varying, 'auto_settled'::character varying])::"text"[]))), (0)::numeric) AS "total_relayer_fees",
    COALESCE("avg"(
        CASE
            WHEN (("status")::"text" = 'auto_settled'::"text") THEN 1.0
            ELSE 0.0
        END), (0)::numeric) AS "auto_settle_rate"
   FROM "public"."settlement_claims";


ALTER VIEW "public"."settlement_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spread_multiplier_config" (
    "id" integer NOT NULL,
    "spread_tier" character varying(20) NOT NULL,
    "min_spread" numeric(8,4) NOT NULL,
    "max_spread" numeric(8,4),
    "multiplier" numeric(4,2) NOT NULL,
    "min_order_size" numeric(20,2) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."spread_multiplier_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spread_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "calculation_date" "date" NOT NULL,
    "avg_spread_7d" numeric(8,4),
    "min_spread" numeric(8,4),
    "max_spread" numeric(8,4),
    "spread_percentile" numeric(5,2),
    "spread_tier" character varying(20),
    "base_multiplier" numeric(4,2) DEFAULT 1.0,
    "size_multiplier" numeric(4,2) DEFAULT 1.0,
    "final_multiplier" numeric(4,2) DEFAULT 1.0,
    "meets_min_size" boolean DEFAULT false,
    "avg_order_size" numeric(20,2),
    "bonus_amount" numeric(20,2) DEFAULT 0,
    "applied_to_rebate_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "spread_rewards_spread_tier_check" CHECK ((("spread_tier")::"text" = ANY ((ARRAY['elite'::character varying, 'tight'::character varying, 'standard'::character varying, 'wide'::character varying])::"text"[])))
);


ALTER TABLE "public"."spread_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_ticket_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_internal" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_ticket_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ticket_type" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "status" character varying(50) DEFAULT 'open'::character varying NOT NULL,
    "priority" character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    "assigned_to" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trader_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid",
    "trader_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trader_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades_2026_03" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "maker_order_id" "uuid" NOT NULL,
    "taker_order_id" "uuid" NOT NULL,
    "maker_id" "uuid" NOT NULL,
    "taker_id" "uuid" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fee_amount" numeric DEFAULT 0,
    "maker_fee" numeric DEFAULT 0,
    "taker_fee" numeric DEFAULT 0,
    "trade_type" "text" DEFAULT 'limit'::"text",
    "settlement_status" "text" DEFAULT 'pending'::"text",
    "settled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type"
);


ALTER TABLE "public"."trades_2026_03" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades_2026_04" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "maker_order_id" "uuid" NOT NULL,
    "taker_order_id" "uuid" NOT NULL,
    "maker_id" "uuid" NOT NULL,
    "taker_id" "uuid" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fee_amount" numeric DEFAULT 0,
    "maker_fee" numeric DEFAULT 0,
    "taker_fee" numeric DEFAULT 0,
    "trade_type" "text" DEFAULT 'limit'::"text",
    "settlement_status" "text" DEFAULT 'pending'::"text",
    "settled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type"
);


ALTER TABLE "public"."trades_2026_04" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades_2026_05" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "maker_order_id" "uuid" NOT NULL,
    "taker_order_id" "uuid" NOT NULL,
    "maker_id" "uuid" NOT NULL,
    "taker_id" "uuid" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fee_amount" numeric DEFAULT 0,
    "maker_fee" numeric DEFAULT 0,
    "taker_fee" numeric DEFAULT 0,
    "trade_type" "text" DEFAULT 'limit'::"text",
    "settlement_status" "text" DEFAULT 'pending'::"text",
    "settled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "outcome" "public"."outcome_type" DEFAULT 'YES'::"public"."outcome_type"
);


ALTER TABLE "public"."trades_2026_05" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades_legacy" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "market_id" "uuid",
    "buy_order_id" "uuid",
    "sell_order_id" "uuid",
    "outcome" "public"."outcome_type" NOT NULL,
    "price" numeric(5,4) NOT NULL,
    "quantity" bigint NOT NULL,
    "maker_id" "uuid",
    "taker_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fee_amount" numeric DEFAULT 0,
    "maker_fee" numeric DEFAULT 0,
    "taker_fee" numeric DEFAULT 0,
    "trade_type" "text" DEFAULT 'limit'::"text",
    "settlement_status" "text" DEFAULT 'pending'::"text",
    "settled_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trades_legacy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trades_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "maker_order_id" "uuid" NOT NULL,
    "taker_order_id" "uuid" NOT NULL,
    "maker_id" "uuid" NOT NULL,
    "taker_id" "uuid" NOT NULL,
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("executed_at");


ALTER TABLE "public"."trades_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "type" "public"."transaction_type" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "balance_before" numeric(12,2) NOT NULL,
    "balance_after" numeric(12,2) NOT NULL,
    "order_id" "uuid",
    "trade_id" "uuid",
    "market_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treasury_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "market_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "transfer_type" character varying(50) DEFAULT 'payout'::character varying NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "currency" character varying(20) DEFAULT 'USDT'::character varying NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "tx_hash" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."treasury_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."upstash_workflow_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "workflow_type" "text" NOT NULL,
    "qstash_message_id" "text",
    "status" "text" DEFAULT 'queued'::"text",
    "retry_count" integer DEFAULT 0,
    "result" "jsonb",
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."upstash_workflow_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usdt_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" numeric NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "tx_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."usdt_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "badge_id" character varying(50),
    "awarded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_bookmarks" (
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_bookmarks" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_bookmarks" IS 'User saved/bookmarked markets for quick access';



CREATE OR REPLACE VIEW "public"."user_current_rebate_status" AS
 SELECT "mvt"."user_id",
    "mvt"."year_month",
    "mvt"."maker_volume",
    "mvt"."qualifying_volume",
    "mvt"."rebate_tier",
    "rtc"."tier_name",
    ("mvt"."rebate_rate" * (100)::numeric) AS "rebate_rate_percent",
    "mvt"."estimated_rebate",
    "mvt"."claimed_rebate",
    ("mvt"."estimated_rebate" - "mvt"."claimed_rebate") AS "available_to_claim",
    "rtc"."benefits",
    "mvt"."last_updated"
   FROM ("public"."maker_volume_tracking" "mvt"
     JOIN "public"."rebate_tiers_config" "rtc" ON (("mvt"."rebate_tier" = "rtc"."id")))
  WHERE (("mvt"."year_month")::"text" = "to_char"("now"(), 'YYYY-MM'::"text"));


ALTER VIEW "public"."user_current_rebate_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feed_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_feed_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notification_preferences" "jsonb" DEFAULT '{"trades": true, "comments": true, "achievements": true, "market_creations": true}'::"jsonb",
    CONSTRAINT "no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_internal_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "note_type" character varying(50) DEFAULT 'general'::character varying NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_internal_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_kyc_profiles" (
    "id" "uuid" NOT NULL,
    "verification_status" character varying(50) DEFAULT 'unverified'::character varying NOT NULL,
    "verification_tier" character varying(20) DEFAULT 'basic'::character varying NOT NULL,
    "risk_score" integer DEFAULT 50,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "full_name" character varying(255),
    "date_of_birth" "date",
    "nationality" character varying(100),
    "id_type" character varying(50),
    "id_number" character varying(100),
    "id_expiry" "date",
    "address_line1" "text",
    "address_line2" "text",
    "city" character varying(100),
    "state_province" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100),
    "phone_number" character varying(50),
    "phone_verified" boolean DEFAULT false,
    "id_document_front_url" "text",
    "id_document_back_url" "text",
    "selfie_url" "text",
    "proof_of_address_url" "text",
    "risk_factors" "jsonb" DEFAULT '[]'::"jsonb",
    "daily_deposit_limit" numeric(20,8) DEFAULT 1000,
    "daily_withdrawal_limit" numeric(20,8) DEFAULT 1000,
    "submitted_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_kyc_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_leagues" (
    "user_id" "uuid" NOT NULL,
    "league_id" integer,
    "current_points" numeric(12,2) DEFAULT 0,
    "is_promoted" boolean DEFAULT false,
    "is_relegated" boolean DEFAULT false,
    "last_updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_leagues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_moderation_status" (
    "user_id" "uuid" NOT NULL,
    "total_strikes" integer DEFAULT 0,
    "active_strikes" integer DEFAULT 0,
    "last_strike_at" timestamp with time zone,
    "is_comment_banned" boolean DEFAULT false,
    "comment_ban_until" timestamp with time zone,
    "is_trade_restricted" boolean DEFAULT false,
    "trade_restriction_until" timestamp with time zone,
    "restriction_reason" "text",
    "appeal_count" integer DEFAULT 0,
    "last_appeal_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_moderation_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_portfolio_v2" AS
 SELECT "p"."user_id",
    "p"."market_id",
    "m"."question",
    "m"."current_price_yes",
    "m"."current_price_no",
    "p"."outcome",
    "p"."quantity" AS "shares",
    "p"."average_price",
    (("p"."quantity")::numeric * "p"."average_price") AS "investment",
        CASE
            WHEN ("p"."outcome" = 'YES'::"public"."outcome_type") THEN (("p"."quantity")::numeric * "m"."current_price_yes")
            ELSE (("p"."quantity")::numeric * "m"."current_price_no")
        END AS "current_value",
        CASE
            WHEN ("p"."outcome" = 'YES'::"public"."outcome_type") THEN (("m"."current_price_yes" - "p"."average_price") * ("p"."quantity")::numeric)
            ELSE (("m"."current_price_no" - "p"."average_price") * ("p"."quantity")::numeric)
        END AS "unrealized_pnl"
   FROM ("public"."positions" "p"
     JOIN "public"."markets" "m" ON (("m"."id" = "p"."market_id")))
  WHERE ("p"."quantity" > 0);


ALTER VIEW "public"."user_portfolio_v2" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_rebate_history" AS
 SELECT "mr"."user_id",
    "mr"."year_month",
    "mr"."rebate_period_start",
    "mr"."rebate_period_end",
    "mr"."total_maker_volume",
    "mr"."qualifying_volume",
    ("mr"."base_rebate_rate" * (100)::numeric) AS "base_rate_percent",
    "mr"."spread_multiplier",
    ("mr"."final_rebate_rate" * (100)::numeric) AS "final_rate_percent",
    "mr"."gross_rebate_amount",
    "mr"."net_rebate_amount",
    "mr"."claim_status",
    "mr"."claimed_at",
    "mr"."payment_method",
    "mr"."payment_tx_hash",
    "rtc"."tier_name"
   FROM ("public"."maker_rebates" "mr"
     JOIN "public"."rebate_tiers_config" "rtc" ON (("mr"."tier_at_calculation" = "rtc"."id")))
  ORDER BY "mr"."created_at" DESC;


ALTER VIEW "public"."user_rebate_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reputation" (
    "user_id" "uuid" NOT NULL,
    "prediction_accuracy" numeric(5,2) DEFAULT 0,
    "total_predictions" integer DEFAULT 0,
    "correct_predictions" integer DEFAULT 0,
    "reputation_score" integer DEFAULT 0,
    "accuracy_tier" "public"."accuracy_tier" DEFAULT 'novice'::"public"."accuracy_tier",
    "volume_score" integer DEFAULT 0,
    "consistency_score" integer DEFAULT 0,
    "social_score" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "best_streak" integer DEFAULT 0,
    "rank_percentile" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_reputation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_status" (
    "id" "uuid" NOT NULL,
    "account_status" character varying(50) DEFAULT 'active'::character varying NOT NULL,
    "can_trade" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_trading_stats" (
    "user_id" "uuid" NOT NULL,
    "thirty_day_volume" numeric(15,2) DEFAULT 0,
    "total_maker_rebates_earned" numeric(12,2) DEFAULT 0,
    "last_reset_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_trading_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_workflows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "event_category" character varying(50) NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_category_valid" CHECK ((("event_category")::"text" = ANY ((ARRAY['crypto'::character varying, 'sports'::character varying, 'politics'::character varying, 'news'::character varying, 'complex'::character varying, 'general'::character varying])::"text"[])))
);


ALTER TABLE "public"."verification_workflows" OWNER TO "postgres";


COMMENT ON TABLE "public"."verification_workflows" IS 'Stores verification workflow configurations for event resolution';



CREATE OR REPLACE VIEW "public"."view_resolvable_events" AS
 SELECT "e"."id" AS "event_id",
    "e"."title",
    "e"."status" AS "event_status",
    "e"."ends_at" AS "end_date",
    "count"("m"."id") AS "market_count",
    "count"(
        CASE
            WHEN ("m"."status" = 'active'::"public"."market_status") THEN 1
            ELSE NULL::integer
        END) AS "active_markets"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."markets" "m" ON (("m"."event_id" = "e"."id")))
  WHERE (("e"."status")::"text" = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'pending_resolution'::character varying])::"text"[]))
  GROUP BY "e"."id", "e"."title", "e"."status", "e"."ends_at";


ALTER VIEW "public"."view_resolvable_events" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_expiring_kyc" AS
 SELECT "id" AS "user_id",
    "full_name",
    "id_type",
    "id_number",
    "id_expiry",
    ("id_expiry" - ("now"())::"date") AS "days_until_expiry"
   FROM "public"."user_kyc_profiles"
  WHERE (("id_expiry" IS NOT NULL) AND ("id_expiry" <= (("now"() + '30 days'::interval))::"date"));


ALTER VIEW "public"."vw_expiring_kyc" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_type" character varying(20) NOT NULL,
    "amount" numeric(36,18) NOT NULL,
    "currency" character varying(10) DEFAULT 'BDT'::character varying,
    "network_type" character varying(20),
    "wallet_address" "text",
    "tx_hash" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "wallet_transactions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "wallet_transactions_transaction_type_check" CHECK ((("transaction_type")::"text" = ANY ((ARRAY['deposit'::character varying, 'withdrawal'::character varying, 'trade_in'::character varying, 'trade_out'::character varying, 'rebate'::character varying, 'referral'::character varying, 'adjustment'::character varying])::"text"[])))
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "balance" numeric(12,2) DEFAULT 0,
    "locked_balance" numeric(12,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "usdt_address" "text",
    "usdc_address" "text",
    "qr_code_url" "text",
    "network_type" character varying(20) DEFAULT 'TRC20'::character varying,
    "address_type" character varying(20) DEFAULT 'DYNAMIC'::character varying,
    "is_active" boolean DEFAULT true,
    "version" integer DEFAULT 0,
    "asset" "text" DEFAULT 'USDT'::"text",
    "total_deposited" numeric DEFAULT 0,
    "total_withdrawn" numeric DEFAULT 0,
    "total_earned" numeric DEFAULT 0,
    "total_fees_paid" numeric DEFAULT 0,
    "last_deposit_at" timestamp with time zone,
    "last_withdrawal_at" timestamp with time zone,
    "currency" "text" DEFAULT 'USDT'::"text",
    "daily_withdrawal_limit" numeric DEFAULT 1000,
    "monthly_withdrawal_limit" numeric DEFAULT 10000,
    "risk_score" numeric DEFAULT 0,
    "usdt_balance" numeric DEFAULT 0,
    "locked_usdt" numeric DEFAULT 0,
    CONSTRAINT "wallets_balance_check" CHECK (("balance" >= (0)::numeric)),
    CONSTRAINT "wallets_locked_balance_check" CHECK (("locked_balance" >= (0)::numeric))
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawal_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "usdt_amount" numeric(12,2) NOT NULL,
    "bdt_amount" numeric(12,2) NOT NULL,
    "exchange_rate" numeric(10,4) NOT NULL,
    "mfs_provider" "public"."mfs_provider" NOT NULL,
    "recipient_number" character varying(20) NOT NULL,
    "recipient_name" character varying(100),
    "status" "public"."withdrawal_status" DEFAULT 'pending'::"public"."withdrawal_status" NOT NULL,
    "balance_hold_id" "uuid",
    "processed_by" "uuid",
    "processed_at" timestamp with time zone,
    "admin_notes" "text",
    "transfer_proof_url" "text",
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "withdrawal_requests_bdt_amount_check" CHECK (("bdt_amount" > (0)::numeric)),
    CONSTRAINT "withdrawal_requests_usdt_amount_check" CHECK (("usdt_amount" > (0)::numeric))
);


ALTER TABLE "public"."withdrawal_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawal_verifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "otp_code" character varying(10) NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "withdrawal_payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."withdrawal_verifications" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawal_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_date" "date" DEFAULT CURRENT_DATE,
    "workflow_name" "text" NOT NULL,
    "total_executions" integer DEFAULT 0,
    "success_count" integer DEFAULT 0,
    "failure_count" integer DEFAULT 0,
    "avg_duration_ms" double precision,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_analytics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "cron_expression" "text" DEFAULT '0 */4 * * *'::"text",
    "is_active" boolean DEFAULT true,
    "last_run" timestamp with time zone,
    "next_run" timestamp with time zone,
    "last_status" "text",
    "execution_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_dlq" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "workflow_type" "text" NOT NULL,
    "payload" "jsonb",
    "error" "text",
    "failed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_dlq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_executions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_name" character varying(100) NOT NULL,
    "status" character varying(20) NOT NULL,
    "results" "jsonb" DEFAULT '{}'::"jsonb",
    "error_message" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid",
    "workflow_id" "uuid",
    "outcome" character varying(20),
    "confidence" numeric(5,2),
    "mismatch_detected" boolean DEFAULT false,
    "escalated" boolean DEFAULT false,
    "sources" "jsonb",
    "evidence" "jsonb",
    "notified" boolean DEFAULT false,
    "execution_time" integer,
    "workflow_type" "text" DEFAULT 'unknown'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "max_retries" integer DEFAULT 3,
    "retry_count" integer DEFAULT 0,
    CONSTRAINT "workflow_executions_confidence_check" CHECK ((("confidence" >= (0)::numeric) AND ("confidence" <= (100)::numeric))),
    CONSTRAINT "workflow_executions_outcome_check" CHECK ((("outcome")::"text" = ANY ((ARRAY['YES'::character varying, 'NO'::character varying, 'URCENTAIN'::character varying, 'ESCALATED'::character varying, 'yes'::character varying, 'no'::character varying, 'uncertain'::character varying, 'escalated'::character varying])::"text"[]))),
    CONSTRAINT "workflow_executions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['success'::character varying, 'partial'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."workflow_executions" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_executions" IS 'Tracks both automated system workflows and event verification history';



COMMENT ON COLUMN "public"."workflow_executions"."outcome" IS 'Outcome data for workflow execution results';



CREATE OR REPLACE VIEW "public"."workflow_execution_summary" AS
 SELECT "workflow_name",
    "count"(*) AS "total_executions",
    "count"(*) FILTER (WHERE (("status")::"text" = 'success'::"text")) AS "successful",
    "count"(*) FILTER (WHERE (("status")::"text" = 'partial'::"text")) AS "partial",
    "count"(*) FILTER (WHERE (("status")::"text" = 'failed'::"text")) AS "failed",
    "max"("created_at") AS "last_execution",
    "avg"("duration_ms") AS "avg_duration_ms"
   FROM "public"."workflow_executions"
  GROUP BY "workflow_name";


ALTER VIEW "public"."workflow_execution_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "text",
    "name" character varying(100) NOT NULL,
    "workflow_type" character varying(50) NOT NULL,
    "cron_expression" "text" NOT NULL,
    "timezone" character varying(50) DEFAULT 'Asia/Dhaka'::character varying,
    "endpoint_url" "text" NOT NULL,
    "method" character varying(10) DEFAULT 'POST'::character varying,
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "default_payload" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_run_at" timestamp with time zone,
    "last_run_status" character varying(20),
    "next_run_at" timestamp with time zone,
    "total_runs" integer DEFAULT 0,
    "successful_runs" integer DEFAULT 0,
    "failed_runs" integer DEFAULT 0,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_schedules" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_schedules" IS 'Stores QStash schedule configurations';



CREATE TABLE IF NOT EXISTS "public"."workflow_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "execution_id" "uuid",
    "step_name" "text" NOT NULL,
    "step_status" "text" NOT NULL,
    "step_data" "jsonb" DEFAULT '{}'::"jsonb",
    "error_details" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."workflow_steps" OWNER TO "postgres";


DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders" ATTACH PARTITION "public"."orders_2026_03" FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders" ATTACH PARTITION "public"."orders_2026_04" FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders" ATTACH PARTITION "public"."orders_2026_05" FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades" ATTACH PARTITION "public"."trades_2026_03" FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades" ATTACH PARTITION "public"."trades_2026_04" FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades" ATTACH PARTITION "public"."trades_2026_05" FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



ALTER TABLE ONLY "public"."leagues" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."leagues_id_seq"'::"regclass");



DO $$
BEGIN
    ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."activity_aggregations"
    ADD CONSTRAINT "activity_aggregations_aggregation_type_aggregation_key_key" UNIQUE ("aggregation_type", "aggregation_key");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."activity_aggregations"
    ADD CONSTRAINT "activity_aggregations_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_ai_settings"
    ADD CONSTRAINT "admin_ai_settings_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_key_key" UNIQUE ("key");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_workflow_triggers"
    ADD CONSTRAINT "admin_workflow_triggers_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."agent_wallets"
    ADD CONSTRAINT "agent_wallets_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_ab_tests"
    ADD CONSTRAINT "ai_ab_tests_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_agent_configs"
    ADD CONSTRAINT "ai_agent_configs_agent_key_key" UNIQUE ("agent_key");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_agent_configs"
    ADD CONSTRAINT "ai_agent_configs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_circuit_breaker_state"
    ADD CONSTRAINT "ai_circuit_breaker_state_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_circuit_breaker_state"
    ADD CONSTRAINT "ai_circuit_breaker_state_service_key" UNIQUE ("service");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_daily_topics"
    ADD CONSTRAINT "ai_daily_topics_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_event_pipelines"
    ADD CONSTRAINT "ai_event_pipelines_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_evidence_cache"
    ADD CONSTRAINT "ai_evidence_cache_cache_key_key" UNIQUE ("cache_key");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_evidence_cache"
    ADD CONSTRAINT "ai_evidence_cache_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_model_versions"
    ADD CONSTRAINT "ai_model_versions_model_type_version_key" UNIQUE ("model_type", "version");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_model_versions"
    ADD CONSTRAINT "ai_model_versions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_agent_name_key" UNIQUE ("agent_name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_providers"
    ADD CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_providers"
    ADD CONSTRAINT "ai_providers_provider_name_key" UNIQUE ("provider_name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_rate_limit_state"
    ADD CONSTRAINT "ai_rate_limit_state_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_rate_limit_state"
    ADD CONSTRAINT "ai_rate_limit_state_service_key" UNIQUE ("service");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_resolution_pipelines"
    ADD CONSTRAINT "ai_resolution_pipelines_pipeline_id_key" UNIQUE ("pipeline_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_resolution_pipelines"
    ADD CONSTRAINT "ai_resolution_pipelines_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_topic_configs"
    ADD CONSTRAINT "ai_topic_configs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_topic_generation_jobs"
    ADD CONSTRAINT "ai_topic_generation_jobs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_agent_key_usage_date_key" UNIQUE ("agent_key", "usage_date");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."analytics_snapshots_daily"
    ADD CONSTRAINT "analytics_snapshots_daily_date_key" UNIQUE ("date");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."analytics_snapshots_daily"
    ADD CONSTRAINT "analytics_snapshots_daily_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."analytics_snapshots_hourly"
    ADD CONSTRAINT "analytics_snapshots_hourly_bucket_start_key" UNIQUE ("bucket_start");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."analytics_snapshots_hourly"
    ADD CONSTRAINT "analytics_snapshots_hourly_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."balance_holds"
    ADD CONSTRAINT "balance_holds_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_cricket_events"
    ADD CONSTRAINT "bd_cricket_events_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_divisions"
    ADD CONSTRAINT "bd_divisions_name_key" UNIQUE ("name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_divisions"
    ADD CONSTRAINT "bd_divisions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_economic_indicators"
    ADD CONSTRAINT "bd_economic_indicators_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_news_sources"
    ADD CONSTRAINT "bd_news_sources_domain_key" UNIQUE ("domain");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_news_sources"
    ADD CONSTRAINT "bd_news_sources_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."bd_political_events"
    ADD CONSTRAINT "bd_political_events_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."burn_events"
    ADD CONSTRAINT "burn_events_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."cancellation_records"
    ADD CONSTRAINT "cancellation_records_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."category_settings"
    ADD CONSTRAINT "category_settings_pkey" PRIMARY KEY ("category");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_attachments"
    ADD CONSTRAINT "comment_attachments_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_flags"
    ADD CONSTRAINT "comment_flags_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_flags"
    ADD CONSTRAINT "comment_flags_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("user_id", "comment_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_moderation_queue"
    ADD CONSTRAINT "comment_moderation_queue_comment_id_key" UNIQUE ("comment_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_moderation_queue"
    ADD CONSTRAINT "comment_moderation_queue_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_votes"
    ADD CONSTRAINT "comment_votes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_votes"
    ADD CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."copy_trading_settings"
    ADD CONSTRAINT "copy_trading_settings_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."copy_trading_settings"
    ADD CONSTRAINT "copy_trading_settings_user_id_key" UNIQUE ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."custom_categories"
    ADD CONSTRAINT "custom_categories_name_key" UNIQUE ("name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."custom_categories"
    ADD CONSTRAINT "custom_categories_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."custom_categories"
    ADD CONSTRAINT "custom_categories_slug_key" UNIQUE ("slug");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."deposit_attempts"
    ADD CONSTRAINT "deposit_attempts_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."deposit_requests"
    ADD CONSTRAINT "deposit_requests_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."dispute_records"
    ADD CONSTRAINT "dispute_records_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_dispute_id_key" UNIQUE ("dispute_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."exchange_rates"
    ADD CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_assignments"
    ADD CONSTRAINT "expert_assignments_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_badges"
    ADD CONSTRAINT "expert_badges_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel_members"
    ADD CONSTRAINT "expert_panel_members_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel"
    ADD CONSTRAINT "expert_panel_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel_reviews"
    ADD CONSTRAINT "expert_panel_reviews_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_votes"
    ADD CONSTRAINT "expert_votes_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."feed_preferences"
    ADD CONSTRAINT "feed_preferences_pkey" PRIMARY KEY ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."fill_records"
    ADD CONSTRAINT "fill_records_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."follow_requests"
    ADD CONSTRAINT "follow_requests_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."global_sequence"
    ADD CONSTRAINT "global_sequence_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."human_review_queue"
    ADD CONSTRAINT "human_review_queue_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_admin_overrides"
    ADD CONSTRAINT "kyc_admin_overrides_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_documents"
    ADD CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_settings"
    ADD CONSTRAINT "kyc_settings_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_submissions"
    ADD CONSTRAINT "kyc_submissions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leaderboard_cache"
    ADD CONSTRAINT "leaderboard_cache_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leaderboard_cache"
    ADD CONSTRAINT "leaderboard_cache_user_id_timeframe_key" UNIQUE ("user_id", "timeframe");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leaderboard"
    ADD CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leaderboard"
    ADD CONSTRAINT "leaderboard_user_id_key" UNIQUE ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_name_key" UNIQUE ("name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_tier_order_key" UNIQUE ("tier_order");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."legal_review_queue"
    ADD CONSTRAINT "legal_review_queue_draft_id_key" UNIQUE ("draft_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."legal_review_queue"
    ADD CONSTRAINT "legal_review_queue_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."maker_rebates"
    ADD CONSTRAINT "maker_rebates_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."maker_volume_tracking"
    ADD CONSTRAINT "maker_volume_tracking_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."manual_deposits"
    ADD CONSTRAINT "manual_deposits_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."manual_deposits"
    ADD CONSTRAINT "manual_deposits_transaction_id_key" UNIQUE ("transaction_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_comments"
    ADD CONSTRAINT "market_comments_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_creation_drafts"
    ADD CONSTRAINT "market_creation_drafts_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_daily_stats"
    ADD CONSTRAINT "market_daily_stats_market_id_date_key" UNIQUE ("market_id", "date");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_daily_stats"
    ADD CONSTRAINT "market_daily_stats_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_followers"
    ADD CONSTRAINT "market_followers_pkey" PRIMARY KEY ("user_id", "market_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_follows"
    ADD CONSTRAINT "market_follows_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_suggestions"
    ADD CONSTRAINT "market_suggestions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_templates"
    ADD CONSTRAINT "market_templates_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "markets_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "markets_slug_key" UNIQUE ("slug");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."moderation_actions"
    ADD CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."news_sources"
    ADD CONSTRAINT "news_sources_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notification_channels"
    ADD CONSTRAINT "notification_channels_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_assertions"
    ADD CONSTRAINT "oracle_assertions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_disputes"
    ADD CONSTRAINT "oracle_disputes_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_requests"
    ADD CONSTRAINT "oracle_requests_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_verifications"
    ADD CONSTRAINT "oracle_verifications_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_batches"
    ADD CONSTRAINT "order_batches_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_book"
    ADD CONSTRAINT "order_book_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_commitments"
    ADD CONSTRAINT "order_commitments_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_v2_pkey" PRIMARY KEY ("id", "created_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_2026_03"
    ADD CONSTRAINT "orders_2026_03_pkey" PRIMARY KEY ("id", "created_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_2026_04"
    ADD CONSTRAINT "orders_2026_04_pkey" PRIMARY KEY ("id", "created_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_2026_05"
    ADD CONSTRAINT "orders_2026_05_pkey" PRIMARY KEY ("id", "created_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_legacy"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_v2"
    ADD CONSTRAINT "orders_v2_pkey1" PRIMARY KEY ("id", "created_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."outcomes"
    ADD CONSTRAINT "outcomes_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."p2p_seller_cache"
    ADD CONSTRAINT "p2p_seller_cache_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_transaction_id_key" UNIQUE ("transaction_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."payout_calculations"
    ADD CONSTRAINT "payout_calculations_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_key_key" UNIQUE ("key");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."platform_wallets"
    ADD CONSTRAINT "platform_wallets_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."position_interventions"
    ADD CONSTRAINT "position_interventions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_market_id_user_id_outcome_key" UNIQUE ("market_id", "user_id", "outcome");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."rebate_tiers_config"
    ADD CONSTRAINT "rebate_tiers_config_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_feedback"
    ADD CONSTRAINT "resolution_feedback_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_systems"
    ADD CONSTRAINT "resolution_systems_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolvers"
    ADD CONSTRAINT "resolvers_pkey" PRIMARY KEY ("address");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resting_orders"
    ADD CONSTRAINT "resting_orders_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."sensitive_topics"
    ADD CONSTRAINT "sensitive_topics_keyword_key" UNIQUE ("keyword");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."sensitive_topics"
    ADD CONSTRAINT "sensitive_topics_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_batches"
    ADD CONSTRAINT "settlement_batches_batch_id_key" UNIQUE ("batch_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_batches"
    ADD CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_claims"
    ADD CONSTRAINT "settlement_claims_claim_id_key" UNIQUE ("claim_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_claims"
    ADD CONSTRAINT "settlement_claims_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_escalations"
    ADD CONSTRAINT "settlement_escalations_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."spread_multiplier_config"
    ADD CONSTRAINT "spread_multiplier_config_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."spread_rewards"
    ADD CONSTRAINT "spread_rewards_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trader_subscriptions"
    ADD CONSTRAINT "trader_subscriptions_follower_id_trader_id_key" UNIQUE ("follower_id", "trader_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trader_subscriptions"
    ADD CONSTRAINT "trader_subscriptions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades"
    ADD CONSTRAINT "trades_v2_pkey" PRIMARY KEY ("id", "executed_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_2026_03"
    ADD CONSTRAINT "trades_2026_03_pkey" PRIMARY KEY ("id", "executed_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_2026_04"
    ADD CONSTRAINT "trades_2026_04_pkey" PRIMARY KEY ("id", "executed_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_2026_05"
    ADD CONSTRAINT "trades_2026_05_pkey" PRIMARY KEY ("id", "executed_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_legacy"
    ADD CONSTRAINT "trades_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_v2"
    ADD CONSTRAINT "trades_v2_pkey1" PRIMARY KEY ("id", "executed_at");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."treasury_transfers"
    ADD CONSTRAINT "treasury_transfers_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_systems"
    ADD CONSTRAINT "unique_event_resolution" UNIQUE ("event_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_assignments"
    ADD CONSTRAINT "unique_expert_event_assignment" UNIQUE ("expert_id", "event_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_votes"
    ADD CONSTRAINT "unique_expert_event_vote" UNIQUE ("expert_id", "event_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel"
    ADD CONSTRAINT "unique_expert_user" UNIQUE ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "unique_follow" UNIQUE ("follower_id", "following_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_follows"
    ADD CONSTRAINT "unique_market_follow" UNIQUE ("user_id", "market_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."follow_requests"
    ADD CONSTRAINT "unique_pending_request" UNIQUE ("requester_id", "target_id", "status");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."news_sources"
    ADD CONSTRAINT "unique_source_url" UNIQUE ("source_url");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."maker_volume_tracking"
    ADD CONSTRAINT "unique_user_month" UNIQUE ("user_id", "year_month");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "unique_user_preferences" UNIQUE ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."upstash_workflow_runs"
    ADD CONSTRAINT "upstash_workflow_runs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "uq_wallets_usdt_address" UNIQUE ("usdt_address");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."usdt_transactions"
    ADD CONSTRAINT "usdt_transactions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("user_id", "market_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_feed_preferences"
    ADD CONSTRAINT "user_feed_preferences_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_feed_preferences"
    ADD CONSTRAINT "user_feed_preferences_user_id_key" UNIQUE ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_internal_notes"
    ADD CONSTRAINT "user_internal_notes_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_kyc_profiles"
    ADD CONSTRAINT "user_kyc_profiles_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_leagues"
    ADD CONSTRAINT "user_leagues_pkey" PRIMARY KEY ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_moderation_status"
    ADD CONSTRAINT "user_moderation_status_pkey" PRIMARY KEY ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_reputation"
    ADD CONSTRAINT "user_reputation_pkey" PRIMARY KEY ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_trading_stats"
    ADD CONSTRAINT "user_trading_stats_pkey" PRIMARY KEY ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_wallet_address_key" UNIQUE ("wallet_address");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."verification_workflows"
    ADD CONSTRAINT "verification_workflows_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."withdrawal_verifications"
    ADD CONSTRAINT "withdrawal_verifications_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_analytics_daily"
    ADD CONSTRAINT "workflow_analytics_daily_execution_date_workflow_name_key" UNIQUE ("execution_date", "workflow_name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_analytics_daily"
    ADD CONSTRAINT "workflow_analytics_daily_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_configs"
    ADD CONSTRAINT "workflow_configs_name_key" UNIQUE ("name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_configs"
    ADD CONSTRAINT "workflow_configs_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_dlq"
    ADD CONSTRAINT "workflow_dlq_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_schedules"
    ADD CONSTRAINT "workflow_schedules_name_key" UNIQUE ("name");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_schedules"
    ADD CONSTRAINT "workflow_schedules_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_schedules"
    ADD CONSTRAINT "workflow_schedules_schedule_id_key" UNIQUE ("schedule_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



CREATE INDEX IF NOT EXISTS "idx_ab_tests_status" ON "public"."ai_ab_tests" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_activities_created_at" ON "public"."activities" USING "btree" ("created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_activities_user" ON "public"."activities" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_admin_audit_log_performed_by" ON "public"."admin_audit_log" USING "btree" ("performed_by");



CREATE INDEX IF NOT EXISTS "idx_admin_audit_log_target" ON "public"."admin_audit_log" USING "btree" ("target_table", "target_id");



CREATE INDEX IF NOT EXISTS "idx_admin_logs_action" ON "public"."admin_activity_logs" USING "btree" ("action_type");



CREATE INDEX IF NOT EXISTS "idx_admin_logs_admin" ON "public"."admin_activity_logs" USING "btree" ("admin_id");



CREATE INDEX IF NOT EXISTS "idx_admin_logs_created" ON "public"."admin_activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_admin_logs_resource" ON "public"."admin_activity_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX IF NOT EXISTS "idx_admin_logs_workflow" ON "public"."admin_activity_logs" USING "btree" ("workflow_id");



CREATE INDEX IF NOT EXISTS "idx_admin_workflow_triggers_admin" ON "public"."admin_workflow_triggers" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_admin_workflow_triggers_workflow" ON "public"."admin_workflow_triggers" USING "btree" ("workflow_name", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_ai_configs_status" ON "public"."ai_agent_configs" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_ai_daily_topics_category" ON "public"."ai_daily_topics" USING "btree" ("suggested_category");



CREATE INDEX IF NOT EXISTS "idx_ai_daily_topics_generated" ON "public"."ai_daily_topics" USING "btree" ("generated_at");



CREATE INDEX IF NOT EXISTS "idx_ai_daily_topics_status" ON "public"."ai_daily_topics" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_ai_feedback_error" ON "public"."resolution_feedback" USING "btree" ("error_type");



CREATE INDEX IF NOT EXISTS "idx_ai_feedback_market" ON "public"."resolution_feedback" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_ai_feedback_pipeline" ON "public"."resolution_feedback" USING "btree" ("pipeline_id");



CREATE INDEX IF NOT EXISTS "idx_ai_feedback_unprocessed" ON "public"."resolution_feedback" USING "btree" ("processed_at") WHERE ("processed_at" IS NULL);



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_bangladesh" ON "public"."ai_resolution_pipelines" USING "btree" ("is_bangladesh_context");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_confidence" ON "public"."ai_resolution_pipelines" USING "btree" ("confidence_level");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_division" ON "public"."ai_resolution_pipelines" USING "btree" ("bangladesh_division");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_language" ON "public"."ai_resolution_pipelines" USING "btree" ("detected_language");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_market" ON "public"."ai_resolution_pipelines" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_pipeline_id" ON "public"."ai_resolution_pipelines" USING "btree" ("pipeline_id");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_started" ON "public"."ai_resolution_pipelines" USING "btree" ("started_at");



CREATE INDEX IF NOT EXISTS "idx_ai_pipelines_status" ON "public"."ai_resolution_pipelines" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_ai_topics_category" ON "public"."ai_daily_topics" USING "btree" ("suggested_category");



CREATE INDEX IF NOT EXISTS "idx_ai_topics_generated" ON "public"."ai_daily_topics" USING "btree" ("generated_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_ai_topics_status" ON "public"."ai_daily_topics" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_ai_usage_agent_date" ON "public"."ai_usage_logs" USING "btree" ("agent_key", "usage_date");



CREATE INDEX IF NOT EXISTS "idx_analytics_daily_date" ON "public"."analytics_snapshots_daily" USING "btree" ("date" DESC);



CREATE INDEX IF NOT EXISTS "idx_analytics_hourly_time" ON "public"."analytics_snapshots_hourly" USING "btree" ("bucket_start" DESC);



CREATE INDEX IF NOT EXISTS "idx_balance_holds_user" ON "public"."balance_holds" USING "btree" ("user_id", "created_at");



CREATE INDEX IF NOT EXISTS "idx_batches_market" ON "public"."settlement_batches" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_batches_status" ON "public"."settlement_batches" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_bd_cricket_events_date" ON "public"."bd_cricket_events" USING "btree" ("match_date");



CREATE INDEX IF NOT EXISTS "idx_bd_cricket_events_opponent" ON "public"."bd_cricket_events" USING "btree" ("opponent");



CREATE INDEX IF NOT EXISTS "idx_bd_economic_indicators_date" ON "public"."bd_economic_indicators" USING "btree" ("indicator_date");



CREATE INDEX IF NOT EXISTS "idx_bd_economic_indicators_name" ON "public"."bd_economic_indicators" USING "btree" ("indicator_name");



CREATE INDEX IF NOT EXISTS "idx_bd_news_sources_active" ON "public"."bd_news_sources" USING "btree" ("is_active");



CREATE INDEX IF NOT EXISTS "idx_bd_news_sources_category" ON "public"."bd_news_sources" USING "btree" ("category");



CREATE INDEX IF NOT EXISTS "idx_bd_news_sources_type" ON "public"."bd_news_sources" USING "btree" ("source_type");



CREATE INDEX IF NOT EXISTS "idx_bd_political_events_date" ON "public"."bd_political_events" USING "btree" ("event_date");



CREATE INDEX IF NOT EXISTS "idx_bd_political_events_type" ON "public"."bd_political_events" USING "btree" ("event_type");



CREATE INDEX IF NOT EXISTS "idx_cancellation_order" ON "public"."cancellation_records" USING "btree" ("order_id");



CREATE INDEX IF NOT EXISTS "idx_cancellation_sequence" ON "public"."cancellation_records" USING "btree" ("sequence_number");



CREATE INDEX IF NOT EXISTS "idx_cancellation_time" ON "public"."cancellation_records" USING "btree" ("requested_at");



CREATE INDEX IF NOT EXISTS "idx_claims_market" ON "public"."settlement_claims" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_claims_status" ON "public"."settlement_claims" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_claims_user" ON "public"."settlement_claims" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_comment_likes_comment" ON "public"."comment_likes" USING "btree" ("comment_id");



CREATE INDEX IF NOT EXISTS "idx_comment_likes_user" ON "public"."comment_likes" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_comments_event_created" ON "public"."comments" USING "btree" ("event_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_comments_market_created" ON "public"."market_comments" USING "btree" ("market_id", "created_at");



CREATE INDEX IF NOT EXISTS "idx_comments_user" ON "public"."comments" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_commitments_hash" ON "public"."order_commitments" USING "btree" ("commitment_hash");



CREATE INDEX IF NOT EXISTS "idx_deposits_status_created" ON "public"."deposit_requests" USING "btree" ("status", "created_at");



CREATE INDEX IF NOT EXISTS "idx_deposits_txn_provider" ON "public"."deposit_requests" USING "btree" ("txn_id", "payment_method");



CREATE INDEX IF NOT EXISTS "idx_deposits_user" ON "public"."deposit_requests" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_dispute_records_event" ON "public"."dispute_records" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_disputes_challenger" ON "public"."disputes" USING "btree" ("challenger_id");



CREATE INDEX IF NOT EXISTS "idx_disputes_deadline" ON "public"."disputes" USING "btree" ("deadline_at");



CREATE INDEX IF NOT EXISTS "idx_disputes_level" ON "public"."disputes" USING "btree" ("level");



CREATE INDEX IF NOT EXISTS "idx_disputes_market" ON "public"."disputes" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_disputes_status" ON "public"."disputes" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_events_category" ON "public"."events" USING "btree" ("category");



CREATE INDEX IF NOT EXISTS "idx_events_created_at" ON "public"."events" USING "btree" ("created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_events_created_by" ON "public"."events" USING "btree" ("created_by");



CREATE INDEX IF NOT EXISTS "idx_events_event_date" ON "public"."events" USING "btree" ("event_date");



CREATE INDEX IF NOT EXISTS "idx_events_is_featured" ON "public"."events" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX IF NOT EXISTS "idx_events_is_trending" ON "public"."events" USING "btree" ("is_trending") WHERE ("is_trending" = true);



CREATE INDEX IF NOT EXISTS "idx_events_market_id" ON "public"."events" USING "btree" ("market_id") WHERE ("market_id" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_events_search" ON "public"."events" USING "gin" ("search_vector");



CREATE INDEX IF NOT EXISTS "idx_events_slug" ON "public"."events" USING "btree" ("slug");



CREATE INDEX IF NOT EXISTS "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_events_status_category" ON "public"."events" USING "btree" ("status", "category_id");



CREATE INDEX IF NOT EXISTS "idx_events_tags" ON "public"."events" USING "gin" ("tags");



CREATE INDEX IF NOT EXISTS "idx_events_title" ON "public"."events" USING "btree" ("title");



CREATE INDEX IF NOT EXISTS "idx_events_trading_closes" ON "public"."events" USING "btree" ("trading_closes_at");



CREATE INDEX IF NOT EXISTS "idx_evidence_cache_expires" ON "public"."ai_evidence_cache" USING "btree" ("expires_at");



CREATE INDEX IF NOT EXISTS "idx_exchange_rates_effective" ON "public"."exchange_rates" USING "btree" ("effective_from", "effective_until");



CREATE INDEX IF NOT EXISTS "idx_expert_active" ON "public"."expert_panel_members" USING "btree" ("is_active");



CREATE INDEX IF NOT EXISTS "idx_expert_assignments_event" ON "public"."expert_assignments" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_expert_assignments_expert" ON "public"."expert_assignments" USING "btree" ("expert_id");



CREATE INDEX IF NOT EXISTS "idx_expert_expertise" ON "public"."expert_panel_members" USING "gin" ("expertise");



CREATE INDEX IF NOT EXISTS "idx_expert_panel_active" ON "public"."expert_panel" USING "btree" ("is_active", "is_verified");



CREATE INDEX IF NOT EXISTS "idx_expert_panel_reputation" ON "public"."expert_panel" USING "btree" ("reputation_score" DESC);



CREATE INDEX IF NOT EXISTS "idx_expert_panel_specializations" ON "public"."expert_panel" USING "gin" ("specializations");



CREATE INDEX IF NOT EXISTS "idx_expert_panel_user" ON "public"."expert_panel" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_expert_votes_event" ON "public"."expert_votes" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_expert_votes_expert" ON "public"."expert_votes" USING "btree" ("expert_id");



CREATE INDEX IF NOT EXISTS "idx_expert_votes_status" ON "public"."expert_votes" USING "btree" ("ai_verification_status");



CREATE INDEX IF NOT EXISTS "idx_fill_records_order" ON "public"."fill_records" USING "btree" ("order_id", "fill_number");



CREATE INDEX IF NOT EXISTS "idx_fill_records_time" ON "public"."fill_records" USING "btree" ("filled_at");



CREATE INDEX IF NOT EXISTS "idx_fill_records_trade" ON "public"."fill_records" USING "btree" ("trade_id");



CREATE INDEX IF NOT EXISTS "idx_follow_requests_requester" ON "public"."follow_requests" USING "btree" ("requester_id");



CREATE INDEX IF NOT EXISTS "idx_follow_requests_target" ON "public"."follow_requests" USING "btree" ("target_id", "status");



CREATE INDEX IF NOT EXISTS "idx_followers_market" ON "public"."market_followers" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_followers_notify_resolve" ON "public"."market_followers" USING "btree" ("market_id", "notify_on_resolve") WHERE ("notify_on_resolve" = true);



CREATE INDEX IF NOT EXISTS "idx_followers_notify_trade" ON "public"."market_followers" USING "btree" ("market_id", "notify_on_trade") WHERE ("notify_on_trade" = true);



CREATE INDEX IF NOT EXISTS "idx_followers_user" ON "public"."market_followers" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_generation_jobs_config" ON "public"."ai_topic_generation_jobs" USING "btree" ("config_id");



CREATE INDEX IF NOT EXISTS "idx_generation_jobs_status" ON "public"."ai_topic_generation_jobs" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_human_review_assigned" ON "public"."human_review_queue" USING "btree" ("assigned_to");



CREATE INDEX IF NOT EXISTS "idx_human_review_deadline" ON "public"."human_review_queue" USING "btree" ("deadline_at");



CREATE INDEX IF NOT EXISTS "idx_human_review_pending" ON "public"."human_review_queue" USING "btree" ("status", "priority") WHERE (("status")::"text" = 'pending'::"text");



CREATE INDEX IF NOT EXISTS "idx_human_review_priority" ON "public"."human_review_queue" USING "btree" ("priority");



CREATE INDEX IF NOT EXISTS "idx_human_review_status" ON "public"."human_review_queue" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_idem_user" ON "public"."idempotency_keys" USING "btree" ("user_id", "created_at");



CREATE INDEX IF NOT EXISTS "idx_kyc_documents_status" ON "public"."kyc_documents" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_kyc_documents_user" ON "public"."kyc_documents" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_leaderboard_mv_rank" ON "public"."leaderboard_mv" USING "btree" ("rank");



CREATE INDEX IF NOT EXISTS "idx_leaderboard_mv_score" ON "public"."leaderboard_mv" USING "btree" ("score" DESC);



CREATE UNIQUE INDEX IF NOT EXISTS "idx_leaderboard_mv_user" ON "public"."leaderboard_mv" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_leaderboard_pnl" ON "public"."leaderboard" USING "btree" ("total_pnl" DESC);



CREATE INDEX IF NOT EXISTS "idx_leaderboard_roi" ON "public"."leaderboard_cache" USING "btree" ("timeframe", "roi" DESC);



CREATE INDEX IF NOT EXISTS "idx_leaderboard_score" ON "public"."leaderboard" USING "btree" ("score" DESC);



CREATE INDEX IF NOT EXISTS "idx_leaderboard_season" ON "public"."leaderboard" USING "btree" ("season");



CREATE INDEX IF NOT EXISTS "idx_leaderboard_tier" ON "public"."leaderboard" USING "btree" ("rank_tier");



CREATE INDEX IF NOT EXISTS "idx_leaderboard_user" ON "public"."leaderboard" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_leaderboard_user_id" ON "public"."leaderboard" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_legal_queue_assigned" ON "public"."legal_review_queue" USING "btree" ("assigned_to");



CREATE INDEX IF NOT EXISTS "idx_legal_queue_status" ON "public"."legal_review_queue" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_maker_rebates_month" ON "public"."maker_rebates" USING "btree" ("year_month");



CREATE INDEX IF NOT EXISTS "idx_maker_rebates_status" ON "public"."maker_rebates" USING "btree" ("claim_status");



CREATE INDEX IF NOT EXISTS "idx_maker_rebates_user" ON "public"."maker_rebates" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_maker_rebates_user_month" ON "public"."maker_rebates" USING "btree" ("user_id", "year_month");



CREATE INDEX IF NOT EXISTS "idx_market_comments_depth" ON "public"."market_comments" USING "btree" ("depth_level");



CREATE INDEX IF NOT EXISTS "idx_market_comments_market_id" ON "public"."market_comments" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_market_comments_parent_id" ON "public"."market_comments" USING "btree" ("parent_id");



CREATE INDEX IF NOT EXISTS "idx_market_comments_score" ON "public"."market_comments" USING "btree" ("score" DESC);



CREATE INDEX IF NOT EXISTS "idx_market_comments_user_id" ON "public"."market_comments" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_market_daily_stats" ON "public"."market_daily_stats" USING "btree" ("market_id", "date" DESC);



CREATE INDEX IF NOT EXISTS "idx_market_drafts_creator" ON "public"."market_creation_drafts" USING "btree" ("creator_id");



CREATE INDEX IF NOT EXISTS "idx_market_drafts_legal_review" ON "public"."market_creation_drafts" USING "btree" ("legal_review_status") WHERE ("legal_review_status" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_market_drafts_stage" ON "public"."market_creation_drafts" USING "btree" ("current_stage");



CREATE INDEX IF NOT EXISTS "idx_market_drafts_status" ON "public"."market_creation_drafts" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_market_followers_market" ON "public"."market_followers" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_market_followers_user" ON "public"."market_followers" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_market_follows_market" ON "public"."market_follows" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_market_follows_user" ON "public"."market_follows" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_markets_best_ask" ON "public"."markets" USING "btree" ("best_ask") WHERE ("best_ask" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_markets_best_bid" ON "public"."markets" USING "btree" ("best_bid" DESC) WHERE ("best_bid" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_markets_category" ON "public"."markets" USING "btree" ("category");



CREATE INDEX IF NOT EXISTS "idx_markets_created_by" ON "public"."markets" USING "btree" ("created_by");



CREATE INDEX IF NOT EXISTS "idx_markets_ends_at" ON "public"."markets" USING "btree" ("ends_at");



CREATE INDEX IF NOT EXISTS "idx_markets_event_id" ON "public"."markets" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_markets_event_status" ON "public"."markets" USING "btree" ("event_id", "status");



CREATE INDEX IF NOT EXISTS "idx_markets_is_featured" ON "public"."markets" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX IF NOT EXISTS "idx_markets_slug" ON "public"."markets" USING "btree" ("slug");



CREATE UNIQUE INDEX IF NOT EXISTS "idx_markets_slug_unique" ON "public"."markets" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_markets_status" ON "public"."markets" USING "btree" ("status", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_markets_subcategory" ON "public"."markets" USING "btree" ("subcategory");



CREATE INDEX IF NOT EXISTS "idx_markets_tags" ON "public"."markets" USING "gin" ("tags");



CREATE INDEX IF NOT EXISTS "idx_markets_trading_ends" ON "public"."markets" USING "btree" ("trading_ends");



CREATE INDEX IF NOT EXISTS "idx_markets_trading_ends_category" ON "public"."markets" USING "btree" ("trading_ends", "category") WHERE ("status" = 'active'::"public"."market_status");



CREATE INDEX IF NOT EXISTS "idx_markets_trading_phase" ON "public"."markets" USING "btree" ("trading_phase");



CREATE INDEX IF NOT EXISTS "idx_model_versions_active" ON "public"."ai_model_versions" USING "btree" ("model_type", "deployment_status") WHERE (("deployment_status")::"text" = 'active'::"text");



CREATE INDEX IF NOT EXISTS "idx_model_versions_status" ON "public"."ai_model_versions" USING "btree" ("deployment_status");



CREATE INDEX IF NOT EXISTS "idx_model_versions_type" ON "public"."ai_model_versions" USING "btree" ("model_type");



CREATE INDEX IF NOT EXISTS "idx_notifications_market" ON "public"."notifications" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "public"."notifications" USING "btree" ("user_id", "type", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC) WHERE ("read" = false);



CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "read", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX IF NOT EXISTS "idx_oracle_disputes_request" ON "public"."oracle_disputes" USING "btree" ("request_id");



CREATE INDEX IF NOT EXISTS "idx_oracle_market_id" ON "public"."oracle_requests" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_oracle_requests_challenge_end" ON "public"."oracle_requests" USING "btree" ("challenge_window_ends_at");



CREATE INDEX IF NOT EXISTS "idx_oracle_requests_market" ON "public"."oracle_requests" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_oracle_requests_status" ON "public"."oracle_requests" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_order_batches_status" ON "public"."order_batches" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_order_batches_user" ON "public"."order_batches" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_order_book_market_side_price_asc_created_asc" ON "public"."order_book" USING "btree" ("market_id", "side", "price", "created_at") WHERE (("status")::"text" = ANY ((ARRAY['OPEN'::character varying, 'PARTIAL'::character varying])::"text"[]));



CREATE INDEX IF NOT EXISTS "idx_order_book_market_side_price_desc_created_asc" ON "public"."order_book" USING "btree" ("market_id", "side", "price" DESC, "created_at") WHERE (("status")::"text" = ANY ((ARRAY['OPEN'::character varying, 'PARTIAL'::character varying])::"text"[]));



CREATE INDEX IF NOT EXISTS "idx_orders_batch" ON "public"."orders_legacy" USING "btree" ("batch_id") WHERE ("batch_id" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_orders_batch_id" ON "public"."orders_legacy" USING "btree" ("batch_id") WHERE ("batch_id" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_orders_book" ON "public"."orders_legacy" USING "btree" ("market_id", "outcome", "side", "status", "price") WHERE ("status" = ANY (ARRAY['open'::"public"."order_status", 'partially_filled'::"public"."order_status"]));



CREATE INDEX IF NOT EXISTS "idx_orders_client_order_id" ON "public"."orders_legacy" USING "btree" ("client_order_id") WHERE ("client_order_id" IS NOT NULL);



CREATE INDEX IF NOT EXISTS "idx_orders_expires_at" ON "public"."orders_legacy" USING "btree" ("expires_at") WHERE (("expires_at" IS NOT NULL) AND ("status" = 'open'::"public"."order_status"));



CREATE INDEX IF NOT EXISTS "idx_orders_market_side_price_status" ON "public"."orders_legacy" USING "btree" ("market_id", "side", "price", "status") WHERE ("status" = ANY (ARRAY['open'::"public"."order_status", 'partially_filled'::"public"."order_status"]));



CREATE INDEX IF NOT EXISTS "idx_orders_market_status_price" ON ONLY "public"."orders" USING "btree" ("market_id", "status", "price");



CREATE INDEX IF NOT EXISTS "idx_orders_market_user" ON "public"."orders_legacy" USING "btree" ("market_id", "user_id");



CREATE INDEX IF NOT EXISTS "idx_orders_matching" ON "public"."orders_legacy" USING "btree" ("market_id", "outcome", "side", "status", "price", "created_at") WHERE ("status" = ANY (ARRAY['open'::"public"."order_status", 'partially_filled'::"public"."order_status"]));



CREATE INDEX IF NOT EXISTS "idx_orders_matching_v2" ON "public"."orders_legacy" USING "btree" ("market_id", "outcome", "side", "status", "price") WHERE ("status" = 'open'::"public"."order_status");



CREATE INDEX IF NOT EXISTS "idx_orders_stop_price" ON "public"."orders_legacy" USING "btree" ("stop_price", "trigger_condition", "status") WHERE (("order_type" = ANY (ARRAY['stop_loss'::"public"."order_type", 'take_profit'::"public"."order_type"])) AND ("status" = 'open'::"public"."order_status"));



CREATE INDEX IF NOT EXISTS "idx_orders_user" ON "public"."orders_legacy" USING "btree" ("user_id", "status");



CREATE INDEX IF NOT EXISTS "idx_orders_user_active" ON "public"."orders_legacy" USING "btree" ("user_id", "status", "created_at" DESC) WHERE ("status" <> ALL (ARRAY['filled'::"public"."order_status", 'cancelled'::"public"."order_status", 'expired'::"public"."order_status"]));



CREATE INDEX IF NOT EXISTS "idx_orders_user_created" ON ONLY "public"."orders" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_orders_user_status" ON "public"."orders_legacy" USING "btree" ("user_id", "status") WHERE ("status" = ANY (ARRAY['open'::"public"."order_status", 'partially_filled'::"public"."order_status"]));



CREATE INDEX IF NOT EXISTS "idx_outcomes_market_id" ON "public"."outcomes" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_payment_tx_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_payment_tx_trxid" ON "public"."payment_transactions" USING "btree" ("transaction_id");



CREATE INDEX IF NOT EXISTS "idx_payment_tx_user" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_positions_user_market" ON "public"."positions" USING "btree" ("user_id", "market_id");



CREATE INDEX IF NOT EXISTS "idx_positions_user_outcome" ON "public"."positions" USING "btree" ("user_id", "outcome_index");



CREATE INDEX IF NOT EXISTS "idx_price_history_market" ON "public"."price_history" USING "btree" ("market_id", "recorded_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_price_history_market_outcome" ON "public"."price_history" USING "btree" ("market_id", "outcome", "recorded_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_price_history_market_time" ON "public"."price_history" USING "btree" ("market_id", "recorded_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_price_history_outcome" ON "public"."price_history" USING "btree" ("market_id", "outcome", "recorded_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_price_history_recorded" ON "public"."price_history" USING "btree" ("recorded_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_price_history_recorded_brin" ON "public"."price_history" USING "brin" ("recorded_at");



CREATE UNIQUE INDEX IF NOT EXISTS "idx_price_ohlc_1h_unique" ON "public"."price_ohlc_1h" USING "btree" ("market_id", "outcome", "hour");



CREATE INDEX IF NOT EXISTS "idx_resolution_systems_event" ON "public"."resolution_systems" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_resolution_systems_scheduled" ON "public"."resolution_systems" USING "btree" ("scheduled_resolution_at") WHERE (("status")::"text" = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying])::"text"[]));



CREATE INDEX IF NOT EXISTS "idx_resolution_systems_status" ON "public"."resolution_systems" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_resolvers_active" ON "public"."resolvers" USING "btree" ("is_active", "type");



CREATE INDEX IF NOT EXISTS "idx_resting_orders_active" ON "public"."resting_orders" USING "btree" ("user_id", "is_active");



CREATE INDEX IF NOT EXISTS "idx_resting_orders_market" ON "public"."resting_orders" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_resting_orders_time" ON "public"."resting_orders" USING "btree" ("resting_start_time", "resting_end_time");



CREATE INDEX IF NOT EXISTS "idx_resting_orders_user" ON "public"."resting_orders" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_spread_rewards_date" ON "public"."spread_rewards" USING "btree" ("calculation_date");



CREATE INDEX IF NOT EXISTS "idx_spread_rewards_tier" ON "public"."spread_rewards" USING "btree" ("spread_tier");



CREATE INDEX IF NOT EXISTS "idx_spread_rewards_user" ON "public"."spread_rewards" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_topic_configs_active" ON "public"."ai_topic_configs" USING "btree" ("is_active");



CREATE INDEX IF NOT EXISTS "idx_topic_configs_context" ON "public"."ai_topic_configs" USING "btree" ("context_type");



CREATE INDEX IF NOT EXISTS "idx_trades_created" ON "public"."trades_legacy" USING "btree" ("created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_trades_executed_brin" ON ONLY "public"."trades" USING "brin" ("executed_at");



CREATE INDEX IF NOT EXISTS "idx_trades_maker_taker" ON "public"."trades_legacy" USING "btree" ("maker_id", "taker_id");



CREATE INDEX IF NOT EXISTS "idx_trades_market" ON "public"."trades_legacy" USING "btree" ("market_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_trades_market_created" ON "public"."trades_legacy" USING "btree" ("market_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_trades_market_executed" ON ONLY "public"."trades" USING "btree" ("market_id", "executed_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_trades_settlement" ON "public"."trades_legacy" USING "btree" ("settlement_status") WHERE ("settlement_status" = 'pending'::"text");



CREATE INDEX IF NOT EXISTS "idx_trades_user" ON "public"."trades_legacy" USING "btree" ("maker_id", "taker_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_transactions_user" ON "public"."transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_transactions_user_created" ON "public"."transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_runs_event" ON "public"."upstash_workflow_runs" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_upstash_workflow_runs_status" ON "public"."upstash_workflow_runs" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_user_bookmarks_created" ON "public"."user_bookmarks" USING "btree" ("created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_user_bookmarks_market" ON "public"."user_bookmarks" USING "btree" ("market_id");



CREATE INDEX IF NOT EXISTS "idx_user_bookmarks_user" ON "public"."user_bookmarks" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_user_follows_created" ON "public"."user_follows" USING "btree" ("created_at");



CREATE INDEX IF NOT EXISTS "idx_user_follows_follower" ON "public"."user_follows" USING "btree" ("follower_id");



CREATE INDEX IF NOT EXISTS "idx_user_follows_following" ON "public"."user_follows" USING "btree" ("following_id");



CREATE INDEX IF NOT EXISTS "idx_user_leagues_points" ON "public"."user_leagues" USING "btree" ("league_id", "current_points" DESC);



CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX IF NOT EXISTS "idx_users_is_admin" ON "public"."users" USING "btree" ("id") WHERE ("is_admin" = true);



CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_wallet_email" ON "public"."users" USING "btree" ("wallet_address", "email") WHERE (("wallet_address" IS NOT NULL) AND ("email" IS NOT NULL));



CREATE INDEX IF NOT EXISTS "idx_verification_workflows_category" ON "public"."verification_workflows" USING "btree" ("event_category");



CREATE INDEX IF NOT EXISTS "idx_verification_workflows_created_at" ON "public"."verification_workflows" USING "btree" ("created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_verification_workflows_enabled" ON "public"."verification_workflows" USING "btree" ("enabled");



CREATE INDEX IF NOT EXISTS "idx_volume_tracking_month" ON "public"."maker_volume_tracking" USING "btree" ("year_month");



CREATE INDEX IF NOT EXISTS "idx_volume_tracking_tier" ON "public"."maker_volume_tracking" USING "btree" ("rebate_tier");



CREATE INDEX IF NOT EXISTS "idx_volume_tracking_user" ON "public"."maker_volume_tracking" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_wallet_transactions_user_created" ON "public"."wallet_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_wallet_tx_status" ON "public"."wallet_transactions" USING "btree" ("status");



CREATE INDEX IF NOT EXISTS "idx_wallet_tx_type" ON "public"."wallet_transactions" USING "btree" ("transaction_type");



CREATE INDEX IF NOT EXISTS "idx_wallet_tx_user" ON "public"."wallet_transactions" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_wallets_active" ON "public"."wallets" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX IF NOT EXISTS "idx_wallets_active_usdc" ON "public"."wallets" USING "btree" ("usdc_address") WHERE (("usdc_address" IS NOT NULL) AND ("is_active" = true));



CREATE INDEX IF NOT EXISTS "idx_wallets_active_usdt" ON "public"."wallets" USING "btree" ("usdt_address") WHERE (("usdt_address" IS NOT NULL) AND ("is_active" = true));



CREATE INDEX IF NOT EXISTS "idx_wallets_balance" ON "public"."wallets" USING "btree" ("balance" DESC) WHERE ("balance" > (0)::numeric);



CREATE INDEX IF NOT EXISTS "idx_wallets_user" ON "public"."wallets" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_wallets_user_id" ON "public"."wallets" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_withdrawal_verif_expires" ON "public"."withdrawal_verifications" USING "btree" ("expires_at");



CREATE INDEX IF NOT EXISTS "idx_withdrawal_verif_user" ON "public"."withdrawal_verifications" USING "btree" ("user_id");



CREATE INDEX IF NOT EXISTS "idx_withdrawals_status_created" ON "public"."withdrawal_requests" USING "btree" ("status", "created_at");



CREATE INDEX IF NOT EXISTS "idx_withdrawals_user" ON "public"."withdrawal_requests" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_workflow_dlq_event" ON "public"."workflow_dlq" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_workflow_executions_event_id" ON "public"."workflow_executions" USING "btree" ("event_id");



CREATE INDEX IF NOT EXISTS "idx_workflow_executions_name_date" ON "public"."workflow_executions" USING "btree" ("workflow_name", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_workflow_executions_outcome" ON "public"."workflow_executions" USING "btree" ("outcome");



CREATE INDEX IF NOT EXISTS "idx_workflow_executions_status" ON "public"."workflow_executions" USING "btree" ("status", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "idx_workflow_executions_type" ON "public"."workflow_executions" USING "btree" ("workflow_type");



CREATE INDEX IF NOT EXISTS "idx_workflow_executions_workflow_id" ON "public"."workflow_executions" USING "btree" ("workflow_id");



CREATE INDEX IF NOT EXISTS "idx_workflow_is_active" ON "public"."workflow_configs" USING "btree" ("is_active");



CREATE INDEX IF NOT EXISTS "idx_workflow_schedules_active" ON "public"."workflow_schedules" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX IF NOT EXISTS "idx_workflow_schedules_type" ON "public"."workflow_schedules" USING "btree" ("workflow_type");



CREATE INDEX IF NOT EXISTS "idx_workflow_steps_execution" ON "public"."workflow_steps" USING "btree" ("execution_id");



CREATE INDEX IF NOT EXISTS "orders_2026_03_market_id_status_price_idx" ON "public"."orders_2026_03" USING "btree" ("market_id", "status", "price");



CREATE INDEX IF NOT EXISTS "orders_2026_03_user_id_created_at_idx" ON "public"."orders_2026_03" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "orders_2026_04_market_id_status_price_idx" ON "public"."orders_2026_04" USING "btree" ("market_id", "status", "price");



CREATE INDEX IF NOT EXISTS "orders_2026_04_user_id_created_at_idx" ON "public"."orders_2026_04" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "orders_2026_05_market_id_status_price_idx" ON "public"."orders_2026_05" USING "btree" ("market_id", "status", "price");



CREATE INDEX IF NOT EXISTS "orders_2026_05_user_id_created_at_idx" ON "public"."orders_2026_05" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX IF NOT EXISTS "trades_2026_03_executed_at_idx" ON "public"."trades_2026_03" USING "brin" ("executed_at");



CREATE INDEX IF NOT EXISTS "trades_2026_03_market_id_executed_at_idx" ON "public"."trades_2026_03" USING "btree" ("market_id", "executed_at" DESC);



CREATE INDEX IF NOT EXISTS "trades_2026_04_executed_at_idx" ON "public"."trades_2026_04" USING "brin" ("executed_at");



CREATE INDEX IF NOT EXISTS "trades_2026_04_market_id_executed_at_idx" ON "public"."trades_2026_04" USING "btree" ("market_id", "executed_at" DESC);



CREATE INDEX IF NOT EXISTS "trades_2026_05_executed_at_idx" ON "public"."trades_2026_05" USING "brin" ("executed_at");



CREATE INDEX IF NOT EXISTS "trades_2026_05_market_id_executed_at_idx" ON "public"."trades_2026_05" USING "btree" ("market_id", "executed_at" DESC);



DO $$
BEGIN
    ALTER INDEX "public"."idx_orders_market_status_price" ATTACH PARTITION "public"."orders_2026_03_market_id_status_price_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."orders_v2_pkey" ATTACH PARTITION "public"."orders_2026_03_pkey";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_orders_user_created" ATTACH PARTITION "public"."orders_2026_03_user_id_created_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_orders_market_status_price" ATTACH PARTITION "public"."orders_2026_04_market_id_status_price_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."orders_v2_pkey" ATTACH PARTITION "public"."orders_2026_04_pkey";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_orders_user_created" ATTACH PARTITION "public"."orders_2026_04_user_id_created_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_orders_market_status_price" ATTACH PARTITION "public"."orders_2026_05_market_id_status_price_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."orders_v2_pkey" ATTACH PARTITION "public"."orders_2026_05_pkey";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_orders_user_created" ATTACH PARTITION "public"."orders_2026_05_user_id_created_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_trades_executed_brin" ATTACH PARTITION "public"."trades_2026_03_executed_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_trades_market_executed" ATTACH PARTITION "public"."trades_2026_03_market_id_executed_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."trades_v2_pkey" ATTACH PARTITION "public"."trades_2026_03_pkey";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_trades_executed_brin" ATTACH PARTITION "public"."trades_2026_04_executed_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_trades_market_executed" ATTACH PARTITION "public"."trades_2026_04_market_id_executed_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."trades_v2_pkey" ATTACH PARTITION "public"."trades_2026_04_pkey";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_trades_executed_brin" ATTACH PARTITION "public"."trades_2026_05_executed_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."idx_trades_market_executed" ATTACH PARTITION "public"."trades_2026_05_market_id_executed_at_idx";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    ALTER INDEX "public"."trades_v2_pkey" ATTACH PARTITION "public"."trades_2026_05_pkey";
EXCEPTION
    WHEN SQLSTATE '42809' THEN
        -- Ignore error: already a partition
        NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "check_user_eligibility_before_deposit" BEFORE INSERT ON "public"."manual_deposits" FOR EACH ROW EXECUTE FUNCTION "public"."check_trading_eligibility"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "check_user_eligibility_before_order" BEFORE INSERT ON "public"."order_book" FOR EACH ROW EXECUTE FUNCTION "public"."check_trading_eligibility"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "exchange_rates_updated_at" BEFORE UPDATE ON "public"."exchange_rates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "leaderboard_updated_at" BEFORE UPDATE ON "public"."leaderboard" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "markets_updated_at" BEFORE UPDATE ON "public"."markets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "on_new_follower" AFTER INSERT ON "public"."user_follows" FOR EACH ROW EXECUTE FUNCTION "public"."create_follower_notification"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "oracle_updated_at" BEFORE UPDATE ON "public"."oracle_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "seed_orderbook_on_event_activate" AFTER UPDATE OF "status" ON "public"."events" FOR EACH ROW WHEN ((("new"."status")::"text" = 'active'::"text")) EXECUTE FUNCTION "public"."trigger_seed_orderbook_on_event_activation"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "tr_topic_config_updated_at" BEFORE UPDATE ON "public"."ai_topic_configs" FOR EACH ROW EXECUTE FUNCTION "public"."sync_topic_config_updated_at"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "tr_wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trades_updated_at" BEFORE UPDATE ON "public"."trades" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trades_updated_at" BEFORE UPDATE ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_ai_settings_updated" BEFORE UPDATE ON "public"."admin_ai_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_settings_timestamp"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_auto_complete_cancellation" AFTER INSERT ON "public"."cancellation_records" FOR EACH ROW EXECUTE FUNCTION "public"."auto_complete_cancellation"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_auto_log_resolution" AFTER UPDATE ON "public"."markets" FOR EACH ROW EXECUTE FUNCTION "public"."auto_log_market_resolution"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_calc_remaining" BEFORE INSERT OR UPDATE OF "filled_quantity" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_remaining_quantity"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_calc_remaining" BEFORE INSERT OR UPDATE OF "filled_quantity" ON "public"."orders_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_remaining_quantity"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_comment_like_count" AFTER INSERT OR DELETE ON "public"."comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_like_count"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_comments_edit_window" BEFORE UPDATE ON "public"."comments" FOR EACH ROW WHEN (("old"."content" IS DISTINCT FROM "new"."content")) EXECUTE FUNCTION "public"."check_comment_edit_window"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_comments_rate_limit" BEFORE INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."check_comment_rate_limit"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_generate_event_slug" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."generate_event_slug"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_generate_market_slug" BEFORE INSERT OR UPDATE ON "public"."markets" FOR EACH ROW EXECUTE FUNCTION "public"."generate_market_slug"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_markets_updated_at" BEFORE UPDATE ON "public"."markets" FOR EACH ROW EXECUTE FUNCTION "public"."handle_market_updated_at"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_notify_followers" AFTER INSERT ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."notify_market_followers_on_trade"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_notify_resolve" AFTER UPDATE ON "public"."markets" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_market_resolve"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_record_trade_price_history" AFTER INSERT ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."record_trade_price_history"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_trades_unique_traders" AFTER INSERT ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."update_unique_traders"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_trades_volume_update" AFTER INSERT ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."handle_trade_volume_update"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_update_batch_on_fill" AFTER UPDATE OF "status" ON "public"."orders_legacy" FOR EACH ROW WHEN (("old"."status" <> "new"."status")) EXECUTE FUNCTION "public"."update_batch_on_order_fill"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_update_best_quotes" AFTER INSERT OR UPDATE OF "status" ON "public"."orders_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."update_market_best_quotes"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_update_comment_score" AFTER INSERT OR DELETE OR UPDATE ON "public"."comment_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_score"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_update_market_on_trade" AFTER INSERT ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."update_market_on_trade"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trg_validate_outcome_probabilities" AFTER INSERT OR UPDATE OF "current_price" ON "public"."outcomes" FOR EACH ROW EXECUTE FUNCTION "public"."validate_outcome_probabilities"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trig_audit_markets" AFTER UPDATE ON "public"."markets" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."log_entity_change"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trig_audit_user_status" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_status" FOR EACH ROW EXECUTE FUNCTION "public"."log_entity_change"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_cache_top_experts" AFTER UPDATE OF "reputation_score" ON "public"."expert_panel" FOR EACH ROW WHEN (("old"."reputation_score" IS DISTINCT FROM "new"."reputation_score")) EXECUTE FUNCTION "public"."cache_top_experts"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_ensure_uppercase_outcome" BEFORE INSERT OR UPDATE ON "public"."orders_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_uppercase_outcome"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_ensure_uppercase_outcome_positions" BEFORE INSERT OR UPDATE ON "public"."positions" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_uppercase_outcome"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_ensure_uppercase_outcome_trades" BEFORE INSERT OR UPDATE ON "public"."trades_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_uppercase_outcome"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_sync_event_title_question" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."sync_event_title_question"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_update_expert_stats" AFTER INSERT OR UPDATE ON "public"."expert_votes" FOR EACH ROW EXECUTE FUNCTION "public"."update_expert_after_vote"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "trigger_workflow_schedules_updated_at" BEFORE UPDATE ON "public"."workflow_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_ai_pipelines_updated_at" BEFORE UPDATE ON "public"."ai_resolution_pipelines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_category_settings_timestamp" BEFORE UPDATE ON "public"."category_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_circuit_breaker_updated_at" BEFORE UPDATE ON "public"."ai_circuit_breaker_state" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_deposit_requests_updated_at" BEFORE UPDATE ON "public"."deposit_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_events_timestamp"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_exchange_rates_updated_at" BEFORE UPDATE ON "public"."exchange_rates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_market_drafts_updated_at" BEFORE UPDATE ON "public"."market_creation_drafts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_market_templates_updated_at" BEFORE UPDATE ON "public"."market_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_model_versions_updated_at" BEFORE UPDATE ON "public"."ai_model_versions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders_legacy" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_platform_settings_timestamp" BEFORE UPDATE ON "public"."platform_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_timestamp_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_positions_updated_at" BEFORE UPDATE ON "public"."positions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_rate_limit_updated_at" BEFORE UPDATE ON "public"."ai_rate_limit_state" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "update_withdrawal_requests_updated_at" BEFORE UPDATE ON "public"."withdrawal_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE OR REPLACE TRIGGER "wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_ai_settings"
    ADD CONSTRAINT "admin_ai_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_dual_auth_admin_id_fkey" FOREIGN KEY ("dual_auth_admin_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."admin_workflow_triggers"
    ADD CONSTRAINT "admin_workflow_triggers_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_ab_tests"
    ADD CONSTRAINT "ai_ab_tests_model_a_id_fkey" FOREIGN KEY ("model_a_id") REFERENCES "public"."ai_model_versions"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_ab_tests"
    ADD CONSTRAINT "ai_ab_tests_model_b_id_fkey" FOREIGN KEY ("model_b_id") REFERENCES "public"."ai_model_versions"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_ab_tests"
    ADD CONSTRAINT "ai_ab_tests_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "public"."ai_model_versions"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_daily_topics"
    ADD CONSTRAINT "ai_daily_topics_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_daily_topics"
    ADD CONSTRAINT "ai_daily_topics_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_prompts"
    ADD CONSTRAINT "ai_prompts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_providers"
    ADD CONSTRAINT "ai_providers_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_resolution_pipelines"
    ADD CONSTRAINT "ai_resolution_pipelines_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_topic_configs"
    ADD CONSTRAINT "ai_topic_configs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_topic_generation_jobs"
    ADD CONSTRAINT "ai_topic_generation_jobs_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "public"."ai_topic_configs"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_agent_key_fkey" FOREIGN KEY ("agent_key") REFERENCES "public"."ai_agent_configs"("agent_key") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."balance_holds"
    ADD CONSTRAINT "balance_holds_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."balance_holds"
    ADD CONSTRAINT "balance_holds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."cancellation_records"
    ADD CONSTRAINT "cancellation_records_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."cancellation_records"
    ADD CONSTRAINT "cancellation_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order_book"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."category_settings"
    ADD CONSTRAINT "category_settings_paused_by_fkey" FOREIGN KEY ("paused_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."market_comments"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."copy_trading_settings"
    ADD CONSTRAINT "copy_trading_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."custom_categories"
    ADD CONSTRAINT "custom_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."deposit_attempts"
    ADD CONSTRAINT "deposit_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."deposit_requests"
    ADD CONSTRAINT "deposit_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."deposit_requests"
    ADD CONSTRAINT "deposit_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."dispute_records"
    ADD CONSTRAINT "dispute_records_assigned_judge_fkey" FOREIGN KEY ("assigned_judge") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."dispute_records"
    ADD CONSTRAINT "dispute_records_disputed_by_fkey" FOREIGN KEY ("disputed_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_child_dispute_id_fkey" FOREIGN KEY ("child_dispute_id") REFERENCES "public"."disputes"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_parent_dispute_id_fkey" FOREIGN KEY ("parent_dispute_id") REFERENCES "public"."disputes"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."ai_resolution_pipelines"("pipeline_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_paused_by_fkey" FOREIGN KEY ("paused_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_assignments"
    ADD CONSTRAINT "expert_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_assignments"
    ADD CONSTRAINT "expert_assignments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_assignments"
    ADD CONSTRAINT "expert_assignments_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_panel"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel_members"
    ADD CONSTRAINT "expert_panel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel_reviews"
    ADD CONSTRAINT "expert_panel_reviews_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel"
    ADD CONSTRAINT "expert_panel_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_panel"
    ADD CONSTRAINT "expert_panel_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_votes"
    ADD CONSTRAINT "expert_votes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."expert_votes"
    ADD CONSTRAINT "expert_votes_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "public"."expert_panel"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."fill_records"
    ADD CONSTRAINT "fill_records_counterparty_order_id_fkey" FOREIGN KEY ("counterparty_order_id") REFERENCES "public"."order_book"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."fill_records"
    ADD CONSTRAINT "fill_records_counterparty_user_id_fkey" FOREIGN KEY ("counterparty_user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."fill_records"
    ADD CONSTRAINT "fill_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order_book"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."fill_records"
    ADD CONSTRAINT "fill_records_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades_legacy"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "fk_markets_event" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."follow_requests"
    ADD CONSTRAINT "follow_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."follow_requests"
    ADD CONSTRAINT "follow_requests_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."human_review_queue"
    ADD CONSTRAINT "human_review_queue_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."human_review_queue"
    ADD CONSTRAINT "human_review_queue_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."human_review_queue"
    ADD CONSTRAINT "human_review_queue_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."ai_resolution_pipelines"("pipeline_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_admin_overrides"
    ADD CONSTRAINT "kyc_admin_overrides_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_admin_overrides"
    ADD CONSTRAINT "kyc_admin_overrides_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_admin_overrides"
    ADD CONSTRAINT "kyc_admin_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_documents"
    ADD CONSTRAINT "kyc_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_documents"
    ADD CONSTRAINT "kyc_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_settings"
    ADD CONSTRAINT "kyc_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_submissions"
    ADD CONSTRAINT "kyc_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."kyc_submissions"
    ADD CONSTRAINT "kyc_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leaderboard_cache"
    ADD CONSTRAINT "leaderboard_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."leaderboard"
    ADD CONSTRAINT "leaderboard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."legal_review_queue"
    ADD CONSTRAINT "legal_review_queue_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."legal_review_queue"
    ADD CONSTRAINT "legal_review_queue_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "public"."market_creation_drafts"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."maker_rebates"
    ADD CONSTRAINT "maker_rebates_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."maker_rebates"
    ADD CONSTRAINT "maker_rebates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."maker_volume_tracking"
    ADD CONSTRAINT "maker_volume_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."manual_deposits"
    ADD CONSTRAINT "manual_deposits_agent_wallet_id_fkey" FOREIGN KEY ("agent_wallet_id") REFERENCES "public"."agent_wallets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."manual_deposits"
    ADD CONSTRAINT "manual_deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_comments"
    ADD CONSTRAINT "market_comments_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_comments"
    ADD CONSTRAINT "market_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."market_comments"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_comments"
    ADD CONSTRAINT "market_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_creation_drafts"
    ADD CONSTRAINT "market_creation_drafts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_creation_drafts"
    ADD CONSTRAINT "market_creation_drafts_deployed_market_id_fkey" FOREIGN KEY ("deployed_market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_creation_drafts"
    ADD CONSTRAINT "market_creation_drafts_legal_reviewer_id_fkey" FOREIGN KEY ("legal_reviewer_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_creation_drafts"
    ADD CONSTRAINT "market_creation_drafts_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "public"."market_creation_drafts"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_daily_stats"
    ADD CONSTRAINT "market_daily_stats_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_followers"
    ADD CONSTRAINT "market_followers_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_followers"
    ADD CONSTRAINT "market_followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_follows"
    ADD CONSTRAINT "market_follows_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."market_follows"
    ADD CONSTRAINT "market_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "markets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "markets_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."markets"
    ADD CONSTRAINT "markets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades_legacy"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_assertions"
    ADD CONSTRAINT "oracle_assertions_asserter_id_fkey" FOREIGN KEY ("asserter_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_assertions"
    ADD CONSTRAINT "oracle_assertions_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."oracle_requests"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_disputes"
    ADD CONSTRAINT "oracle_disputes_disputer_id_fkey" FOREIGN KEY ("disputer_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_disputes"
    ADD CONSTRAINT "oracle_disputes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."oracle_requests"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_disputes"
    ADD CONSTRAINT "oracle_disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_requests"
    ADD CONSTRAINT "oracle_requests_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_requests"
    ADD CONSTRAINT "oracle_requests_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_verifications"
    ADD CONSTRAINT "oracle_verifications_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."oracle_verifications"
    ADD CONSTRAINT "oracle_verifications_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_batches"
    ADD CONSTRAINT "order_batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_book"
    ADD CONSTRAINT "order_book_event_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_book"
    ADD CONSTRAINT "order_book_parent_order_id_fkey" FOREIGN KEY ("parent_order_id") REFERENCES "public"."order_book"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_commitments"
    ADD CONSTRAINT "order_commitments_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."order_commitments"
    ADD CONSTRAINT "order_commitments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_legacy"
    ADD CONSTRAINT "orders_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."order_batches"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_legacy"
    ADD CONSTRAINT "orders_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_legacy"
    ADD CONSTRAINT "orders_parent_order_id_fkey" FOREIGN KEY ("parent_order_id") REFERENCES "public"."orders_legacy"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."orders_legacy"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_v2_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."orders_v2"
    ADD CONSTRAINT "orders_v2_market_id_fkey1" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."orders"
    ADD CONSTRAINT "orders_v2_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."orders_v2"
    ADD CONSTRAINT "orders_v2_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."outcomes"
    ADD CONSTRAINT "outcomes_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "public"."outcomes"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_feedback"
    ADD CONSTRAINT "resolution_feedback_human_reviewer_id_fkey" FOREIGN KEY ("human_reviewer_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_feedback"
    ADD CONSTRAINT "resolution_feedback_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_feedback"
    ADD CONSTRAINT "resolution_feedback_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."ai_resolution_pipelines"("pipeline_id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_systems"
    ADD CONSTRAINT "resolution_systems_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_systems"
    ADD CONSTRAINT "resolution_systems_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resolution_systems"
    ADD CONSTRAINT "resolution_systems_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resting_orders"
    ADD CONSTRAINT "resting_orders_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resting_orders"
    ADD CONSTRAINT "resting_orders_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders_legacy"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."resting_orders"
    ADD CONSTRAINT "resting_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_batches"
    ADD CONSTRAINT "settlement_batches_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_claims"
    ADD CONSTRAINT "settlement_claims_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_claims"
    ADD CONSTRAINT "settlement_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_escalations"
    ADD CONSTRAINT "settlement_escalations_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."settlement_escalations"
    ADD CONSTRAINT "settlement_escalations_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."spread_rewards"
    ADD CONSTRAINT "spread_rewards_applied_to_rebate_id_fkey" FOREIGN KEY ("applied_to_rebate_id") REFERENCES "public"."maker_rebates"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."spread_rewards"
    ADD CONSTRAINT "spread_rewards_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."spread_rewards"
    ADD CONSTRAINT "spread_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trader_subscriptions"
    ADD CONSTRAINT "trader_subscriptions_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trader_subscriptions"
    ADD CONSTRAINT "trader_subscriptions_trader_id_fkey" FOREIGN KEY ("trader_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_legacy"
    ADD CONSTRAINT "trades_buy_order_id_fkey" FOREIGN KEY ("buy_order_id") REFERENCES "public"."orders_legacy"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_legacy"
    ADD CONSTRAINT "trades_buyer_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_legacy"
    ADD CONSTRAINT "trades_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_legacy"
    ADD CONSTRAINT "trades_sell_order_id_fkey" FOREIGN KEY ("sell_order_id") REFERENCES "public"."orders_legacy"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."trades_legacy"
    ADD CONSTRAINT "trades_seller_id_fkey" FOREIGN KEY ("taker_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."trades"
    ADD CONSTRAINT "trades_v2_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."trades_v2"
    ADD CONSTRAINT "trades_v2_maker_id_fkey1" FOREIGN KEY ("maker_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."trades"
    ADD CONSTRAINT "trades_v2_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."trades_v2"
    ADD CONSTRAINT "trades_v2_market_id_fkey1" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."trades"
    ADD CONSTRAINT "trades_v2_taker_id_fkey" FOREIGN KEY ("taker_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE "public"."trades_v2"
    ADD CONSTRAINT "trades_v2_taker_id_fkey1" FOREIGN KEY ("taker_id") REFERENCES "public"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders_legacy"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "public"."trades_legacy"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."upstash_workflow_runs"
    ADD CONSTRAINT "upstash_workflow_runs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."usdt_transactions"
    ADD CONSTRAINT "usdt_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_kyc_profiles"
    ADD CONSTRAINT "user_kyc_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_kyc_profiles"
    ADD CONSTRAINT "user_kyc_profiles_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_leagues"
    ADD CONSTRAINT "user_leagues_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_leagues"
    ADD CONSTRAINT "user_leagues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_status"
    ADD CONSTRAINT "user_status_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."user_trading_stats"
    ADD CONSTRAINT "user_trading_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."verification_workflows"
    ADD CONSTRAINT "verification_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."verification_workflows"
    ADD CONSTRAINT "verification_workflows_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."withdrawal_requests"
    ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."withdrawal_verifications"
    ADD CONSTRAINT "withdrawal_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_dlq"
    ADD CONSTRAINT "workflow_dlq_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_executions"
    ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."verification_workflows"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_schedules"
    ADD CONSTRAINT "workflow_schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "public"."workflow_executions"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_table_definition THEN NULL;
    WHEN duplicate_table THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admin can manage experts" ON "public"."expert_panel" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admin full access on drafts" ON "public"."market_creation_drafts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admin logs viewable by admin only" ON "public"."admin_activity_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."is_admin" = true) OR ("user_profiles"."is_super_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admin read workflow_configs" ON "public"."workflow_configs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can insert events" ON "public"."events" FOR INSERT WITH CHECK ("public"."is_admin"());
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can insert markets" ON "public"."markets" FOR INSERT WITH CHECK ("public"."is_admin"());
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage KYC overrides" ON "public"."kyc_admin_overrides" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage KYC settings" ON "public"."kyc_settings" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage all KYC submissions" ON "public"."kyc_submissions" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage categories" ON "public"."custom_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage markets" ON "public"."markets" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage oracle" ON "public"."oracle_verifications" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage platform wallets" ON "public"."platform_wallets" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."is_admin" = true) OR ("user_profiles"."is_super_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage resolution systems" ON "public"."resolution_systems" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can manage suggestions" ON "public"."market_suggestions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can modify KYC profiles" ON "public"."user_kyc_profiles" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can modify status" ON "public"."user_status" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can update events" ON "public"."events" FOR UPDATE USING ("public"."is_admin"());
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can update markets" ON "public"."markets" FOR UPDATE USING ("public"."is_admin"());
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all KYC" ON "public"."user_kyc_profiles" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all KYC profiles" ON "public"."user_kyc_profiles" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all audit logs" ON "public"."audit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all profiles" ON "public"."user_profiles" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all status" ON "public"."user_status" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all transactions" ON "public"."wallet_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view all workflow triggers" ON "public"."admin_workflow_triggers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view and update all documents" ON "public"."kyc_documents" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view and update all payment transactions" ON "public"."payment_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view audit log" ON "public"."admin_audit_log" FOR SELECT USING ("public"."is_admin"());
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view audit logs" ON "public"."admin_audit_log" FOR SELECT USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view daily analytics" ON "public"."analytics_snapshots_daily" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view houry analytics" ON "public"."analytics_snapshots_hourly" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view security events" ON "public"."security_events" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view workflow executions" ON "public"."workflow_executions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins can view workflow runs" ON "public"."upstash_workflow_runs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins manage agent configs" ON "public"."ai_agent_configs" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins manage categories" ON "public"."custom_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Admins view usage logs" ON "public"."ai_usage_logs" USING ("public"."is_admin"("auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow admin read schedules" ON "public"."workflow_schedules" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."is_admin" = true) OR ("user_profiles"."is_super_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow all for service role" ON "public"."workflow_analytics_daily" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow delete for creators and admins" ON "public"."market_creation_drafts" FOR DELETE USING ((("auth"."uid"() = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow insert for creators" ON "public"."market_creation_drafts" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow public read" ON "public"."p2p_seller_cache" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow read access to market_creation_drafts" ON "public"."market_creation_drafts" FOR SELECT USING ((("auth"."uid"() = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))) OR (("legal_review_status")::"text" = 'pending'::"text")));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Allow update for creators and admins" ON "public"."market_creation_drafts" FOR UPDATE USING ((("auth"."uid"() = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Anyone can read markets" ON "public"."markets" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Anyone can read trades" ON "public"."trades_legacy" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Anyone can view follower counts" ON "public"."market_followers" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Anyone can view likes" ON "public"."comment_likes" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Anyone can view price history" ON "public"."price_history" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Auth can update exchange rates" ON "public"."exchange_rates" USING (("auth"."role"() = 'authenticated'::"text"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Authenticated users can insert audit logs" ON "public"."admin_audit_log" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Authenticated users can insert exchange rates" ON "public"."exchange_rates" FOR INSERT TO "authenticated" WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Category settings are viewable by everyone" ON "public"."category_settings" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Creators can insert own drafts" ON "public"."market_creation_drafts" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Creators can update own drafts" ON "public"."market_creation_drafts" FOR UPDATE USING ((("auth"."uid"() = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Events viewable by authenticated users" ON "public"."events" FOR SELECT USING (("auth"."uid"() IS NOT NULL));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Exchange rates viewable by everyone" ON "public"."exchange_rates" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Experts are viewable by everyone" ON "public"."expert_panel" FOR SELECT USING ((("is_verified" = true) AND ("is_active" = true)));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Experts can create own votes" ON "public"."expert_votes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."expert_panel" "ep"
  WHERE (("ep"."id" = "expert_votes"."expert_id") AND ("ep"."user_id" = "auth"."uid"())))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Experts can update own profile" ON "public"."expert_panel" FOR UPDATE USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Leaderboard viewable by everyone" ON "public"."leaderboard" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Markets viewable by authenticated users" ON "public"."markets" FOR SELECT USING (("auth"."uid"() IS NOT NULL));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Only admin can insert logs" ON "public"."admin_activity_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."is_admin" = true) OR ("user_profiles"."is_super_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Only admins can update category settings" ON "public"."category_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Only admins can update platform settings" ON "public"."platform_settings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Oracle requests viewable by everyone" ON "public"."oracle_requests" FOR SELECT USING (("auth"."uid"() IS NOT NULL));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Platform settings are viewable by everyone" ON "public"."platform_settings" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can read exchange rates" ON "public"."exchange_rates" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can view active categories" ON "public"."custom_categories" FOR SELECT USING (("is_active" = true));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can view active platform wallets" ON "public"."platform_wallets" FOR SELECT USING (("is_active" = true));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can view categories" ON "public"."custom_categories" FOR SELECT USING (("is_active" = true));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can view events" ON "public"."events" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can view markets" ON "public"."markets" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Public can view resolution systems" ON "public"."resolution_systems" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role bypass" ON "public"."wallets" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role bypass dlq" ON "public"."workflow_dlq" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role bypass workflow runs" ON "public"."upstash_workflow_runs" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role can insert workflow triggers" ON "public"."admin_workflow_triggers" FOR INSERT TO "service_role" WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role can manage markets" ON "public"."markets" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role can manage verifications" ON "public"."withdrawal_verifications" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role can manage workflow executions" ON "public"."workflow_executions" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role full access on exchange_rates" ON "public"."exchange_rates" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role full access schedules" ON "public"."workflow_schedules" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Service role full access workflow_configs" ON "public"."workflow_configs" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Super admin full access on drafts" ON "public"."market_creation_drafts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_super_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_super_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Super admins can manage ai_prompts" ON "public"."ai_prompts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_super_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Super admins can manage ai_providers" ON "public"."ai_providers" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_super_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Super admins can view ai_prompts" ON "public"."ai_prompts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_super_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Super admins can view ai_providers" ON "public"."ai_providers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_super_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "System can insert cancellation records" ON "public"."cancellation_records" FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "System can insert fill records" ON "public"."fill_records" FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "System can insert price history" ON "public"."price_history" FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "System can update cancellation records" ON "public"."cancellation_records" FOR UPDATE USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Target users can update requests" ON "public"."follow_requests" FOR UPDATE USING (("target_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can cancel own orders" ON "public"."orders_legacy" FOR UPDATE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create disputes" ON "public"."dispute_records" FOR INSERT TO "authenticated" WITH CHECK (("disputed_by" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create disputes" ON "public"."oracle_disputes" FOR INSERT WITH CHECK (("auth"."uid"() = "disputer_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create follow requests" ON "public"."follow_requests" FOR INSERT WITH CHECK (("requester_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create manual deposits if KYC level 1" ON "public"."manual_deposits" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"public"."user_account_status") AND ("user_profiles"."kyc_level" >= 1))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create orders" ON "public"."orders_legacy" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create orders if active" ON "public"."order_book" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."status" = 'active'::"public"."user_account_status"))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create own KYC submissions" ON "public"."kyc_submissions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create payments" ON "public"."payment_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create their market follows" ON "public"."market_follows" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can create their own follows" ON "public"."user_follows" FOR INSERT WITH CHECK (("follower_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can delete own drafts" ON "public"."market_creation_drafts" FOR DELETE USING (("auth"."uid"() = "creator_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can delete their market follows" ON "public"."market_follows" FOR DELETE USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can delete their own follows" ON "public"."user_follows" FOR DELETE USING (("follower_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can insert own drafts" ON "public"."market_creation_drafts" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can insert own orders" ON "public"."orders" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'open'::"public"."order_status")));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can insert own orders" ON "public"."orders_legacy" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'open'::"public"."order_status")));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can insert payment transactions" ON "public"."payment_transactions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can insert their own attempts" ON "public"."deposit_attempts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can read own wallet" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can update own KYC profile" ON "public"."user_kyc_profiles" FOR UPDATE USING (("id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can update own drafts" ON "public"."market_creation_drafts" FOR UPDATE USING (("auth"."uid"() = "creator_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can update own orders" ON "public"."orders" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("status" = 'cancelled'::"public"."order_status"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can update own orders" ON "public"."orders_legacy" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("status" = 'cancelled'::"public"."order_status"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can upload own documents" ON "public"."kyc_documents" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can upsert own KYC profile" ON "public"."user_kyc_profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view disputes" ON "public"."oracle_disputes" FOR SELECT USING (("auth"."uid"() IS NOT NULL));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own KYC profile" ON "public"."user_kyc_profiles" FOR SELECT USING (("id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own KYC submissions" ON "public"."kyc_submissions" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own disputes" ON "public"."dispute_records" FOR SELECT TO "authenticated" USING ((("disputed_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_pro" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own documents" ON "public"."kyc_documents" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own drafts" ON "public"."market_creation_drafts" FOR SELECT USING (("auth"."uid"() = "creator_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own orders" ON "public"."orders_legacy" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own payment transactions" ON "public"."payment_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own payments" ON "public"."payment_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own positions" ON "public"."positions" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own preferences" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own rebates" ON "public"."maker_rebates" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own resting orders" ON "public"."resting_orders" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own spread rewards" ON "public"."spread_rewards" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own trades" ON "public"."trades" FOR SELECT USING ((("auth"."uid"() = "maker_id") OR ("auth"."uid"() = "taker_id")));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own trades" ON "public"."trades_legacy" FOR SELECT USING ((("auth"."uid"() = "maker_id") OR ("auth"."uid"() = "taker_id")));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own transactions" ON "public"."wallet_transactions" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own verifications" ON "public"."withdrawal_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own volume tracking" ON "public"."maker_volume_tracking" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view own wallet" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their follow requests" ON "public"."follow_requests" FOR SELECT USING ((("requester_id" = "auth"."uid"()) OR ("target_id" = "auth"."uid"())));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their market follows" ON "public"."market_follows" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own attempts" ON "public"."deposit_attempts" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own cancellation records" ON "public"."cancellation_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."order_book" "ob"
  WHERE (("ob"."id" = "cancellation_records"."order_id") AND ("ob"."user_id" = "auth"."uid"())))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own fill records" ON "public"."fill_records" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."order_book" "ob"
  WHERE (("ob"."id" = "fill_records"."order_id") AND ("ob"."user_id" = "auth"."uid"())))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own follows" ON "public"."user_follows" FOR SELECT USING ((("follower_id" = "auth"."uid"()) OR ("following_id" = "auth"."uid"())));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own idempotency keys" ON "public"."idempotency_keys" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own wallet transactions" ON "public"."wallet_transactions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users can view their own wallets" ON "public"."wallets" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users manage own bookmarks" ON "public"."user_bookmarks" USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users manage own follows" ON "public"."market_followers" USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Users manage own likes" ON "public"."comment_likes" USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "Votes viewable by assigned experts and admin" ON "public"."expert_votes" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."expert_panel" "ep"
  WHERE (("ep"."id" = "expert_votes"."expert_id") AND ("ep"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_aggregations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_ai_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_workflow_triggers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_ab_tests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_agent_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_circuit_breaker_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_daily_topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_event_pipelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_evidence_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_model_versions" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "ai_pipelines_admin_all" ON "public"."ai_resolution_pipelines" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "ai_pipelines_admin_select" ON "public"."ai_resolution_pipelines" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "ai_pipelines_all" ON "public"."ai_event_pipelines" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "ai_pipelines_insert" ON "public"."ai_resolution_pipelines" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "ai_pipelines_select" ON "public"."ai_resolution_pipelines" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."ai_prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_rate_limit_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_resolution_pipelines" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "ai_settings_admin_select" ON "public"."admin_ai_settings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "ai_settings_admin_update" ON "public"."admin_ai_settings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."ai_topic_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_topic_generation_jobs" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "ai_topics_admin_all" ON "public"."ai_daily_topics" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "ai_topics_admin_select" ON "public"."ai_daily_topics" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_snapshots_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_snapshots_hourly" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."balance_holds" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "batches_own_insert" ON "public"."order_batches" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "batches_own_select" ON "public"."order_batches" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."bd_cricket_events" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "bd_cricket_events_public_read" ON "public"."bd_cricket_events" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."bd_divisions" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "bd_divisions_public_read" ON "public"."bd_divisions" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."bd_economic_indicators" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "bd_economic_indicators_public_read" ON "public"."bd_economic_indicators" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."bd_news_sources" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "bd_news_sources_public_read" ON "public"."bd_news_sources" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."bd_political_events" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "bd_political_events_public_read" ON "public"."bd_political_events" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "bookmarks_own_delete" ON "public"."user_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "bookmarks_own_insert" ON "public"."user_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "bookmarks_own_select" ON "public"."user_bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."burn_events" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "burn_events_all" ON "public"."burn_events" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."cancellation_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_settings" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "claims_select_own" ON "public"."settlement_claims" FOR SELECT USING (("user_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."comment_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_flags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "comment_likes_own_delete" ON "public"."comment_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "comment_likes_own_insert" ON "public"."comment_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "comment_likes_own_select" ON "public"."comment_likes" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "comment_likes_read_all" ON "public"."comment_likes" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."comment_moderation_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "comments_public_read" ON "public"."comments" FOR SELECT USING ((NOT "is_deleted"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "comments_user_delete" ON "public"."comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "comments_user_insert" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "comments_user_update" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."copy_trading_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_categories" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "custom_categories_admin_all" ON "public"."custom_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "custom_categories_public_read" ON "public"."custom_categories" FOR SELECT USING (("is_active" = true));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "daily_stats_read" ON "public"."market_daily_stats" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."deposit_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."deposit_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dispute_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disputes" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "disputes_select_own" ON "public"."disputes" FOR SELECT USING (("challenger_id" = "auth"."uid"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "events_admin_all" ON "public"."events" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "events_authenticated_read" ON "public"."events" FOR SELECT TO "authenticated" USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "events_public_read" ON "public"."events" FOR SELECT USING ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'resolved'::character varying])::"text"[])));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."exchange_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_panel" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_panel_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_panel_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expert_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feed_preferences" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "feed_prefs_all" ON "public"."user_feed_preferences" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "feedback_select" ON "public"."resolution_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."fill_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follow_requests" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "followers_own_delete" ON "public"."market_followers" FOR DELETE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "followers_own_insert" ON "public"."market_followers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "followers_own_select" ON "public"."market_followers" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "followers_own_update" ON "public"."market_followers" FOR UPDATE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "follows_all" ON "public"."follows" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."global_sequence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."human_review_queue" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "human_review_select" ON "public"."human_review_queue" FOR SELECT USING ((("assigned_to" = "auth"."uid"()) OR (("status")::"text" = 'pending'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."idempotency_keys" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "interventions_all" ON "public"."position_interventions" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."kyc_admin_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kyc_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kyc_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kyc_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboard" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboard_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leagues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_review_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maker_rebates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maker_volume_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manual_deposits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_creation_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_daily_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_followers" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "market_followers_public_count" ON "public"."market_followers" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."market_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."markets" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "messages_all" ON "public"."support_ticket_messages" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."moderation_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_sources" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "notes_all" ON "public"."user_internal_notes" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."notification_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "notifications_own_delete" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "notifications_own_select" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "notifications_own_update" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."oracle_assertions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oracle_disputes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oracle_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oracle_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_book" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_commitments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders_2026_03" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders_2026_04" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders_2026_05" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders_legacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outcomes" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "outcomes_insert_admin" ON "public"."outcomes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."is_admin" = true) OR ("user_profiles"."is_super_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "outcomes_read_all" ON "public"."outcomes" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "outcomes_update_admin" ON "public"."outcomes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND (("user_profiles"."is_admin" = true) OR ("user_profiles"."is_super_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."p2p_seller_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payout_calculations" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "payouts_all" ON "public"."payout_calculations" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_interventions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_history" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "price_history_insert_system" ON "public"."price_history" FOR INSERT WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "price_history_read" ON "public"."price_history" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rebate_tiers_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resolution_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resolution_systems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resolvers" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "resolvers_admin_all" ON "public"."resolvers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "resolvers_public_read" ON "public"."resolvers" FOR SELECT USING (("is_active" = true));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."resting_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sensitive_topics" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "service_ai_pipelines_all" ON "public"."ai_event_pipelines" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_burn_events_all" ON "public"."burn_events" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_feed_prefs_all" ON "public"."user_feed_preferences" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_follows_all" ON "public"."follows" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_interventions_all" ON "public"."position_interventions" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_messages_all" ON "public"."support_ticket_messages" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_notes_all" ON "public"."user_internal_notes" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_payouts_all" ON "public"."payout_calculations" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_tickets_all" ON "public"."support_tickets" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_treasury_all" ON "public"."treasury_transfers" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "service_usdt_transactions_all" ON "public"."usdt_transactions" TO "service_role" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."settlement_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settlement_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settlement_escalations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spread_multiplier_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spread_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_ticket_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "tickets_all" ON "public"."support_tickets" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "topic_configs_admin_all" ON "public"."ai_topic_configs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "topic_jobs_admin_all" ON "public"."ai_topic_generation_jobs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."trader_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades_2026_03" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades_2026_04" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades_2026_05" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades_legacy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trades_v2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "treasury_all" ON "public"."treasury_transfers" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."treasury_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."upstash_workflow_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usdt_transactions" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "usdt_transactions_all" ON "public"."usdt_transactions" TO "authenticated" USING (true) WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feed_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_internal_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_kyc_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_leagues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_moderation_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "user_profiles_self_insert" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "user_profiles_self_select" ON "public"."user_profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."is_admin_secure"()));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "user_profiles_self_update" ON "public"."user_profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR (( SELECT "user_profiles_1"."is_admin"
   FROM "public"."user_profiles" "user_profiles_1"
  WHERE ("user_profiles_1"."id" = "auth"."uid"())) = true)));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



ALTER TABLE "public"."user_reputation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_trading_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."verification_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawal_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawal_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_analytics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_dlq" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_executions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_steps" ENABLE ROW LEVEL SECURITY;


DO $$
BEGIN
    CREATE POLICY "workflows_admin_delete" ON "public"."verification_workflows" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))) AND ("is_default" = false)));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "workflows_admin_insert" ON "public"."verification_workflows" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "workflows_admin_update" ON "public"."verification_workflows" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))) AND ("is_default" = false)));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    CREATE POLICY "workflows_view_policy" ON "public"."verification_workflows" FOR SELECT USING ((("enabled" = true) OR (("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))))));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






DO $$
BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."events";
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."markets";
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;



DO $$
BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wallets";
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."add_to_workflow_dlq"("p_workflow_run_id" "text", "p_error_message" "text", "p_error_stack" "text", "p_failed_step" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."add_to_workflow_dlq"("p_workflow_run_id" "text", "p_error_message" "text", "p_error_stack" "text", "p_failed_step" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_to_workflow_dlq"("p_workflow_run_id" "text", "p_error_message" "text", "p_error_stack" "text", "p_failed_step" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_credit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_debit_wallet"("p_admin_id" "uuid", "p_user_id" "uuid", "p_amount" numeric, "p_currency" character varying, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_get_user_wallet"("p_admin_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_user_wallet"("p_admin_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_user_wallet"("p_admin_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_kyc_action"("p_admin_id" "uuid", "p_user_id" "uuid", "p_action" character varying, "p_reason" "text", "p_rejection_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_kyc_action"("p_admin_id" "uuid", "p_user_id" "uuid", "p_action" character varying, "p_reason" "text", "p_rejection_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_kyc_action"("p_admin_id" "uuid", "p_user_id" "uuid", "p_action" character varying, "p_reason" "text", "p_rejection_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_market_fields"("p_market_id" "uuid", "p_fields" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_market_fields"("p_market_id" "uuid", "p_fields" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_market_fields"("p_market_id" "uuid", "p_fields" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_trading_closes_at" timestamp with time zone, "p_initial_liquidity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_trading_closes_at" timestamp with time zone, "p_initial_liquidity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_trading_closes_at" timestamp with time zone, "p_initial_liquidity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_deposit"("p_admin_id" "uuid", "p_payment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_deposit"("p_admin_id" "uuid", "p_payment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_deposit"("p_admin_id" "uuid", "p_payment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_complete_cancellation"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_complete_cancellation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_complete_cancellation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_log_market_resolution"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_log_market_resolution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_log_market_resolution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_cancel_orders"("p_order_ids" "uuid"[], "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_cancel_orders"("p_order_ids" "uuid"[], "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_cancel_orders"("p_order_ids" "uuid"[], "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cache_top_experts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cache_top_experts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cache_top_experts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_daily_ohlc"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_daily_ohlc"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_daily_ohlc"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_hourly_metrics"("p_hour" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_hourly_metrics"("p_hour" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_hourly_metrics"("p_hour" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_market_spread"("p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_market_spread"("p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_market_spread"("p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_remaining_quantity"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_remaining_quantity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_remaining_quantity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_reputation_score"("p_correct_votes" integer, "p_total_votes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_reputation_score"("p_correct_votes" integer, "p_total_votes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_reputation_score"("p_correct_votes" integer, "p_total_votes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_spread_multiplier"("p_avg_spread" numeric, "p_avg_order_size" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_spread_multiplier"("p_avg_spread" numeric, "p_avg_order_size" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_spread_multiplier"("p_avg_spread" numeric, "p_avg_order_size" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_vwap"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_vwap"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_vwap"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_weekly_rebate"("p_user_id" "uuid", "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_weekly_rebate"("p_user_id" "uuid", "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_weekly_rebate"("p_user_id" "uuid", "p_period_start" timestamp with time zone, "p_period_end" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_order_batch"("p_batch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order_batch"("p_batch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order_batch"("p_batch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_order_v2"("p_order_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order_v2"("p_order_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order_v2"("p_order_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_ai_topics_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_ai_topics_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ai_topics_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_comment_edit_window"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_comment_edit_window"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_comment_edit_window"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_comment_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_comment_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_comment_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_gtd_expiry"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_gtd_expiry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_gtd_expiry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_kyc_withdrawal_gate"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_kyc_withdrawal_gate"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_kyc_withdrawal_gate"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_sensitive_topics"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_sensitive_topics"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_sensitive_topics"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_trading_eligibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_trading_eligibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_trading_eligibility"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_withdrawal_eligibility"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."check_withdrawal_eligibility"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_withdrawal_eligibility"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_workflow_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_workflow_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_workflow_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_rebate"("p_rebate_id" "uuid", "p_user_id" "uuid", "p_payment_method" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."claim_rebate"("p_rebate_id" "uuid", "p_user_id" "uuid", "p_payment_method" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_rebate"("p_rebate_id" "uuid", "p_user_id" "uuid", "p_payment_method" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_dormant_accounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_dormant_accounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_dormant_accounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_batches"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_batches"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_batches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_notifications"("p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_legal_review"("p_draft_id" "uuid", "p_reviewer_id" "uuid", "p_status" character varying, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_legal_review"("p_draft_id" "uuid", "p_reviewer_id" "uuid", "p_status" character varying, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_legal_review"("p_draft_id" "uuid", "p_reviewer_id" "uuid", "p_status" character varying, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_complete"("p_event_data" "jsonb", "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_complete"("p_event_data" "jsonb", "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_complete"("p_event_data" "jsonb", "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_complete"("p_title" character varying, "p_description" "text", "p_category_id" "uuid", "p_tags" "text"[], "p_answer_type" "text", "p_resolution_src" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_complete"("p_title" character varying, "p_description" "text", "p_category_id" "uuid", "p_tags" "text"[], "p_answer_type" "text", "p_resolution_src" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_complete"("p_title" character varying, "p_description" "text", "p_category_id" "uuid", "p_tags" "text"[], "p_answer_type" "text", "p_resolution_src" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_complete_v1"("event_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_complete_v1"("event_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_complete_v1"("event_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_complete_v2"("title" character varying, "description" "text", "category_id" "uuid", "tags" "text"[], "answer_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_complete_v2"("title" character varying, "description" "text", "category_id" "uuid", "tags" "text"[], "answer_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_complete_v2"("title" character varying, "description" "text", "category_id" "uuid", "tags" "text"[], "answer_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_complete_v3"("p_title" character varying, "p_description" "text", "p_answer_type" "public"."answer_type", "p_tags" "jsonb", "p_category_id" "uuid", "p_resolution_source" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_complete_v3"("p_title" character varying, "p_description" "text", "p_answer_type" "public"."answer_type", "p_tags" "jsonb", "p_category_id" "uuid", "p_resolution_source" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_complete_v3"("p_title" character varying, "p_description" "text", "p_answer_type" "public"."answer_type", "p_tags" "jsonb", "p_category_id" "uuid", "p_resolution_source" "text", "p_starts_at" timestamp with time zone, "p_ends_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_debug"("p_event_data" "jsonb", "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_debug"("p_event_data" "jsonb", "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_debug"("p_event_data" "jsonb", "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_with_markets"("p_event_data" "jsonb", "p_markets_data" "jsonb"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_with_markets"("p_event_data" "jsonb", "p_markets_data" "jsonb"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_with_markets"("p_event_data" "jsonb", "p_markets_data" "jsonb"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_with_resolution"("p_event_data" "jsonb", "p_resolution_config" "jsonb", "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_with_resolution"("p_event_data" "jsonb", "p_resolution_config" "jsonb", "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_with_resolution"("p_event_data" "jsonb", "p_resolution_config" "jsonb", "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_follower_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_follower_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_follower_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_market"("p_event_id" "uuid", "p_slug" "text", "p_ends_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_market"("p_event_id" "uuid", "p_slug" "text", "p_ends_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_market"("p_event_id" "uuid", "p_slug" "text", "p_ends_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying, "p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying, "p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_market_draft"("p_creator_id" "uuid", "p_market_type" character varying, "p_template_id" character varying, "p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_market_v2"("p_event_id" "uuid", "p_slug" "text", "p_min_tick" numeric, "p_max_tick" numeric, "p_fee_percent" numeric, "p_market_type" "text", "p_ends_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."create_market_v2"("p_event_id" "uuid", "p_slug" "text", "p_min_tick" numeric, "p_max_tick" numeric, "p_fee_percent" numeric, "p_market_type" "text", "p_ends_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_market_v2"("p_event_id" "uuid", "p_slug" "text", "p_min_tick" numeric, "p_max_tick" numeric, "p_fee_percent" numeric, "p_market_type" "text", "p_ends_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order_batch"("p_orders" "jsonb", "p_total_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_batch"("p_orders" "jsonb", "p_total_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_batch"("p_orders" "jsonb", "p_total_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_price_alert_notification"("p_user_id" "uuid", "p_market_id" "uuid", "p_price_change_percent" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_price_alert_notification"("p_user_id" "uuid", "p_market_id" "uuid", "p_price_change_percent" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_price_alert_notification"("p_user_id" "uuid", "p_market_id" "uuid", "p_price_change_percent" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_withdrawal_hold"("p_user_id" "uuid", "p_amount" numeric, "p_withdrawal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_withdrawal_hold"("p_user_id" "uuid", "p_amount" numeric, "p_withdrawal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_withdrawal_hold"("p_user_id" "uuid", "p_amount" numeric, "p_withdrawal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_workflow_execution"("p_workflow_type" "text", "p_payload" "jsonb", "p_max_retries" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_workflow_execution"("p_workflow_type" "text", "p_payload" "jsonb", "p_max_retries" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_workflow_execution"("p_workflow_type" "text", "p_payload" "jsonb", "p_max_retries" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."credit_wallet"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."credit_wallet"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."credit_wallet"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."debit_wallet"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."debit_wallet"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."debit_wallet"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."deploy_market_full"("p_draft_id" "uuid", "p_deployer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deploy_market_full"("p_draft_id" "uuid", "p_deployer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deploy_market_full"("p_draft_id" "uuid", "p_deployer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."deposit_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deposit_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deposit_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."determine_rebate_tier"("p_monthly_volume" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."determine_rebate_tier"("p_monthly_volume" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."determine_rebate_tier"("p_monthly_volume" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."dispute_resolution_v2"("p_request_id" "uuid", "p_reason" "text", "p_evidence_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."dispute_resolution_v2"("p_request_id" "uuid", "p_reason" "text", "p_evidence_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dispute_resolution_v2"("p_request_id" "uuid", "p_reason" "text", "p_evidence_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_uppercase_outcome"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_uppercase_outcome"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_uppercase_outcome"() TO "service_role";



GRANT ALL ON FUNCTION "public"."event_tags_as_text_array"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."event_tags_as_text_array"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."event_tags_as_text_array"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_trade_v2"("p_market_id" "uuid", "p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_maker_id" "uuid", "p_taker_id" "uuid", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_trade_v2"("p_market_id" "uuid", "p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_maker_id" "uuid", "p_taker_id" "uuid", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_trade_v2"("p_market_id" "uuid", "p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_maker_id" "uuid", "p_taker_id" "uuid", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_order"("p_order_id" "uuid", "p_expiry_reason" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."expire_order"("p_order_id" "uuid", "p_expiry_reason" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_order"("p_order_id" "uuid", "p_expiry_reason" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_stale_orders"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_stale_orders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_stale_orders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fetch_leaderboard"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."fetch_leaderboard"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fetch_leaderboard"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."follow_market"("p_user_id" "uuid", "p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."follow_market"("p_user_id" "uuid", "p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."follow_market"("p_user_id" "uuid", "p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."follow_user"("p_follower_id" "uuid", "p_following_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."follow_user"("p_follower_id" "uuid", "p_following_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."follow_user"("p_follower_id" "uuid", "p_following_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."freeze_funds"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."freeze_funds"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."freeze_funds"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."freeze_funds_v2"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."freeze_funds_v2"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."freeze_funds_v2"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."freeze_wallet_v2"("p_user_id" "uuid", "p_freeze" boolean, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."freeze_wallet_v2"("p_user_id" "uuid", "p_freeze" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."freeze_wallet_v2"("p_user_id" "uuid", "p_freeze" boolean, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_cancellation_confirmation"("p_cancel_record_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_cancellation_confirmation"("p_cancel_record_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_cancellation_confirmation"("p_cancel_record_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_event_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_event_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_event_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_market_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_market_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_market_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_activity_summary"("p_admin_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_activity_summary"("p_admin_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_activity_summary"("p_admin_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_events"("p_status" character varying, "p_category" character varying, "p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_events"("p_status" character varying, "p_category" character varying, "p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_events"("p_status" character varying, "p_category" character varying, "p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_topics_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_topics_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_topics_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_batch_details"("p_batch_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_batch_details"("p_batch_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_batch_details"("p_batch_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_events_with_resolution"("p_status" character varying, "p_category" character varying, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_events_with_resolution"("p_status" character varying, "p_category" character varying, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_events_with_resolution"("p_status" character varying, "p_category" character varying, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_exchange_rate_v2"("p_currency_pair" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_exchange_rate_v2"("p_currency_pair" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exchange_rate_v2"("p_currency_pair" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_follow_status"("p_follower_id" "uuid", "p_following_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_follow_status"("p_follower_id" "uuid", "p_following_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_follow_status"("p_follower_id" "uuid", "p_following_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaderboard"("p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_leaderboard_v2"("p_limit" integer, "p_offset" integer, "p_tier" "text", "p_season" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_leaderboard_v2"("p_limit" integer, "p_offset" integer, "p_tier" "text", "p_season" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_leaderboard_v2"("p_limit" integer, "p_offset" integer, "p_tier" "text", "p_season" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_legal_review_queue"("p_assignee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_legal_review_queue"("p_assignee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_legal_review_queue"("p_assignee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_comments_threaded"("p_market_id" "uuid", "p_sort_by" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_comments_threaded"("p_market_id" "uuid", "p_sort_by" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_comments_threaded"("p_market_id" "uuid", "p_sort_by" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_prices"("p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_prices"("p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_prices"("p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_stats_summary"("p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_stats_summary"("p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_stats_summary"("p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_stats_v2"("p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_stats_v2"("p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_stats_v2"("p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_trades"("p_market_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_trades"("p_market_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_trades"("p_market_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_trades_v2"("p_market_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_trades_v2"("p_market_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_trades_v2"("p_market_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_sequence"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_sequence"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_sequence"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_oracle_status_v2"("p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_oracle_status_v2"("p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_oracle_status_v2"("p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_book"("p_market_id" "uuid", "p_depth" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_book"("p_market_id" "uuid", "p_depth" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_book"("p_market_id" "uuid", "p_depth" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_book_depth"("p_market_id" "uuid", "p_depth" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_book_depth"("p_market_id" "uuid", "p_depth" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_book_depth"("p_market_id" "uuid", "p_depth" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_book_v2"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_depth" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_book_v2"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_depth" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_book_v2"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_depth" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_orderbook"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_side" "public"."order_side") TO "anon";
GRANT ALL ON FUNCTION "public"."get_orderbook"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_side" "public"."order_side") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_orderbook"("p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_side" "public"."order_side") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_orphaned_event_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_orphaned_event_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_orphaned_event_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_platform_analytics"("p_period" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_platform_analytics"("p_period" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_platform_analytics"("p_period" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_platform_analytics"("p_period" character varying, "p_metric_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."get_platform_analytics"("p_period" character varying, "p_metric_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_platform_analytics"("p_period" character varying, "p_metric_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_platform_stats_v2"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_platform_stats_v2"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_platform_stats_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_interval_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_interval_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_interval_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_hours" integer, "p_outcome" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_hours" integer, "p_outcome" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_price_history"("p_market_id" "uuid", "p_hours" integer, "p_outcome" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_price_history_ohlc"("p_market_id" "uuid", "p_interval" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_price_history_ohlc"("p_market_id" "uuid", "p_interval" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_price_history_ohlc"("p_market_id" "uuid", "p_interval" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_admin_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_admin_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_admin_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics_v2"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_analytics_v2"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics_v2"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_orders"("p_user_id" "uuid", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_orders"("p_user_id" "uuid", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_orders"("p_user_id" "uuid", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_orders_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_status" "public"."order_status", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_orders_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_status" "public"."order_status", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_orders_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_status" "public"."order_status", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_positions_v2"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_positions_v2"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_positions_v2"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_rank_v2"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_rank_v2"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_rank_v2"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_wallet_summary_v2"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_wallet_summary_v2"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_wallet_summary_v2"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_weighted_expert_consensus"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_weighted_expert_consensus"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_weighted_expert_consensus"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_market_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_market_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_market_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_trade_volume_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_trade_volume_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_trade_volume_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hard_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_is_system" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."hard_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_is_system" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."hard_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_is_system" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_agent_usage"("p_agent_key" "text", "p_tokens" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_agent_usage"("p_agent_key" "text", "p_tokens" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_agent_usage"("p_agent_key" "text", "p_tokens" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_filled"("p_order_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_filled"("p_order_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_filled"("p_order_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_secure"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_secure"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_secure"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_dispute_bond"("p_user_id" "uuid", "p_amount" numeric, "p_dispute_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."lock_dispute_bond"("p_user_id" "uuid", "p_amount" numeric, "p_dispute_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_dispute_bond"("p_user_id" "uuid", "p_amount" numeric, "p_dispute_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."lock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."lock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_details" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_details" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action" "text", "p_details" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action_type" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_reason" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_workflow_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action_type" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_reason" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_workflow_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_admin_id" "uuid", "p_action_type" character varying, "p_resource_type" character varying, "p_resource_id" "uuid", "p_old_values" "jsonb", "p_new_values" "jsonb", "p_reason" "text", "p_ip_address" "inet", "p_user_agent" "text", "p_workflow_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action_v2"("p_admin_id" "uuid", "p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_diff_jsonb" "jsonb", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action_v2"("p_admin_id" "uuid", "p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_diff_jsonb" "jsonb", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action_v2"("p_admin_id" "uuid", "p_action" "text", "p_target_table" "text", "p_target_id" "uuid", "p_diff_jsonb" "jsonb", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_entity_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_entity_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_entity_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_market_movement_activity"("p_market_id" "uuid", "p_user_id" "uuid", "p_movement_type" character varying, "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_market_movement_activity"("p_market_id" "uuid", "p_user_id" "uuid", "p_movement_type" character varying, "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_market_movement_activity"("p_market_id" "uuid", "p_user_id" "uuid", "p_movement_type" character varying, "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_trader_activity"("p_trader_id" "uuid", "p_activity_type" character varying, "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_trader_activity"("p_trader_id" "uuid", "p_activity_type" character varying, "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_trader_activity"("p_trader_id" "uuid", "p_activity_type" character varying, "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_workflow_step"("p_execution_id" "uuid", "p_step_name" "text", "p_step_status" "text", "p_step_data" "jsonb", "p_error_details" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_workflow_step"("p_execution_id" "uuid", "p_step_name" "text", "p_step_status" "text", "p_step_data" "jsonb", "p_error_details" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_workflow_step"("p_execution_id" "uuid", "p_step_name" "text", "p_step_status" "text", "p_step_data" "jsonb", "p_error_details" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."manual_resolve_market"("p_market_id" "uuid", "p_winning_outcome" character varying, "p_admin_id" "uuid", "p_resolution_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."manual_resolve_market"("p_market_id" "uuid", "p_winning_outcome" character varying, "p_admin_id" "uuid", "p_resolution_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."manual_resolve_market"("p_market_id" "uuid", "p_winning_outcome" character varying, "p_admin_id" "uuid", "p_resolution_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notifications_read"("p_notification_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."match_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_binary_market_outcomes"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_binary_market_outcomes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_binary_market_outcomes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_market_followers_on_trade"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_market_followers_on_trade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_market_followers_on_trade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_market_resolve"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_market_resolve"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_market_resolve"() TO "service_role";



GRANT ALL ON FUNCTION "public"."place_atomic_order"("p_market_id" "uuid", "p_side" "public"."order_side", "p_outcome" "public"."outcome_type", "p_price" numeric, "p_quantity" bigint, "p_order_type" "public"."order_type") TO "anon";
GRANT ALL ON FUNCTION "public"."place_atomic_order"("p_market_id" "uuid", "p_side" "public"."order_side", "p_outcome" "public"."outcome_type", "p_price" numeric, "p_quantity" bigint, "p_order_type" "public"."order_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_atomic_order"("p_market_id" "uuid", "p_side" "public"."order_side", "p_outcome" "public"."outcome_type", "p_price" numeric, "p_quantity" bigint, "p_order_type" "public"."order_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric, "p_order_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric, "p_order_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric, "p_order_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_outcome" "text", "p_price" numeric, "p_quantity" numeric, "p_order_type" "text", "p_idempotency_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_outcome" "text", "p_price" numeric, "p_quantity" numeric, "p_order_type" "text", "p_idempotency_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_order_atomic"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_outcome" "text", "p_price" numeric, "p_quantity" numeric, "p_order_type" "text", "p_idempotency_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type", "p_tif" "text", "p_stop_price" numeric, "p_post_only" boolean, "p_client_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type", "p_tif" "text", "p_stop_price" numeric, "p_post_only" boolean, "p_client_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."place_order_atomic_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "public"."order_side", "p_type" "public"."order_type", "p_price" numeric, "p_quantity" numeric, "p_outcome" "public"."outcome_type", "p_tif" "text", "p_stop_price" numeric, "p_post_only" boolean, "p_client_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_analytics_last_24h"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_analytics_last_24h"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_analytics_last_24h"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_aon_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_aon_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_aon_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_deposit_tx"("p_user_id" "uuid", "p_amount" numeric, "p_txid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_deposit_tx"("p_user_id" "uuid", "p_amount" numeric, "p_txid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_deposit_tx"("p_user_id" "uuid", "p_amount" numeric, "p_txid" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_expert_vote"("p_expert_id" "uuid", "p_event_id" "uuid", "p_vote_outcome" integer, "p_confidence_level" numeric, "p_reasoning" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_expert_vote"("p_expert_id" "uuid", "p_event_id" "uuid", "p_vote_outcome" integer, "p_confidence_level" numeric, "p_reasoning" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_expert_vote"("p_expert_id" "uuid", "p_event_id" "uuid", "p_vote_outcome" integer, "p_confidence_level" numeric, "p_reasoning" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_fok_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_fok_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_fok_order"("p_order_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_ioc_order"("p_order_id" "uuid", "p_size" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_ioc_order"("p_order_id" "uuid", "p_size" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_ioc_order"("p_order_id" "uuid", "p_size" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_order_with_tif"("p_market_id" "uuid", "p_user_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric, "p_order_type" character varying, "p_tif" "public"."tif_type", "p_gtd_expiry" timestamp with time zone, "p_time_in_force" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."process_order_with_tif"("p_market_id" "uuid", "p_user_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric, "p_order_type" character varying, "p_tif" "public"."tif_type", "p_gtd_expiry" timestamp with time zone, "p_time_in_force" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_order_with_tif"("p_market_id" "uuid", "p_user_id" "uuid", "p_side" character varying, "p_price" numeric, "p_size" numeric, "p_order_type" character varying, "p_tif" "public"."tif_type", "p_gtd_expiry" timestamp with time zone, "p_time_in_force" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_rebate_payment"("p_rebate_id" "uuid", "p_tx_hash" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."process_rebate_payment"("p_rebate_id" "uuid", "p_tx_hash" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_rebate_payment"("p_rebate_id" "uuid", "p_tx_hash" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_trade_settlement"("p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_quantity" bigint, "p_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_trade_settlement"("p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_quantity" bigint, "p_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_trade_settlement"("p_buy_order_id" "uuid", "p_sell_order_id" "uuid", "p_quantity" bigint, "p_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_withdrawal"("p_withdrawal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_withdrawal"("p_withdrawal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_withdrawal"("p_withdrawal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."re_enter_gtc_order"("p_order_id" "uuid", "p_new_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."re_enter_gtc_order"("p_order_id" "uuid", "p_new_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."re_enter_gtc_order"("p_order_id" "uuid", "p_new_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."reconcile_order_state"("p_order_ids" "uuid"[], "p_client_last_sequence" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."reconcile_order_state"("p_order_ids" "uuid"[], "p_client_last_sequence" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reconcile_order_state"("p_order_ids" "uuid"[], "p_client_last_sequence" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_fill"("p_order_id" "uuid", "p_quantity" numeric, "p_price" numeric, "p_counterparty_order_id" "uuid", "p_counterparty_user_id" "uuid", "p_trade_id" "uuid", "p_is_maker" boolean, "p_transaction_hash" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."record_fill"("p_order_id" "uuid", "p_quantity" numeric, "p_price" numeric, "p_counterparty_order_id" "uuid", "p_counterparty_user_id" "uuid", "p_trade_id" "uuid", "p_is_maker" boolean, "p_transaction_hash" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_fill"("p_order_id" "uuid", "p_quantity" numeric, "p_price" numeric, "p_counterparty_order_id" "uuid", "p_counterparty_user_id" "uuid", "p_trade_id" "uuid", "p_is_maker" boolean, "p_transaction_hash" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_liquidity_deposit"("p_draft_id" "uuid", "p_tx_hash" character varying, "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."record_liquidity_deposit"("p_draft_id" "uuid", "p_tx_hash" character varying, "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_liquidity_deposit"("p_draft_id" "uuid", "p_tx_hash" character varying, "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_market_deployment"("p_draft_id" "uuid", "p_market_id" "uuid", "p_tx_hash" character varying, "p_deployment_config" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."record_market_deployment"("p_draft_id" "uuid", "p_market_id" "uuid", "p_tx_hash" character varying, "p_deployment_config" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_market_deployment"("p_draft_id" "uuid", "p_market_id" "uuid", "p_tx_hash" character varying, "p_deployment_config" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_price_snapshots"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_price_snapshots"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_price_snapshots"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_trade_price_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_trade_price_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_trade_price_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_trade_result_v2"("p_user_id" "uuid", "p_pnl" numeric, "p_is_win" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."record_trade_result_v2"("p_user_id" "uuid", "p_pnl" numeric, "p_is_win" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_trade_result_v2"("p_user_id" "uuid", "p_pnl" numeric, "p_is_win" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_workflow_complete"("p_workflow_run_id" "text", "p_status" character varying, "p_result" "jsonb", "p_error_message" "text", "p_execution_time_ms" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."record_workflow_complete"("p_workflow_run_id" "text", "p_status" character varying, "p_result" "jsonb", "p_error_message" "text", "p_execution_time_ms" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_workflow_complete"("p_workflow_run_id" "text", "p_status" character varying, "p_result" "jsonb", "p_error_message" "text", "p_execution_time_ms" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."record_workflow_start"("p_workflow_run_id" "text", "p_workflow_type" character varying, "p_event_id" "uuid", "p_market_id" "uuid", "p_payload" "jsonb", "p_message_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_workflow_start"("p_workflow_run_id" "text", "p_workflow_type" character varying, "p_event_id" "uuid", "p_market_id" "uuid", "p_payload" "jsonb", "p_message_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_workflow_start"("p_workflow_run_id" "text", "p_workflow_type" character varying, "p_event_id" "uuid", "p_market_id" "uuid", "p_payload" "jsonb", "p_message_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_market_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_market_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_market_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_price_ohlc"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_price_ohlc"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_price_ohlc"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_ai_topic"("p_topic_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_deposit_v2"("p_deposit_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_deposit_v2"("p_deposit_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_deposit_v2"("p_deposit_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_withdrawal"("p_id" "uuid", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_withdrawal"("p_id" "uuid", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_withdrawal"("p_id" "uuid", "p_note" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."release_balance_hold"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."release_balance_hold"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_balance_hold"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."release_funds_v2"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."release_funds_v2"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_funds_v2"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_user_id" "uuid", "p_amount" numeric, "p_address" "text", "p_network" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_user_id" "uuid", "p_amount" numeric, "p_address" "text", "p_network" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_withdrawal"("p_user_id" "uuid", "p_amount" numeric, "p_address" "text", "p_network" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_dispute_v2"("p_dispute_id" "uuid", "p_admin_response" "text", "p_override_resolution" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_dispute_v2"("p_dispute_id" "uuid", "p_admin_response" "text", "p_override_resolution" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_dispute_v2"("p_dispute_id" "uuid", "p_admin_response" "text", "p_override_resolution" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_market"("p_market_id" "uuid", "p_resolution" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_market"("p_market_id" "uuid", "p_resolution" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_market"("p_market_id" "uuid", "p_resolution" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_market"("p_event_id" "uuid", "p_winner" integer, "p_resolver_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_market"("p_event_id" "uuid", "p_winner" integer, "p_resolver_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_market"("p_event_id" "uuid", "p_winner" integer, "p_resolver_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_market_v2"("p_market_id" "uuid", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_market_v2"("p_market_id" "uuid", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_market_v2"("p_market_id" "uuid", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."respond_to_follow_request"("p_request_id" "uuid", "p_target_id" "uuid", "p_approve" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."respond_to_follow_request"("p_request_id" "uuid", "p_target_id" "uuid", "p_approve" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_follow_request"("p_request_id" "uuid", "p_target_id" "uuid", "p_approve" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."review_kyc_document"("p_admin_id" "uuid", "p_document_id" "uuid", "p_status" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."review_kyc_document"("p_admin_id" "uuid", "p_document_id" "uuid", "p_status" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."review_kyc_document"("p_admin_id" "uuid", "p_document_id" "uuid", "p_status" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_users"("p_query" "text", "p_status_filter" character varying, "p_kyc_filter" character varying, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_users"("p_query" "text", "p_status_filter" character varying, "p_kyc_filter" character varying, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_users"("p_query" "text", "p_status_filter" character varying, "p_kyc_filter" character varying, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."seed_event_orderbook"("p_event_id" "uuid", "p_initial_liquidity" numeric, "p_spread" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."seed_event_orderbook"("p_event_id" "uuid", "p_initial_liquidity" numeric, "p_spread" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."seed_event_orderbook"("p_event_id" "uuid", "p_initial_liquidity" numeric, "p_spread" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_exchange_rate"("pair" "text", "new_rate" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."set_exchange_rate"("pair" "text", "new_rate" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_exchange_rate"("pair" "text", "new_rate" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_outcome" "text", "p_resolved_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_outcome" "text", "p_resolved_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_market"("p_market_id" "uuid", "p_outcome" "text", "p_resolved_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_resolution" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_resolution" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_resolution" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_market_v2"("p_market_id" "uuid", "p_winning_outcome" "public"."outcome_type") TO "service_role";



GRANT ALL ON FUNCTION "public"."settle_trade_cash"("p_buyer_id" "uuid", "p_seller_id" "uuid", "p_amount" numeric, "p_trade_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."settle_trade_cash"("p_buyer_id" "uuid", "p_seller_id" "uuid", "p_amount" numeric, "p_trade_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."settle_trade_cash"("p_buyer_id" "uuid", "p_seller_id" "uuid", "p_amount" numeric, "p_trade_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_client_request_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."soft_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_client_request_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_cancel_order"("p_order_id" "uuid", "p_user_id" "uuid", "p_client_request_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."start_resting_order_tracking"("p_order_id" "uuid", "p_user_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."start_resting_order_tracking"("p_order_id" "uuid", "p_user_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_resting_order_tracking"("p_order_id" "uuid", "p_user_id" "uuid", "p_market_id" "uuid", "p_side" character varying, "p_price" numeric, "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."stop_resting_order_tracking"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."stop_resting_order_tracking"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."stop_resting_order_tracking"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_deposit_request"("p_user_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_transaction_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_deposit_request"("p_user_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_transaction_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_deposit_request"("p_user_id" "uuid", "p_amount" numeric, "p_payment_method" "text", "p_transaction_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_for_legal_review"("p_draft_id" "uuid", "p_submitter_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_for_legal_review"("p_draft_id" "uuid", "p_submitter_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_for_legal_review"("p_draft_id" "uuid", "p_submitter_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_oracle_request_v2"("p_market_id" "uuid", "p_requested_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_oracle_request_v2"("p_market_id" "uuid", "p_requested_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_oracle_request_v2"("p_market_id" "uuid", "p_requested_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_oracle_verdict_v2"("p_request_id" "uuid", "p_resolution" "text", "p_confidence" numeric, "p_reasoning" "text", "p_evidence" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_oracle_verdict_v2"("p_request_id" "uuid", "p_resolution" "text", "p_confidence" numeric, "p_reasoning" "text", "p_evidence" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_oracle_verdict_v2"("p_request_id" "uuid", "p_resolution" "text", "p_confidence" numeric, "p_reasoning" "text", "p_evidence" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_order"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_order"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_order"("p_user_id" "uuid", "p_market_id" "uuid", "p_side" "text", "p_price" numeric, "p_size" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_name_title"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_name_title"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_name_title"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_title_question"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_title_question"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_title_question"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_topic_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_topic_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_topic_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_event_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_event_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_event_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_bookmark"("p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_bookmark"("p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_bookmark"("p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_comment_like"("p_comment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_market_follow"("p_market_id" "uuid", "p_notify_on_trade" boolean, "p_notify_on_resolve" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_market_follow"("p_market_id" "uuid", "p_notify_on_trade" boolean, "p_notify_on_resolve" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_market_follow"("p_market_id" "uuid", "p_notify_on_trade" boolean, "p_notify_on_resolve" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."track_user_activity"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."track_user_activity"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_user_activity"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_seed_orderbook_on_event_activation"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_seed_orderbook_on_event_activation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_seed_orderbook_on_event_activation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unfollow_market"("p_user_id" "uuid", "p_market_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unfollow_market"("p_user_id" "uuid", "p_market_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unfollow_market"("p_user_id" "uuid", "p_market_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unfollow_user"("p_follower_id" "uuid", "p_following_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unfollow_user"("p_follower_id" "uuid", "p_following_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unfollow_user"("p_follower_id" "uuid", "p_following_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unfreeze_funds"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."unfreeze_funds"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."unfreeze_funds"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."unlock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."unlock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlock_wallet_funds"("p_user_id" "uuid", "p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_admin_log_workflow"("p_log_id" "uuid", "p_workflow_status" character varying, "p_new_values" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_admin_log_workflow"("p_log_id" "uuid", "p_workflow_status" character varying, "p_new_values" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_admin_log_workflow"("p_log_id" "uuid", "p_workflow_status" character varying, "p_new_values" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_settings_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_settings_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_settings_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_batch_on_order_fill"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_batch_on_order_fill"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_batch_on_order_fill"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_like_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_like_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_like_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_score"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_score"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_score"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_draft_stage"("p_draft_id" "uuid", "p_stage" character varying, "p_stage_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_draft_stage"("p_draft_id" "uuid", "p_stage" character varying, "p_stage_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_draft_stage"("p_draft_id" "uuid", "p_stage" character varying, "p_stage_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_status"("p_event_id" "uuid", "p_new_status" character varying, "p_admin_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_status"("p_event_id" "uuid", "p_new_status" character varying, "p_admin_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_status"("p_event_id" "uuid", "p_new_status" character varying, "p_admin_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_events_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_events_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_events_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_events_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_events_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_events_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_exchange_rate"("currency_pair" "text", "rate" numeric, "recorded_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_exchange_rate"("currency_pair" "text", "rate" numeric, "recorded_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_exchange_rate"("currency_pair" "text", "rate" numeric, "recorded_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_exchange_rate_v2"("p_currency_pair" "text", "p_rate" numeric, "p_recorded_at" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."update_exchange_rate_v2"("p_currency_pair" "text", "p_rate" numeric, "p_recorded_at" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_exchange_rate_v2"("p_currency_pair" "text", "p_rate" numeric, "p_recorded_at" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expert_after_vote"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_expert_after_vote"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expert_after_vote"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expert_rank_tier"("p_reputation_score" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_expert_rank_tier"("p_reputation_score" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expert_rank_tier"("p_reputation_score" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leaderboard"("p_user_id" "uuid", "p_score_delta" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_leaderboard"("p_user_id" "uuid", "p_score_delta" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leaderboard"("p_user_id" "uuid", "p_score_delta" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_leaderboard_v2"("p_user_id" "uuid", "p_score_delta" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_leaderboard_v2"("p_user_id" "uuid", "p_score_delta" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_leaderboard_v2"("p_user_id" "uuid", "p_score_delta" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_maker_volume"("p_user_id" "uuid", "p_volume" numeric, "p_is_maker" boolean, "p_spread_contribution" numeric, "p_resting_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_maker_volume"("p_user_id" "uuid", "p_volume" numeric, "p_is_maker" boolean, "p_spread_contribution" numeric, "p_resting_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_maker_volume"("p_user_id" "uuid", "p_volume" numeric, "p_is_maker" boolean, "p_spread_contribution" numeric, "p_resting_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_market_best_quotes"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_market_best_quotes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_market_best_quotes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_market_on_trade"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_market_on_trade"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_market_on_trade"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity_delta" bigint, "p_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity_delta" bigint, "p_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity_delta" bigint, "p_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_position"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_price_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_price_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_price_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_resolution_system_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_resolution_system_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_resolution_system_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timestamp_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_unique_traders"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_unique_traders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_unique_traders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_status"("p_admin_id" "uuid", "p_user_id" "uuid", "p_status" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_status"("p_admin_id" "uuid", "p_user_id" "uuid", "p_status" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_status"("p_admin_id" "uuid", "p_user_id" "uuid", "p_status" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_workflow_status"("p_execution_id" "uuid", "p_status" "text", "p_error_message" "text", "p_increment_retry" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_workflow_status"("p_execution_id" "uuid", "p_status" "text", "p_error_message" "text", "p_increment_retry" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_workflow_status"("p_execution_id" "uuid", "p_status" "text", "p_error_message" "text", "p_increment_retry" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_position_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric, "p_side" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_position_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric, "p_side" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_position_v2"("p_user_id" "uuid", "p_market_id" "uuid", "p_outcome" "public"."outcome_type", "p_quantity" numeric, "p_price" numeric, "p_side" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_event_timing"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_event_timing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_event_timing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_outcome_probabilities"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_outcome_probabilities"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_outcome_probabilities"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_and_credit_deposit"("p_admin_id" "uuid", "p_deposit_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_and_credit_deposit"("p_admin_id" "uuid", "p_deposit_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_and_credit_deposit"("p_admin_id" "uuid", "p_deposit_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_and_credit_deposit_v2"("p_deposit_id" "uuid", "p_admin_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_and_credit_deposit_v2"("p_deposit_id" "uuid", "p_admin_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_and_credit_deposit_v2"("p_deposit_id" "uuid", "p_admin_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_expert_vote"("p_vote_id" "uuid", "p_ai_relevance_score" numeric, "p_ai_feedback" "text", "p_final_outcome" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."verify_expert_vote"("p_vote_id" "uuid", "p_ai_relevance_score" numeric, "p_ai_feedback" "text", "p_final_outcome" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_expert_vote"("p_vote_id" "uuid", "p_ai_relevance_score" numeric, "p_ai_feedback" "text", "p_final_outcome" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."withdraw_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_destination" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."withdraw_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_destination" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."withdraw_funds_v2"("p_user_id" "uuid", "p_amount" numeric, "p_method" "text", "p_destination" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."withdrawal_processing"("p_withdrawal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."withdrawal_processing"("p_withdrawal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."withdrawal_processing"("p_withdrawal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."workflow_health_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."workflow_health_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."workflow_health_check"() TO "service_role";
























GRANT ALL ON TABLE "public"."cancellation_records" TO "anon";
GRANT ALL ON TABLE "public"."cancellation_records" TO "authenticated";
GRANT ALL ON TABLE "public"."cancellation_records" TO "service_role";



GRANT ALL ON TABLE "public"."order_book" TO "anon";
GRANT ALL ON TABLE "public"."order_book" TO "authenticated";
GRANT ALL ON TABLE "public"."order_book" TO "service_role";



GRANT ALL ON TABLE "public"."active_cancellations" TO "anon";
GRANT ALL ON TABLE "public"."active_cancellations" TO "authenticated";
GRANT ALL ON TABLE "public"."active_cancellations" TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_aggregations" TO "anon";
GRANT ALL ON TABLE "public"."activity_aggregations" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_aggregations" TO "service_role";



GRANT ALL ON TABLE "public"."admin_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_ai_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_ai_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_ai_settings" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_roles" TO "anon";
GRANT ALL ON TABLE "public"."admin_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_roles" TO "service_role";



GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."admin_workflow_triggers" TO "anon";
GRANT ALL ON TABLE "public"."admin_workflow_triggers" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_workflow_triggers" TO "service_role";



GRANT ALL ON TABLE "public"."agent_wallets" TO "anon";
GRANT ALL ON TABLE "public"."agent_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."ai_ab_tests" TO "anon";
GRANT ALL ON TABLE "public"."ai_ab_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_ab_tests" TO "service_role";



GRANT ALL ON TABLE "public"."ai_agent_configs" TO "anon";
GRANT ALL ON TABLE "public"."ai_agent_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_agent_configs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_circuit_breaker_state" TO "anon";
GRANT ALL ON TABLE "public"."ai_circuit_breaker_state" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_circuit_breaker_state" TO "service_role";



GRANT ALL ON TABLE "public"."ai_daily_topics" TO "anon";
GRANT ALL ON TABLE "public"."ai_daily_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_daily_topics" TO "service_role";



GRANT ALL ON TABLE "public"."ai_event_pipelines" TO "anon";
GRANT ALL ON TABLE "public"."ai_event_pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_event_pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."ai_evidence_cache" TO "anon";
GRANT ALL ON TABLE "public"."ai_evidence_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_evidence_cache" TO "service_role";



GRANT ALL ON TABLE "public"."ai_model_versions" TO "anon";
GRANT ALL ON TABLE "public"."ai_model_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_model_versions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_prompts" TO "anon";
GRANT ALL ON TABLE "public"."ai_prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_prompts" TO "service_role";



GRANT ALL ON TABLE "public"."ai_providers" TO "anon";
GRANT ALL ON TABLE "public"."ai_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_providers" TO "service_role";



GRANT ALL ON TABLE "public"."ai_rate_limit_state" TO "anon";
GRANT ALL ON TABLE "public"."ai_rate_limit_state" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_rate_limit_state" TO "service_role";



GRANT ALL ON TABLE "public"."ai_resolution_pipelines" TO "anon";
GRANT ALL ON TABLE "public"."ai_resolution_pipelines" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_resolution_pipelines" TO "service_role";



GRANT ALL ON TABLE "public"."ai_topic_configs" TO "anon";
GRANT ALL ON TABLE "public"."ai_topic_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_topic_configs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_topic_generation_jobs" TO "anon";
GRANT ALL ON TABLE "public"."ai_topic_generation_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_topic_generation_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_snapshots_daily" TO "anon";
GRANT ALL ON TABLE "public"."analytics_snapshots_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_snapshots_daily" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_snapshots_hourly" TO "anon";
GRANT ALL ON TABLE "public"."analytics_snapshots_hourly" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_snapshots_hourly" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."balance_holds" TO "anon";
GRANT ALL ON TABLE "public"."balance_holds" TO "authenticated";
GRANT ALL ON TABLE "public"."balance_holds" TO "service_role";



GRANT ALL ON TABLE "public"."bd_cricket_events" TO "anon";
GRANT ALL ON TABLE "public"."bd_cricket_events" TO "authenticated";
GRANT ALL ON TABLE "public"."bd_cricket_events" TO "service_role";



GRANT ALL ON TABLE "public"."bd_divisions" TO "anon";
GRANT ALL ON TABLE "public"."bd_divisions" TO "authenticated";
GRANT ALL ON TABLE "public"."bd_divisions" TO "service_role";



GRANT ALL ON TABLE "public"."bd_economic_indicators" TO "anon";
GRANT ALL ON TABLE "public"."bd_economic_indicators" TO "authenticated";
GRANT ALL ON TABLE "public"."bd_economic_indicators" TO "service_role";



GRANT ALL ON TABLE "public"."bd_news_sources" TO "anon";
GRANT ALL ON TABLE "public"."bd_news_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."bd_news_sources" TO "service_role";



GRANT ALL ON TABLE "public"."bd_political_events" TO "anon";
GRANT ALL ON TABLE "public"."bd_political_events" TO "authenticated";
GRANT ALL ON TABLE "public"."bd_political_events" TO "service_role";



GRANT ALL ON TABLE "public"."burn_events" TO "anon";
GRANT ALL ON TABLE "public"."burn_events" TO "authenticated";
GRANT ALL ON TABLE "public"."burn_events" TO "service_role";



GRANT ALL ON TABLE "public"."category_settings" TO "anon";
GRANT ALL ON TABLE "public"."category_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."category_settings" TO "service_role";



GRANT ALL ON TABLE "public"."comment_attachments" TO "anon";
GRANT ALL ON TABLE "public"."comment_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."comment_flags" TO "anon";
GRANT ALL ON TABLE "public"."comment_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_flags" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."comment_like_counts" TO "anon";
GRANT ALL ON TABLE "public"."comment_like_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_like_counts" TO "service_role";



GRANT ALL ON TABLE "public"."comment_moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."comment_moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."comment_votes" TO "anon";
GRANT ALL ON TABLE "public"."comment_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_votes" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."copy_trading_settings" TO "anon";
GRANT ALL ON TABLE "public"."copy_trading_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."copy_trading_settings" TO "service_role";



GRANT ALL ON TABLE "public"."custom_categories" TO "anon";
GRANT ALL ON TABLE "public"."custom_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_categories" TO "service_role";



GRANT ALL ON TABLE "public"."deposit_attempts" TO "anon";
GRANT ALL ON TABLE "public"."deposit_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."deposit_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."deposit_requests" TO "anon";
GRANT ALL ON TABLE "public"."deposit_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."deposit_requests" TO "service_role";



GRANT ALL ON TABLE "public"."dispute_records" TO "anon";
GRANT ALL ON TABLE "public"."dispute_records" TO "authenticated";
GRANT ALL ON TABLE "public"."dispute_records" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."dispute_statistics" TO "anon";
GRANT ALL ON TABLE "public"."dispute_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."dispute_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."exchange_rates" TO "anon";
GRANT ALL ON TABLE "public"."exchange_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."exchange_rates" TO "service_role";



GRANT ALL ON TABLE "public"."expert_assignments" TO "anon";
GRANT ALL ON TABLE "public"."expert_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."expert_badges" TO "anon";
GRANT ALL ON TABLE "public"."expert_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_badges" TO "service_role";



GRANT ALL ON TABLE "public"."expert_panel" TO "anon";
GRANT ALL ON TABLE "public"."expert_panel" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_panel" TO "service_role";



GRANT ALL ON TABLE "public"."expert_panel_members" TO "anon";
GRANT ALL ON TABLE "public"."expert_panel_members" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_panel_members" TO "service_role";



GRANT ALL ON TABLE "public"."expert_panel_reviews" TO "anon";
GRANT ALL ON TABLE "public"."expert_panel_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_panel_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."expert_votes" TO "anon";
GRANT ALL ON TABLE "public"."expert_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."expert_votes" TO "service_role";



GRANT ALL ON TABLE "public"."feed_preferences" TO "anon";
GRANT ALL ON TABLE "public"."feed_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."fill_records" TO "anon";
GRANT ALL ON TABLE "public"."fill_records" TO "authenticated";
GRANT ALL ON TABLE "public"."fill_records" TO "service_role";



GRANT ALL ON TABLE "public"."follow_requests" TO "anon";
GRANT ALL ON TABLE "public"."follow_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."follow_requests" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."global_sequence" TO "anon";
GRANT ALL ON TABLE "public"."global_sequence" TO "authenticated";
GRANT ALL ON TABLE "public"."global_sequence" TO "service_role";



GRANT ALL ON TABLE "public"."human_review_queue" TO "anon";
GRANT ALL ON TABLE "public"."human_review_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."human_review_queue" TO "service_role";



GRANT ALL ON TABLE "public"."idempotency_keys" TO "anon";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "service_role";



GRANT ALL ON TABLE "public"."kyc_admin_overrides" TO "anon";
GRANT ALL ON TABLE "public"."kyc_admin_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."kyc_admin_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."kyc_documents" TO "anon";
GRANT ALL ON TABLE "public"."kyc_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."kyc_documents" TO "service_role";



GRANT ALL ON TABLE "public"."kyc_settings" TO "anon";
GRANT ALL ON TABLE "public"."kyc_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."kyc_settings" TO "service_role";



GRANT ALL ON TABLE "public"."kyc_submissions" TO "anon";
GRANT ALL ON TABLE "public"."kyc_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."kyc_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_cache" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_cache" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_mv" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_mv" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_mv" TO "service_role";



GRANT ALL ON TABLE "public"."leagues" TO "anon";
GRANT ALL ON TABLE "public"."leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."leagues" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leagues_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."legal_review_queue" TO "anon";
GRANT ALL ON TABLE "public"."legal_review_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_review_queue" TO "service_role";



GRANT ALL ON TABLE "public"."maker_rebates" TO "anon";
GRANT ALL ON TABLE "public"."maker_rebates" TO "authenticated";
GRANT ALL ON TABLE "public"."maker_rebates" TO "service_role";



GRANT ALL ON TABLE "public"."maker_volume_tracking" TO "anon";
GRANT ALL ON TABLE "public"."maker_volume_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."maker_volume_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."manual_deposits" TO "anon";
GRANT ALL ON TABLE "public"."manual_deposits" TO "authenticated";
GRANT ALL ON TABLE "public"."manual_deposits" TO "service_role";



GRANT ALL ON TABLE "public"."market_comments" TO "anon";
GRANT ALL ON TABLE "public"."market_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."market_comments" TO "service_role";



GRANT ALL ON TABLE "public"."market_creation_drafts" TO "anon";
GRANT ALL ON TABLE "public"."market_creation_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."market_creation_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."market_daily_stats" TO "anon";
GRANT ALL ON TABLE "public"."market_daily_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."market_daily_stats" TO "service_role";



GRANT ALL ON TABLE "public"."market_followers" TO "anon";
GRANT ALL ON TABLE "public"."market_followers" TO "authenticated";
GRANT ALL ON TABLE "public"."market_followers" TO "service_role";



GRANT ALL ON TABLE "public"."market_follows" TO "anon";
GRANT ALL ON TABLE "public"."market_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."market_follows" TO "service_role";



GRANT ALL ON TABLE "public"."markets" TO "anon";
GRANT ALL ON TABLE "public"."markets" TO "authenticated";
GRANT ALL ON TABLE "public"."markets" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."trades" TO "anon";
GRANT ALL ON TABLE "public"."trades" TO "authenticated";
GRANT ALL ON TABLE "public"."trades" TO "service_role";



GRANT ALL ON TABLE "public"."market_metrics" TO "anon";
GRANT ALL ON TABLE "public"."market_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."market_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."market_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."market_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."market_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."market_templates" TO "anon";
GRANT ALL ON TABLE "public"."market_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."market_templates" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_actions" TO "anon";
GRANT ALL ON TABLE "public"."moderation_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_actions" TO "service_role";



GRANT ALL ON TABLE "public"."news_sources" TO "anon";
GRANT ALL ON TABLE "public"."news_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."news_sources" TO "service_role";



GRANT ALL ON TABLE "public"."notification_channels" TO "anon";
GRANT ALL ON TABLE "public"."notification_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_channels" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."oracle_assertions" TO "anon";
GRANT ALL ON TABLE "public"."oracle_assertions" TO "authenticated";
GRANT ALL ON TABLE "public"."oracle_assertions" TO "service_role";



GRANT ALL ON TABLE "public"."oracle_disputes" TO "anon";
GRANT ALL ON TABLE "public"."oracle_disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."oracle_disputes" TO "service_role";



GRANT ALL ON TABLE "public"."oracle_requests" TO "anon";
GRANT ALL ON TABLE "public"."oracle_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."oracle_requests" TO "service_role";



GRANT ALL ON TABLE "public"."oracle_verifications" TO "anon";
GRANT ALL ON TABLE "public"."oracle_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."oracle_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_batches" TO "anon";
GRANT ALL ON TABLE "public"."order_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."order_batches" TO "service_role";



GRANT ALL ON TABLE "public"."order_commitments" TO "anon";
GRANT ALL ON TABLE "public"."order_commitments" TO "authenticated";
GRANT ALL ON TABLE "public"."order_commitments" TO "service_role";



GRANT ALL ON TABLE "public"."orders_2026_03" TO "anon";
GRANT ALL ON TABLE "public"."orders_2026_03" TO "authenticated";
GRANT ALL ON TABLE "public"."orders_2026_03" TO "service_role";



GRANT ALL ON TABLE "public"."orders_2026_04" TO "anon";
GRANT ALL ON TABLE "public"."orders_2026_04" TO "authenticated";
GRANT ALL ON TABLE "public"."orders_2026_04" TO "service_role";



GRANT ALL ON TABLE "public"."orders_2026_05" TO "anon";
GRANT ALL ON TABLE "public"."orders_2026_05" TO "authenticated";
GRANT ALL ON TABLE "public"."orders_2026_05" TO "service_role";



GRANT ALL ON TABLE "public"."orders_legacy" TO "anon";
GRANT ALL ON TABLE "public"."orders_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."orders_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."orders_v2" TO "anon";
GRANT ALL ON TABLE "public"."orders_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."orders_v2" TO "service_role";



GRANT ALL ON TABLE "public"."orphaned_events" TO "anon";
GRANT ALL ON TABLE "public"."orphaned_events" TO "authenticated";
GRANT ALL ON TABLE "public"."orphaned_events" TO "service_role";



GRANT ALL ON TABLE "public"."outcomes" TO "anon";
GRANT ALL ON TABLE "public"."outcomes" TO "authenticated";
GRANT ALL ON TABLE "public"."outcomes" TO "service_role";



GRANT ALL ON TABLE "public"."p2p_seller_cache" TO "anon";
GRANT ALL ON TABLE "public"."p2p_seller_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."p2p_seller_cache" TO "service_role";



GRANT ALL ON TABLE "public"."partial_fill_state" TO "anon";
GRANT ALL ON TABLE "public"."partial_fill_state" TO "authenticated";
GRANT ALL ON TABLE "public"."partial_fill_state" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."payout_calculations" TO "anon";
GRANT ALL ON TABLE "public"."payout_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON TABLE "public"."platform_wallets" TO "anon";
GRANT ALL ON TABLE "public"."platform_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."position_interventions" TO "anon";
GRANT ALL ON TABLE "public"."position_interventions" TO "authenticated";
GRANT ALL ON TABLE "public"."position_interventions" TO "service_role";



GRANT ALL ON TABLE "public"."positions" TO "anon";
GRANT ALL ON TABLE "public"."positions" TO "authenticated";
GRANT ALL ON TABLE "public"."positions" TO "service_role";



GRANT ALL ON TABLE "public"."price_history" TO "anon";
GRANT ALL ON TABLE "public"."price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."price_history" TO "service_role";



GRANT ALL ON TABLE "public"."price_ohlc_1h" TO "anon";
GRANT ALL ON TABLE "public"."price_ohlc_1h" TO "authenticated";
GRANT ALL ON TABLE "public"."price_ohlc_1h" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rebate_tiers_config" TO "anon";
GRANT ALL ON TABLE "public"."rebate_tiers_config" TO "authenticated";
GRANT ALL ON TABLE "public"."rebate_tiers_config" TO "service_role";



GRANT ALL ON TABLE "public"."resolution_feedback" TO "anon";
GRANT ALL ON TABLE "public"."resolution_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."resolution_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."resolution_systems" TO "anon";
GRANT ALL ON TABLE "public"."resolution_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."resolution_systems" TO "service_role";



GRANT ALL ON TABLE "public"."resolvers" TO "anon";
GRANT ALL ON TABLE "public"."resolvers" TO "authenticated";
GRANT ALL ON TABLE "public"."resolvers" TO "service_role";



GRANT ALL ON TABLE "public"."resting_orders" TO "anon";
GRANT ALL ON TABLE "public"."resting_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."resting_orders" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



GRANT ALL ON TABLE "public"."sensitive_topics" TO "anon";
GRANT ALL ON TABLE "public"."sensitive_topics" TO "authenticated";
GRANT ALL ON TABLE "public"."sensitive_topics" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_batches" TO "anon";
GRANT ALL ON TABLE "public"."settlement_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_batches" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_claims" TO "anon";
GRANT ALL ON TABLE "public"."settlement_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_claims" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_escalations" TO "anon";
GRANT ALL ON TABLE "public"."settlement_escalations" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_escalations" TO "service_role";



GRANT ALL ON TABLE "public"."settlement_statistics" TO "anon";
GRANT ALL ON TABLE "public"."settlement_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."settlement_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."spread_multiplier_config" TO "anon";
GRANT ALL ON TABLE "public"."spread_multiplier_config" TO "authenticated";
GRANT ALL ON TABLE "public"."spread_multiplier_config" TO "service_role";



GRANT ALL ON TABLE "public"."spread_rewards" TO "anon";
GRANT ALL ON TABLE "public"."spread_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."spread_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."support_ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."support_ticket_messages" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."trader_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."trader_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."trader_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."trades_2026_03" TO "anon";
GRANT ALL ON TABLE "public"."trades_2026_03" TO "authenticated";
GRANT ALL ON TABLE "public"."trades_2026_03" TO "service_role";



GRANT ALL ON TABLE "public"."trades_2026_04" TO "anon";
GRANT ALL ON TABLE "public"."trades_2026_04" TO "authenticated";
GRANT ALL ON TABLE "public"."trades_2026_04" TO "service_role";



GRANT ALL ON TABLE "public"."trades_2026_05" TO "anon";
GRANT ALL ON TABLE "public"."trades_2026_05" TO "authenticated";
GRANT ALL ON TABLE "public"."trades_2026_05" TO "service_role";



GRANT ALL ON TABLE "public"."trades_legacy" TO "anon";
GRANT ALL ON TABLE "public"."trades_legacy" TO "authenticated";
GRANT ALL ON TABLE "public"."trades_legacy" TO "service_role";



GRANT ALL ON TABLE "public"."trades_v2" TO "anon";
GRANT ALL ON TABLE "public"."trades_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."trades_v2" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."treasury_transfers" TO "anon";
GRANT ALL ON TABLE "public"."treasury_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."treasury_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."upstash_workflow_runs" TO "anon";
GRANT ALL ON TABLE "public"."upstash_workflow_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."upstash_workflow_runs" TO "service_role";



GRANT ALL ON TABLE "public"."usdt_transactions" TO "anon";
GRANT ALL ON TABLE "public"."usdt_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."usdt_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."user_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."user_current_rebate_status" TO "anon";
GRANT ALL ON TABLE "public"."user_current_rebate_status" TO "authenticated";
GRANT ALL ON TABLE "public"."user_current_rebate_status" TO "service_role";



GRANT ALL ON TABLE "public"."user_feed_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_feed_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feed_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_internal_notes" TO "anon";
GRANT ALL ON TABLE "public"."user_internal_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_internal_notes" TO "service_role";



GRANT ALL ON TABLE "public"."user_kyc_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_kyc_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_kyc_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_leagues" TO "anon";
GRANT ALL ON TABLE "public"."user_leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."user_leagues" TO "service_role";



GRANT ALL ON TABLE "public"."user_moderation_status" TO "anon";
GRANT ALL ON TABLE "public"."user_moderation_status" TO "authenticated";
GRANT ALL ON TABLE "public"."user_moderation_status" TO "service_role";



GRANT ALL ON TABLE "public"."user_portfolio_v2" TO "anon";
GRANT ALL ON TABLE "public"."user_portfolio_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."user_portfolio_v2" TO "service_role";



GRANT ALL ON TABLE "public"."user_rebate_history" TO "anon";
GRANT ALL ON TABLE "public"."user_rebate_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_rebate_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_reputation" TO "anon";
GRANT ALL ON TABLE "public"."user_reputation" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reputation" TO "service_role";



GRANT ALL ON TABLE "public"."user_status" TO "anon";
GRANT ALL ON TABLE "public"."user_status" TO "authenticated";
GRANT ALL ON TABLE "public"."user_status" TO "service_role";



GRANT ALL ON TABLE "public"."user_trading_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_trading_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_trading_stats" TO "service_role";



GRANT ALL ON TABLE "public"."verification_workflows" TO "anon";
GRANT ALL ON TABLE "public"."verification_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."view_resolvable_events" TO "anon";
GRANT ALL ON TABLE "public"."view_resolvable_events" TO "authenticated";
GRANT ALL ON TABLE "public"."view_resolvable_events" TO "service_role";



GRANT ALL ON TABLE "public"."vw_expiring_kyc" TO "anon";
GRANT ALL ON TABLE "public"."vw_expiring_kyc" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_expiring_kyc" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawal_requests" TO "anon";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawal_requests" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawal_verifications" TO "anon";
GRANT ALL ON TABLE "public"."withdrawal_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawal_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_analytics_daily" TO "anon";
GRANT ALL ON TABLE "public"."workflow_analytics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_analytics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_configs" TO "anon";
GRANT ALL ON TABLE "public"."workflow_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_configs" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_dlq" TO "anon";
GRANT ALL ON TABLE "public"."workflow_dlq" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_dlq" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_executions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_executions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_executions" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_execution_summary" TO "anon";
GRANT ALL ON TABLE "public"."workflow_execution_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_execution_summary" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_schedules" TO "anon";
GRANT ALL ON TABLE "public"."workflow_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_steps" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































