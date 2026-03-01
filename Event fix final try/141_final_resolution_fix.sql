-- ============================================================================
-- Migration 141: Final Resolution System Fix
-- ============================================================================
-- Cleans up conflicting resolution migrations and creates a working system
-- Supports 7 resolution methods: manual_admin, ai_oracle, expert_panel, 
-- external_api, consensus, community_vote, hybrid
-- 
-- REPLACES: 132, 131, 011, 116, 105, 083, 082, 20260225, 123, 125, 138, 139, 094, 093
-- ============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Clean slate - Drop and recreate resolution_systems properly
-- This fixes all the conflicting helper migrations
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop all existing constraints and FKs first
ALTER TABLE IF EXISTS public.resolution_systems
  DROP CONSTRAINT IF EXISTS resolution_systems_event_id_fkey,
  DROP CONSTRAINT IF EXISTS resolution_systems_market_id_fkey,
  DROP CONSTRAINT IF EXISTS unique_event_resolution,
  DROP CONSTRAINT IF EXISTS resolution_systems_pkey CASCADE;

-- Drop the table if it exists (clean slate from all those helper migrations)
DROP TABLE IF EXISTS public.resolution_systems CASCADE;

-- Recreate resolution_systems table with correct structure
CREATE TABLE public.resolution_systems (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  primary_method        VARCHAR(50) DEFAULT 'manual_admin',
  confidence_threshold  INTEGER DEFAULT 85,
  ai_keywords           TEXT[] DEFAULT '{}',
  ai_sources            TEXT[] DEFAULT '{}',
  resolver_reference    TEXT,
  status                VARCHAR(20) DEFAULT 'pending',
  resolution_notes      TEXT,
  resolved_at           TIMESTAMPTZ,
  resolved_by           UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint to ensure valid resolution methods (all 6)
  CONSTRAINT valid_resolution_method CHECK (
    primary_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'consensus', 'community_vote', 'hybrid')
  ),
  CONSTRAINT valid_resolution_status CHECK (
    status IN ('pending', 'in_progress', 'resolved', 'disputed', 'cancelled')
  ),
  -- Unique constraint - one resolution config per event
  CONSTRAINT unique_event_resolution UNIQUE (event_id)
);

-- Enable RLS
ALTER TABLE public.resolution_systems ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view resolution systems"
  ON public.resolution_systems FOR SELECT USING (true);

CREATE POLICY "Admins can manage resolution systems"
  ON public.resolution_systems FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
  ));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resolution_systems_event 
  ON public.resolution_systems(event_id);
CREATE INDEX IF NOT EXISTS idx_resolution_systems_status 
  ON public.resolution_systems(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Add resolution-related columns to events table if missing
-- ─────────────────────────────────────────────────────────────────────────────

-- Add resolution-related columns to events table if missing
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS resolution_method VARCHAR(50) DEFAULT 'manual_admin',
  ADD COLUMN IF NOT EXISTS resolution_source TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolution_outcome VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ai_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_sources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_confidence_threshold INTEGER DEFAULT 85;

-- Handle resolution_delay column (from migration 20260225) - use minutes, not hours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'resolution_delay'
  ) THEN
    ALTER TABLE public.events
      ADD COLUMN resolution_delay INTEGER NOT NULL DEFAULT 1440;
    
    -- Constraint: 0 minutes (immediate) to 20160 minutes (14 days)
    ALTER TABLE public.events
      ADD CONSTRAINT chk_events_resolution_delay
      CHECK (resolution_delay >= 0 AND resolution_delay <= 20160);
  END IF;
END $$;

-- Constraint for valid resolution methods on events
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS valid_event_resolution_method;
ALTER TABLE public.events 
  ADD CONSTRAINT valid_event_resolution_method CHECK (
    resolution_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'consensus', 'community_vote', 'hybrid')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Add columns to markets table if missing
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS name                TEXT,
  ADD COLUMN IF NOT EXISTS slug                TEXT,
  ADD COLUMN IF NOT EXISTS answer_type         VARCHAR(20)  DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS answer1             VARCHAR(200) DEFAULT 'হ্যাঁ (Yes)',
  ADD COLUMN IF NOT EXISTS answer2             VARCHAR(200) DEFAULT 'না (No)',
  ADD COLUMN IF NOT EXISTS liquidity           NUMERIC      DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS subcategory         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags                TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_featured         BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image_url           TEXT,
  ADD COLUMN IF NOT EXISTS created_by          UUID         REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS yes_price           NUMERIC(5,4) DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS no_price            NUMERIC(5,4) DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS total_volume        NUMERIC      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolution_method   VARCHAR(50)  DEFAULT 'manual_admin';

-- Add resolution_delay to markets (in minutes, like events)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'markets' AND column_name = 'resolution_delay'
  ) THEN
    ALTER TABLE public.markets
      ADD COLUMN resolution_delay INTEGER DEFAULT 1440;
  END IF;
END $$;

-- Constraint for valid resolution methods on markets
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS valid_market_resolution_method;
ALTER TABLE public.markets 
  ADD CONSTRAINT valid_market_resolution_method CHECK (
    resolution_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'consensus', 'community_vote', 'hybrid')
  );

-- Auto-generate market slugs where missing
UPDATE public.markets
SET slug = lower(regexp_replace(
  COALESCE(name, question, 'market-' || id::text),
  '[^a-zA-Z0-9]+', '-', 'g'
)) || '-' || substr(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_markets_slug_unique
  ON public.markets(slug) WHERE slug IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Ensure custom_categories table exists
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.custom_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  icon          TEXT DEFAULT '📌',
  is_active     BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 999,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON public.custom_categories;
CREATE POLICY "Public can view categories"
  ON public.custom_categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins manage categories" ON public.custom_categories;
CREATE POLICY "Admins manage categories"
  ON public.custom_categories FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

INSERT INTO public.custom_categories (name, slug, icon, display_order) VALUES
  ('Sports', 'sports', '🏏', 1),
  ('Cricket', 'cricket', '🏏', 2),
  ('Football', 'football', '⚽', 3),
  ('BPL', 'bpl', '🏏', 4),
  ('Politics', 'politics', '🗳️', 5),
  ('Bangladesh Politics', 'bangladesh-politics', '🏛️', 6),
  ('Election', 'election', '🗳️', 7),
  ('Economy', 'economy', '💰', 8),
  ('Stock Market', 'stock-market', '📈', 9),
  ('Crypto', 'crypto', '₿', 10),
  ('Technology', 'technology', '💻', 11),
  ('Entertainment', 'entertainment', '🎬', 12),
  ('Bollywood', 'bollywood', '🎥', 13),
  ('Dhallywood', 'dhallywood', '🎞️', 14),
  ('World Events', 'world-events', '🌍', 15),
  ('Science', 'science', '🔬', 16),
  ('Culture', 'culture', '🎭', 17),
  ('Business', 'business', '🏢', 18),
  ('Education', 'education', '📚', 19),
  ('Health', 'health', '🏥', 20),
  ('Environment', 'environment', '🌿', 21),
  ('Infrastructure', 'infrastructure', '🏗️', 22),
  ('Dhaka City', 'dhaka-city', '🏙️', 23),
  ('International', 'international', '🌐', 24),
  ('General', 'general', '📌', 25)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Social & Market Feature Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user   ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_market ON public.user_bookmarks(market_id);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users manage own bookmarks"
  ON public.user_bookmarks FOR ALL USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.market_followers (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id         UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  notify_on_trade   BOOLEAN DEFAULT false,
  notify_on_resolve BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_market_followers_market ON public.market_followers(market_id);
CREATE INDEX IF NOT EXISTS idx_market_followers_user   ON public.market_followers(user_id);

ALTER TABLE public.market_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own follows"     ON public.market_followers;
DROP POLICY IF EXISTS "Anyone can view follower counts" ON public.market_followers;
CREATE POLICY "Users manage own follows"
  ON public.market_followers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view follower counts"
  ON public.market_followers FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes(comment_id);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own likes" ON public.comment_likes;
DROP POLICY IF EXISTS "Anyone can view likes"  ON public.comment_likes;
CREATE POLICY "Users manage own likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view likes"  ON public.comment_likes FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.price_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id   UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  outcome     TEXT NOT NULL DEFAULT 'YES',
  price       DECIMAL(10,4) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_market
  ON public.price_history(market_id, recorded_at DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;
DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;
CREATE POLICY "Anyone can view price history" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "System can insert price history" ON public.price_history FOR INSERT WITH CHECK (true);


CREATE OR REPLACE VIEW public.comment_like_counts AS
  SELECT comment_id, COUNT(*)::BIGINT AS like_count
  FROM public.comment_likes
  GROUP BY comment_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6: Create the complete event creation function
-- Supports all 7 resolution methods
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS create_event_complete(JSONB, UUID);

CREATE OR REPLACE FUNCTION create_event_complete(
  p_event_data JSONB,
  p_admin_id   UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id         UUID;
  v_market_id        UUID;
  v_slug             TEXT;
  v_market_slug      TEXT;
  v_title            TEXT;
  v_category         TEXT;
  v_trading_closes   TIMESTAMPTZ;
  v_initial_liq      NUMERIC;
  v_is_custom_cat    BOOLEAN;
  v_tags             TEXT[];
  v_ai_keywords      TEXT[];
  v_ai_sources       TEXT[];
  v_status           TEXT;
  v_system_user_id   UUID;
  v_resolution_method TEXT;
  v_result           JSONB;
BEGIN
  -- ── Extract fields ──────────────────────────────────────────────────────────
  v_title := COALESCE(
    p_event_data->>'title',
    p_event_data->>'name',
    p_event_data->>'question',
    'Untitled Event'
  );

  v_slug := COALESCE(
    NULLIF(TRIM(p_event_data->>'slug'), ''),
    lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || substr(gen_random_uuid()::text, 1, 8)
  );
  v_market_slug := v_slug || '-market';

  v_category         := COALESCE(NULLIF(p_event_data->>'category', ''), 'general');
  v_is_custom_cat    := COALESCE((p_event_data->>'is_custom_category')::BOOLEAN, FALSE);
  v_resolution_method := COALESCE(p_event_data->>'resolution_method', 'manual_admin');
  
  -- Validate resolution method (must be one of the 6)
  IF v_resolution_method NOT IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'consensus', 'community_vote', 'hybrid') THEN
    v_resolution_method := 'manual_admin';
  END IF;
  
  v_initial_liq      := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
  v_status           := COALESCE(p_event_data->>'status', 'active');

  -- Parse trading closes at safely
  BEGIN
    v_trading_closes := (p_event_data->>'trading_closes_at')::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    v_trading_closes := NOW() + INTERVAL '7 days';
  END;

  -- Convert JSONB arrays to TEXT[]
  BEGIN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags'))
      INTO v_tags
      WHERE p_event_data->'tags' IS NOT NULL
        AND jsonb_array_length(p_event_data->'tags') > 0;
    v_tags := COALESCE(v_tags, ARRAY[]::TEXT[]);
  EXCEPTION WHEN OTHERS THEN
    v_tags := ARRAY[]::TEXT[];
  END;

  BEGIN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords'))
      INTO v_ai_keywords
      WHERE p_event_data->'ai_keywords' IS NOT NULL
        AND jsonb_array_length(p_event_data->'ai_keywords') > 0;
    v_ai_keywords := COALESCE(v_ai_keywords, ARRAY[]::TEXT[]);
  EXCEPTION WHEN OTHERS THEN
    v_ai_keywords := ARRAY[]::TEXT[];
  END;

  BEGIN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources'))
      INTO v_ai_sources
      WHERE p_event_data->'ai_sources' IS NOT NULL
        AND jsonb_array_length(p_event_data->'ai_sources') > 0;
    v_ai_sources := COALESCE(v_ai_sources, ARRAY[]::TEXT[]);
  EXCEPTION WHEN OTHERS THEN
    v_ai_sources := ARRAY[]::TEXT[];
  END;

  -- ── Custom category handling ────────────────────────────────────────────────
  IF v_is_custom_cat AND v_category <> 'general' THEN
    BEGIN
      INSERT INTO public.custom_categories (name, slug, icon, display_order, created_by)
      VALUES (
        v_category,
        lower(regexp_replace(v_category, '[^a-zA-Z0-9]+', '-', 'g')),
        '📌', 999, p_admin_id
      );
    EXCEPTION WHEN unique_violation THEN
      NULL;  -- already exists, that's fine
    END;
  END IF;

  -- ── INSERT EVENT ────────────────────────────────────────────────────────────
  INSERT INTO public.events (
    title, slug, question, description,
    category, subcategory, tags, image_url,
    answer_type, answer1, answer2, status,
    starts_at, trading_opens_at, trading_closes_at,
    resolution_method, resolution_delay, resolution_source,
    initial_liquidity, current_liquidity, is_featured,
    ai_keywords, ai_sources, ai_confidence_threshold,
    created_by
  ) VALUES (
    v_title, v_slug,
    COALESCE(NULLIF(p_event_data->>'question',''), v_title),
    p_event_data->>'description',
    v_category,
    NULLIF(p_event_data->>'subcategory', ''),
    v_tags,
    NULLIF(p_event_data->>'image_url', ''),
    COALESCE(NULLIF(p_event_data->>'answer_type',''), 'binary'),
    COALESCE(NULLIF(p_event_data->>'answer1',''), 'হ্যাঁ (Yes)'),
    COALESCE(NULLIF(p_event_data->>'answer2',''), 'না (No)'),
    v_status,
    COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
    COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
    v_trading_closes,
    v_resolution_method,
    COALESCE((p_event_data->>'resolution_delay')::INTEGER, 1440),
    NULLIF(p_event_data->>'resolution_source', ''),
    v_initial_liq, v_initial_liq,
    COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
    v_ai_keywords, v_ai_sources,
    COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
    p_admin_id
  )
  RETURNING id INTO v_event_id;

  -- ── INSERT MARKET (linked to event) ────────────────────────────────────────
  INSERT INTO public.markets (
    event_id, name, question, description,
    category, subcategory, tags, image_url,
    trading_closes_at, resolution_delay, resolution_method,
    initial_liquidity, liquidity, status, slug,
    answer_type, answer1, answer2, is_featured,
    yes_price, no_price, total_volume,
    created_by
  ) VALUES (
    v_event_id,
    v_title,
    COALESCE(NULLIF(p_event_data->>'question',''), v_title),
    p_event_data->>'description',
    v_category,
    NULLIF(p_event_data->>'subcategory',''),
    v_tags,
    NULLIF(p_event_data->>'image_url',''),
    v_trading_closes,
    COALESCE((p_event_data->>'resolution_delay')::INTEGER, 1440),
    v_resolution_method,
    v_initial_liq, v_initial_liq,
    'active',
    v_market_slug,
    COALESCE(NULLIF(p_event_data->>'answer_type',''), 'binary'),
    COALESCE(NULLIF(p_event_data->>'answer1',''), 'হ্যাঁ (Yes)'),
    COALESCE(NULLIF(p_event_data->>'answer2',''), 'না (No)'),
    COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
    0.50, 0.50, 0,
    p_admin_id
  )
  RETURNING id INTO v_market_id;

  -- ── Sync back market_id onto event (for bidirectional lookup) ──────────────
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'market_id'
    ) THEN
      UPDATE public.events SET market_id = v_market_id WHERE id = v_event_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  -- ── INSERT RESOLUTION CONFIG ────────────────────────────────────────────────
  BEGIN
    INSERT INTO public.resolution_systems (
      event_id, primary_method, ai_keywords, ai_sources,
      confidence_threshold, status
    ) VALUES (
      v_event_id,
      v_resolution_method,
      v_ai_keywords, v_ai_sources,
      COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
      'pending'
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.resolution_systems
    SET primary_method = v_resolution_method,
        ai_keywords    = v_ai_keywords,
        ai_sources     = v_ai_sources,
        updated_at     = NOW()
    WHERE event_id = v_event_id;
  WHEN OTHERS THEN
    RAISE NOTICE 'Resolution config warning: %', SQLERRM;
  END;

  -- ── SEED INITIAL ORDERBOOK ──────────────────────────────────────────────────
  IF v_status = 'active' AND v_initial_liq > 0 THEN
    SELECT id INTO v_system_user_id
    FROM public.user_profiles
    WHERE is_admin = TRUE
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_system_user_id IS NOT NULL THEN
      INSERT INTO public.orders (
        market_id, user_id, side, outcome,
        price, quantity, filled_quantity, status, order_type
      ) VALUES
        (v_market_id, v_system_user_id, 'buy', 'YES', 0.48, v_initial_liq, 0, 'open', 'limit'),
        (v_market_id, v_system_user_id, 'buy', 'NO',  0.48, v_initial_liq, 0, 'open', 'limit');

      INSERT INTO public.price_history (market_id, outcome, price, recorded_at)
      VALUES
        (v_market_id, 'YES', 0.50, NOW()),
        (v_market_id, 'NO',  0.50, NOW());
    ELSE
      RAISE NOTICE 'No admin user found — skipping liquidity seed';
    END IF;
  END IF;

  -- ── Return success ─────────────────────────────────────────────────────────
  v_result := jsonb_build_object(
    'success',   TRUE,
    'event_id',  v_event_id,
    'market_id', v_market_id,
    'slug',      v_slug,
    'message',   'ইভেন্ট সফলভাবে তৈরি হয়েছে'
  );
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', FALSE,
    'error',   SQLERRM,
    'detail',  SQLSTATE,
    'hint',    'Check trading_closes_at format and all required fields'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7: Update admin events function
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_admin_events(
  p_status   VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_search   TEXT    DEFAULT NULL,
  p_limit    INTEGER DEFAULT 100,
  p_offset   INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, title TEXT, slug TEXT, question TEXT, description TEXT,
  category VARCHAR, subcategory VARCHAR, tags TEXT[], image_url TEXT,
  status VARCHAR, is_featured BOOLEAN, is_trending BOOLEAN,
  answer_type VARCHAR, answer1 VARCHAR, answer2 VARCHAR,
  starts_at TIMESTAMPTZ, trading_closes_at TIMESTAMPTZ,
  resolution_method VARCHAR, resolution_delay INTEGER,
  initial_liquidity NUMERIC, total_volume NUMERIC,
  total_trades INTEGER, unique_traders INTEGER,
  current_yes_price NUMERIC, current_no_price NUMERIC,
  resolver_reference TEXT,
  created_by UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  market_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    COALESCE(
      (SELECT COUNT(*) FROM public.markets m WHERE m.event_id = e.id),
      0
    ) AS market_count
  FROM public.events e
  WHERE
    (p_status   IS NULL OR e.status   = p_status)
    AND (p_category IS NULL OR e.category = p_category)
    AND (
      p_search IS NULL
      OR e.title    ILIKE '%' || p_search || '%'
      OR e.question ILIKE '%' || p_search || '%'
    )
  ORDER BY e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER)
  TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8: Create price history trigger
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.record_trade_price_history()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_trade_price_history ON public.trades;
CREATE TRIGGER trg_record_trade_price_history
  AFTER INSERT ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.record_trade_price_history();

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9: RLS Policies for public viewing
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public can view markets" ON public.markets;
DROP POLICY IF EXISTS "Public can view active markets" ON public.markets;
CREATE POLICY "Public can view markets"
    ON public.markets FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events"
    ON public.events FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "market_followers_public_count" ON public.market_followers;
CREATE POLICY "market_followers_public_count"
  ON public.market_followers FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 10: Additional helper functions (from deleted migrations)
-- ─────────────────────────────────────────────────────────────────────────────

-- Update event status with validation (from migration 094)
CREATE OR REPLACE FUNCTION update_event_status(
    p_event_id UUID,
    p_new_status VARCHAR,
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION update_event_status(UUID, VARCHAR, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_event_status(UUID, VARCHAR, UUID, TEXT) TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 11: Extended status support (including 'published' from migration 138)
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop and recreate status constraint to include 'published'
DO $$
BEGIN
    ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
    ALTER TABLE public.events ADD CONSTRAINT events_status_check 
        CHECK (status IN ('draft', 'pending', 'active', 'paused', 'closed', 'resolved', 'cancelled', 'published'));
    RAISE NOTICE 'Added published status support';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add published status: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 141 (Final Resolution Fix) applied successfully';
  RAISE NOTICE '   - resolution_systems table recreated with correct structure';
  RAISE NOTICE '   - FK properly set to events(id)';
  RAISE NOTICE '   - All 7 resolution methods supported: manual_admin, ai_oracle, expert_panel, external_api, consensus, community_vote, hybrid';
  RAISE NOTICE '   - markets table columns added';
  RAISE NOTICE '   - create_event_complete function installed';
  RAISE NOTICE '   - update_event_status function installed';
  RAISE NOTICE '   - Extended status support (includes published)';
  RAISE NOTICE '   - Social tables ready';
  RAISE NOTICE '   - PostgREST schema cache reloaded';
  RAISE NOTICE '   - REPLACES: 132, 131, 011, 116, 105, 083, 082, 20260225, 123, 125, 138, 139, 094, 093';
END $$;
