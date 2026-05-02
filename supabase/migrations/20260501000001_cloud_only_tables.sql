-- Migration: Create tables that exist in cloud but not in local schema
-- These tables were identified from the cloud DB snapshot and admin component queries

BEGIN;

-- =============================================
-- dispute_records
-- =============================================
CREATE TABLE IF NOT EXISTS public.dispute_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    event_id uuid NOT NULL,
    resolution_system_id uuid,
    disputed_by uuid NOT NULL,
    dispute_type character varying,
    dispute_reason text NOT NULL,
    evidence_urls text[],
    evidence_files text[],
    bond_amount numeric NOT NULL DEFAULT 0,
    bond_locked_at timestamptz DEFAULT now(),
    bond_status character varying DEFAULT 'locked',
    assigned_judge uuid,
    judge_notes text,
    ruling character varying,
    ruling_reason text,
    ruling_at timestamptz,
    status character varying DEFAULT 'pending',
    community_votes_yes integer DEFAULT 0,
    community_votes_no integer DEFAULT 0,
    voting_ends_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dispute_records_event_id ON public.dispute_records(event_id);
CREATE INDEX IF NOT EXISTS idx_dispute_records_disputed_by ON public.dispute_records(disputed_by);
CREATE INDEX IF NOT EXISTS idx_dispute_records_status ON public.dispute_records(status);
CREATE INDEX IF NOT EXISTS idx_dispute_records_created_at ON public.dispute_records(created_at DESC);

-- =============================================
-- manual_review_queue
-- =============================================
CREATE TABLE IF NOT EXISTS public.manual_review_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    market_id uuid NOT NULL,
    review_type character varying NOT NULL DEFAULT 'oracle_verification',
    priority integer NOT NULL DEFAULT 0,
    status character varying DEFAULT 'pending',
    assigned_to uuid,
    notes text,
    ai_trust_score_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_review_queue_market_id ON public.manual_review_queue(market_id);
CREATE INDEX IF NOT EXISTS idx_manual_review_queue_status ON public.manual_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_manual_review_queue_priority ON public.manual_review_queue(priority DESC);

-- =============================================
-- resolvers
-- =============================================
CREATE TABLE IF NOT EXISTS public.resolvers (
    address text NOT NULL PRIMARY KEY,
    name character varying NOT NULL,
    type character varying NOT NULL,
    description text,
    website_url text,
    is_active boolean DEFAULT true,
    success_count integer DEFAULT 0,
    dispute_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- =============================================
-- expert_panel
-- =============================================
CREATE TABLE IF NOT EXISTS public.expert_panel (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    expert_name character varying NOT NULL,
    credentials text,
    specializations text[] NOT NULL DEFAULT '{}',
    bio text,
    is_verified boolean DEFAULT false,
    verification_documents text[],
    verified_by uuid,
    verified_at timestamptz,
    total_votes integer DEFAULT 0,
    correct_votes integer DEFAULT 0,
    incorrect_votes integer DEFAULT 0,
    accuracy_rate numeric,
    expert_rating numeric DEFAULT 0,
    reputation_score integer DEFAULT 0,
    is_active boolean DEFAULT true,
    availability_status character varying DEFAULT 'available',
    email character varying,
    phone character varying,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_vote_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_expert_panel_user_id ON public.expert_panel(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_panel_is_active ON public.expert_panel(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_panel_reputation ON public.expert_panel(reputation_score DESC);

-- =============================================
-- expert_votes
-- =============================================
CREATE TABLE IF NOT EXISTS public.expert_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    expert_id uuid NOT NULL REFERENCES public.expert_panel(id) ON DELETE CASCADE,
    event_id uuid NOT NULL,
    vote_outcome integer NOT NULL,
    confidence_level numeric,
    reasoning text NOT NULL,
    ai_relevance_score numeric,
    ai_verification_status character varying DEFAULT 'pending',
    ai_feedback text,
    is_correct boolean,
    points_earned integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    verified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_expert_votes_expert_id ON public.expert_votes(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_votes_event_id ON public.expert_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_expert_votes_created_at ON public.expert_votes(created_at DESC);

-- =============================================
-- expert_panel_members
-- =============================================
CREATE TABLE IF NOT EXISTS public.expert_panel_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid,
    name character varying NOT NULL,
    expertise text[],
    credibility_score numeric DEFAULT 0.80,
    total_reviews integer DEFAULT 0,
    accuracy_rate numeric DEFAULT 0.80,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- =============================================
-- expert_panel_reviews
-- =============================================
CREATE TABLE IF NOT EXISTS public.expert_panel_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    dispute_id uuid NOT NULL,
    panel_members uuid[] NOT NULL DEFAULT '{}',
    votes jsonb DEFAULT '[]',
    consensus_outcome character varying,
    consensus_confidence numeric,
    assigned_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_expert_panel_reviews_dispute_id ON public.expert_panel_reviews(dispute_id);

-- =============================================
-- workflow_configs
-- =============================================
CREATE TABLE IF NOT EXISTS public.workflow_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name character varying NOT NULL,
    endpoint character varying NOT NULL,
    cron_expression character varying,
    is_active boolean DEFAULT false,
    last_run timestamptz,
    next_run timestamptz,
    last_status character varying,
    execution_time_ms integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_configs_is_active ON public.workflow_configs(is_active);

COMMIT;
