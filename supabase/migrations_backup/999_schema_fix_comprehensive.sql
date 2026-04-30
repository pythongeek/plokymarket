-- ============================================================
-- COMPREHENSIVE SCHEMA FIX MIGRATION
-- Purpose: Add all missing tables, columns, and RPC functions
--          that are defined in database.types.ts but missing 
--          in production database
-- Created: 2026-03-16
-- ============================================================

-- ============================================================
-- PART 1: ADD MISSING COLUMNS FIRST (needed for views)
-- ============================================================

-- 1.0a markets.current_price_yes column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'current_price_yes') THEN
        ALTER TABLE public.markets ADD COLUMN current_price_yes NUMERIC DEFAULT 0.5;
    END IF;
END $$;

-- 1.0b markets.current_price_no column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'current_price_no') THEN
        ALTER TABLE public.markets ADD COLUMN current_price_no NUMERIC DEFAULT 0.5;
    END IF;
END $$;

-- ============================================================
-- PART 2: ADD MISSING TABLES
-- ============================================================

-- 1.1 USDT Transactions Table
CREATE TABLE IF NOT EXISTS public.usdt_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'deposit',
    amount NUMERIC NOT NULL DEFAULT 0,
    currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    tx_hash VARCHAR(100),
    payment_method VARCHAR(20),
    reference_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::JSONB,
    verified_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    ticket_type VARCHAR(50) NOT NULL DEFAULT 'general',
    subject TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assigned_to UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Support Ticket Messages Table
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 User Internal Notes Table
CREATE TABLE IF NOT EXISTS public.user_internal_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    note_type VARCHAR(50) NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 Position Interventions Table
CREATE TABLE IF NOT EXISTS public.position_interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    market_id UUID,
    position_id UUID,
    intervention_type VARCHAR(50) NOT NULL DEFAULT 'balance_adjustment',
    amount NUMERIC NOT NULL DEFAULT 0,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    performed_by UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 AI Event Pipelines Table
CREATE TABLE IF NOT EXISTS public.ai_event_pipelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    event_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    pipeline_type VARCHAR(50) NOT NULL DEFAULT 'event_creation',
    input_data JSONB DEFAULT '{}'::JSONB,
    output_data JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.7 Market Metrics View (if missing)
-- Note: Removed _bn columns as they may not exist in production
DROP VIEW IF EXISTS public.market_metrics CASCADE;
CREATE OR REPLACE VIEW public.market_metrics AS
SELECT 
    m.id as market_id,
    m.event_id,
    m.status,
    m.question,
    m.current_price_yes,
    m.current_price_no,
    m.volume_24h,
    m.liquidity,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT t.id) as trade_count
FROM public.markets m
LEFT JOIN public.orders o ON o.market_id = m.id
LEFT JOIN public.trades t ON t.market_id = m.id
GROUP BY m.id, m.event_id, m.status, m.question, 
         m.current_price_yes, m.current_price_no, m.volume_24h, m.liquidity;

-- 1.8 View Resolvable Events (if missing)
-- Note: Removed resolution_date as it doesn't exist in events table
DROP VIEW IF EXISTS public.view_resolvable_events CASCADE;
CREATE OR REPLACE VIEW public.view_resolvable_events AS
SELECT 
    e.id as event_id,
    e.title,
    e.status as event_status,
    e.ends_at as end_date,
    COUNT(m.id) as market_count,
    COUNT(CASE WHEN m.status = 'active' THEN 1 END) as active_markets
FROM public.events e
LEFT JOIN public.markets m ON m.event_id = e.id
WHERE e.status IN ('active', 'closed', 'pending_resolution')
GROUP BY e.id, e.title, e.status, e.ends_at;

-- 1.9 User Portfolio V2 View (if missing)
-- Note: Removed question_bn column as it may not exist in production
DROP VIEW IF EXISTS public.user_portfolio_v2 CASCADE;
CREATE OR REPLACE VIEW public.user_portfolio_v2 AS
SELECT 
    p.user_id,
    p.market_id,
    m.question,
    m.current_price_yes,
    m.current_price_no,
    p.outcome,
    p.quantity as shares,
    p.average_price,
    p.quantity * p.average_price as investment,
    CASE 
        WHEN p.outcome = 'YES' THEN p.quantity * m.current_price_yes
        ELSE p.quantity * m.current_price_no
    END as current_value,
    CASE 
        WHEN p.outcome = 'YES' THEN (m.current_price_yes - p.average_price) * p.quantity
        ELSE (m.current_price_no - p.average_price) * p.quantity
    END as unrealized_pnl
FROM public.positions p
JOIN public.markets m ON m.id = p.market_id
WHERE p.quantity > 0;

-- ============================================================
-- PART 3: ADD MISSING COLUMNS
-- ============================================================

-- 2.1 profiles.is_admin column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2.2 wallets.usdt_balance column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallets' AND column_name = 'usdt_balance') THEN
        ALTER TABLE public.wallets ADD COLUMN usdt_balance NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2.3 wallets.locked_usdt column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallets' AND column_name = 'locked_usdt') THEN
        ALTER TABLE public.wallets ADD COLUMN locked_usdt NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2.4 markets.question_bn column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'question_bn') THEN
        ALTER TABLE public.markets ADD COLUMN question_bn TEXT;
    END IF;
END $$;

-- 2.5 markets.creator_address column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'creator_address') THEN
        ALTER TABLE public.markets ADD COLUMN creator_address VARCHAR(100);
    END IF;
END $$;

-- 2.6 positions.unrealized_pnl column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'positions' AND column_name = 'unrealized_pnl') THEN
        ALTER TABLE public.positions ADD COLUMN unrealized_pnl NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2.7 positions.side column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'positions' AND column_name = 'side') THEN
        ALTER TABLE public.positions ADD COLUMN side VARCHAR(10);
    END IF;
END $$;

-- ============================================================
-- PART 4: ADD MISSING RPC FUNCTIONS
-- ============================================================

-- 3.1 verify_and_credit_deposit function
DROP FUNCTION IF EXISTS public.verify_and_credit_deposit(UUID, UUID);
CREATE OR REPLACE FUNCTION public.verify_and_credit_deposit(
    p_admin_id UUID,
    p_deposit_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3.2 process_withdrawal function
DROP FUNCTION IF EXISTS public.process_withdrawal(UUID);
CREATE OR REPLACE FUNCTION public.process_withdrawal(
    p_withdrawal_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3.3 admin_credit_wallet function
DROP FUNCTION IF EXISTS public.admin_credit_wallet(UUID, UUID, NUMERIC, VARCHAR, TEXT);
CREATE OR REPLACE FUNCTION public.admin_credit_wallet(
    p_admin_id UUID,
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency VARCHAR DEFAULT 'BDT',
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3.4 admin_debit_wallet function
DROP FUNCTION IF EXISTS public.admin_debit_wallet(UUID, UUID, NUMERIC, VARCHAR, TEXT);
CREATE OR REPLACE FUNCTION public.admin_debit_wallet(
    p_admin_id UUID,
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency VARCHAR DEFAULT 'BDT',
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3.5 manual_resolve_market function
DROP FUNCTION IF EXISTS public.manual_resolve_market(UUID, VARCHAR, UUID, TEXT);
CREATE OR REPLACE FUNCTION public.manual_resolve_market(
    p_market_id UUID,
    p_winning_outcome VARCHAR,
    p_admin_id UUID,
    p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 3.6 withdrawal_processing function (alias for process_withdrawal)
DROP FUNCTION IF EXISTS public.withdrawal_processing(UUID);
CREATE OR REPLACE FUNCTION public.withdrawal_processing(
    p_withdrawal_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.process_withdrawal(p_withdrawal_id);
END;
$$;

-- 3.7 update_user_status function
DROP FUNCTION IF EXISTS public.update_user_status(UUID, UUID, VARCHAR);
CREATE OR REPLACE FUNCTION public.update_user_status(
    p_admin_id UUID,
    p_user_id UUID,
    p_status VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- ============================================================
-- PART 4: ENABLE RLS ON NEW TABLES
-- ============================================================

ALTER TABLE public.usdt_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_event_pipelines ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 5: ADD RLS POLICIES
-- ============================================================

-- USDT Transactions policies
DROP POLICY IF EXISTS "usdt_transactions_all" ON public.usdt_transactions;
CREATE POLICY "usdt_transactions_all" ON public.usdt_transactions 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Support Tickets policies
DROP POLICY IF EXISTS "support_tickets_all" ON public.support_tickets;
CREATE POLICY "support_tickets_all" ON public.support_tickets 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "support_ticket_messages_all" ON public.support_ticket_messages;
CREATE POLICY "support_ticket_messages_all" ON public.support_ticket_messages 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Internal Notes policies
DROP POLICY IF EXISTS "user_internal_notes_all" ON public.user_internal_notes;
CREATE POLICY "user_internal_notes_all" ON public.user_internal_notes 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Position Interventions policies
DROP POLICY IF EXISTS "position_interventions_all" ON public.position_interventions;
CREATE POLICY "position_interventions_all" ON public.position_interventions 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI Event Pipelines policies
DROP POLICY IF EXISTS "ai_event_pipelines_all" ON public.ai_event_pipelines;
CREATE POLICY "ai_event_pipelines_all" ON public.ai_event_pipelines 
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role policies
DROP POLICY IF EXISTS "service_usdt_transactions_all" ON public.usdt_transactions;
CREATE POLICY "service_usdt_transactions_all" ON public.usdt_transactions 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_support_tickets_all" ON public.support_tickets;
CREATE POLICY "service_support_tickets_all" ON public.support_tickets 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_support_ticket_messages_all" ON public.support_ticket_messages;
CREATE POLICY "service_support_ticket_messages_all" ON public.support_ticket_messages 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_user_internal_notes_all" ON public.user_internal_notes;
CREATE POLICY "service_user_internal_notes_all" ON public.user_internal_notes 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_position_interventions_all" ON public.position_interventions;
CREATE POLICY "service_position_interventions_all" ON public.position_interventions 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_ai_event_pipelines_all" ON public.ai_event_pipelines;
CREATE POLICY "service_ai_event_pipelines_all" ON public.ai_event_pipelines 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Migration completed
SELECT 'Comprehensive Schema Fix Migration completed: All missing tables, columns, and RPC functions added' AS status;
