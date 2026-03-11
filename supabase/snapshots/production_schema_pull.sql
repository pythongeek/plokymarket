-- ============================================
-- PRODUCTION SCHEMA PULL
-- Generated: 2026-03-11T19:13:26.487Z
-- Project: sltcfmqefujecqfbmkvz (supabase-amber-lamp)
-- ============================================

-- ======== ENUM TYPES ========
CREATE TYPE public.accuracy_tier AS ENUM ('novice', 'apprentice', 'analyst', 'expert', 'master', 'oracle');
CREATE TYPE public.activity_type AS ENUM ('TRADE', 'MARKET_CREATE', 'MARKET_RESOLVE', 'LEAGUE_UP', 'LEAGUE_DOWN', 'COMMENT', 'USER_JOIN');
CREATE TYPE public.answer_type AS ENUM ('binary', 'categorical', 'scalar');
CREATE TYPE public.attachment_type AS ENUM ('image', 'link', 'gif', 'file');
CREATE TYPE public.badge_category AS ENUM ('accuracy', 'volume', 'streak', 'community', 'special', 'expert');
CREATE TYPE public.badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE public.content_type AS ENUM ('market_movement', 'trader_activity', 'system_notification', 'social_interaction', 'trending_market', 'comment_reply', 'mention', 'follow', 'badge_earned', 'market_resolve');
CREATE TYPE public.deposit_status AS ENUM ('pending', 'under_review', 'verified', 'rejected', 'auto_approved', 'completed');
CREATE TYPE public.flag_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'off_topic', 'trolling', 'other');
CREATE TYPE public.kyc_status AS ENUM ('not_started', 'pending', 'approved', 'rejected', 'expired');
CREATE TYPE public.market_status AS ENUM ('active', 'closed', 'resolved', 'cancelled', 'draft', 'paused', 'rejected');
CREATE TYPE public.market_type_enum AS ENUM ('binary', 'multi_outcome', 'scalar');
CREATE TYPE public.mfs_provider AS ENUM ('bkash', 'nagad', 'rocket', 'upay');
CREATE TYPE public.moderation_status AS ENUM ('clean', 'pending_review', 'flagged', 'removed', 'appealed');
CREATE TYPE public.notification_type AS ENUM ('market_resolved', 'trade_filled', 'price_alert', 'market_closing_soon', 'follower_trade', 'ai_suggestion', 'position_profit', 'position_loss', 'system', 'order_filled');
CREATE TYPE public.oracle_status AS ENUM ('pending', 'verified', 'disputed', 'finalized');
CREATE TYPE public.order_side AS ENUM ('buy', 'sell');
CREATE TYPE public.order_status AS ENUM ('open', 'partially_filled', 'filled', 'cancelled', 'expired');
CREATE TYPE public.order_type AS ENUM ('limit', 'market', 'stop_loss', 'take_profit', 'trailing_stop', 'iceberg');
CREATE TYPE public.outcome_type AS ENUM ('YES', 'NO');
CREATE TYPE public.payment_method AS ENUM ('bkash', 'nagad', 'bank_transfer');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.sentiment_type AS ENUM ('positive', 'negative', 'neutral', 'mixed');
CREATE TYPE public.tif_type AS ENUM ('FOK', 'IOC', 'GTC', 'GTD', 'AON');
CREATE TYPE public.trading_phase_type AS ENUM ('PRE_OPEN', 'CONTINUOUS', 'AUCTION', 'HALTED', 'CLOSED');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'reversed');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'settlement', 'refund');
CREATE TYPE public.user_account_status AS ENUM ('active', 'restricted', 'dormant', 'banned');
CREATE TYPE public.vote_type AS ENUM ('upvote', 'downvote', 'none');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected', 'cancelled');

-- ======== TABLES ========

-- Table: activities
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  type activity_type NOT NULL,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: activity_aggregations
CREATE TABLE IF NOT EXISTS public.activity_aggregations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  aggregation_type text NOT NULL,
  aggregation_key text NOT NULL,
  title text,
  aggregated_count integer DEFAULT 0,
  activity_ids jsonb DEFAULT '[]'::jsonb,
  preview_data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: admin_activity_logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_id uuid NOT NULL,
  action_type character varying(50) NOT NULL,
  resource_type character varying(50),
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  change_summary text,
  reason text,
  ip_address inet,
  user_agent text,
  workflow_id character varying(100),
  workflow_status character varying(20),
  created_at timestamp with time zone DEFAULT now()
);

-- Table: admin_ai_settings
CREATE TABLE IF NOT EXISTS public.admin_ai_settings (
  id integer DEFAULT 1 NOT NULL,
  custom_instruction text DEFAULT 'Generate engaging prediction market topics relevant to Bangladesh users'::text,
  target_region character varying(50) DEFAULT 'Bangladesh'::character varying,
  default_categories ARRAY DEFAULT ARRAY['Sports'::text, 'Politics'::text, 'Economy'::text, 'Entertainment'::text],
  auto_generate_enabled boolean DEFAULT false,
  auto_generate_time time without time zone DEFAULT '08:00:00'::time without time zone,
  max_daily_topics integer DEFAULT 5,
  gemini_model character varying(50) DEFAULT 'gemini-1.5-flash'::character varying,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table: admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_id uuid,
  admin_name character varying(255),
  action character varying(100) NOT NULL,
  action_category character varying(50),
  target_user_id uuid,
  target_user_email character varying(255),
  resource text,
  details jsonb,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  requires_dual_auth boolean DEFAULT false,
  dual_auth_admin_id uuid,
  dual_auth_at timestamp with time zone,
  ip_address text,
  user_agent text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key character varying(50) NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table: admin_workflow_triggers
CREATE TABLE IF NOT EXISTS public.admin_workflow_triggers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  admin_id uuid NOT NULL,
  workflow_name character varying(100) NOT NULL,
  endpoint text NOT NULL,
  status character varying(20) NOT NULL,
  response jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: agent_wallets
CREATE TABLE IF NOT EXISTS public.agent_wallets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  method character varying(10),
  wallet_type character varying(20),
  phone_number character varying(15) NOT NULL,
  account_name character varying(100),
  is_active boolean DEFAULT true,
  daily_limit_bdt numeric DEFAULT 100000,
  used_today_bdt numeric DEFAULT 0,
  last_reset_date date DEFAULT CURRENT_DATE,
  qr_code_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: ai_ab_tests
CREATE TABLE IF NOT EXISTS public.ai_ab_tests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name character varying(200) NOT NULL,
  model_a_id uuid NOT NULL,
  model_b_id uuid NOT NULL,
  traffic_split_a integer NOT NULL,
  traffic_split_b integer NOT NULL,
  status character varying(20) DEFAULT 'running'::character varying,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  model_a_metrics jsonb,
  model_b_metrics jsonb,
  winner_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: ai_agent_configs
CREATE TABLE IF NOT EXISTS public.ai_agent_configs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  agent_key text NOT NULL,
  agent_name text NOT NULL,
  description text,
  system_prompt text DEFAULT ''::text NOT NULL,
  model_name text DEFAULT 'gemini-2.5-flash'::text,
  status text DEFAULT 'active'::text,
  temperature numeric DEFAULT 0.2,
  daily_token_limit integer DEFAULT 100000,
  total_tokens_spent bigint DEFAULT 0,
  pipeline text,
  last_run_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: ai_circuit_breaker_state
CREATE TABLE IF NOT EXISTS public.ai_circuit_breaker_state (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  service character varying(100) NOT NULL,
  status character varying(20) NOT NULL,
  failure_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  threshold integer DEFAULT 5 NOT NULL,
  timeout_ms integer DEFAULT 60000 NOT NULL,
  last_failure_at timestamp with time zone,
  last_success_at timestamp with time zone,
  opened_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: ai_daily_topics
CREATE TABLE IF NOT EXISTS public.ai_daily_topics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  suggested_title text NOT NULL,
  suggested_question text NOT NULL,
  suggested_description text,
  suggested_category character varying(50),
  ai_reasoning text,
  ai_confidence numeric DEFAULT 0.00,
  status character varying(20) DEFAULT 'pending'::character varying,
  market_id uuid,
  rejected_reason text,
  generated_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: ai_evidence_cache
CREATE TABLE IF NOT EXISTS public.ai_evidence_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cache_key character varying(500) NOT NULL,
  query text NOT NULL,
  sources jsonb NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  source_types ARRAY,
  total_sources integer,
  cross_verification_score numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: ai_model_versions
CREATE TABLE IF NOT EXISTS public.ai_model_versions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  model_type character varying(50) NOT NULL,
  version character varying(20) NOT NULL,
  deployment_status character varying(20) DEFAULT 'staging'::character varying,
  accuracy numeric,
  precision numeric,
  recall numeric,
  f1_score numeric,
  avg_latency_ms integer,
  training_date timestamp with time zone,
  dataset_size integer,
  training_parameters jsonb,
  is_canary boolean DEFAULT false,
  canary_traffic_percent integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: ai_prompts
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  agent_name character varying(50) NOT NULL,
  description text,
  system_prompt text NOT NULL,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table: ai_providers
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  provider_name character varying(50) NOT NULL,
  model character varying(255) NOT NULL,
  base_url character varying(1000),
  api_key_secret_name character varying(255),
  temperature numeric DEFAULT 0.7,
  max_tokens integer DEFAULT 4000,
  is_active boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table: ai_rate_limit_state
CREATE TABLE IF NOT EXISTS public.ai_rate_limit_state (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  service character varying(100) NOT NULL,
  window_start timestamp with time zone DEFAULT now(),
  request_count integer DEFAULT 0,
  request_limit integer NOT NULL,
  window_ms integer NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: ai_resolution_pipelines
CREATE TABLE IF NOT EXISTS public.ai_resolution_pipelines (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pipeline_id character varying(100) NOT NULL,
  market_id uuid NOT NULL,
  query text NOT NULL,
  retrieval_output jsonb,
  synthesis_output jsonb,
  deliberation_output jsonb,
  explanation_output jsonb,
  final_outcome character varying(50),
  final_confidence numeric,
  confidence_level character varying(20),
  recommended_action character varying(50),
  status character varying(20) DEFAULT 'running'::character varying,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  total_execution_time_ms integer,
  synthesis_model_version character varying(20),
  deliberation_model_version character varying(20),
  explanation_model_version character varying(20),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  bangladesh_context jsonb,
  bangladesh_division character varying(50),
  detected_language character varying(10),
  is_bangladesh_context boolean DEFAULT false
);

-- Table: ai_topic_configs
CREATE TABLE IF NOT EXISTS public.ai_topic_configs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  context_type character varying(50) DEFAULT 'bangladesh'::character varying NOT NULL,
  news_sources jsonb DEFAULT '[]'::jsonb,
  search_keywords ARRAY,
  prompt_template text DEFAULT 'You are a professional prediction market analyst for {context}.

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
]'::text NOT NULL,
  ai_model character varying(50) DEFAULT 'gemini-1.5-flash'::character varying,
  temperature numeric DEFAULT 0.7,
  max_tokens integer DEFAULT 2048,
  topics_per_generation integer DEFAULT 5,
  focus_areas ARRAY,
  is_active boolean DEFAULT true,
  generation_schedule character varying(20) DEFAULT '0 6 * * *'::character varying,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_generated_at timestamp with time zone,
  generation_count integer DEFAULT 0
);

-- Table: ai_topic_generation_jobs
CREATE TABLE IF NOT EXISTS public.ai_topic_generation_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  config_id uuid,
  status character varying(20) DEFAULT 'pending'::character varying,
  sources_used jsonb,
  keywords_used ARRAY,
  prompt_sent text,
  raw_response text,
  topics_generated jsonb,
  topics_count integer DEFAULT 0,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  execution_time_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: ai_usage_logs
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  agent_key text,
  usage_date date DEFAULT CURRENT_DATE,
  tokens_used integer DEFAULT 0,
  calls_count integer DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: analytics_snapshots_daily
CREATE TABLE IF NOT EXISTS public.analytics_snapshots_daily (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  date date NOT NULL,
  total_volume numeric DEFAULT 0,
  trade_count integer DEFAULT 0,
  active_traders_daily integer DEFAULT 0,
  new_users_count integer DEFAULT 0,
  total_users_count integer DEFAULT 0,
  churned_users_estimate integer DEFAULT 0,
  retention_rate_d30 numeric DEFAULT 0,
  gross_revenue numeric DEFAULT 0,
  net_revenue numeric DEFAULT 0,
  burn_rate_estimate numeric DEFAULT 0,
  runway_days_estimate integer DEFAULT 0,
  avg_risk_score integer DEFAULT 0,
  high_risk_users_count integer DEFAULT 0,
  system_leverage_ratio numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: analytics_snapshots_hourly
CREATE TABLE IF NOT EXISTS public.analytics_snapshots_hourly (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bucket_start timestamp with time zone NOT NULL,
  total_volume numeric DEFAULT 0,
  trade_count integer DEFAULT 0,
  active_traders_count integer DEFAULT 0,
  open_interest numeric DEFAULT 0,
  velocity numeric DEFAULT 0,
  gross_revenue numeric DEFAULT 0,
  net_revenue numeric DEFAULT 0,
  user_rewards_paid numeric DEFAULT 0,
  new_users_count integer DEFAULT 0,
  active_users_session_count integer DEFAULT 0,
  avg_spread_bps numeric DEFAULT 0,
  fill_rate_percent numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  actor_name text,
  action character varying(100) NOT NULL,
  entity_type character varying(50),
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  description text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  audit_type text,
  status text,
  reserve_ratio numeric,
  variance numeric,
  details jsonb
);

-- Table: badges
CREATE TABLE IF NOT EXISTS public.badges (
  id character varying(50) NOT NULL,
  name character varying(50) NOT NULL,
  description text,
  icon_url text,
  condition_type character varying(50),
  condition_value numeric,
  rarity character varying(20) DEFAULT 'COMMON'::character varying,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: balance_holds
CREATE TABLE IF NOT EXISTS public.balance_holds (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason character varying(50) NOT NULL,
  reference_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  released_at timestamp with time zone,
  released_by uuid,
  released_reason text
);

-- Table: bd_cricket_events
CREATE TABLE IF NOT EXISTS public.bd_cricket_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  match_type character varying(50) NOT NULL,
  opponent character varying(100) NOT NULL,
  match_date date NOT NULL,
  venue character varying(200),
  is_home boolean DEFAULT true,
  bangladesh_result character varying(20),
  player_of_match character varying(100),
  key_players ARRAY,
  market_relevance boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: bd_divisions
CREATE TABLE IF NOT EXISTS public.bd_divisions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name character varying(50) NOT NULL,
  name_bn character varying(100),
  headquarters character varying(100),
  population_2021 bigint,
  area_sq_km numeric,
  is_active boolean DEFAULT true
);

-- Table: bd_economic_indicators
CREATE TABLE IF NOT EXISTS public.bd_economic_indicators (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  indicator_name character varying(100) NOT NULL,
  indicator_date date NOT NULL,
  value numeric NOT NULL,
  unit character varying(50),
  previous_value numeric,
  change_percent numeric,
  source character varying(200),
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: bd_news_sources
CREATE TABLE IF NOT EXISTS public.bd_news_sources (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name character varying(200) NOT NULL,
  domain character varying(200) NOT NULL,
  source_type character varying(50) NOT NULL,
  category character varying(50) NOT NULL,
  authority_score numeric NOT NULL,
  is_government boolean DEFAULT false,
  is_active boolean DEFAULT true,
  contact_info jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: bd_political_events
CREATE TABLE IF NOT EXISTS public.bd_political_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_type character varying(50) NOT NULL,
  event_date date NOT NULL,
  description text NOT NULL,
  parties_involved ARRAY,
  locations ARRAY,
  outcome_summary text,
  market_impact_score integer,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: cancellation_records
CREATE TABLE IF NOT EXISTS public.cancellation_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  cancel_type character varying(20) NOT NULL,
  requested_at timestamp with time zone DEFAULT now() NOT NULL,
  soft_cancelled_at timestamp with time zone,
  hard_cancelled_at timestamp with time zone,
  filled_quantity_before numeric DEFAULT 0 NOT NULL,
  remaining_quantity numeric NOT NULL,
  average_fill_price numeric,
  final_filled_quantity numeric,
  final_cancelled_quantity numeric,
  released_collateral numeric DEFAULT 0 NOT NULL,
  race_condition_detected boolean DEFAULT false,
  race_resolution character varying(20),
  sequence_number bigint NOT NULL,
  cancellation_signature character varying(128),
  cancelled_by uuid,
  cancellation_reason character varying(50),
  client_request_id character varying(64),
  created_at timestamp with time zone DEFAULT now()
);

-- Table: category_settings
CREATE TABLE IF NOT EXISTS public.category_settings (
  category character varying(100) NOT NULL,
  trading_status character varying(20) DEFAULT 'active'::character varying,
  pause_reason text,
  paused_at timestamp with time zone,
  paused_by uuid,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: comment_attachments
CREATE TABLE IF NOT EXISTS public.comment_attachments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  comment_id uuid NOT NULL,
  type attachment_type NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  title text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: comment_flags
CREATE TABLE IF NOT EXISTS public.comment_flags (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason flag_reason NOT NULL,
  details text,
  is_resolved boolean DEFAULT false,
  resolved_by uuid,
  resolution text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Table: comment_likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id uuid NOT NULL,
  comment_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: comment_moderation_queue
CREATE TABLE IF NOT EXISTS public.comment_moderation_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  toxicity_score numeric DEFAULT 0,
  spam_score numeric DEFAULT 0,
  sentiment_mismatch boolean DEFAULT false,
  flagged_categories ARRAY DEFAULT '{}'::text[],
  ai_confidence numeric DEFAULT 0,
  ai_reasoning text,
  status moderation_status DEFAULT 'pending_review'::moderation_status,
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone
);

-- Table: comment_votes
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote_type vote_type NOT NULL,
  user_reputation_at_vote integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Table: copy_trading_settings
CREATE TABLE IF NOT EXISTS public.copy_trading_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  is_active boolean DEFAULT false,
  allocation_type character varying(20) DEFAULT 'PERCENTAGE'::character varying,
  allocation_amount numeric DEFAULT 10,
  max_position_size numeric DEFAULT 1000,
  stop_loss_percent numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: custom_categories
CREATE TABLE IF NOT EXISTS public.custom_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  icon text DEFAULT '📌'::text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 999,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: deposit_attempts
CREATE TABLE IF NOT EXISTS public.deposit_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  method character varying(10),
  selected_seller_id character varying(100),
  affiliate_used boolean DEFAULT false,
  status character varying(20) DEFAULT 'initiated'::character varying,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: deposit_requests
CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  usdt_amount numeric,
  status character varying(20) DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  payment_method character varying(50) DEFAULT 'usdt_p2p'::character varying,
  sender_number character varying(20),
  sender_name character varying(100),
  txn_id character varying(100),
  bdt_amount numeric,
  exchange_rate numeric,
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Table: dispute_records
CREATE TABLE IF NOT EXISTS public.dispute_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  resolution_system_id uuid,
  disputed_by uuid NOT NULL,
  dispute_type character varying(50),
  dispute_reason text NOT NULL,
  evidence_urls ARRAY,
  evidence_files ARRAY,
  bond_amount numeric NOT NULL,
  bond_locked_at timestamp with time zone DEFAULT now(),
  bond_status character varying(20) DEFAULT 'locked'::character varying,
  assigned_judge uuid,
  judge_notes text,
  ruling character varying(50),
  ruling_reason text,
  ruling_at timestamp with time zone,
  status character varying(20) DEFAULT 'pending'::character varying,
  community_votes_yes integer DEFAULT 0,
  community_votes_no integer DEFAULT 0,
  voting_ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Table: disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  dispute_id character varying(100) NOT NULL,
  market_id uuid NOT NULL,
  pipeline_id character varying(100),
  level character varying(20) NOT NULL,
  status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
  challenger_id uuid NOT NULL,
  proposer_id uuid,
  bond_amount numeric NOT NULL,
  bond_currency character varying(10) DEFAULT 'BDT'::character varying,
  bond_locked_at timestamp with time zone NOT NULL,
  bond_released_at timestamp with time zone,
  challenge_reason text NOT NULL,
  evidence_urls ARRAY,
  expected_outcome character varying(50) NOT NULL,
  resolution_method character varying(50),
  resolution_outcome character varying(20),
  final_outcome character varying(50),
  resolution_details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  deadline_at timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  reward_distributed boolean DEFAULT false,
  challenger_reward numeric,
  treasury_fee numeric,
  parent_dispute_id uuid,
  child_dispute_id uuid
);

-- Table: events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text DEFAULT 'New Event'::text NOT NULL,
  slug text NOT NULL,
  question text NOT NULL,
  description text,
  ticker character varying(20),
  category character varying(100) DEFAULT 'general'::character varying NOT NULL,
  subcategory character varying(100),
  tags ARRAY DEFAULT '{}'::text[],
  image_url text,
  thumbnail_url text,
  banner_url text,
  status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
  is_featured boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  answer1 character varying(200) DEFAULT 'হ্যাঁ (Yes)'::character varying,
  answer2 character varying(200) DEFAULT 'না (No)'::character varying,
  answer_type character varying(20) DEFAULT 'binary'::character varying,
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  trading_opens_at timestamp with time zone DEFAULT now(),
  trading_closes_at timestamp with time zone,
  resolved_at timestamp with time zone,
  resolution_source text,
  resolution_method character varying(50) DEFAULT 'manual_admin'::character varying,
  resolution_delay_hours integer DEFAULT 24,
  resolved_outcome integer,
  resolved_by uuid,
  winning_token character varying(100),
  initial_liquidity numeric DEFAULT 1000,
  current_liquidity numeric DEFAULT 1000,
  total_volume numeric DEFAULT 0,
  total_trades integer DEFAULT 0,
  unique_traders integer DEFAULT 0,
  current_yes_price numeric DEFAULT 0.5000,
  current_no_price numeric DEFAULT 0.5000,
  price_24h_change numeric DEFAULT 0.0000,
  condition_id character varying(100),
  token1 character varying(100),
  token2 character varying(100),
  neg_risk boolean DEFAULT false,
  pause_reason text,
  paused_at timestamp with time zone,
  paused_by uuid,
  estimated_resume_at timestamp with time zone,
  ai_keywords ARRAY DEFAULT '{}'::text[],
  ai_sources ARRAY DEFAULT '{}'::text[],
  ai_confidence_threshold integer DEFAULT 85,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  search_vector tsvector,
  market_id uuid,
  name text,
  name_en text,
  event_date timestamp with time zone DEFAULT now(),
  resolution_outcome character varying(20),
  resolution_delay integer DEFAULT 1440 NOT NULL,
  trading_volume_24h numeric DEFAULT 0,
  price_change_24h numeric DEFAULT 0.0000,
  liquidity_score numeric DEFAULT 0,
  trending_score numeric DEFAULT 0,
  featured_until timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  current_stage character varying(100) DEFAULT 'created'::character varying,
  creator_id uuid
);

-- Table: exchange_rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  bdt_to_usdt numeric NOT NULL,
  usdt_to_bdt numeric NOT NULL,
  effective_from timestamp with time zone DEFAULT now() NOT NULL,
  effective_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  source character varying(50),
  rate numeric
);

-- Table: expert_assignments
CREATE TABLE IF NOT EXISTS public.expert_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  expert_id uuid NOT NULL,
  event_id uuid NOT NULL,
  assigned_by uuid,
  assignment_reason text,
  status character varying(20) DEFAULT 'pending'::character varying,
  assigned_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Table: expert_badges
CREATE TABLE IF NOT EXISTS public.expert_badges (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  short_description text,
  icon_url text,
  icon_color text,
  category badge_category NOT NULL,
  rarity badge_rarity DEFAULT 'common'::badge_rarity,
  min_accuracy integer,
  min_predictions integer,
  min_streak integer,
  min_reputation_score integer DEFAULT 0,
  verification_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: expert_panel
CREATE TABLE IF NOT EXISTS public.expert_panel (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  expert_name character varying(100) NOT NULL,
  credentials text,
  specializations ARRAY NOT NULL,
  bio text,
  is_verified boolean DEFAULT false,
  verification_documents ARRAY,
  verified_by uuid,
  verified_at timestamp with time zone,
  total_votes integer DEFAULT 0,
  correct_votes integer DEFAULT 0,
  incorrect_votes integer DEFAULT 0,
  accuracy_rate numeric,
  expert_rating numeric DEFAULT 0.00,
  reputation_score integer DEFAULT 0,
  is_active boolean DEFAULT true,
  availability_status character varying(20) DEFAULT 'available'::character varying,
  email character varying(255),
  phone character varying(20),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_vote_at timestamp with time zone
);

-- Table: expert_panel_members
CREATE TABLE IF NOT EXISTS public.expert_panel_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  name character varying(200) NOT NULL,
  expertise ARRAY,
  credibility_score numeric DEFAULT 0.80,
  total_reviews integer DEFAULT 0,
  accuracy_rate numeric DEFAULT 0.80,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: expert_panel_reviews
CREATE TABLE IF NOT EXISTS public.expert_panel_reviews (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  dispute_id uuid NOT NULL,
  panel_members ARRAY NOT NULL,
  votes jsonb DEFAULT '[]'::jsonb,
  consensus_outcome character varying(50),
  consensus_confidence numeric,
  assigned_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Table: expert_votes
CREATE TABLE IF NOT EXISTS public.expert_votes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  expert_id uuid NOT NULL,
  event_id uuid NOT NULL,
  vote_outcome integer NOT NULL,
  confidence_level numeric,
  reasoning text NOT NULL,
  ai_relevance_score numeric,
  ai_verification_status character varying(20) DEFAULT 'pending'::character varying,
  ai_feedback text,
  is_correct boolean,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone
);

-- Table: feed_preferences
CREATE TABLE IF NOT EXISTS public.feed_preferences (
  user_id uuid NOT NULL,
  market_movements_weight integer DEFAULT 90,
  trader_activity_weight integer DEFAULT 60,
  system_notifications_weight integer DEFAULT 100,
  social_interactions_weight integer DEFAULT 50,
  trending_markets_weight integer DEFAULT 30,
  muted_keywords ARRAY DEFAULT '{}'::text[],
  muted_users ARRAY DEFAULT '{}'::uuid[],
  muted_markets ARRAY DEFAULT '{}'::uuid[],
  notifications_paused boolean DEFAULT false,
  notifications_pause_until timestamp with time zone,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  compact_mode boolean DEFAULT false,
  auto_expand_threads boolean DEFAULT false,
  default_thread_depth integer DEFAULT 3,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: fill_records
CREATE TABLE IF NOT EXISTS public.fill_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  total_value numeric NOT NULL,
  counterparty_order_id uuid,
  counterparty_user_id uuid,
  trade_id uuid,
  fill_number integer NOT NULL,
  is_maker boolean DEFAULT false,
  transaction_hash character varying(128),
  blockchain_reference character varying(256),
  filled_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Table: follow_requests
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  requester_id uuid NOT NULL,
  target_id uuid NOT NULL,
  status character varying(20) DEFAULT 'pending'::character varying,
  message text,
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone
);

-- Table: global_sequence
CREATE TABLE IF NOT EXISTS public.global_sequence (
  id integer DEFAULT 1 NOT NULL,
  last_sequence bigint DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: human_review_queue
CREATE TABLE IF NOT EXISTS public.human_review_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pipeline_id character varying(100) NOT NULL,
  market_id uuid NOT NULL,
  market_question text NOT NULL,
  ai_outcome character varying(50) NOT NULL,
  ai_confidence numeric NOT NULL,
  ai_explanation text,
  evidence_summary jsonb,
  status character varying(20) DEFAULT 'pending'::character varying,
  priority character varying(20) DEFAULT 'medium'::character varying,
  assigned_to uuid,
  assigned_at timestamp with time zone,
  reviewer_decision character varying(20),
  final_outcome character varying(50),
  reviewer_notes text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  deadline_at timestamp with time zone NOT NULL
);

-- Table: idempotency_keys
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key text NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  result jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: kyc_admin_overrides
CREATE TABLE IF NOT EXISTS public.kyc_admin_overrides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  override_type character varying(20),
  admin_id uuid,
  reason text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  revoked_by uuid
);

-- Table: kyc_documents
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  document_type text NOT NULL,
  document_front_url text NOT NULL,
  document_back_url text,
  selfie_url text,
  status character varying(20) DEFAULT 'pending'::character varying,
  rejection_reason text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: kyc_settings
CREATE TABLE IF NOT EXISTS public.kyc_settings (
  id integer DEFAULT 1 NOT NULL,
  withdrawal_threshold numeric DEFAULT 5000.00,
  required_documents jsonb DEFAULT '["id_front", "selfie"]'::jsonb,
  auto_approve_enabled boolean DEFAULT false,
  auto_approve_max_risk_score integer DEFAULT 30,
  kyc_globally_required boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table: kyc_submissions
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  submitted_data jsonb NOT NULL,
  status character varying(20) DEFAULT 'pending'::character varying,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: leaderboard_cache
CREATE TABLE IF NOT EXISTS public.leaderboard_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  timeframe character varying(20) NOT NULL,
  trading_volume bigint DEFAULT 0,
  realized_pnl bigint DEFAULT 0,
  unrealized_pnl bigint DEFAULT 0,
  score bigint DEFAULT 0,
  period_start date DEFAULT CURRENT_DATE NOT NULL,
  period_end date DEFAULT (CURRENT_DATE + '7 days'::interval) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  roi numeric DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  risk_score numeric DEFAULT 0
);

-- Table: leagues
CREATE TABLE IF NOT EXISTS public.leagues (
  id integer DEFAULT nextval('leagues_id_seq'::regclass) NOT NULL,
  name character varying(50) NOT NULL,
  tier_order integer NOT NULL,
  min_rank_percentile integer,
  icon_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: legal_review_queue
CREATE TABLE IF NOT EXISTS public.legal_review_queue (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  draft_id uuid NOT NULL,
  assigned_to uuid,
  priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
  status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- Table: maker_rebates
CREATE TABLE IF NOT EXISTS public.maker_rebates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  year_month character varying(7) NOT NULL,
  rebate_period_start timestamp with time zone NOT NULL,
  rebate_period_end timestamp with time zone NOT NULL,
  total_maker_volume numeric DEFAULT 0,
  qualifying_volume numeric DEFAULT 0,
  base_rebate_rate numeric DEFAULT 0.0002,
  spread_multiplier numeric DEFAULT 1.0,
  final_rebate_rate numeric DEFAULT 0.0002,
  gross_rebate_amount numeric DEFAULT 0,
  adjustment_factor numeric DEFAULT 1.0,
  net_rebate_amount numeric DEFAULT 0,
  claim_status character varying(20) DEFAULT 'pending'::character varying,
  claimed_at timestamp with time zone,
  claimed_by_user_id uuid,
  payment_method character varying(10),
  payment_tx_hash character varying(100),
  payment_completed_at timestamp with time zone,
  tier_at_calculation integer DEFAULT 1,
  tier_benefits jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: maker_volume_tracking
CREATE TABLE IF NOT EXISTS public.maker_volume_tracking (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  year_month character varying(7) NOT NULL,
  maker_volume numeric DEFAULT 0,
  taker_volume numeric DEFAULT 0,
  total_spread_contribution numeric DEFAULT 0,
  resting_time_seconds integer DEFAULT 0,
  qualifying_volume numeric DEFAULT 0,
  rebate_tier integer DEFAULT 1,
  rebate_rate numeric DEFAULT 0.0002,
  estimated_rebate numeric DEFAULT 0,
  claimed_rebate numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Table: manual_deposits
CREATE TABLE IF NOT EXISTS public.manual_deposits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  method character varying(10),
  amount_bdt numeric,
  agent_wallet_id uuid,
  user_phone_number character varying(15),
  transaction_id character varying(100),
  screenshot_url text,
  status character varying(20) DEFAULT 'pending'::character varying,
  usdt_sent_to_user numeric,
  usdt_rate_used numeric,
  agent_notes text,
  processing_started_at timestamp with time zone,
  completed_at timestamp with time zone,
  expiry_warning_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: market_comments
CREATE TABLE IF NOT EXISTS public.market_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid,
  user_id uuid,
  parent_id uuid,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  depth_level integer DEFAULT 0,
  content_html text,
  sentiment_score numeric DEFAULT 0,
  is_collapsed boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  score numeric DEFAULT 0,
  sentiment text DEFAULT 'neutral'::text,
  is_flagged boolean DEFAULT false,
  flag_count integer DEFAULT 0,
  edited_at timestamp with time zone,
  like_count integer DEFAULT 0
);

-- Table: market_creation_drafts
CREATE TABLE IF NOT EXISTS public.market_creation_drafts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  creator_id uuid NOT NULL,
  current_stage character varying(50) DEFAULT 'template_selection'::character varying NOT NULL,
  status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
  stages_completed jsonb DEFAULT '[]'::jsonb NOT NULL,
  market_type character varying(50),
  template_id character varying(100),
  question text,
  description text,
  category character varying(100),
  subcategory character varying(100),
  tags ARRAY,
  min_value numeric,
  max_value numeric,
  unit character varying(50),
  outcomes jsonb,
  resolution_source character varying(255),
  resolution_source_url text,
  resolution_criteria text,
  resolution_deadline timestamp with time zone,
  oracle_type character varying(50),
  oracle_config jsonb,
  liquidity_commitment numeric DEFAULT 0 NOT NULL,
  liquidity_currency character varying(10) DEFAULT 'USDC'::character varying NOT NULL,
  liquidity_deposited boolean DEFAULT false NOT NULL,
  liquidity_tx_hash character varying(100),
  sensitive_topics ARRAY,
  regulatory_risk_level character varying(20),
  legal_review_status character varying(50),
  legal_review_notes text,
  legal_reviewer_id uuid,
  legal_reviewed_at timestamp with time zone,
  requires_senior_counsel boolean DEFAULT false NOT NULL,
  simulation_config jsonb,
  simulation_results jsonb,
  deployment_config jsonb,
  deployment_tx_hash character varying(100),
  deployed_market_id uuid,
  deployed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  submitted_at timestamp with time zone,
  completed_at timestamp with time zone,
  version integer DEFAULT 1 NOT NULL,
  previous_version_id uuid,
  admin_bypass_liquidity boolean DEFAULT false NOT NULL,
  admin_bypass_legal_review boolean DEFAULT false NOT NULL,
  admin_bypass_simulation boolean DEFAULT false NOT NULL,
  verification_method jsonb DEFAULT '{"type": "MANUAL", "sources": []}'::jsonb,
  required_confirmations integer DEFAULT 1 NOT NULL,
  confidence_threshold numeric DEFAULT 80.00,
  trading_fee_percent numeric DEFAULT 2.00 NOT NULL,
  image_url text,
  trading_end_type character varying(20) DEFAULT 'date'::character varying NOT NULL,
  liquidity_amount numeric DEFAULT 0 NOT NULL,
  event_id uuid
);

-- Table: market_daily_stats
CREATE TABLE IF NOT EXISTS public.market_daily_stats (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid NOT NULL,
  date date NOT NULL,
  open_price numeric,
  close_price numeric,
  high_price numeric,
  low_price numeric,
  volume numeric DEFAULT 0,
  trade_count integer DEFAULT 0,
  unique_traders integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: market_followers
CREATE TABLE IF NOT EXISTS public.market_followers (
  user_id uuid NOT NULL,
  market_id uuid NOT NULL,
  notify_on_trade boolean DEFAULT false,
  notify_on_resolve boolean DEFAULT true,
  notify_on_price_change boolean DEFAULT false,
  price_alert_threshold numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: market_follows
CREATE TABLE IF NOT EXISTS public.market_follows (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  market_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  notification_preferences jsonb DEFAULT '{"news": true, "resolutions": true, "volume_spikes": true, "price_movements": true}'::jsonb
);

-- Table: market_suggestions
CREATE TABLE IF NOT EXISTS public.market_suggestions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  title text NOT NULL,
  description text,
  source_url text,
  ai_confidence numeric,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Table: market_templates
CREATE TABLE IF NOT EXISTS public.market_templates (
  id character varying(100) NOT NULL,
  name character varying(255) NOT NULL,
  description text,
  market_type character varying(50) NOT NULL,
  category character varying(100),
  default_params jsonb,
  validation_rules jsonb,
  ui_config jsonb,
  is_active boolean DEFAULT true NOT NULL,
  is_premium boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: markets
CREATE TABLE IF NOT EXISTS public.markets (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  question text NOT NULL,
  description text,
  category text DEFAULT 'General'::text NOT NULL,
  source_url text,
  image_url text,
  creator_id uuid,
  status market_status DEFAULT 'active'::market_status,
  resolution_source text,
  min_price numeric DEFAULT 0.0001,
  max_price numeric DEFAULT 0.9999,
  tick_size numeric DEFAULT 0.01,
  created_at timestamp with time zone DEFAULT now(),
  trading_closes_at timestamp with time zone NOT NULL,
  event_date timestamp with time zone NOT NULL,
  resolved_at timestamp with time zone,
  winning_outcome outcome_type,
  resolution_details jsonb DEFAULT '{}'::jsonb,
  total_volume numeric DEFAULT 0,
  yes_shares_outstanding bigint DEFAULT 0,
  no_shares_outstanding bigint DEFAULT 0,
  resolution_source_type character varying(20) DEFAULT 'MANUAL'::character varying,
  resolution_data jsonb,
  fee_percent numeric DEFAULT 2.0,
  initial_liquidity numeric DEFAULT 0,
  maker_rebate_percent numeric DEFAULT 0.05,
  market_category character varying(50) DEFAULT 'binary'::character varying,
  min_tick bigint DEFAULT 100,
  max_tick bigint DEFAULT 10000,
  current_tick bigint DEFAULT 100,
  realized_volatility_24h numeric DEFAULT 0.02,
  pending_tick_change jsonb DEFAULT '{}'::jsonb,
  event_id uuid NOT NULL,
  resolution_source_url text,
  subcategory character varying(50),
  tags ARRAY DEFAULT '{}'::text[],
  slug character varying(100),
  answer_type character varying(20) DEFAULT 'binary'::character varying,
  answer1 character varying(100) DEFAULT 'হ্যাঁ (Yes)'::character varying,
  answer2 character varying(100) DEFAULT 'না (No)'::character varying,
  is_featured boolean DEFAULT false,
  created_by uuid,
  name character varying(255),
  liquidity numeric DEFAULT 1000,
  resolution_delay integer DEFAULT 1440,
  condition_id character varying(255),
  token1 character varying(255),
  token2 character varying(255),
  neg_risk boolean DEFAULT false,
  resolver_reference text,
  volume numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  market_type market_type_enum DEFAULT 'binary'::market_type_enum,
  min_value numeric,
  max_value numeric,
  scalar_unit text,
  yes_price_change_24h numeric DEFAULT 0,
  no_price_change_24h numeric DEFAULT 0,
  unique_traders integer DEFAULT 0,
  close_warned boolean DEFAULT false,
  yes_price numeric DEFAULT 0.5,
  no_price numeric DEFAULT 0.5,
  trading_phase trading_phase_type DEFAULT 'CONTINUOUS'::trading_phase_type,
  next_phase_time timestamp with time zone,
  auction_data jsonb,
  resolution_delay_hours integer DEFAULT 24,
  resolution_method character varying(50) DEFAULT 'manual_admin'::character varying,
  volume_24h numeric DEFAULT 0,
  best_bid numeric,
  best_ask numeric,
  spread numeric,
  order_count integer DEFAULT 0,
  unique_traders_24h integer DEFAULT 0,
  last_trade_price numeric,
  last_trade_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  current_stage character varying(100) DEFAULT 'created'::character varying,
  deployed_at timestamp with time zone,
  oracle_type character varying(50) DEFAULT 'MANUAL'::character varying,
  legal_review_status character varying(50),
  legal_review_notes text,
  legal_reviewed_at timestamp with time zone,
  liquidity_commitment numeric,
  liquidity_deposited boolean DEFAULT false,
  deployment_config jsonb,
  deployment_tx_hash character varying(100),
  resolution_deadline timestamp with time zone,
  resolution_criteria text,
  risk_score integer DEFAULT 0,
  stages_completed ARRAY DEFAULT '{}'::text[],
  trading_fee_percent numeric DEFAULT 2.0,
  confidence integer DEFAULT 0,
  trader_count integer DEFAULT 0,
  legal_reviewer_id uuid,
  simulation_config jsonb,
  simulation_results jsonb,
  admin_bypass_legal_review boolean DEFAULT false,
  admin_bypass_liquidity boolean DEFAULT false,
  trading_ends timestamp with time zone,
  name_bn text
);

-- Table: moderation_actions
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  action_type text NOT NULL,
  target_user_id uuid,
  target_comment_id uuid,
  performed_by uuid NOT NULL,
  reason text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: news_sources
CREATE TABLE IF NOT EXISTS public.news_sources (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  source_name character varying(100) NOT NULL,
  source_url text NOT NULL,
  source_type character varying(50),
  country_code character(2) DEFAULT 'BD'::bpchar,
  language_code character(2) DEFAULT 'bn'::bpchar,
  is_verified boolean DEFAULT false,
  trust_score integer DEFAULT 50,
  bias_rating character varying(20),
  api_endpoint text,
  api_key_encrypted text,
  requires_authentication boolean DEFAULT false,
  rate_limit_per_hour integer DEFAULT 100,
  rss_feed_url text,
  categories_covered ARRAY,
  total_articles_fetched integer DEFAULT 0,
  successful_fetches integer DEFAULT 0,
  failed_fetches integer DEFAULT 0,
  last_fetch_at timestamp with time zone,
  last_fetch_status character varying(20),
  is_active boolean DEFAULT true,
  is_whitelisted boolean DEFAULT false,
  scraping_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: notification_channels
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id character varying(50) NOT NULL,
  name character varying(100) NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  notifications_enabled boolean DEFAULT true,
  order_fills_channels jsonb DEFAULT jsonb_build_array('websocket', 'push', 'email'),
  market_resolution_channels jsonb DEFAULT jsonb_build_array('websocket', 'push', 'email', 'in_app'),
  price_alerts_channels jsonb DEFAULT jsonb_build_array('push', 'email'),
  position_risk_channels jsonb DEFAULT jsonb_build_array('websocket', 'push'),
  social_channels jsonb DEFAULT jsonb_build_array('in_app', 'email'),
  system_maintenance_channels jsonb DEFAULT jsonb_build_array('email', 'in_app'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: notification_templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id character varying(100) NOT NULL,
  name character varying(200) NOT NULL,
  category character varying(50) NOT NULL,
  title_en text NOT NULL,
  title_bn text,
  body_en text NOT NULL,
  body_bn text,
  default_channels jsonb DEFAULT jsonb_build_array('websocket', 'in_app'),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  type character varying(50) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  is_dismissed boolean DEFAULT false,
  market_id uuid,
  trade_id uuid,
  sender_id uuid,
  read boolean DEFAULT false,
  read_at timestamp with time zone
);

-- Table: oracle_assertions
CREATE TABLE IF NOT EXISTS public.oracle_assertions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid NOT NULL,
  asserter_id uuid,
  outcome character varying(50) NOT NULL,
  bond_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_current_best boolean DEFAULT false
);

-- Table: oracle_disputes
CREATE TABLE IF NOT EXISTS public.oracle_disputes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  request_id uuid NOT NULL,
  disputer_id uuid NOT NULL,
  bond_amount numeric NOT NULL,
  reason text NOT NULL,
  evidence_urls ARRAY,
  status character varying(20) DEFAULT 'open'::character varying,
  resolution_outcome character varying(50),
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Table: oracle_requests
CREATE TABLE IF NOT EXISTS public.oracle_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid NOT NULL,
  request_type character varying(50) NOT NULL,
  proposer_id uuid,
  proposed_outcome character varying(50),
  confidence_score numeric,
  evidence_text text,
  evidence_urls ARRAY,
  ai_analysis jsonb,
  bond_amount numeric DEFAULT 0,
  bond_currency character varying(10) DEFAULT 'BDT'::character varying,
  challenge_window_ends_at timestamp with time zone,
  status character varying(20) DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  resolved_at timestamp with time zone,
  finalized_at timestamp with time zone
);

-- Table: oracle_verifications
CREATE TABLE IF NOT EXISTS public.oracle_verifications (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  market_id uuid,
  ai_result outcome_type,
  ai_confidence numeric,
  ai_reasoning text,
  scraped_data jsonb DEFAULT '{}'::jsonb,
  admin_id uuid,
  admin_decision outcome_type,
  admin_notes text,
  status oracle_status DEFAULT 'pending'::oracle_status,
  created_at timestamp with time zone DEFAULT now(),
  finalized_at timestamp with time zone
);

-- Table: order_batches
CREATE TABLE IF NOT EXISTS public.order_batches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending'::text,
  total_cost numeric DEFAULT 0 NOT NULL,
  order_count integer DEFAULT 0,
  filled_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  error_message text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  expires_at timestamp with time zone
);

-- Table: order_book
CREATE TABLE IF NOT EXISTS public.order_book (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid NOT NULL,
  user_id uuid,
  side character varying(4) NOT NULL,
  price numeric NOT NULL,
  size numeric NOT NULL,
  filled numeric DEFAULT 0,
  status character varying(20) DEFAULT 'OPEN'::character varying,
  order_type character varying(20) DEFAULT 'LIMIT'::character varying,
  time_in_force character varying(10) DEFAULT 'GTC'::character varying,
  post_only boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  tif tif_type DEFAULT 'GTC'::tif_type,
  gtd_expiry timestamp with time zone,
  original_quantity numeric DEFAULT 0 NOT NULL,
  avg_fill_price numeric DEFAULT 0,
  fill_count integer DEFAULT 0,
  last_fill_at timestamp with time zone,
  time_priority integer DEFAULT 0,
  is_re_entry boolean DEFAULT false,
  parent_order_id uuid
);

-- Table: order_commitments
CREATE TABLE IF NOT EXISTS public.order_commitments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  commitment_hash text NOT NULL,
  market_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  market_id uuid,
  user_id uuid,
  order_type order_type NOT NULL,
  side order_side NOT NULL,
  outcome outcome_type NOT NULL,
  price numeric NOT NULL,
  quantity bigint NOT NULL,
  filled_quantity bigint DEFAULT 0,
  status order_status DEFAULT 'open'::order_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  batch_id uuid,
  time_in_force character varying(10) DEFAULT 'GTC'::character varying,
  stop_price numeric,
  trigger_condition character varying(20),
  parent_order_id uuid,
  oco_group_id uuid,
  display_size numeric,
  refresh_size numeric,
  client_order_id character varying(100),
  ip_address inet,
  user_agent text
);

-- Table: outcomes
CREATE TABLE IF NOT EXISTS public.outcomes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid NOT NULL,
  label text NOT NULL,
  label_bn text,
  image_url text,
  current_price numeric DEFAULT 0.5,
  total_volume numeric DEFAULT 0,
  price_change_24h numeric DEFAULT 0,
  display_order integer DEFAULT 0,
  is_winning boolean,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: p2p_seller_cache
CREATE TABLE IF NOT EXISTS public.p2p_seller_cache (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  method character varying(10),
  sellers_data jsonb NOT NULL,
  scraped_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  affiliate_link character varying(255),
  active boolean DEFAULT true
);

-- Table: payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  method payment_method NOT NULL,
  amount numeric NOT NULL,
  status payment_status DEFAULT 'pending'::payment_status,
  transaction_id text,
  sender_number text,
  receiver_number text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Table: platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid
);

-- Table: platform_wallets
CREATE TABLE IF NOT EXISTS public.platform_wallets (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  method character varying(50) NOT NULL,
  wallet_number character varying(50) NOT NULL,
  wallet_name character varying(100),
  instructions text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: positions
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  market_id uuid,
  user_id uuid,
  outcome outcome_type NOT NULL,
  quantity bigint DEFAULT 0,
  average_price numeric,
  realized_pnl numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  outcome_index integer
);

-- Table: price_history
CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid NOT NULL,
  outcome_id uuid,
  outcome text DEFAULT 'YES'::text NOT NULL,
  price numeric NOT NULL,
  volume_at_time numeric DEFAULT 0,
  recorded_at timestamp with time zone DEFAULT now(),
  volume_24h numeric DEFAULT 0
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  balance numeric DEFAULT 0.00 NOT NULL,
  total_deposited numeric DEFAULT 0.00 NOT NULL,
  total_withdrawn numeric DEFAULT 0.00 NOT NULL,
  kyc_status character varying(20) DEFAULT 'pending'::character varying,
  kyc_submitted_at timestamp with time zone,
  daily_withdrawal_limit numeric DEFAULT 1000.00,
  last_withdrawal_date date,
  referral_code character varying(20),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: rebate_tiers_config
CREATE TABLE IF NOT EXISTS public.rebate_tiers_config (
  id integer NOT NULL,
  tier_name character varying(50) NOT NULL,
  min_volume numeric NOT NULL,
  max_volume numeric,
  rebate_rate numeric NOT NULL,
  min_spread numeric NOT NULL,
  benefits jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: resolution_feedback
CREATE TABLE IF NOT EXISTS public.resolution_feedback (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  pipeline_id character varying(100) NOT NULL,
  market_id uuid NOT NULL,
  was_disputed boolean DEFAULT false,
  dispute_outcome character varying(20),
  human_corrected_outcome character varying(50),
  human_reviewer_id uuid,
  feedback_score numeric,
  error_type character varying(50),
  root_cause text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: resolution_systems
CREATE TABLE IF NOT EXISTS public.resolution_systems (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  market_id uuid,
  primary_method character varying(50) DEFAULT 'manual_admin'::character varying NOT NULL,
  confidence_threshold integer DEFAULT 85,
  ai_keywords ARRAY DEFAULT '{}'::text[],
  ai_sources ARRAY DEFAULT '{}'::text[],
  resolver_reference text,
  status character varying(20) DEFAULT 'pending'::character varying,
  proposed_outcome integer,
  final_outcome integer,
  resolution_notes text,
  evidence_urls ARRAY,
  scheduled_resolution_at timestamp with time zone,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: resolvers
CREATE TABLE IF NOT EXISTS public.resolvers (
  address text NOT NULL,
  name character varying(255) NOT NULL,
  type character varying(50) NOT NULL,
  description text,
  website_url text,
  is_active boolean DEFAULT true,
  success_count integer DEFAULT 0,
  dispute_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: resting_orders
CREATE TABLE IF NOT EXISTS public.resting_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  market_id uuid NOT NULL,
  side character varying(10) NOT NULL,
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  spread_at_placement numeric,
  resting_start_time timestamp with time zone DEFAULT now(),
  resting_end_time timestamp with time zone,
  total_resting_seconds integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: security_events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  risk_score integer NOT NULL,
  threat_type text NOT NULL,
  action_taken text NOT NULL,
  reasoning_bn text,
  linked_accounts jsonb DEFAULT '[]'::jsonb,
  suspicious_pattern text,
  admin_instruction_bn text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: sensitive_topics
CREATE TABLE IF NOT EXISTS public.sensitive_topics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  keyword character varying(100) NOT NULL,
  category character varying(100) NOT NULL,
  risk_level character varying(20) NOT NULL,
  requires_review boolean DEFAULT false NOT NULL,
  auto_flag boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: settlement_batches
CREATE TABLE IF NOT EXISTS public.settlement_batches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id character varying(100) NOT NULL,
  market_id uuid NOT NULL,
  claim_ids ARRAY NOT NULL,
  total_amount numeric NOT NULL,
  gas_estimate integer,
  status character varying(20) DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone
);

-- Table: settlement_claims
CREATE TABLE IF NOT EXISTS public.settlement_claims (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  claim_id character varying(100) NOT NULL,
  user_id uuid NOT NULL,
  market_id uuid NOT NULL,
  outcome character varying(50) NOT NULL,
  shares numeric NOT NULL,
  payout_amount numeric NOT NULL,
  status character varying(20) DEFAULT 'pending'::character varying,
  opt_in_auto_settle boolean DEFAULT false,
  relayer_fee numeric,
  created_at timestamp with time zone DEFAULT now(),
  claimed_at timestamp with time zone
);

-- Table: settlement_escalations
CREATE TABLE IF NOT EXISTS public.settlement_escalations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  market_id uuid NOT NULL,
  batch_id character varying(100),
  reason text NOT NULL,
  status character varying(20) DEFAULT 'open'::character varying,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Table: spread_multiplier_config
CREATE TABLE IF NOT EXISTS public.spread_multiplier_config (
  id integer NOT NULL,
  spread_tier character varying(20) NOT NULL,
  min_spread numeric NOT NULL,
  max_spread numeric,
  multiplier numeric NOT NULL,
  min_order_size numeric NOT NULL,
  description text,
  is_active boolean DEFAULT true
);

-- Table: spread_rewards
CREATE TABLE IF NOT EXISTS public.spread_rewards (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  market_id uuid NOT NULL,
  calculation_date date NOT NULL,
  avg_spread_7d numeric,
  min_spread numeric,
  max_spread numeric,
  spread_percentile numeric,
  spread_tier character varying(20),
  base_multiplier numeric DEFAULT 1.0,
  size_multiplier numeric DEFAULT 1.0,
  final_multiplier numeric DEFAULT 1.0,
  meets_min_size boolean DEFAULT false,
  avg_order_size numeric,
  bonus_amount numeric DEFAULT 0,
  applied_to_rebate_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: trader_subscriptions
CREATE TABLE IF NOT EXISTS public.trader_subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  follower_id uuid,
  trader_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: trades
CREATE TABLE IF NOT EXISTS public.trades (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  market_id uuid,
  buy_order_id uuid,
  sell_order_id uuid,
  outcome outcome_type NOT NULL,
  price numeric NOT NULL,
  quantity bigint NOT NULL,
  maker_id uuid,
  taker_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  type transaction_type NOT NULL,
  amount numeric NOT NULL,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  order_id uuid,
  trade_id uuid,
  market_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: upstash_workflow_runs
CREATE TABLE IF NOT EXISTS public.upstash_workflow_runs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid,
  workflow_type text NOT NULL,
  qstash_message_id text,
  status text DEFAULT 'queued'::text,
  retry_count integer DEFAULT 0,
  result jsonb,
  error text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Table: user_badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  badge_id character varying(50),
  awarded_at timestamp with time zone DEFAULT now()
);

-- Table: user_bookmarks
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id uuid NOT NULL,
  market_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: user_follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  notification_preferences jsonb DEFAULT '{"trades": true, "comments": true, "achievements": true, "market_creations": true}'::jsonb
);

-- Table: user_kyc_profiles
CREATE TABLE IF NOT EXISTS public.user_kyc_profiles (
  id uuid NOT NULL,
  verification_status character varying(50) DEFAULT 'unverified'::character varying NOT NULL,
  verification_tier character varying(20) DEFAULT 'basic'::character varying NOT NULL,
  risk_score integer DEFAULT 50,
  updated_at timestamp with time zone DEFAULT now(),
  full_name character varying(255),
  date_of_birth date,
  nationality character varying(100),
  id_type character varying(50),
  id_number character varying(100),
  id_expiry date,
  address_line1 text,
  address_line2 text,
  city character varying(100),
  state_province character varying(100),
  postal_code character varying(20),
  country character varying(100),
  phone_number character varying(50),
  phone_verified boolean DEFAULT false,
  id_document_front_url text,
  id_document_back_url text,
  selfie_url text,
  proof_of_address_url text,
  risk_factors jsonb DEFAULT '[]'::jsonb,
  daily_deposit_limit numeric DEFAULT 1000,
  daily_withdrawal_limit numeric DEFAULT 1000,
  submitted_at timestamp with time zone,
  verified_at timestamp with time zone,
  verified_by uuid,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: user_leagues
CREATE TABLE IF NOT EXISTS public.user_leagues (
  user_id uuid NOT NULL,
  league_id integer,
  current_points numeric DEFAULT 0,
  is_promoted boolean DEFAULT false,
  is_relegated boolean DEFAULT false,
  last_updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_moderation_status
CREATE TABLE IF NOT EXISTS public.user_moderation_status (
  user_id uuid NOT NULL,
  total_strikes integer DEFAULT 0,
  active_strikes integer DEFAULT 0,
  last_strike_at timestamp with time zone,
  is_comment_banned boolean DEFAULT false,
  comment_ban_until timestamp with time zone,
  is_trade_restricted boolean DEFAULT false,
  trade_restriction_until timestamp with time zone,
  restriction_reason text,
  appeal_count integer DEFAULT 0,
  last_appeal_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL,
  full_name character varying(255),
  email character varying(255),
  avatar_url text,
  is_admin boolean DEFAULT false NOT NULL,
  is_super_admin boolean DEFAULT false NOT NULL,
  is_senior_counsel boolean DEFAULT false,
  last_admin_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_login_at timestamp with time zone,
  kyc_level integer DEFAULT 0,
  status user_account_status DEFAULT 'active'::user_account_status,
  flags jsonb DEFAULT '{}'::jsonb,
  is_pro boolean DEFAULT false,
  can_create_events boolean DEFAULT false
);

-- Table: user_reputation
CREATE TABLE IF NOT EXISTS public.user_reputation (
  user_id uuid NOT NULL,
  prediction_accuracy numeric DEFAULT 0,
  total_predictions integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  reputation_score integer DEFAULT 0,
  accuracy_tier accuracy_tier DEFAULT 'novice'::accuracy_tier,
  volume_score integer DEFAULT 0,
  consistency_score integer DEFAULT 0,
  social_score integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  rank_percentile integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_status
CREATE TABLE IF NOT EXISTS public.user_status (
  id uuid NOT NULL,
  account_status character varying(50) DEFAULT 'active'::character varying NOT NULL,
  can_trade boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: user_trading_stats
CREATE TABLE IF NOT EXISTS public.user_trading_stats (
  user_id uuid NOT NULL,
  thirty_day_volume numeric DEFAULT 0,
  total_maker_rebates_earned numeric DEFAULT 0,
  last_reset_at timestamp with time zone DEFAULT now()
);

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  phone text,
  full_name text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  kyc_verified boolean DEFAULT false,
  privacy_tier character varying(20) DEFAULT 'public'::character varying,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  max_followers integer DEFAULT 1000,
  wallet_address text,
  display_name text,
  avatar_url text,
  kyc_status kyc_status DEFAULT 'not_started'::kyc_status NOT NULL,
  kyc_verified_at timestamp with time zone
);

-- Table: verification_workflows
CREATE TABLE IF NOT EXISTS public.verification_workflows (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  name character varying(255) NOT NULL,
  description text,
  event_category character varying(50) NOT NULL,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  enabled boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Table: wallet_transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  transaction_type character varying(20) NOT NULL,
  amount numeric NOT NULL,
  currency character varying(10) DEFAULT 'BDT'::character varying,
  network_type character varying(20),
  wallet_address text,
  tx_hash text,
  status character varying(20) DEFAULT 'pending'::character varying,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table: wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid,
  balance numeric DEFAULT 0,
  locked_balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  usdt_address text,
  usdc_address text,
  qr_code_url text,
  network_type character varying(20) DEFAULT 'TRC20'::character varying,
  address_type character varying(20) DEFAULT 'DYNAMIC'::character varying,
  is_active boolean DEFAULT true,
  version integer DEFAULT 0
);

-- Table: withdrawal_requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  usdt_amount numeric NOT NULL,
  bdt_amount numeric NOT NULL,
  exchange_rate numeric NOT NULL,
  mfs_provider mfs_provider NOT NULL,
  recipient_number character varying(20) NOT NULL,
  recipient_name character varying(100),
  status withdrawal_status DEFAULT 'pending'::withdrawal_status NOT NULL,
  balance_hold_id uuid,
  processed_by uuid,
  processed_at timestamp with time zone,
  admin_notes text,
  transfer_proof_url text,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: withdrawal_verifications
CREATE TABLE IF NOT EXISTS public.withdrawal_verifications (
  id uuid DEFAULT uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  otp_code character varying(10) NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_verified boolean DEFAULT false NOT NULL,
  withdrawal_payload jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: workflow_analytics_daily
CREATE TABLE IF NOT EXISTS public.workflow_analytics_daily (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  execution_date date DEFAULT CURRENT_DATE,
  workflow_name text NOT NULL,
  total_executions integer DEFAULT 0,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  avg_duration_ms double precision,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: workflow_dlq
CREATE TABLE IF NOT EXISTS public.workflow_dlq (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid,
  workflow_type text NOT NULL,
  payload jsonb,
  error text,
  failed_at timestamp with time zone DEFAULT now()
);

-- Table: workflow_executions
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  workflow_name character varying(100) NOT NULL,
  status character varying(20) NOT NULL,
  results jsonb DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  event_id uuid,
  workflow_id uuid,
  outcome character varying(20),
  confidence numeric,
  mismatch_detected boolean DEFAULT false,
  escalated boolean DEFAULT false,
  sources jsonb,
  evidence jsonb,
  notified boolean DEFAULT false,
  execution_time integer,
  workflow_type text DEFAULT 'unknown'::text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  max_retries integer DEFAULT 3,
  retry_count integer DEFAULT 0
);

-- Table: workflow_schedules
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
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

-- Table: workflow_steps
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  execution_id uuid,
  step_name text NOT NULL,
  step_status text NOT NULL,
  step_data jsonb DEFAULT '{}'::jsonb,
  error_details text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- ======== INDEXES ========
CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);
CREATE INDEX idx_activities_created_at ON public.activities USING btree (created_at DESC);
CREATE INDEX idx_activities_user ON public.activities USING btree (user_id);
CREATE UNIQUE INDEX activity_aggregations_aggregation_type_aggregation_key_key ON public.activity_aggregations USING btree (aggregation_type, aggregation_key);
CREATE UNIQUE INDEX activity_aggregations_pkey ON public.activity_aggregations USING btree (id);
CREATE UNIQUE INDEX admin_activity_logs_pkey ON public.admin_activity_logs USING btree (id);
CREATE INDEX idx_admin_logs_action ON public.admin_activity_logs USING btree (action_type);
CREATE INDEX idx_admin_logs_admin ON public.admin_activity_logs USING btree (admin_id);
CREATE INDEX idx_admin_logs_created ON public.admin_activity_logs USING btree (created_at DESC);
CREATE INDEX idx_admin_logs_resource ON public.admin_activity_logs USING btree (resource_type, resource_id);
CREATE INDEX idx_admin_logs_workflow ON public.admin_activity_logs USING btree (workflow_id);
CREATE UNIQUE INDEX admin_ai_settings_pkey ON public.admin_ai_settings USING btree (id);
CREATE UNIQUE INDEX admin_audit_log_pkey ON public.admin_audit_log USING btree (id);
CREATE UNIQUE INDEX admin_settings_key_key ON public.admin_settings USING btree (key);
CREATE UNIQUE INDEX admin_settings_pkey ON public.admin_settings USING btree (id);
CREATE UNIQUE INDEX admin_workflow_triggers_pkey ON public.admin_workflow_triggers USING btree (id);
CREATE INDEX idx_admin_workflow_triggers_admin ON public.admin_workflow_triggers USING btree (admin_id, created_at DESC);
CREATE INDEX idx_admin_workflow_triggers_workflow ON public.admin_workflow_triggers USING btree (workflow_name, created_at DESC);
CREATE UNIQUE INDEX agent_wallets_pkey ON public.agent_wallets USING btree (id);
CREATE UNIQUE INDEX ai_ab_tests_pkey ON public.ai_ab_tests USING btree (id);
CREATE INDEX idx_ab_tests_status ON public.ai_ab_tests USING btree (status);
CREATE UNIQUE INDEX ai_agent_configs_agent_key_key ON public.ai_agent_configs USING btree (agent_key);
CREATE UNIQUE INDEX ai_agent_configs_pkey ON public.ai_agent_configs USING btree (id);
CREATE INDEX idx_ai_configs_status ON public.ai_agent_configs USING btree (status);
CREATE UNIQUE INDEX ai_circuit_breaker_state_pkey ON public.ai_circuit_breaker_state USING btree (id);
CREATE UNIQUE INDEX ai_circuit_breaker_state_service_key ON public.ai_circuit_breaker_state USING btree (service);
CREATE UNIQUE INDEX ai_daily_topics_pkey ON public.ai_daily_topics USING btree (id);
CREATE INDEX idx_ai_daily_topics_category ON public.ai_daily_topics USING btree (suggested_category);
CREATE INDEX idx_ai_daily_topics_generated ON public.ai_daily_topics USING btree (generated_at);
CREATE INDEX idx_ai_daily_topics_status ON public.ai_daily_topics USING btree (status);
CREATE INDEX idx_ai_topics_category ON public.ai_daily_topics USING btree (suggested_category);
CREATE INDEX idx_ai_topics_generated ON public.ai_daily_topics USING btree (generated_at DESC);
CREATE INDEX idx_ai_topics_status ON public.ai_daily_topics USING btree (status);
CREATE UNIQUE INDEX ai_evidence_cache_cache_key_key ON public.ai_evidence_cache USING btree (cache_key);
CREATE UNIQUE INDEX ai_evidence_cache_pkey ON public.ai_evidence_cache USING btree (id);
CREATE INDEX idx_evidence_cache_expires ON public.ai_evidence_cache USING btree (expires_at);
CREATE UNIQUE INDEX ai_model_versions_model_type_version_key ON public.ai_model_versions USING btree (model_type, version);
CREATE UNIQUE INDEX ai_model_versions_pkey ON public.ai_model_versions USING btree (id);
CREATE INDEX idx_model_versions_active ON public.ai_model_versions USING btree (model_type, deployment_status) WHERE ((deployment_status)::text = 'active'::text);
CREATE INDEX idx_model_versions_status ON public.ai_model_versions USING btree (deployment_status);
CREATE INDEX idx_model_versions_type ON public.ai_model_versions USING btree (model_type);
CREATE UNIQUE INDEX ai_prompts_agent_name_key ON public.ai_prompts USING btree (agent_name);
CREATE UNIQUE INDEX ai_prompts_pkey ON public.ai_prompts USING btree (id);
CREATE UNIQUE INDEX ai_providers_pkey ON public.ai_providers USING btree (id);
CREATE UNIQUE INDEX ai_providers_provider_name_key ON public.ai_providers USING btree (provider_name);
CREATE UNIQUE INDEX ai_rate_limit_state_pkey ON public.ai_rate_limit_state USING btree (id);
CREATE UNIQUE INDEX ai_rate_limit_state_service_key ON public.ai_rate_limit_state USING btree (service);
CREATE UNIQUE INDEX ai_resolution_pipelines_pipeline_id_key ON public.ai_resolution_pipelines USING btree (pipeline_id);
CREATE UNIQUE INDEX ai_resolution_pipelines_pkey ON public.ai_resolution_pipelines USING btree (id);
CREATE INDEX idx_ai_pipelines_bangladesh ON public.ai_resolution_pipelines USING btree (is_bangladesh_context);
CREATE INDEX idx_ai_pipelines_confidence ON public.ai_resolution_pipelines USING btree (confidence_level);
CREATE INDEX idx_ai_pipelines_division ON public.ai_resolution_pipelines USING btree (bangladesh_division);
CREATE INDEX idx_ai_pipelines_language ON public.ai_resolution_pipelines USING btree (detected_language);
CREATE INDEX idx_ai_pipelines_market ON public.ai_resolution_pipelines USING btree (market_id);
CREATE INDEX idx_ai_pipelines_pipeline_id ON public.ai_resolution_pipelines USING btree (pipeline_id);
CREATE INDEX idx_ai_pipelines_started ON public.ai_resolution_pipelines USING btree (started_at);
CREATE INDEX idx_ai_pipelines_status ON public.ai_resolution_pipelines USING btree (status);
CREATE UNIQUE INDEX ai_topic_configs_pkey ON public.ai_topic_configs USING btree (id);
CREATE INDEX idx_topic_configs_active ON public.ai_topic_configs USING btree (is_active);
CREATE INDEX idx_topic_configs_context ON public.ai_topic_configs USING btree (context_type);
CREATE UNIQUE INDEX ai_topic_generation_jobs_pkey ON public.ai_topic_generation_jobs USING btree (id);
CREATE INDEX idx_generation_jobs_config ON public.ai_topic_generation_jobs USING btree (config_id);
CREATE INDEX idx_generation_jobs_status ON public.ai_topic_generation_jobs USING btree (status);
CREATE UNIQUE INDEX ai_usage_logs_agent_key_usage_date_key ON public.ai_usage_logs USING btree (agent_key, usage_date);
CREATE UNIQUE INDEX ai_usage_logs_pkey ON public.ai_usage_logs USING btree (id);
CREATE INDEX idx_ai_usage_agent_date ON public.ai_usage_logs USING btree (agent_key, usage_date);
CREATE UNIQUE INDEX analytics_snapshots_daily_date_key ON public.analytics_snapshots_daily USING btree (date);
CREATE UNIQUE INDEX analytics_snapshots_daily_pkey ON public.analytics_snapshots_daily USING btree (id);
CREATE INDEX idx_analytics_daily_date ON public.analytics_snapshots_daily USING btree (date DESC);
CREATE UNIQUE INDEX analytics_snapshots_hourly_bucket_start_key ON public.analytics_snapshots_hourly USING btree (bucket_start);
CREATE UNIQUE INDEX analytics_snapshots_hourly_pkey ON public.analytics_snapshots_hourly USING btree (id);
CREATE INDEX idx_analytics_hourly_time ON public.analytics_snapshots_hourly USING btree (bucket_start DESC);
CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);
CREATE UNIQUE INDEX badges_pkey ON public.badges USING btree (id);
CREATE UNIQUE INDEX balance_holds_pkey ON public.balance_holds USING btree (id);
CREATE INDEX idx_balance_holds_user ON public.balance_holds USING btree (user_id, created_at);
CREATE UNIQUE INDEX bd_cricket_events_pkey ON public.bd_cricket_events USING btree (id);
CREATE INDEX idx_bd_cricket_events_date ON public.bd_cricket_events USING btree (match_date);
CREATE INDEX idx_bd_cricket_events_opponent ON public.bd_cricket_events USING btree (opponent);
CREATE UNIQUE INDEX bd_divisions_name_key ON public.bd_divisions USING btree (name);
CREATE UNIQUE INDEX bd_divisions_pkey ON public.bd_divisions USING btree (id);
CREATE UNIQUE INDEX bd_economic_indicators_pkey ON public.bd_economic_indicators USING btree (id);
CREATE INDEX idx_bd_economic_indicators_date ON public.bd_economic_indicators USING btree (indicator_date);
CREATE INDEX idx_bd_economic_indicators_name ON public.bd_economic_indicators USING btree (indicator_name);
CREATE UNIQUE INDEX bd_news_sources_domain_key ON public.bd_news_sources USING btree (domain);
CREATE UNIQUE INDEX bd_news_sources_pkey ON public.bd_news_sources USING btree (id);
CREATE INDEX idx_bd_news_sources_active ON public.bd_news_sources USING btree (is_active);
CREATE INDEX idx_bd_news_sources_category ON public.bd_news_sources USING btree (category);
CREATE INDEX idx_bd_news_sources_type ON public.bd_news_sources USING btree (source_type);
CREATE UNIQUE INDEX bd_political_events_pkey ON public.bd_political_events USING btree (id);
CREATE INDEX idx_bd_political_events_date ON public.bd_political_events USING btree (event_date);
CREATE INDEX idx_bd_political_events_type ON public.bd_political_events USING btree (event_type);
CREATE UNIQUE INDEX cancellation_records_pkey ON public.cancellation_records USING btree (id);
CREATE INDEX idx_cancellation_order ON public.cancellation_records USING btree (order_id);
CREATE INDEX idx_cancellation_sequence ON public.cancellation_records USING btree (sequence_number);
CREATE INDEX idx_cancellation_time ON public.cancellation_records USING btree (requested_at);
CREATE UNIQUE INDEX category_settings_pkey ON public.category_settings USING btree (category);
CREATE UNIQUE INDEX comment_attachments_pkey ON public.comment_attachments USING btree (id);
CREATE UNIQUE INDEX comment_flags_comment_id_user_id_key ON public.comment_flags USING btree (comment_id, user_id);
CREATE UNIQUE INDEX comment_flags_pkey ON public.comment_flags USING btree (id);
CREATE UNIQUE INDEX comment_likes_pkey ON public.comment_likes USING btree (user_id, comment_id);
CREATE INDEX idx_comment_likes_comment ON public.comment_likes USING btree (comment_id);
CREATE INDEX idx_comment_likes_user ON public.comment_likes USING btree (user_id);
CREATE UNIQUE INDEX comment_moderation_queue_comment_id_key ON public.comment_moderation_queue USING btree (comment_id);
CREATE UNIQUE INDEX comment_moderation_queue_pkey ON public.comment_moderation_queue USING btree (id);
CREATE UNIQUE INDEX comment_votes_comment_id_user_id_key ON public.comment_votes USING btree (comment_id, user_id);
CREATE UNIQUE INDEX comment_votes_pkey ON public.comment_votes USING btree (id);
CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);
CREATE INDEX idx_comments_event_created ON public.comments USING btree (event_id, created_at DESC);
CREATE INDEX idx_comments_user ON public.comments USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX copy_trading_settings_pkey ON public.copy_trading_settings USING btree (id);
CREATE UNIQUE INDEX copy_trading_settings_user_id_key ON public.copy_trading_settings USING btree (user_id);
CREATE UNIQUE INDEX custom_categories_name_key ON public.custom_categories USING btree (name);
CREATE UNIQUE INDEX custom_categories_pkey ON public.custom_categories USING btree (id);
CREATE UNIQUE INDEX custom_categories_slug_key ON public.custom_categories USING btree (slug);
CREATE UNIQUE INDEX deposit_attempts_pkey ON public.deposit_attempts USING btree (id);
CREATE UNIQUE INDEX deposit_requests_pkey ON public.deposit_requests USING btree (id);
CREATE INDEX idx_deposits_status_created ON public.deposit_requests USING btree (status, created_at);
CREATE INDEX idx_deposits_txn_provider ON public.deposit_requests USING btree (txn_id, payment_method);
CREATE INDEX idx_deposits_user ON public.deposit_requests USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX dispute_records_pkey ON public.dispute_records USING btree (id);
CREATE INDEX idx_dispute_records_event ON public.dispute_records USING btree (event_id);
CREATE UNIQUE INDEX disputes_dispute_id_key ON public.disputes USING btree (dispute_id);
CREATE UNIQUE INDEX disputes_pkey ON public.disputes USING btree (id);
CREATE INDEX idx_disputes_challenger ON public.disputes USING btree (challenger_id);
CREATE INDEX idx_disputes_deadline ON public.disputes USING btree (deadline_at);
CREATE INDEX idx_disputes_level ON public.disputes USING btree (level);
CREATE INDEX idx_disputes_market ON public.disputes USING btree (market_id);
CREATE INDEX idx_disputes_status ON public.disputes USING btree (status);
CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);
CREATE UNIQUE INDEX events_slug_key ON public.events USING btree (slug);
CREATE INDEX idx_events_category ON public.events USING btree (category);
CREATE INDEX idx_events_created_at ON public.events USING btree (created_at DESC);
CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);
CREATE INDEX idx_events_event_date ON public.events USING btree (event_date);
CREATE INDEX idx_events_is_featured ON public.events USING btree (is_featured) WHERE (is_featured = true);
CREATE INDEX idx_events_is_trending ON public.events USING btree (is_trending) WHERE (is_trending = true);
CREATE INDEX idx_events_market_id ON public.events USING btree (market_id) WHERE (market_id IS NOT NULL);
CREATE INDEX idx_events_search ON public.events USING gin (search_vector);
CREATE INDEX idx_events_slug ON public.events USING btree (slug);
CREATE INDEX idx_events_status ON public.events USING btree (status);
CREATE INDEX idx_events_tags ON public.events USING gin (tags);
CREATE INDEX idx_events_title ON public.events USING btree (title);
CREATE INDEX idx_events_trading_closes ON public.events USING btree (trading_closes_at);
CREATE UNIQUE INDEX exchange_rates_pkey ON public.exchange_rates USING btree (id);
CREATE INDEX idx_exchange_rates_effective ON public.exchange_rates USING btree (effective_from, effective_until);
CREATE UNIQUE INDEX expert_assignments_pkey ON public.expert_assignments USING btree (id);
CREATE INDEX idx_expert_assignments_event ON public.expert_assignments USING btree (event_id);
CREATE INDEX idx_expert_assignments_expert ON public.expert_assignments USING btree (expert_id);
CREATE UNIQUE INDEX unique_expert_event_assignment ON public.expert_assignments USING btree (expert_id, event_id);
CREATE UNIQUE INDEX expert_badges_pkey ON public.expert_badges USING btree (id);
CREATE UNIQUE INDEX expert_panel_pkey ON public.expert_panel USING btree (id);
CREATE INDEX idx_expert_panel_active ON public.expert_panel USING btree (is_active, is_verified);
CREATE INDEX idx_expert_panel_reputation ON public.expert_panel USING btree (reputation_score DESC);
CREATE INDEX idx_expert_panel_specializations ON public.expert_panel USING gin (specializations);
CREATE INDEX idx_expert_panel_user ON public.expert_panel USING btree (user_id);
CREATE UNIQUE INDEX unique_expert_user ON public.expert_panel USING btree (user_id);
CREATE UNIQUE INDEX expert_panel_members_pkey ON public.expert_panel_members USING btree (id);
CREATE INDEX idx_expert_active ON public.expert_panel_members USING btree (is_active);
CREATE INDEX idx_expert_expertise ON public.expert_panel_members USING gin (expertise);
CREATE UNIQUE INDEX expert_panel_reviews_pkey ON public.expert_panel_reviews USING btree (id);
CREATE UNIQUE INDEX expert_votes_pkey ON public.expert_votes USING btree (id);
CREATE INDEX idx_expert_votes_event ON public.expert_votes USING btree (event_id);
CREATE INDEX idx_expert_votes_expert ON public.expert_votes USING btree (expert_id);
CREATE INDEX idx_expert_votes_status ON public.expert_votes USING btree (ai_verification_status);
CREATE UNIQUE INDEX unique_expert_event_vote ON public.expert_votes USING btree (expert_id, event_id);
CREATE UNIQUE INDEX feed_preferences_pkey ON public.feed_preferences USING btree (user_id);
CREATE UNIQUE INDEX fill_records_pkey ON public.fill_records USING btree (id);
CREATE INDEX idx_fill_records_order ON public.fill_records USING btree (order_id, fill_number);
CREATE INDEX idx_fill_records_time ON public.fill_records USING btree (filled_at);
CREATE INDEX idx_fill_records_trade ON public.fill_records USING btree (trade_id);
CREATE UNIQUE INDEX follow_requests_pkey ON public.follow_requests USING btree (id);
CREATE INDEX idx_follow_requests_requester ON public.follow_requests USING btree (requester_id);
CREATE INDEX idx_follow_requests_target ON public.follow_requests USING btree (target_id, status);
CREATE UNIQUE INDEX unique_pending_request ON public.follow_requests USING btree (requester_id, target_id, status);
CREATE UNIQUE INDEX global_sequence_pkey ON public.global_sequence USING btree (id);
CREATE UNIQUE INDEX human_review_queue_pkey ON public.human_review_queue USING btree (id);
CREATE INDEX idx_human_review_assigned ON public.human_review_queue USING btree (assigned_to);
CREATE INDEX idx_human_review_deadline ON public.human_review_queue USING btree (deadline_at);
CREATE INDEX idx_human_review_pending ON public.human_review_queue USING btree (status, priority) WHERE ((status)::text = 'pending'::text);
CREATE INDEX idx_human_review_priority ON public.human_review_queue USING btree (priority);
CREATE INDEX idx_human_review_status ON public.human_review_queue USING btree (status);
CREATE UNIQUE INDEX idempotency_keys_pkey ON public.idempotency_keys USING btree (key);
CREATE INDEX idx_idem_user ON public.idempotency_keys USING btree (user_id, created_at);
CREATE UNIQUE INDEX kyc_admin_overrides_pkey ON public.kyc_admin_overrides USING btree (id);
CREATE INDEX idx_kyc_documents_status ON public.kyc_documents USING btree (status);
CREATE INDEX idx_kyc_documents_user ON public.kyc_documents USING btree (user_id);
CREATE UNIQUE INDEX kyc_documents_pkey ON public.kyc_documents USING btree (id);
CREATE UNIQUE INDEX kyc_settings_pkey ON public.kyc_settings USING btree (id);
CREATE UNIQUE INDEX kyc_submissions_pkey ON public.kyc_submissions USING btree (id);
CREATE INDEX idx_leaderboard_roi ON public.leaderboard_cache USING btree (timeframe, roi DESC);
CREATE UNIQUE INDEX leaderboard_cache_pkey ON public.leaderboard_cache USING btree (id);
CREATE UNIQUE INDEX leaderboard_cache_user_id_timeframe_key ON public.leaderboard_cache USING btree (user_id, timeframe);
CREATE UNIQUE INDEX leagues_name_key ON public.leagues USING btree (name);
CREATE UNIQUE INDEX leagues_pkey ON public.leagues USING btree (id);
CREATE UNIQUE INDEX leagues_tier_order_key ON public.leagues USING btree (tier_order);
CREATE INDEX idx_legal_queue_assigned ON public.legal_review_queue USING btree (assigned_to);
CREATE INDEX idx_legal_queue_status ON public.legal_review_queue USING btree (status);
CREATE UNIQUE INDEX legal_review_queue_draft_id_key ON public.legal_review_queue USING btree (draft_id);
CREATE UNIQUE INDEX legal_review_queue_pkey ON public.legal_review_queue USING btree (id);
CREATE INDEX idx_maker_rebates_month ON public.maker_rebates USING btree (year_month);
CREATE INDEX idx_maker_rebates_status ON public.maker_rebates USING btree (claim_status);
CREATE INDEX idx_maker_rebates_user ON public.maker_rebates USING btree (user_id);
CREATE INDEX idx_maker_rebates_user_month ON public.maker_rebates USING btree (user_id, year_month);
CREATE UNIQUE INDEX maker_rebates_pkey ON public.maker_rebates USING btree (id);
CREATE INDEX idx_volume_tracking_month ON public.maker_volume_tracking USING btree (year_month);
CREATE INDEX idx_volume_tracking_tier ON public.maker_volume_tracking USING btree (rebate_tier);
CREATE INDEX idx_volume_tracking_user ON public.maker_volume_tracking USING btree (user_id);
CREATE UNIQUE INDEX maker_volume_tracking_pkey ON public.maker_volume_tracking USING btree (id);
CREATE UNIQUE INDEX unique_user_month ON public.maker_volume_tracking USING btree (user_id, year_month);
CREATE UNIQUE INDEX manual_deposits_pkey ON public.manual_deposits USING btree (id);
CREATE UNIQUE INDEX manual_deposits_transaction_id_key ON public.manual_deposits USING btree (transaction_id);
CREATE INDEX idx_comments_market_created ON public.market_comments USING btree (market_id, created_at);
CREATE INDEX idx_market_comments_depth ON public.market_comments USING btree (depth_level);
CREATE INDEX idx_market_comments_market_id ON public.market_comments USING btree (market_id);
CREATE INDEX idx_market_comments_parent_id ON public.market_comments USING btree (parent_id);
CREATE INDEX idx_market_comments_score ON public.market_comments USING btree (score DESC);
CREATE INDEX idx_market_comments_user_id ON public.market_comments USING btree (user_id);
CREATE UNIQUE INDEX market_comments_pkey ON public.market_comments USING btree (id);
CREATE INDEX idx_market_drafts_creator ON public.market_creation_drafts USING btree (creator_id);
CREATE INDEX idx_market_drafts_legal_review ON public.market_creation_drafts USING btree (legal_review_status) WHERE (legal_review_status IS NOT NULL);
CREATE INDEX idx_market_drafts_stage ON public.market_creation_drafts USING btree (current_stage);
CREATE INDEX idx_market_drafts_status ON public.market_creation_drafts USING btree (status);
CREATE UNIQUE INDEX market_creation_drafts_pkey ON public.market_creation_drafts USING btree (id);
CREATE INDEX idx_market_daily_stats ON public.market_daily_stats USING btree (market_id, date DESC);
CREATE UNIQUE INDEX market_daily_stats_market_id_date_key ON public.market_daily_stats USING btree (market_id, date);
CREATE UNIQUE INDEX market_daily_stats_pkey ON public.market_daily_stats USING btree (id);
CREATE INDEX idx_followers_market ON public.market_followers USING btree (market_id);
CREATE INDEX idx_followers_notify_resolve ON public.market_followers USING btree (market_id, notify_on_resolve) WHERE (notify_on_resolve = true);
CREATE INDEX idx_followers_notify_trade ON public.market_followers USING btree (market_id, notify_on_trade) WHERE (notify_on_trade = true);
CREATE INDEX idx_followers_user ON public.market_followers USING btree (user_id);
CREATE INDEX idx_market_followers_market ON public.market_followers USING btree (market_id);
CREATE INDEX idx_market_followers_user ON public.market_followers USING btree (user_id);
CREATE UNIQUE INDEX market_followers_pkey ON public.market_followers USING btree (user_id, market_id);
CREATE INDEX idx_market_follows_market ON public.market_follows USING btree (market_id);
CREATE INDEX idx_market_follows_user ON public.market_follows USING btree (user_id);
CREATE UNIQUE INDEX market_follows_pkey ON public.market_follows USING btree (id);
CREATE UNIQUE INDEX unique_market_follow ON public.market_follows USING btree (user_id, market_id);
CREATE UNIQUE INDEX market_suggestions_pkey ON public.market_suggestions USING btree (id);
CREATE UNIQUE INDEX market_templates_pkey ON public.market_templates USING btree (id);
CREATE INDEX idx_markets_best_ask ON public.markets USING btree (best_ask) WHERE (best_ask IS NOT NULL);
CREATE INDEX idx_markets_best_bid ON public.markets USING btree (best_bid DESC) WHERE (best_bid IS NOT NULL);
CREATE INDEX idx_markets_category ON public.markets USING btree (category);
CREATE INDEX idx_markets_created_by ON public.markets USING btree (created_by);
CREATE INDEX idx_markets_event_id ON public.markets USING btree (event_id);
CREATE INDEX idx_markets_is_featured ON public.markets USING btree (is_featured) WHERE (is_featured = true);
CREATE INDEX idx_markets_slug ON public.markets USING btree (slug);
CREATE UNIQUE INDEX idx_markets_slug_unique ON public.markets USING btree (slug) WHERE (slug IS NOT NULL);
CREATE INDEX idx_markets_status ON public.markets USING btree (status, created_at DESC);
CREATE INDEX idx_markets_subcategory ON public.markets USING btree (subcategory);
CREATE INDEX idx_markets_tags ON public.markets USING gin (tags);
CREATE INDEX idx_markets_trading_ends ON public.markets USING btree (trading_ends);
CREATE INDEX idx_markets_trading_ends_category ON public.markets USING btree (trading_ends, category) WHERE (status = 'active'::market_status);
CREATE INDEX idx_markets_trading_phase ON public.markets USING btree (trading_phase);
CREATE UNIQUE INDEX markets_pkey ON public.markets USING btree (id);
CREATE UNIQUE INDEX markets_slug_key ON public.markets USING btree (slug);
CREATE UNIQUE INDEX moderation_actions_pkey ON public.moderation_actions USING btree (id);
CREATE UNIQUE INDEX news_sources_pkey ON public.news_sources USING btree (id);
CREATE UNIQUE INDEX unique_source_url ON public.news_sources USING btree (source_url);
CREATE UNIQUE INDEX notification_channels_pkey ON public.notification_channels USING btree (id);
CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id);
CREATE UNIQUE INDEX unique_user_preferences ON public.notification_preferences USING btree (user_id);
CREATE UNIQUE INDEX notification_templates_pkey ON public.notification_templates USING btree (id);
CREATE INDEX idx_notifications_market ON public.notifications USING btree (market_id);
CREATE INDEX idx_notifications_type ON public.notifications USING btree (user_id, type, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE (read = false);
CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, read, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);
CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);
CREATE UNIQUE INDEX oracle_assertions_pkey ON public.oracle_assertions USING btree (id);
CREATE INDEX idx_oracle_disputes_request ON public.oracle_disputes USING btree (request_id);
CREATE UNIQUE INDEX oracle_disputes_pkey ON public.oracle_disputes USING btree (id);
CREATE INDEX idx_oracle_requests_challenge_end ON public.oracle_requests USING btree (challenge_window_ends_at);
CREATE INDEX idx_oracle_requests_market ON public.oracle_requests USING btree (market_id);
CREATE INDEX idx_oracle_requests_status ON public.oracle_requests USING btree (status);
CREATE UNIQUE INDEX oracle_requests_pkey ON public.oracle_requests USING btree (id);
CREATE UNIQUE INDEX oracle_verifications_pkey ON public.oracle_verifications USING btree (id);
CREATE INDEX idx_order_batches_status ON public.order_batches USING btree (status);
CREATE INDEX idx_order_batches_user ON public.order_batches USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX order_batches_pkey ON public.order_batches USING btree (id);
CREATE INDEX idx_order_book_market_side_price_asc_created_asc ON public.order_book USING btree (market_id, side, price, created_at) WHERE ((status)::text = ANY ((ARRAY['OPEN'::character varying, 'PARTIAL'::character varying])::text[]));
CREATE INDEX idx_order_book_market_side_price_desc_created_asc ON public.order_book USING btree (market_id, side, price DESC, created_at) WHERE ((status)::text = ANY ((ARRAY['OPEN'::character varying, 'PARTIAL'::character varying])::text[]));
CREATE UNIQUE INDEX order_book_pkey ON public.order_book USING btree (id);
CREATE INDEX idx_commitments_hash ON public.order_commitments USING btree (commitment_hash);
CREATE UNIQUE INDEX order_commitments_pkey ON public.order_commitments USING btree (id);
CREATE INDEX idx_orders_batch ON public.orders USING btree (batch_id) WHERE (batch_id IS NOT NULL);
CREATE INDEX idx_orders_batch_id ON public.orders USING btree (batch_id) WHERE (batch_id IS NOT NULL);
CREATE INDEX idx_orders_book ON public.orders USING btree (market_id, outcome, side, status, price) WHERE (status = ANY (ARRAY['open'::order_status, 'partially_filled'::order_status]));
CREATE INDEX idx_orders_client_order_id ON public.orders USING btree (client_order_id) WHERE (client_order_id IS NOT NULL);
CREATE INDEX idx_orders_market_side_price_status ON public.orders USING btree (market_id, side, price, status) WHERE (status = ANY (ARRAY['open'::order_status, 'partially_filled'::order_status]));
CREATE INDEX idx_orders_market_user ON public.orders USING btree (market_id, user_id);
CREATE INDEX idx_orders_matching ON public.orders USING btree (market_id, outcome, side, status, price, created_at) WHERE (status = ANY (ARRAY['open'::order_status, 'partially_filled'::order_status]));
CREATE INDEX idx_orders_stop_price ON public.orders USING btree (stop_price, trigger_condition, status) WHERE ((order_type = ANY (ARRAY['stop_loss'::order_type, 'take_profit'::order_type])) AND (status = 'open'::order_status));
CREATE INDEX idx_orders_user ON public.orders USING btree (user_id, status);
CREATE INDEX idx_orders_user_active ON public.orders USING btree (user_id, status, created_at DESC) WHERE (status <> ALL (ARRAY['filled'::order_status, 'cancelled'::order_status, 'expired'::order_status]));
CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);
CREATE INDEX idx_outcomes_market_id ON public.outcomes USING btree (market_id);
CREATE UNIQUE INDEX outcomes_pkey ON public.outcomes USING btree (id);
CREATE UNIQUE INDEX p2p_seller_cache_pkey ON public.p2p_seller_cache USING btree (id);
CREATE INDEX idx_payment_tx_status ON public.payment_transactions USING btree (status);
CREATE INDEX idx_payment_tx_trxid ON public.payment_transactions USING btree (transaction_id);
CREATE INDEX idx_payment_tx_user ON public.payment_transactions USING btree (user_id);
CREATE UNIQUE INDEX payment_transactions_pkey ON public.payment_transactions USING btree (id);
CREATE UNIQUE INDEX payment_transactions_transaction_id_key ON public.payment_transactions USING btree (transaction_id);
CREATE UNIQUE INDEX platform_settings_key_key ON public.platform_settings USING btree (key);
CREATE UNIQUE INDEX platform_settings_pkey ON public.platform_settings USING btree (id);
CREATE UNIQUE INDEX platform_wallets_pkey ON public.platform_wallets USING btree (id);
CREATE INDEX idx_positions_user_market ON public.positions USING btree (user_id, market_id);
CREATE INDEX idx_positions_user_outcome ON public.positions USING btree (user_id, outcome_index);
CREATE UNIQUE INDEX positions_market_id_user_id_outcome_key ON public.positions USING btree (market_id, user_id, outcome);
CREATE UNIQUE INDEX positions_pkey ON public.positions USING btree (id);
CREATE INDEX idx_price_history_market ON public.price_history USING btree (market_id, recorded_at DESC);
CREATE INDEX idx_price_history_market_outcome ON public.price_history USING btree (market_id, outcome, recorded_at DESC);
CREATE INDEX idx_price_history_market_time ON public.price_history USING btree (market_id, recorded_at DESC);
CREATE INDEX idx_price_history_outcome ON public.price_history USING btree (market_id, outcome, recorded_at DESC);
CREATE INDEX idx_price_history_recorded ON public.price_history USING btree (recorded_at DESC);
CREATE UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id);
CREATE UNIQUE INDEX idx_price_ohlc_1h_unique ON public.price_ohlc_1h USING btree (market_id, outcome, hour);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles USING btree (referral_code);
CREATE UNIQUE INDEX rebate_tiers_config_pkey ON public.rebate_tiers_config USING btree (id);
CREATE INDEX idx_ai_feedback_error ON public.resolution_feedback USING btree (error_type);
CREATE INDEX idx_ai_feedback_market ON public.resolution_feedback USING btree (market_id);
CREATE INDEX idx_ai_feedback_pipeline ON public.resolution_feedback USING btree (pipeline_id);
CREATE INDEX idx_ai_feedback_unprocessed ON public.resolution_feedback USING btree (processed_at) WHERE (processed_at IS NULL);
CREATE UNIQUE INDEX resolution_feedback_pkey ON public.resolution_feedback USING btree (id);
CREATE INDEX idx_resolution_systems_event ON public.resolution_systems USING btree (event_id);
CREATE INDEX idx_resolution_systems_scheduled ON public.resolution_systems USING btree (scheduled_resolution_at) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying])::text[]));
CREATE INDEX idx_resolution_systems_status ON public.resolution_systems USING btree (status);
CREATE UNIQUE INDEX resolution_systems_pkey ON public.resolution_systems USING btree (id);
CREATE UNIQUE INDEX unique_event_resolution ON public.resolution_systems USING btree (event_id);
CREATE INDEX idx_resolvers_active ON public.resolvers USING btree (is_active, type);
CREATE UNIQUE INDEX resolvers_pkey ON public.resolvers USING btree (address);
CREATE INDEX idx_resting_orders_active ON public.resting_orders USING btree (user_id, is_active);
CREATE INDEX idx_resting_orders_market ON public.resting_orders USING btree (market_id);
CREATE INDEX idx_resting_orders_time ON public.resting_orders USING btree (resting_start_time, resting_end_time);
CREATE INDEX idx_resting_orders_user ON public.resting_orders USING btree (user_id);
CREATE UNIQUE INDEX resting_orders_pkey ON public.resting_orders USING btree (id);
CREATE UNIQUE INDEX security_events_pkey ON public.security_events USING btree (id);
CREATE UNIQUE INDEX sensitive_topics_keyword_key ON public.sensitive_topics USING btree (keyword);
CREATE UNIQUE INDEX sensitive_topics_pkey ON public.sensitive_topics USING btree (id);
CREATE INDEX idx_batches_market ON public.settlement_batches USING btree (market_id);
CREATE INDEX idx_batches_status ON public.settlement_batches USING btree (status);
CREATE UNIQUE INDEX settlement_batches_batch_id_key ON public.settlement_batches USING btree (batch_id);
CREATE UNIQUE INDEX settlement_batches_pkey ON public.settlement_batches USING btree (id);
CREATE INDEX idx_claims_market ON public.settlement_claims USING btree (market_id);
CREATE INDEX idx_claims_status ON public.settlement_claims USING btree (status);
CREATE INDEX idx_claims_user ON public.settlement_claims USING btree (user_id);
CREATE UNIQUE INDEX settlement_claims_claim_id_key ON public.settlement_claims USING btree (claim_id);
CREATE UNIQUE INDEX settlement_claims_pkey ON public.settlement_claims USING btree (id);
CREATE UNIQUE INDEX settlement_escalations_pkey ON public.settlement_escalations USING btree (id);
CREATE UNIQUE INDEX spread_multiplier_config_pkey ON public.spread_multiplier_config USING btree (id);
CREATE INDEX idx_spread_rewards_date ON public.spread_rewards USING btree (calculation_date);
CREATE INDEX idx_spread_rewards_tier ON public.spread_rewards USING btree (spread_tier);
CREATE INDEX idx_spread_rewards_user ON public.spread_rewards USING btree (user_id);
CREATE UNIQUE INDEX spread_rewards_pkey ON public.spread_rewards USING btree (id);
CREATE UNIQUE INDEX trader_subscriptions_follower_id_trader_id_key ON public.trader_subscriptions USING btree (follower_id, trader_id);
CREATE UNIQUE INDEX trader_subscriptions_pkey ON public.trader_subscriptions USING btree (id);
CREATE INDEX idx_trades_created ON public.trades USING btree (created_at DESC);
CREATE INDEX idx_trades_market ON public.trades USING btree (market_id, created_at DESC);
CREATE INDEX idx_trades_user ON public.trades USING btree (maker_id, taker_id, created_at DESC);
CREATE UNIQUE INDEX trades_pkey ON public.trades USING btree (id);
CREATE INDEX idx_transactions_user ON public.transactions USING btree (user_id, created_at DESC);
CREATE INDEX idx_transactions_user_created ON public.transactions USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);
CREATE INDEX idx_upstash_workflow_runs_event ON public.upstash_workflow_runs USING btree (event_id);
CREATE INDEX idx_upstash_workflow_runs_status ON public.upstash_workflow_runs USING btree (status);
CREATE UNIQUE INDEX upstash_workflow_runs_pkey ON public.upstash_workflow_runs USING btree (id);
CREATE UNIQUE INDEX user_badges_pkey ON public.user_badges USING btree (id);
CREATE UNIQUE INDEX user_badges_user_id_badge_id_key ON public.user_badges USING btree (user_id, badge_id);
CREATE INDEX idx_user_bookmarks_created ON public.user_bookmarks USING btree (created_at DESC);
CREATE INDEX idx_user_bookmarks_market ON public.user_bookmarks USING btree (market_id);
CREATE INDEX idx_user_bookmarks_user ON public.user_bookmarks USING btree (user_id);
CREATE UNIQUE INDEX user_bookmarks_pkey ON public.user_bookmarks USING btree (user_id, market_id);
CREATE INDEX idx_user_follows_created ON public.user_follows USING btree (created_at);
CREATE INDEX idx_user_follows_follower ON public.user_follows USING btree (follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows USING btree (following_id);
CREATE UNIQUE INDEX unique_follow ON public.user_follows USING btree (follower_id, following_id);
CREATE UNIQUE INDEX user_follows_pkey ON public.user_follows USING btree (id);
CREATE UNIQUE INDEX user_kyc_profiles_pkey ON public.user_kyc_profiles USING btree (id);
CREATE INDEX idx_user_leagues_points ON public.user_leagues USING btree (league_id, current_points DESC);
CREATE UNIQUE INDEX user_leagues_pkey ON public.user_leagues USING btree (user_id);
CREATE UNIQUE INDEX user_moderation_status_pkey ON public.user_moderation_status USING btree (user_id);
CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);
CREATE UNIQUE INDEX user_reputation_pkey ON public.user_reputation USING btree (user_id);
CREATE UNIQUE INDEX user_status_pkey ON public.user_status USING btree (id);
CREATE UNIQUE INDEX user_trading_stats_pkey ON public.user_trading_stats USING btree (user_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_is_admin ON public.users USING btree (id) WHERE (is_admin = true);
CREATE UNIQUE INDEX idx_users_wallet_email ON public.users USING btree (wallet_address, email) WHERE ((wallet_address IS NOT NULL) AND (email IS NOT NULL));
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX users_wallet_address_key ON public.users USING btree (wallet_address);
CREATE INDEX idx_verification_workflows_category ON public.verification_workflows USING btree (event_category);
CREATE INDEX idx_verification_workflows_created_at ON public.verification_workflows USING btree (created_at DESC);
CREATE INDEX idx_verification_workflows_enabled ON public.verification_workflows USING btree (enabled);
CREATE UNIQUE INDEX verification_workflows_pkey ON public.verification_workflows USING btree (id);
CREATE INDEX idx_wallet_transactions_user_created ON public.wallet_transactions USING btree (user_id, created_at DESC);
CREATE INDEX idx_wallet_tx_status ON public.wallet_transactions USING btree (status);
CREATE INDEX idx_wallet_tx_type ON public.wallet_transactions USING btree (transaction_type);
CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions USING btree (user_id);
CREATE UNIQUE INDEX wallet_transactions_pkey ON public.wallet_transactions USING btree (id);
CREATE INDEX idx_wallets_active_usdc ON public.wallets USING btree (usdc_address) WHERE ((usdc_address IS NOT NULL) AND (is_active = true));
CREATE INDEX idx_wallets_active_usdt ON public.wallets USING btree (usdt_address) WHERE ((usdt_address IS NOT NULL) AND (is_active = true));
CREATE INDEX idx_wallets_user ON public.wallets USING btree (user_id);
CREATE UNIQUE INDEX uq_wallets_usdt_address ON public.wallets USING btree (usdt_address);
CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id);
CREATE UNIQUE INDEX wallets_user_id_key ON public.wallets USING btree (user_id);
CREATE INDEX idx_withdrawals_status_created ON public.withdrawal_requests USING btree (status, created_at);
CREATE INDEX idx_withdrawals_user ON public.withdrawal_requests USING btree (user_id, created_at DESC);
CREATE UNIQUE INDEX withdrawal_requests_pkey ON public.withdrawal_requests USING btree (id);
CREATE INDEX idx_withdrawal_verif_expires ON public.withdrawal_verifications USING btree (expires_at);
CREATE INDEX idx_withdrawal_verif_user ON public.withdrawal_verifications USING btree (user_id);
CREATE UNIQUE INDEX withdrawal_verifications_pkey ON public.withdrawal_verifications USING btree (id);
CREATE UNIQUE INDEX workflow_analytics_daily_execution_date_workflow_name_key ON public.workflow_analytics_daily USING btree (execution_date, workflow_name);
CREATE UNIQUE INDEX workflow_analytics_daily_pkey ON public.workflow_analytics_daily USING btree (id);
CREATE INDEX idx_workflow_dlq_event ON public.workflow_dlq USING btree (event_id);
CREATE UNIQUE INDEX workflow_dlq_pkey ON public.workflow_dlq USING btree (id);
CREATE INDEX idx_workflow_executions_event_id ON public.workflow_executions USING btree (event_id);
CREATE INDEX idx_workflow_executions_name_date ON public.workflow_executions USING btree (workflow_name, created_at DESC);
CREATE INDEX idx_workflow_executions_outcome ON public.workflow_executions USING btree (outcome);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions USING btree (status, created_at DESC);
CREATE INDEX idx_workflow_executions_type ON public.workflow_executions USING btree (workflow_type);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions USING btree (workflow_id);
CREATE UNIQUE INDEX workflow_executions_pkey ON public.workflow_executions USING btree (id);
CREATE INDEX idx_workflow_schedules_active ON public.workflow_schedules USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_workflow_schedules_type ON public.workflow_schedules USING btree (workflow_type);
CREATE UNIQUE INDEX workflow_schedules_name_key ON public.workflow_schedules USING btree (name);
CREATE UNIQUE INDEX workflow_schedules_pkey ON public.workflow_schedules USING btree (id);
CREATE UNIQUE INDEX workflow_schedules_schedule_id_key ON public.workflow_schedules USING btree (schedule_id);
CREATE INDEX idx_workflow_steps_execution ON public.workflow_steps USING btree (execution_id);
CREATE UNIQUE INDEX workflow_steps_pkey ON public.workflow_steps USING btree (id);

-- ======== FUNCTIONS ========
CREATE OR REPLACE FUNCTION public.add_to_workflow_dlq(p_workflow_run_id text, p_error_message text, p_error_stack text DEFAULT NULL::text, p_failed_step character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.admin_credit_wallet(p_admin_id uuid, p_user_id uuid, p_amount numeric, p_reason text DEFAULT 'Admin credit'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.admin_debit_wallet(p_admin_id uuid, p_user_id uuid, p_amount numeric, p_reason text DEFAULT 'Admin debit'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.admin_get_user_wallet(p_admin_id uuid, p_user_id uuid)
 RETURNS TABLE(id uuid, user_id uuid, balance numeric, locked_balance numeric, available_balance numeric, currency text, created_at timestamp with time zone, updated_at timestamp with time zone, transactions jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.admin_kyc_action(p_admin_id uuid, p_user_id uuid, p_action character varying, p_reason text DEFAULT NULL::text, p_rejection_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.admin_update_market_fields(p_market_id uuid, p_fields jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.approve_ai_topic(p_topic_id uuid, p_admin_id uuid, p_trading_closes_at timestamp with time zone, p_initial_liquidity numeric DEFAULT 1000)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.approve_deposit(p_admin_id uuid, p_payment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.auto_complete_cancellation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.auto_log_market_resolution()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.batch_cancel_orders(p_order_ids uuid[], p_user_id uuid)
 RETURNS TABLE(order_id uuid, success boolean, message text, sequence_number bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cache_top_experts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_daily_ohlc(p_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_hourly_metrics(p_hour timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_market_spread(p_market_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_reputation_score(p_correct_votes integer, p_total_votes integer)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_spread_multiplier(p_avg_spread numeric, p_avg_order_size numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_vwap(p_order_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_weekly_rebate(p_user_id uuid, p_period_start timestamp with time zone, p_period_end timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_order_batch(p_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_comment_edit_window()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF OLD.created_at < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Edit window (5 minutes) has expired';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_gtd_expiry()
 RETURNS TABLE(expired_order_id uuid, released_collateral numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_kyc_withdrawal_gate(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_sensitive_topics(p_text text)
 RETURNS TABLE(keyword character varying, category character varying, risk_level character varying, requires_review boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT st.keyword, st.category, st.risk_level, st.requires_review
    FROM sensitive_topics st
    WHERE p_text ILIKE '%' || st.keyword || '%'
    AND st.is_active = TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_trading_eligibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_withdrawal_eligibility(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.claim_rebate(p_rebate_id uuid, p_user_id uuid, p_payment_method character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_dormant_accounts()
 RETURNS TABLE(user_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_batches()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.complete_legal_review(p_draft_id uuid, p_reviewer_id uuid, p_status character varying, p_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_event_complete(p_event_data jsonb, p_admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        
        -- If no admin user, use null user_id (will need RLS policy for this)
        IF v_system_user_id IS NULL THEN
            v_system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        END IF;
        
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_event_debug(p_event_data jsonb, p_admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_event_with_markets(p_event_data jsonb, p_markets_data jsonb[])
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_event_with_resolution(p_event_data jsonb, p_resolution_config jsonb, p_admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_follower_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_market_draft(p_creator_id uuid, p_market_type character varying, p_template_id character varying DEFAULT NULL::character varying, p_event_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_market_draft(p_creator_id uuid, p_market_type character varying, p_template_id character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_order_batch(p_orders jsonb, p_total_cost numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_price_alert_notification(p_user_id uuid, p_market_id uuid, p_price_change_percent numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_withdrawal_hold(p_user_id uuid, p_amount numeric, p_withdrawal_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_workflow_execution(p_workflow_type text, p_payload jsonb DEFAULT '{}'::jsonb, p_max_retries integer DEFAULT 3)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.credit_wallet(p_user_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    UPDATE wallets
    SET 
        balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user: %', p_user_id;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debit_wallet(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_balance DECIMAL;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Get current balance with lock
    SELECT balance INTO v_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    UPDATE wallets
    SET 
        balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.deploy_market_full(p_draft_id uuid, p_deployer_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.determine_rebate_tier(p_monthly_volume numeric)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_uppercase_outcome()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.outcome := UPPER(NEW.outcome::text);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.expire_order(p_order_id uuid, p_expiry_reason character varying DEFAULT 'GTD_EXPIRED'::character varying)
 RETURNS TABLE(success boolean, cancel_record_id uuid, released_collateral numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.follow_market(p_user_id uuid, p_market_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.follow_user(p_follower_id uuid, p_following_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.freeze_funds(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    RETURN FALSE; 
  END IF;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_cancellation_confirmation(p_cancel_record_id uuid)
 RETURNS TABLE(confirmation_data jsonb, signature_payload text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_event_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.generate_market_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_activity_summary(p_admin_id uuid DEFAULT NULL::uuid, p_start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(action_type character varying, action_count bigint, last_action_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_events(p_status character varying DEFAULT NULL::character varying, p_category character varying DEFAULT NULL::character varying, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, slug text, question text, description text, category character varying, subcategory character varying, tags text[], image_url text, status character varying, is_featured boolean, is_trending boolean, answer_type character varying, answer1 character varying, answer2 character varying, starts_at timestamp with time zone, trading_closes_at timestamp with time zone, resolution_method character varying, resolution_delay integer, initial_liquidity numeric, total_volume numeric, total_trades integer, unique_traders integer, current_yes_price numeric, current_no_price numeric, resolver_reference text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, market_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_ai_topics_summary()
 RETURNS TABLE(total_pending bigint, total_approved bigint, total_rejected bigint, today_generated bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'pending')::BIGINT as total_pending,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'approved')::BIGINT as total_approved,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'rejected')::BIGINT as total_rejected,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE generated_at >= CURRENT_DATE)::BIGINT as today_generated;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_categories()
 RETURNS TABLE(name text, slug text, icon text, display_order integer, is_custom boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT 
        cc.name, cc.slug, cc.icon, cc.display_order, false AS is_custom
    FROM public.custom_categories cc
    WHERE cc.is_active = TRUE
    ORDER BY cc.display_order, cc.name;
$function$
;

CREATE OR REPLACE FUNCTION public.get_batch_details(p_batch_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_events_with_resolution(p_status character varying DEFAULT NULL::character varying, p_category character varying DEFAULT NULL::character varying, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, name text, question text, category character varying, subcategory character varying, tags text[], trading_closes_at timestamp with time zone, status character varying, resolution_method character varying, resolution_status character varying, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_follow_status(p_follower_id uuid, p_following_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_legal_review_queue(p_assignee_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(draft_id uuid, question text, category character varying, risk_level character varying, priority character varying, requires_senior boolean, sensitive_topics text[], submitted_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_market_comments_threaded(p_market_id uuid, p_sort_by text DEFAULT 'score'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, market_id uuid, user_id uuid, parent_id uuid, content text, depth_level integer, is_collapsed boolean, upvotes integer, downvotes integer, score numeric, sentiment text, is_flagged boolean, is_deleted boolean, created_at timestamp with time zone, edited_at timestamp with time zone, author_reputation numeric, reply_count bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_market_prices(p_market_id uuid)
 RETURNS TABLE(yes_price numeric, no_price numeric, yes_volume bigint, no_volume bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_market_stats_summary(p_market_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_next_sequence()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_order_book_depth(p_market_id uuid, p_depth integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_orderbook(p_market_id uuid, p_outcome outcome_type, p_side order_side)
 RETURNS TABLE(price numeric, quantity bigint, total bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_orphaned_event_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
    SELECT id FROM public.orphaned_events;
$function$
;

CREATE OR REPLACE FUNCTION public.get_platform_analytics(p_period character varying DEFAULT '24h'::character varying, p_metric_type character varying DEFAULT 'trading'::character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_price_history(p_market_id uuid, p_hours integer DEFAULT 24, p_outcome text DEFAULT 'YES'::text)
 RETURNS TABLE(price numeric, volume_at_time numeric, recorded_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_weighted_expert_consensus(p_event_id uuid)
 RETURNS TABLE(outcome integer, total_weight numeric, vote_count integer, avg_confidence numeric, consensus_percentage numeric)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_market_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_trade_volume_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.hard_cancel_order(p_order_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_is_system boolean DEFAULT false)
 RETURNS TABLE(success boolean, cancel_record_id uuid, sequence_number bigint, released_collateral numeric, final_status character varying, filled_during_cancel numeric, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_agent_usage(p_agent_key text, p_tokens integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.increment_filled(p_order_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _is_admin boolean;
  _is_super_admin boolean;
BEGIN
  SELECT is_admin, is_super_admin INTO _is_admin, _is_super_admin
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN COALESCE(_is_admin, false) OR COALESCE(_is_super_admin, false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_secure()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _is_admin boolean;
  _is_super_admin boolean;
BEGIN
  SELECT is_admin, is_super_admin INTO _is_admin, _is_super_admin
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(_is_admin, false) OR COALESCE(_is_super_admin, false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.lock_dispute_bond(p_user_id uuid, p_amount numeric, p_dispute_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.lock_wallet_funds(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_available DECIMAL;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Calculate available balance (balance - locked_balance)
    SELECT balance - COALESCE(locked_balance, 0) INTO v_available
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_available IS NULL OR v_available < p_amount THEN
        RETURN FALSE;
    END IF;

    UPDATE wallets
    SET 
        locked_balance = COALESCE(locked_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_admin_action(p_admin_id uuid, p_action_type character varying, p_resource_type character varying, p_resource_id uuid, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_reason text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_workflow_id character varying DEFAULT NULL::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_entity_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_market_movement_activity(p_market_id uuid, p_user_id uuid, p_movement_type character varying, p_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_trader_activity(p_trader_id uuid, p_activity_type character varying, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.log_workflow_step(p_execution_id uuid, p_step_name text, p_step_status text, p_step_data jsonb DEFAULT '{}'::jsonb, p_error_details text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_notification_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.match_order(p_order_id uuid)
 RETURNS TABLE(matched boolean, trades_created integer, remaining_quantity bigint)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.migrate_binary_market_outcomes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.notify_market_followers_on_trade()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.notify_on_market_resolve()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.place_atomic_order(p_market_id uuid, p_side order_side, p_outcome outcome_type, p_price numeric, p_quantity bigint, p_order_type order_type DEFAULT 'limit'::order_type)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.place_order_atomic(p_user_id uuid, p_market_id uuid, p_side text, p_outcome text, p_price numeric, p_quantity numeric, p_order_type text DEFAULT 'limit'::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.populate_analytics_last_24h()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 0..23 LOOP
        PERFORM calculate_hourly_metrics(NOW() - (i || ' hours')::INTERVAL);
    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_aon_order(p_order_id uuid, p_market_id uuid, p_side character varying, p_price numeric, p_size numeric)
 RETURNS TABLE(can_proceed boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_deposit_tx(p_user_id uuid, p_amount numeric, p_txid text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_expert_vote(p_expert_id uuid, p_event_id uuid, p_vote_outcome integer, p_confidence_level numeric, p_reasoning text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_fok_order(p_order_id uuid, p_market_id uuid, p_side character varying, p_price numeric, p_size numeric)
 RETURNS TABLE(success boolean, message text, fills jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_ioc_order(p_order_id uuid, p_size numeric)
 RETURNS TABLE(filled_quantity numeric, remaining_quantity numeric, cancelled boolean, avg_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_order_with_tif(p_market_id uuid, p_user_id uuid, p_side character varying, p_price numeric, p_size numeric, p_order_type character varying DEFAULT 'LIMIT'::character varying, p_tif tif_type DEFAULT 'GTC'::tif_type, p_gtd_expiry timestamp with time zone DEFAULT NULL::timestamp with time zone, p_time_in_force character varying DEFAULT 'GTC'::character varying)
 RETURNS TABLE(order_id uuid, status character varying, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_rebate_payment(p_rebate_id uuid, p_tx_hash character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.process_trade_settlement(p_buy_order_id uuid, p_sell_order_id uuid, p_quantity bigint, p_price numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.re_enter_gtc_order(p_order_id uuid, p_new_price numeric)
 RETURNS TABLE(new_order_id uuid, preserved_priority boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reconcile_order_state(p_order_ids uuid[], p_client_last_sequence bigint DEFAULT 0)
 RETURNS TABLE(order_id uuid, current_status character varying, filled_quantity numeric, cancelled_quantity numeric, sequence_number bigint, changes_since_sequence jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_fill(p_order_id uuid, p_quantity numeric, p_price numeric, p_counterparty_order_id uuid, p_counterparty_user_id uuid, p_trade_id uuid, p_is_maker boolean DEFAULT false, p_transaction_hash character varying DEFAULT NULL::character varying)
 RETURNS TABLE(fill_id uuid, new_avg_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_liquidity_deposit(p_draft_id uuid, p_tx_hash character varying, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE market_creation_drafts SET
        liquidity_deposited = TRUE,
        liquidity_tx_hash = p_tx_hash,
        liquidity_commitment = p_amount,
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_market_deployment(p_draft_id uuid, p_market_id uuid, p_tx_hash character varying, p_deployment_config jsonb DEFAULT NULL::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_price_snapshots()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_trade_price_history()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_workflow_complete(p_workflow_run_id text, p_status character varying, p_result jsonb DEFAULT '{}'::jsonb, p_error_message text DEFAULT NULL::text, p_execution_time_ms integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.record_workflow_start(p_workflow_run_id text, p_workflow_type character varying, p_event_id uuid DEFAULT NULL::uuid, p_market_id uuid DEFAULT NULL::uuid, p_payload jsonb DEFAULT '{}'::jsonb, p_message_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_market_metrics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Refresh the materialized view concurrently so we don't block reads
  REFRESH MATERIALIZED VIEW public.market_metrics;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.refresh_price_ohlc()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.price_ohlc_1h;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reject_ai_topic(p_topic_id uuid, p_admin_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.ai_daily_topics
  SET 
    status = 'rejected',
    rejected_reason = COALESCE(p_reason, 'Rejected by admin'),
    approved_by = p_admin_id,
    approved_at = NOW()
  WHERE id = p_topic_id AND status = 'pending';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reject_deposit_v2(p_deposit_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.reject_withdrawal(p_id uuid, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.release_balance_hold(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_address text, p_network text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.resolve_market(p_event_id uuid, p_winner integer, p_resolver_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.respond_to_follow_request(p_request_id uuid, p_target_id uuid, p_approve boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.review_kyc_document(p_admin_id uuid, p_document_id uuid, p_status text, p_reason text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_users(p_query text, p_status_filter character varying DEFAULT NULL::character varying, p_kyc_filter character varying DEFAULT NULL::character varying, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, email character varying, full_name character varying, created_at timestamp with time zone, account_status character varying, verification_status character varying, total_matches bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.seed_event_orderbook(p_event_id uuid, p_initial_liquidity numeric DEFAULT 1000, p_spread numeric DEFAULT 0.02)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.settle_market(p_market_id uuid, p_winning_outcome outcome_type)
 RETURNS TABLE(users_settled integer, total_payout numeric)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.settle_market_v2(p_market_id uuid, p_winning_outcome outcome_type)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.settle_trade_cash(p_buyer_id uuid, p_seller_id uuid, p_amount numeric, p_trade_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.settle_trade_cash(p_buyer_id uuid, p_seller_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Buyer pays from locked balance
  UPDATE public.wallets 
  SET locked_balance = locked_balance - p_amount,
      version = version + 1,
      updated_at = NOW()
  WHERE user_id = p_buyer_id;

  -- Seller receives into usable balance
  UPDATE public.wallets 
  SET balance = balance + p_amount,
      version = version + 1,
      updated_at = NOW()
  WHERE user_id = p_seller_id;
END; $function$
;

CREATE OR REPLACE FUNCTION public.soft_cancel_order(p_order_id uuid, p_user_id uuid, p_client_request_id character varying DEFAULT NULL::character varying)
 RETURNS TABLE(success boolean, cancel_record_id uuid, sequence_number bigint, message text, current_status character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.start_resting_order_tracking(p_order_id uuid, p_user_id uuid, p_market_id uuid, p_side character varying, p_price numeric, p_quantity numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.stop_resting_order_tracking(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.submit_deposit_request(p_user_id uuid, p_amount numeric, p_payment_method text, p_transaction_id text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.submit_for_legal_review(p_draft_id uuid, p_submitter_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_event_name_title()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_event_title_question()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.question IS NULL THEN
    NEW.question := NEW.title;
  END IF;
  IF NEW.question IS DISTINCT FROM OLD.question AND NEW.title IS NULL THEN
    NEW.title := NEW.question;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_topic_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.test_event_creation()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_bookmark(p_market_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.toggle_market_follow(p_market_id uuid, p_notify_on_trade boolean DEFAULT false, p_notify_on_resolve boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.track_user_activity(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_seed_orderbook_on_event_activation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Seed orderbook when event status changes to 'active'
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        PERFORM seed_event_orderbook(NEW.id, NEW.initial_liquidity, 0.02);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unfollow_market(p_user_id uuid, p_market_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM market_follows 
    WHERE user_id = p_user_id AND market_id = p_market_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Not following this market');
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unfollow_user(p_follower_id uuid, p_following_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.unfreeze_funds(p_user_id uuid, p_amount numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_locked DECIMAL;
BEGIN
  SELECT locked_balance INTO v_locked
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_locked IS NULL OR v_locked < p_amount THEN
    RETURN FALSE;  -- Not enough locked funds
  END IF;

  UPDATE wallets
    SET balance        = balance + p_amount,
        locked_balance = locked_balance - p_amount,
        updated_at     = NOW()
    WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unlock_wallet_funds(p_user_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    UPDATE wallets
    SET 
        locked_balance = COALESCE(locked_balance, 0) - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Ensure locked_balance doesn't go negative
    UPDATE wallets
    SET locked_balance = GREATEST(COALESCE(locked_balance, 0), 0)
    WHERE user_id = p_user_id AND COALESCE(locked_balance, 0) < 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_admin_log_workflow(p_log_id uuid, p_workflow_status character varying, p_new_values jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE admin_activity_logs
  SET 
    workflow_status = p_workflow_status,
    new_values = COALESCE(p_new_values, new_values)
  WHERE id = p_log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_ai_settings_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_batch_on_order_fill()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_comment_like_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_comment_score()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE v_up INTEGER; v_down INTEGER;
BEGIN
    SELECT COUNT(*) FILTER (WHERE vote_type='upvote'), COUNT(*) FILTER (WHERE vote_type='downvote')
    INTO v_up, v_down FROM public.comment_votes WHERE comment_id=COALESCE(NEW.comment_id, OLD.comment_id);
    UPDATE public.market_comments SET upvotes=v_up, downvotes=v_down, score=(v_up-v_down)
    WHERE id=COALESCE(NEW.comment_id, OLD.comment_id);
    RETURN COALESCE(NEW, OLD);
END; $function$
;

CREATE OR REPLACE FUNCTION public.update_draft_stage(p_draft_id uuid, p_stage character varying, p_stage_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_event_status(p_event_id uuid, p_new_status character varying, p_admin_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_events_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_events_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_exchange_rate(p_source text DEFAULT 'binance'::text, p_usdt_to_bdt numeric DEFAULT 125.00)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_rate_id UUID;
    v_updated BOOLEAN := FALSE;
BEGIN
    -- Try to update existing rate
    UPDATE exchange_rates
    SET rate = p_usdt_to_bdt,
        updated_at = NOW()
    WHERE source = p_source
    RETURNING id INTO v_rate_id;

    -- If no row was updated, insert new rate
    IF v_rate_id IS NULL THEN
        INSERT INTO exchange_rates (source, rate, updated_at)
        VALUES (p_source, p_usdt_to_bdt, NOW())
        RETURNING id INTO v_rate_id;
        v_updated := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'source', p_source,
        'rate', p_usdt_to_bdt,
        'created', v_updated
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_expert_after_vote()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_expert_rank_tier(p_reputation_score numeric)
 RETURNS character varying
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    RETURN CASE
        WHEN p_reputation_score >= 4.0 THEN 'diamond'
        WHEN p_reputation_score >= 3.0 THEN 'platinum'
        WHEN p_reputation_score >= 2.0 THEN 'gold'
        WHEN p_reputation_score >= 1.0 THEN 'silver'
        ELSE 'bronze'
    END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_maker_volume(p_user_id uuid, p_volume numeric, p_is_maker boolean, p_spread_contribution numeric DEFAULT 0, p_resting_seconds integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_market_best_quotes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_market_on_trade()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_position(p_user_id uuid, p_market_id uuid, p_outcome outcome_type, p_quantity_delta bigint, p_price numeric)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_price_changes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_resolution_system_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_timestamp_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_unique_traders()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_workflow_status(p_execution_id uuid, p_status text, p_error_message text DEFAULT NULL::text, p_increment_retry boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.validate_event_timing()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.validate_outcome_probabilities()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.verify_and_credit_deposit_v2(p_deposit_id uuid, p_admin_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.verify_expert_vote(p_vote_id uuid, p_ai_relevance_score numeric, p_ai_feedback text, p_final_outcome integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.workflow_health_check()
 RETURNS TABLE(check_name text, status text, details text, severity text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;


-- ======== RLS POLICIES ========
CREATE POLICY "Admin logs viewable by admin only" ON public.admin_activity_logs
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))))
;
CREATE POLICY "Only admin can insert logs" ON public.admin_activity_logs
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))))
;
CREATE POLICY "ai_settings_admin_select" ON public.admin_ai_settings
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "ai_settings_admin_update" ON public.admin_ai_settings
  AS PERMISSIVE FOR UPDATE
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Authenticated users can insert audit logs" ON public.admin_audit_log
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() IS NOT NULL))
;
CREATE POLICY "Admins can view all workflow triggers" ON public.admin_workflow_triggers
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Service role can insert workflow triggers" ON public.admin_workflow_triggers
  AS PERMISSIVE FOR INSERT
  TO {service_role}
  WITH CHECK (true)
;
CREATE POLICY "Admins manage agent configs" ON public.ai_agent_configs
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "ai_topics_admin_all" ON public.ai_daily_topics
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "ai_topics_admin_select" ON public.ai_daily_topics
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Super admins can manage ai_prompts" ON public.ai_prompts
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_super_admin = true)))))
;
CREATE POLICY "Super admins can view ai_prompts" ON public.ai_prompts
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_super_admin = true)))))
;
CREATE POLICY "Super admins can manage ai_providers" ON public.ai_providers
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_super_admin = true)))))
;
CREATE POLICY "Super admins can view ai_providers" ON public.ai_providers
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_super_admin = true)))))
;
CREATE POLICY "ai_pipelines_admin_all" ON public.ai_resolution_pipelines
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "ai_pipelines_admin_select" ON public.ai_resolution_pipelines
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "ai_pipelines_insert" ON public.ai_resolution_pipelines
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.role() = 'authenticated'::text))
;
CREATE POLICY "ai_pipelines_select" ON public.ai_resolution_pipelines
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "topic_configs_admin_all" ON public.ai_topic_configs
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))
;
CREATE POLICY "topic_jobs_admin_all" ON public.ai_topic_generation_jobs
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))
;
CREATE POLICY "Admins view usage logs" ON public.ai_usage_logs
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Admins can view daily analytics" ON public.analytics_snapshots_daily
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Admins can view houry analytics" ON public.analytics_snapshots_hourly
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "bd_cricket_events_public_read" ON public.bd_cricket_events
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "bd_divisions_public_read" ON public.bd_divisions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "bd_economic_indicators_public_read" ON public.bd_economic_indicators
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "bd_news_sources_public_read" ON public.bd_news_sources
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "bd_political_events_public_read" ON public.bd_political_events
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "System can insert cancellation records" ON public.cancellation_records
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK (true)
;
CREATE POLICY "System can update cancellation records" ON public.cancellation_records
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING (true)
;
CREATE POLICY "Users can view their own cancellation records" ON public.cancellation_records
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM order_book ob
  WHERE ((ob.id = cancellation_records.order_id) AND (ob.user_id = auth.uid())))))
;
CREATE POLICY "Category settings are viewable by everyone" ON public.category_settings
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Only admins can update category settings" ON public.category_settings
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Anyone can view likes" ON public.comment_likes
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Users manage own likes" ON public.comment_likes
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "comment_likes_own_delete" ON public.comment_likes
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "comment_likes_own_insert" ON public.comment_likes
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "comment_likes_own_select" ON public.comment_likes
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "comment_likes_read_all" ON public.comment_likes
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "comments_public_read" ON public.comments
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((NOT is_deleted))
;
CREATE POLICY "comments_user_delete" ON public.comments
  AS PERMISSIVE FOR DELETE
  TO {authenticated}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "comments_user_insert" ON public.comments
  AS PERMISSIVE FOR INSERT
  TO {authenticated}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "comments_user_update" ON public.comments
  AS PERMISSIVE FOR UPDATE
  TO {authenticated}
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "Admins can manage categories" ON public.custom_categories
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Admins manage categories" ON public.custom_categories
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Public can view active categories" ON public.custom_categories
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((is_active = true))
;
CREATE POLICY "Public can view categories" ON public.custom_categories
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((is_active = true))
;
CREATE POLICY "custom_categories_admin_all" ON public.custom_categories
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "custom_categories_public_read" ON public.custom_categories
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((is_active = true))
;
CREATE POLICY "Users can insert their own attempts" ON public.deposit_attempts
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "Users can view their own attempts" ON public.deposit_attempts
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Users can create disputes" ON public.dispute_records
  AS PERMISSIVE FOR INSERT
  TO {authenticated}
  WITH CHECK ((disputed_by = auth.uid()))
;
CREATE POLICY "Users can view own disputes" ON public.dispute_records
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING (((disputed_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_pro = true))))))
;
CREATE POLICY "disputes_select_own" ON public.disputes
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((challenger_id = auth.uid()))
;
CREATE POLICY "Public can view events" ON public.events
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "events_admin_all" ON public.events
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "events_authenticated_read" ON public.events
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING (true)
;
CREATE POLICY "events_public_read" ON public.events
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying, 'resolved'::character varying])::text[])))
;
CREATE POLICY "Auth can update exchange rates" ON public.exchange_rates
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((auth.role() = 'authenticated'::text))
;
CREATE POLICY "Authenticated users can insert exchange rates" ON public.exchange_rates
  AS PERMISSIVE FOR INSERT
  TO {authenticated}
  WITH CHECK (true)
;
CREATE POLICY "Public can read exchange rates" ON public.exchange_rates
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Service role full access on exchange_rates" ON public.exchange_rates
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text))
;
CREATE POLICY "Admin can manage experts" ON public.expert_panel
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Experts are viewable by everyone" ON public.expert_panel
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((is_verified = true) AND (is_active = true)))
;
CREATE POLICY "Experts can update own profile" ON public.expert_panel
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Experts can create own votes" ON public.expert_votes
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((EXISTS ( SELECT 1
   FROM expert_panel ep
  WHERE ((ep.id = expert_votes.expert_id) AND (ep.user_id = auth.uid())))))
;
CREATE POLICY "Votes viewable by assigned experts and admin" ON public.expert_votes
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((EXISTS ( SELECT 1
   FROM expert_panel ep
  WHERE ((ep.id = expert_votes.expert_id) AND (ep.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true))))))
;
CREATE POLICY "System can insert fill records" ON public.fill_records
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK (true)
;
CREATE POLICY "Users can view their own fill records" ON public.fill_records
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM order_book ob
  WHERE ((ob.id = fill_records.order_id) AND (ob.user_id = auth.uid())))))
;
CREATE POLICY "Target users can update requests" ON public.follow_requests
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((target_id = auth.uid()))
;
CREATE POLICY "Users can create follow requests" ON public.follow_requests
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((requester_id = auth.uid()))
;
CREATE POLICY "Users can view their follow requests" ON public.follow_requests
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((requester_id = auth.uid()) OR (target_id = auth.uid())))
;
CREATE POLICY "human_review_select" ON public.human_review_queue
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((assigned_to = auth.uid()) OR ((status)::text = 'pending'::text) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true))))))
;
CREATE POLICY "Users can view their own idempotency keys" ON public.idempotency_keys
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Admins can manage KYC overrides" ON public.kyc_admin_overrides
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Admins can view and update all documents" ON public.kyc_documents
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Users can upload own documents" ON public.kyc_documents
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own documents" ON public.kyc_documents
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Admins can manage KYC settings" ON public.kyc_settings
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Admins can manage all KYC submissions" ON public.kyc_submissions
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Users can create own KYC submissions" ON public.kyc_submissions
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own KYC submissions" ON public.kyc_submissions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own rebates" ON public.maker_rebates
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own volume tracking" ON public.maker_volume_tracking
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can create manual deposits if KYC level 1" ON public.manual_deposits
  AS PERMISSIVE FOR INSERT
  TO {authenticated}
  WITH CHECK (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.status = 'active'::user_account_status) AND (user_profiles.kyc_level >= 1))))))
;
CREATE POLICY "Admin full access on drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Allow delete for creators and admins" ON public.market_creation_drafts
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING (((auth.uid() = creator_id) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true))))))
;
CREATE POLICY "Allow insert for creators" ON public.market_creation_drafts
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = creator_id))
;
CREATE POLICY "Allow read access to market_creation_drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((auth.uid() = creator_id) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))) OR ((legal_review_status)::text = 'pending'::text)))
;
CREATE POLICY "Allow update for creators and admins" ON public.market_creation_drafts
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING (((auth.uid() = creator_id) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true))))))
;
CREATE POLICY "Creators can insert own drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = creator_id))
;
CREATE POLICY "Creators can update own drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING (((auth.uid() = creator_id) OR (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true))))))
;
CREATE POLICY "Super admin full access on drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_super_admin = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_super_admin = true)))))
;
CREATE POLICY "Users can delete own drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((auth.uid() = creator_id))
;
CREATE POLICY "Users can insert own drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = creator_id))
;
CREATE POLICY "Users can update own drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((auth.uid() = creator_id))
;
CREATE POLICY "Users can view own drafts" ON public.market_creation_drafts
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = creator_id))
;
CREATE POLICY "daily_stats_read" ON public.market_daily_stats
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Anyone can view follower counts" ON public.market_followers
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Users manage own follows" ON public.market_followers
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "followers_own_delete" ON public.market_followers
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "followers_own_insert" ON public.market_followers
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "followers_own_select" ON public.market_followers
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "followers_own_update" ON public.market_followers
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "market_followers_public_count" ON public.market_followers
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Users can create their market follows" ON public.market_follows
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((user_id = auth.uid()))
;
CREATE POLICY "Users can delete their market follows" ON public.market_follows
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can view their market follows" ON public.market_follows
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Admins can manage suggestions" ON public.market_suggestions
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))
;
CREATE POLICY "Admins can manage markets" ON public.markets
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))
;
CREATE POLICY "Anyone can read markets" ON public.markets
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Public can view markets" ON public.markets
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Service role can manage markets" ON public.markets
  AS PERMISSIVE FOR ALL
  TO {service_role}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Users can view own notifications" ON public.notifications
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "notifications_own_delete" ON public.notifications
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "notifications_own_select" ON public.notifications
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "notifications_own_update" ON public.notifications
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Admins can manage oracle" ON public.oracle_verifications
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))
;
CREATE POLICY "batches_own_insert" ON public.order_batches
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "batches_own_select" ON public.order_batches
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Users can create orders if active" ON public.order_book
  AS PERMISSIVE FOR INSERT
  TO {authenticated}
  WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.status = 'active'::user_account_status))))))
;
CREATE POLICY "Users can cancel own orders" ON public.orders
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Users can create orders" ON public.orders
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "Users can view own orders" ON public.orders
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "outcomes_insert_admin" ON public.outcomes
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))))
;
CREATE POLICY "outcomes_read_all" ON public.outcomes
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "outcomes_update_admin" ON public.outcomes
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))))
;
CREATE POLICY "Allow public read" ON public.p2p_seller_cache
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Admins can view and update all payment transactions" ON public.payment_transactions
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Users can create payments" ON public.payment_transactions
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "Users can insert payment transactions" ON public.payment_transactions
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own payment transactions" ON public.payment_transactions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own payments" ON public.payment_transactions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Only admins can update platform settings" ON public.platform_settings
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Platform settings are viewable by everyone" ON public.platform_settings
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Admins can manage platform wallets" ON public.platform_wallets
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))))
;
CREATE POLICY "Public can view active platform wallets" ON public.platform_wallets
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((is_active = true))
;
CREATE POLICY "Users can view own positions" ON public.positions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Anyone can view price history" ON public.price_history
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "System can insert price history" ON public.price_history
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK (true)
;
CREATE POLICY "price_history_insert_system" ON public.price_history
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK (true)
;
CREATE POLICY "price_history_read" ON public.price_history
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "feedback_select" ON public.resolution_feedback
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))
;
CREATE POLICY "Admins can manage resolution systems" ON public.resolution_systems
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Public can view resolution systems" ON public.resolution_systems
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "resolvers_admin_all" ON public.resolvers
  AS PERMISSIVE FOR ALL
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "resolvers_public_read" ON public.resolvers
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((is_active = true))
;
CREATE POLICY "Users can view own resting orders" ON public.resting_orders
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Admins can view security events" ON public.security_events
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((auth.jwt() ->> 'role'::text) = 'admin'::text))
;
CREATE POLICY "claims_select_own" ON public.settlement_claims
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can view own spread rewards" ON public.spread_rewards
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Anyone can read trades" ON public.trades
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (true)
;
CREATE POLICY "Users can view own transactions" ON public.transactions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Admins can view workflow runs" ON public.upstash_workflow_runs
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Service role bypass workflow runs" ON public.upstash_workflow_runs
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Users manage own bookmarks" ON public.user_bookmarks
  AS PERMISSIVE FOR ALL
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "bookmarks_own_delete" ON public.user_bookmarks
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "bookmarks_own_insert" ON public.user_bookmarks
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = user_id))
;
CREATE POLICY "bookmarks_own_select" ON public.user_bookmarks
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Users can create their own follows" ON public.user_follows
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((follower_id = auth.uid()))
;
CREATE POLICY "Users can delete their own follows" ON public.user_follows
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING ((follower_id = auth.uid()))
;
CREATE POLICY "Users can view their own follows" ON public.user_follows
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((follower_id = auth.uid()) OR (following_id = auth.uid())))
;
CREATE POLICY "Admins can modify KYC profiles" ON public.user_kyc_profiles
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Admins can view all KYC" ON public.user_kyc_profiles
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Admins can view all KYC profiles" ON public.user_kyc_profiles
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Users can update own KYC profile" ON public.user_kyc_profiles
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((id = auth.uid()))
;
CREATE POLICY "Users can upsert own KYC profile" ON public.user_kyc_profiles
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((id = auth.uid()))
;
CREATE POLICY "Users can view own KYC profile" ON public.user_kyc_profiles
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((id = auth.uid()))
;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "user_profiles_self_insert" ON public.user_profiles
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK ((auth.uid() = id))
;
CREATE POLICY "user_profiles_self_select" ON public.user_profiles
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((auth.uid() = id) OR is_admin_secure()))
;
CREATE POLICY "user_profiles_self_update" ON public.user_profiles
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING (((auth.uid() = id) OR (( SELECT user_profiles_1.is_admin
   FROM user_profiles user_profiles_1
  WHERE (user_profiles_1.id = auth.uid())) = true)))
;
CREATE POLICY "Admins can modify status" ON public.user_status
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Admins can view all status" ON public.user_status
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (is_admin(auth.uid()))
;
CREATE POLICY "Users can read own data" ON public.users
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = id))
;
CREATE POLICY "Users can update own data" ON public.users
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING ((auth.uid() = id))
;
CREATE POLICY "workflows_admin_delete" ON public.verification_workflows
  AS PERMISSIVE FOR DELETE
  TO {public}
  USING (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))) AND (is_default = false)))
;
CREATE POLICY "workflows_admin_insert" ON public.verification_workflows
  AS PERMISSIVE FOR INSERT
  TO {public}
  WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true))))))
;
CREATE POLICY "workflows_admin_update" ON public.verification_workflows
  AS PERMISSIVE FOR UPDATE
  TO {public}
  USING (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true))))))
  WITH CHECK (((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))) AND (is_default = false)))
;
CREATE POLICY "workflows_view_policy" ON public.verification_workflows
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING (((enabled = true) OR ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))))))
;
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((user_id = auth.uid()))
;
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Service role bypass" ON public.wallets
  AS PERMISSIVE FOR ALL
  TO {service_role}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Users can read own wallet" ON public.wallets
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Users can view their own wallets" ON public.wallets
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((( SELECT auth.uid() AS uid) = user_id))
;
CREATE POLICY "Service role can manage verifications" ON public.withdrawal_verifications
  AS PERMISSIVE FOR ALL
  TO {service_role}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Users can view own verifications" ON public.withdrawal_verifications
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((auth.uid() = user_id))
;
CREATE POLICY "Allow all for service role" ON public.workflow_analytics_daily
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Service role bypass dlq" ON public.workflow_dlq
  AS PERMISSIVE FOR ALL
  TO {public}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Admins can view workflow executions" ON public.workflow_executions
  AS PERMISSIVE FOR SELECT
  TO {public}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND (user_profiles.is_admin = true)))))
;
CREATE POLICY "Service role can manage workflow executions" ON public.workflow_executions
  AS PERMISSIVE FOR ALL
  TO {service_role}
  USING (true)
  WITH CHECK (true)
;
CREATE POLICY "Allow admin read schedules" ON public.workflow_schedules
  AS PERMISSIVE FOR SELECT
  TO {authenticated}
  USING ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = auth.uid()) AND ((user_profiles.is_admin = true) OR (user_profiles.is_super_admin = true))))))
;
CREATE POLICY "Service role full access schedules" ON public.workflow_schedules
  AS PERMISSIVE FOR ALL
  TO {service_role}
  USING (true)
  WITH CHECK (true)
;

-- ======== TRIGGERS ========
CREATE TRIGGER trg_ai_settings_updated
  BEFORE UPDATE ON public.admin_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_settings_timestamp();

CREATE TRIGGER update_circuit_breaker_updated_at
  BEFORE UPDATE ON public.ai_circuit_breaker_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_versions_updated_at
  BEFORE UPDATE ON public.ai_model_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_updated_at
  BEFORE UPDATE ON public.ai_rate_limit_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_pipelines_updated_at
  BEFORE UPDATE ON public.ai_resolution_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_topic_config_updated_at
  BEFORE UPDATE ON public.ai_topic_configs
  FOR EACH ROW
  EXECUTE FUNCTION sync_topic_config_updated_at();

CREATE TRIGGER trg_auto_complete_cancellation
  AFTER INSERT ON public.cancellation_records
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_cancellation();

CREATE TRIGGER update_category_settings_timestamp
  BEFORE UPDATE ON public.category_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_comment_like_count
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

CREATE TRIGGER trg_comment_like_count
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

CREATE TRIGGER trg_update_comment_score
  AFTER UPDATE ON public.comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_score();

CREATE TRIGGER trg_update_comment_score
  AFTER INSERT ON public.comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_score();

CREATE TRIGGER trg_update_comment_score
  AFTER DELETE ON public.comment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_score();

CREATE TRIGGER trg_comments_edit_window
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION check_comment_edit_window();

CREATE TRIGGER trg_comments_rate_limit
  BEFORE INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION check_comment_rate_limit();

CREATE TRIGGER update_deposit_requests_updated_at
  BEFORE UPDATE ON public.deposit_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER seed_orderbook_on_event_activate
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_orderbook_on_event_activation();

CREATE TRIGGER trg_events_search_vector
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_search_vector();

CREATE TRIGGER trg_events_search_vector
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_search_vector();

CREATE TRIGGER trg_generate_event_slug
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION generate_event_slug();

CREATE TRIGGER trg_generate_event_slug
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION generate_event_slug();

CREATE TRIGGER trigger_sync_event_title_question
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_title_question();

CREATE TRIGGER trigger_sync_event_title_question
  BEFORE INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_title_question();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_timestamp();

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_cache_top_experts
  AFTER UPDATE ON public.expert_panel
  FOR EACH ROW
  EXECUTE FUNCTION cache_top_experts();

CREATE TRIGGER trigger_update_expert_stats
  AFTER INSERT ON public.expert_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_after_vote();

CREATE TRIGGER trigger_update_expert_stats
  AFTER UPDATE ON public.expert_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_after_vote();

CREATE TRIGGER check_user_eligibility_before_deposit
  BEFORE INSERT ON public.manual_deposits
  FOR EACH ROW
  EXECUTE FUNCTION check_trading_eligibility();

CREATE TRIGGER update_market_drafts_updated_at
  BEFORE UPDATE ON public.market_creation_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_templates_updated_at
  BEFORE UPDATE ON public.market_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_auto_log_resolution
  AFTER UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION auto_log_market_resolution();

CREATE TRIGGER trg_generate_market_slug
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION generate_market_slug();

CREATE TRIGGER trg_generate_market_slug
  BEFORE INSERT ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION generate_market_slug();

CREATE TRIGGER trg_markets_updated_at
  BEFORE UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION handle_market_updated_at();

CREATE TRIGGER trg_notify_resolve
  AFTER UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_market_resolve();

CREATE TRIGGER trig_audit_markets
  AFTER UPDATE ON public.markets
  FOR EACH ROW
  EXECUTE FUNCTION log_entity_change();

CREATE TRIGGER check_user_eligibility_before_order
  BEFORE INSERT ON public.order_book
  FOR EACH ROW
  EXECUTE FUNCTION check_trading_eligibility();

CREATE TRIGGER trg_update_batch_on_fill
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_on_order_fill();

CREATE TRIGGER trg_update_best_quotes
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_market_best_quotes();

CREATE TRIGGER trg_update_best_quotes
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_market_best_quotes();

CREATE TRIGGER trigger_ensure_uppercase_outcome
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_uppercase_outcome();

CREATE TRIGGER trigger_ensure_uppercase_outcome
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_uppercase_outcome();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_validate_outcome_probabilities
  AFTER UPDATE ON public.outcomes
  FOR EACH ROW
  EXECUTE FUNCTION validate_outcome_probabilities();

CREATE TRIGGER trg_validate_outcome_probabilities
  AFTER INSERT ON public.outcomes
  FOR EACH ROW
  EXECUTE FUNCTION validate_outcome_probabilities();

CREATE TRIGGER update_platform_settings_timestamp
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trigger_ensure_uppercase_outcome_positions
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_uppercase_outcome();

CREATE TRIGGER trigger_ensure_uppercase_outcome_positions
  BEFORE INSERT ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_uppercase_outcome();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_notify_followers
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_market_followers_on_trade();

CREATE TRIGGER trg_record_trade_price_history
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION record_trade_price_history();

CREATE TRIGGER trg_trades_unique_traders
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_unique_traders();

CREATE TRIGGER trg_trades_volume_update
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION handle_trade_volume_update();

CREATE TRIGGER trg_update_market_on_trade
  AFTER INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION update_market_on_trade();

CREATE TRIGGER trigger_ensure_uppercase_outcome_trades
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION ensure_uppercase_outcome();

CREATE TRIGGER trigger_ensure_uppercase_outcome_trades
  BEFORE INSERT ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION ensure_uppercase_outcome();

CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follower_notification();

CREATE TRIGGER trig_audit_user_status
  AFTER UPDATE ON public.user_status
  FOR EACH ROW
  EXECUTE FUNCTION log_entity_change();

CREATE TRIGGER trig_audit_user_status
  AFTER DELETE ON public.user_status
  FOR EACH ROW
  EXECUTE FUNCTION log_entity_change();

CREATE TRIGGER trig_audit_user_status
  AFTER INSERT ON public.user_status
  FOR EACH ROW
  EXECUTE FUNCTION log_entity_change();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_workflow_schedules_updated_at
  BEFORE UPDATE ON public.workflow_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

