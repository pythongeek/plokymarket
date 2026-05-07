-- Missing cloud tables - applied May 5 2026
BEGIN;

CREATE TABLE IF NOT EXISTS public."admin_settings" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "key" character varying(50) NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now(),
    "updated_by" "uuid"
)

CREATE TABLE IF NOT EXISTS public."ai_daily_topics" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "suggested_title" "text" NOT NULL,
    "suggested_question" "text" NOT NULL,
    "suggested_description" "text",
    "suggested_category" character varying(50),
    "ai_reasoning" "text",
    "ai_confidence" numeric(5,2) DEFAULT 0.00,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "market_id" "uuid",
    "rejected_reason" "text",
    "generated_at" timestamp with time zone DEFAULT now(),
    "approved_at" timestamp with time zone,
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "ai_daily_topics_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
)

CREATE TABLE IF NOT EXISTS public."ai_rate_limit_state" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "service" character varying(100) NOT NULL,
    "window_start" timestamp with time zone DEFAULT now(),
    "request_count" integer DEFAULT 0,
    "request_limit" integer NOT NULL,
    "window_ms" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
)

CREATE TABLE IF NOT EXISTS public."audit_logs" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT now(),
    "audit_type" "text",
    "status" "text",
    "reserve_ratio" numeric,
    "variance" numeric,
    "details" "jsonb"
)

CREATE TABLE IF NOT EXISTS public."balance_holds" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "reason" character varying(50) NOT NULL,
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "released_at" timestamp with time zone,
    "released_by" "uuid",
    "released_reason" "text",
    CONSTRAINT "balance_holds_amount_check" CHECK (("amount" > (0)::numeric))
)

CREATE TABLE IF NOT EXISTS public."bd_news_sources" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "name" character varying(200) NOT NULL,
    "domain" character varying(200) NOT NULL,
    "source_type" character varying(50) NOT NULL,
    "category" character varying(50) NOT NULL,
    "authority_score" numeric(3,2) NOT NULL,
    "is_government" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "contact_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "bd_news_sources_authority_score_check" CHECK ((("authority_score" >= (0)::numeric) AND ("authority_score" <= (1)::numeric))),
    CONSTRAINT "bd_news_sources_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['general'::character varying, 'business'::character varying, 'sports'::character varying, 'politics'::character varying])::"text"[]))),
    CONSTRAINT "bd_news_sources_source_type_check" CHECK ((("source_type")::"text" = ANY ((ARRAY['english'::character varying, 'bengali'::character varying, 'online_portal'::character varying])::"text"[])))
)

CREATE TABLE IF NOT EXISTS public."bd_political_events" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "event_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "parties_involved" "text"[],
    "locations" "text"[],
    "outcome_summary" "text",
    "market_impact_score" integer,
    "is_resolved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "bd_political_events_event_type_check" CHECK ((("event_type")::"text" = ANY ((ARRAY['election'::character varying, 'protest'::character varying, 'policy_change'::character varying, 'cabinet_reshuffle'::character varying, 'international_visit'::character varying])::"text"[]))),
    CONSTRAINT "bd_political_events_market_impact_score_check" CHECK ((("market_impact_score" >= 1) AND ("market_impact_score" <= 10)))
)

CREATE TABLE IF NOT EXISTS public."dispute_records" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "resolution_system_id" "uuid",
    "disputed_by" "uuid" NOT NULL,
    "dispute_type" character varying(50),
    "dispute_reason" "text" NOT NULL,
    "evidence_urls" "text"[],
    "evidence_files" "text"[],
    "bond_amount" numeric(10,2) NOT NULL,
    "bond_locked_at" timestamp with time zone DEFAULT now(),
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
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "resolved_at" timestamp with time zone
)

CREATE TABLE IF NOT EXISTS public."expert_assignments" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "expert_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "assignment_reason" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "assigned_at" timestamp with time zone DEFAULT now(),
    "responded_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "expert_assignments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'completed'::character varying, 'expired'::character varying])::"text"[])))
)

CREATE TABLE IF NOT EXISTS public."expert_panel" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_vote_at" timestamp with time zone
)

CREATE TABLE IF NOT EXISTS public."expert_panel_members" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "user_id" "uuid",
    "name" character varying(200) NOT NULL,
    "expertise" "text"[],
    "credibility_score" numeric(4,3) DEFAULT 0.80,
    "total_reviews" integer DEFAULT 0,
    "accuracy_rate" numeric(5,4) DEFAULT 0.80,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "expert_panel_members_accuracy_rate_check" CHECK ((("accuracy_rate" >= (0)::numeric) AND ("accuracy_rate" <= (1)::numeric))),
    CONSTRAINT "expert_panel_members_credibility_score_check" CHECK ((("credibility_score" >= (0)::numeric) AND ("credibility_score" <= (1)::numeric)))
)

CREATE TABLE IF NOT EXISTS public."expert_panel_reviews" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "dispute_id" "uuid" NOT NULL,
    "panel_members" "uuid"[] NOT NULL,
    "votes" "jsonb" DEFAULT '[]'::"jsonb",
    "consensus_outcome" character varying(50),
    "consensus_confidence" numeric(5,4),
    "assigned_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone
)

CREATE TABLE IF NOT EXISTS public."expert_votes" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT now(),
    "verified_at" timestamp with time zone,
    CONSTRAINT "expert_votes_ai_verification_status_check" CHECK ((("ai_verification_status")::"text" = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying, 'flagged'::character varying])::"text"[]))),
    CONSTRAINT "expert_votes_confidence_level_check" CHECK ((("confidence_level" >= (0)::numeric) AND ("confidence_level" <= (100)::numeric))),
    CONSTRAINT "expert_votes_vote_outcome_check" CHECK (("vote_outcome" = ANY (ARRAY[1, 2])))
)

CREATE TABLE IF NOT EXISTS public."kyc_admin_overrides" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "override_type" character varying(20),
    "admin_id" "uuid",
    "reason" "text",
    "is_active" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "revoked_at" timestamp with time zone,
    "revoked_by" "uuid"
)

CREATE TABLE IF NOT EXISTS public."manual_deposits" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT now()
)

CREATE TABLE IF NOT EXISTS public."market_creation_drafts" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
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
)

CREATE TABLE IF NOT EXISTS public."market_follows" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "market_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "notification_preferences" "jsonb" DEFAULT '{"news": true, "resolutions": true, "volume_spikes": true, "price_movements": true}'::"jsonb"
)

CREATE TABLE IF NOT EXISTS public."moderation_actions" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
    "action_type" "text" NOT NULL,
    "target_user_id" "uuid",
    "target_comment_id" "uuid",
    "performed_by" "uuid" NOT NULL,
    "reason" "text",
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT now()
)

CREATE TABLE IF NOT EXISTS public."news_sources" (
    "id" "uuid" DEFAULT gen_random_uuid() NOT NULL,
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
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
)

CREATE TABLE IF NOT EXISTS public."resolvers" (
    "address" "text" NOT NULL,
    "name" character varying(255) NOT NULL,
    "type" character varying(50) NOT NULL,
    "description" "text",
    "website_url" "text",
    "is_active" boolean DEFAULT true,
    "success_count" integer DEFAULT 0,
    "dispute_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "resolvers_address_check" CHECK (("address" ~ '^0x[a-fA-F0-9]{40}$'::"text")),
    CONSTRAINT "resolvers_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['UMA'::character varying, 'Chainlink'::character varying, 'Custom'::character varying, 'Multisig'::character varying, 'AI_ORACLE'::character varying, 'MANUAL_ADMIN'::character varying])::"text"[])))
)

-- MISSING: manual_review_queue
COMMIT;