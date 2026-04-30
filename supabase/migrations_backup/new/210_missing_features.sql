-- ============================================================
-- DOMAIN: missing_features  
-- PURPOSE: Create missing tables - clean slate version
-- Created: 2026-03-16
-- ============================================================

-- FIRST: Drop existing tables if they exist (to avoid schema conflicts)
DROP TABLE IF EXISTS public.support_ticket_messages CASCADE;
DROP TABLE IF EXISTS public.support_tickets CASCADE;
DROP TABLE IF EXISTS public.user_internal_notes CASCADE;
DROP TABLE IF EXISTS public.position_interventions CASCADE;
DROP TABLE IF EXISTS public.payout_calculations CASCADE;
DROP TABLE IF EXISTS public.treasury_transfers CASCADE;
DROP TABLE IF EXISTS public.burn_events CASCADE;
DROP TABLE IF EXISTS public.ai_event_pipelines CASCADE;
DROP TABLE IF EXISTS public.user_feed_preferences CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;

-- ============================================================
-- PART 1: SOCIAL FEATURES
-- ============================================================

CREATE TABLE public.follows (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id     UUID NOT NULL,
    following_id   UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE public.user_feed_preferences (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL UNIQUE,
    preferences     JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 2: AI PIPELINES
-- ============================================================

CREATE TABLE public.ai_event_pipelines (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL,
    event_id        UUID,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    pipeline_type   VARCHAR(50) NOT NULL DEFAULT 'event_creation',
    input_data      JSONB DEFAULT '{}'::JSONB,
    output_data     JSONB DEFAULT '{}'::JSONB,
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 3: TREASURY & BURN EVENTS
-- ============================================================

CREATE TABLE public.burn_events (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id        UUID NOT NULL,
    market_id       UUID,
    burned_amount   NUMERIC NOT NULL DEFAULT 0,
    burn_rate       NUMERIC NOT NULL DEFAULT 0.01,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    tx_hash         VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.treasury_transfers (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market_id       UUID NOT NULL,
    user_id         UUID,
    transfer_type   VARCHAR(50) NOT NULL DEFAULT 'payout',
    amount          NUMERIC NOT NULL DEFAULT 0,
    currency        VARCHAR(20) NOT NULL DEFAULT 'USDT',
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    tx_hash         VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 4: PAYOUT SYSTEM
-- ============================================================

CREATE TABLE public.payout_calculations (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    outcome         VARCHAR(10) NOT NULL DEFAULT 'YES',
    position_id     UUID,
    shares          NUMERIC NOT NULL DEFAULT 0,
    purchase_price  NUMERIC NOT NULL DEFAULT 0,
    current_price   NUMERIC NOT NULL DEFAULT 0,
    payout_amount   NUMERIC NOT NULL DEFAULT 0,
    profit_loss     NUMERIC NOT NULL DEFAULT 0,
    calculation_type VARCHAR(50) NOT NULL DEFAULT 'settlement',
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata        JSONB DEFAULT '{}'::JSONB,
    calculated_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 5: ADMIN & INTERVENTIONS
-- ============================================================

CREATE TABLE public.position_interventions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL,
    market_id       UUID,
    position_id     UUID,
    intervention_type VARCHAR(50) NOT NULL DEFAULT 'balance_adjustment',
    amount          NUMERIC NOT NULL DEFAULT 0,
    reason          TEXT,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    performed_by    UUID,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_internal_notes (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL,
    note_type       VARCHAR(50) NOT NULL DEFAULT 'general',
    content         TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::JSONB,
    created_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 6: SUPPORT SYSTEM
-- ============================================================

CREATE TABLE public.support_tickets (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID NOT NULL,
    ticket_type     VARCHAR(50) NOT NULL DEFAULT 'general',
    subject         TEXT NOT NULL,
    description     TEXT,
    status          VARCHAR(50) NOT NULL DEFAULT 'open',
    priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
    assigned_to     UUID,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.support_ticket_messages (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id       UUID NOT NULL,
    user_id         UUID NOT NULL,
    message         TEXT NOT NULL,
    is_internal     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 7: RLS - Enable and set simple policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_event_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burn_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "follows_all" ON public.follows FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "feed_prefs_all" ON public.user_feed_preferences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ai_pipelines_all" ON public.ai_event_pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "burn_events_all" ON public.burn_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "treasury_all" ON public.treasury_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "payouts_all" ON public.payout_calculations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "interventions_all" ON public.position_interventions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "notes_all" ON public.user_internal_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tickets_all" ON public.support_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "messages_all" ON public.support_ticket_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role policies
CREATE POLICY "service_follows_all" ON public.follows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_feed_prefs_all" ON public.user_feed_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_ai_pipelines_all" ON public.ai_event_pipelines FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_burn_events_all" ON public.burn_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_treasury_all" ON public.treasury_transfers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_payouts_all" ON public.payout_calculations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_interventions_all" ON public.position_interventions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_notes_all" ON public.user_internal_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_tickets_all" ON public.support_tickets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_messages_all" ON public.support_ticket_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Migration completed
SELECT 'Migration 210 completed: All tables created with RLS policies' AS status;
