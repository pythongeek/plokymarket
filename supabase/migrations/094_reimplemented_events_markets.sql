-- ===============================================
-- REIMPLEMENTED EVENTS & MARKETS SYSTEM
-- Migration 094 - Production-Ready Schema
-- Bangladesh Context Optimized
-- ===============================================

-- 1. Drop old events table (from 059) and recreate with comprehensive schema
-- We use CASCADE to drop dependent objects, then recreate properly
DROP TABLE IF EXISTS public.events CASCADE;

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Identity
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    question TEXT NOT NULL,
    description TEXT,
    ticker VARCHAR(20),
    
    -- Category & Metadata
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- Visual Assets
    image_url TEXT,
    thumbnail_url TEXT,
    banner_url TEXT,
    
    -- Status Management
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending', 'active', 'paused', 'closed', 'resolved', 'cancelled')),
    
    -- Visibility Flags
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Answer Options
    answer1 VARCHAR(200) DEFAULT 'হ্যাঁ (Yes)',
    answer2 VARCHAR(200) DEFAULT 'না (No)',
    answer_type VARCHAR(20) DEFAULT 'binary'
        CHECK (answer_type IN ('binary', 'multiple', 'scalar')),
    
    -- Time Management  
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    trading_opens_at TIMESTAMPTZ DEFAULT NOW(),
    trading_closes_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Resolution Configuration
    resolution_source TEXT,
    resolution_method VARCHAR(50) DEFAULT 'manual_admin'
        CHECK (resolution_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'community_vote', 'hybrid')),
    resolution_delay_hours INTEGER DEFAULT 24 CHECK (resolution_delay_hours >= 0 AND resolution_delay_hours <= 720),
    resolved_outcome INTEGER CHECK (resolved_outcome IN (1, 2)),
    resolved_by UUID REFERENCES auth.users(id),
    winning_token VARCHAR(100),
    
    -- Financial Tracking
    initial_liquidity NUMERIC DEFAULT 1000 CHECK (initial_liquidity >= 0),
    current_liquidity NUMERIC DEFAULT 1000 CHECK (current_liquidity >= 0),
    total_volume NUMERIC DEFAULT 0 CHECK (total_volume >= 0),
    total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
    unique_traders INTEGER DEFAULT 0 CHECK (unique_traders >= 0),
    
    -- Pricing Snapshot
    current_yes_price NUMERIC(5, 4) DEFAULT 0.5000,
    current_no_price NUMERIC(5, 4) DEFAULT 0.5000,
    price_24h_change NUMERIC(5, 4) DEFAULT 0.0000,
    
    -- Blockchain Integration 
    condition_id VARCHAR(100),
    token1 VARCHAR(100),
    token2 VARCHAR(100),
    neg_risk BOOLEAN DEFAULT FALSE,
    
    -- Pause Control
    pause_reason TEXT,
    paused_at TIMESTAMPTZ,
    paused_by UUID REFERENCES auth.users(id),
    estimated_resume_at TIMESTAMPTZ,
    
    -- AI Oracle Config (embedded for convenience)
    ai_keywords TEXT[] DEFAULT '{}',
    ai_sources TEXT[] DEFAULT '{}',
    ai_confidence_threshold INTEGER DEFAULT 85 CHECK (ai_confidence_threshold BETWEEN 50 AND 99),
    
    -- Audit Trail
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Full-Text Search
    search_vector TSVECTOR
);

-- 2. Ensure markets table has event_id FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'markets' AND column_name = 'event_id'
    ) THEN
        ALTER TABLE public.markets ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON public.events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_is_trending ON public.events(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_trading_closes ON public.events(trading_closes_at);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_events_search ON public.events USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- Re-create markets event_id index
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON public.markets(event_id);

-- 4. RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read access to active events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;

-- Public can view active, closed, and resolved events
CREATE POLICY "events_public_read"
    ON public.events
    FOR SELECT
    USING (status IN ('active', 'closed', 'resolved'));

-- Authenticated users can view pending events too
CREATE POLICY "events_authenticated_read"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (true);

-- Admins can do everything
CREATE POLICY "events_admin_all"
    ON public.events
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ));

-- 5. Search Vector Trigger
CREATE OR REPLACE FUNCTION update_events_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_search_vector ON public.events;
CREATE TRIGGER trg_events_search_vector
    BEFORE INSERT OR UPDATE OF title, question, description, category, tags
    ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_events_search_vector();

-- 6. Updated_at Trigger    
CREATE OR REPLACE FUNCTION update_events_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_events_timestamp();

-- 7. Admin Functions

-- Create complete event with resolution config
CREATE OR REPLACE FUNCTION create_event_complete(
    p_event_data JSONB,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_market_id UUID;
    v_slug TEXT;
    v_result JSONB;
    v_initial_liquidity NUMERIC;
    v_system_user_id UUID;
BEGIN
    -- Generate slug if not provided, preferring the explicit one from the payload
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(COALESCE(p_event_data->>'title', p_event_data->>'question'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    
    -- Insert event
    INSERT INTO public.events (
        title,
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
        COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'),
        v_slug,
        COALESCE(p_event_data->>'question', p_event_data->>'title'),
        p_event_data->>'description',
        COALESCE(p_event_data->>'category', 'general'),
        p_event_data->>'subcategory',
        COALESCE((p_event_data->'tags')::TEXT[], '{}'),
        p_event_data->>'image_url',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE(p_event_data->>'status', 'pending'),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        p_event_data->>'resolution_source',
        v_initial_liquidity,
        v_initial_liquidity,
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        COALESCE((p_event_data->'ai_keywords')::TEXT[], '{}'),
        COALESCE((p_event_data->'ai_sources')::TEXT[], '{}'),
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- Also create a linked market record for CLOB compatibility
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
        COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'),
        COALESCE(p_event_data->>'question', p_event_data->>'title'),
        p_event_data->>'description',
        COALESCE(p_event_data->>'category', 'general'),
        p_event_data->>'subcategory',
        COALESCE((p_event_data->'tags')::TEXT[], '{}'),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        'active',
        v_slug,
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        p_admin_id,
        p_event_data->>'image_url'
    )
    RETURNING id INTO v_market_id;
    
    -- Create resolution config if resolution_systems table exists
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
        COALESCE((p_event_data->'ai_keywords')::TEXT[], '{}'),
        COALESCE((p_event_data->'ai_sources')::TEXT[], '{}'),
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        'pending'
    );
    
    -- INITIALIZE ORDERBOOK (Replaces MarketService.initializeOrderbook logic)
    -- Only seed if the market is effectively active
    IF COALESCE(p_event_data->>'status', 'pending') = 'active' AND v_initial_liquidity > 0 THEN
        -- Find the system admin user to act as liquidity provider
        SELECT id INTO v_system_user_id
        FROM public.user_profiles
        WHERE is_admin = true
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_system_user_id IS NOT NULL THEN
            -- Strategy: 0.48 YES Bid, 0.48 NO Bid (Total 0.96, 4% Platform Spread)
            INSERT INTO public.orders (
                market_id,
                user_id,
                side,
                outcome,
                price,
                quantity,
                filled_quantity,
                status,
                order_type
            ) VALUES 
            (v_market_id, v_system_user_id, 'buy', 'YES', 0.48, v_initial_liquidity, 0, 'open', 'limit'),
            (v_market_id, v_system_user_id, 'buy', 'NO', 0.48, v_initial_liquidity, 0, 'open', 'limit');
        ELSE
            -- We cannot seed without an admin user, but we won't abort market creation here.
            RAISE WARNING 'No admin user found to seed market liquidity';
        END IF;
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully'
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

-- Get events for admin with market counts
-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_admin_events(
    p_status VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    question TEXT,
    description TEXT,
    category VARCHAR,
    subcategory VARCHAR,
    tags TEXT[],
    image_url TEXT,
    status VARCHAR,
    is_featured BOOLEAN,
    is_trending BOOLEAN,
    answer_type VARCHAR,
    answer1 VARCHAR,
    answer2 VARCHAR,
    starts_at TIMESTAMPTZ,
    trading_closes_at TIMESTAMPTZ,
    resolution_method VARCHAR,
    resolution_delay_hours INTEGER,
    initial_liquidity NUMERIC,
    total_volume NUMERIC,
    total_trades INTEGER,
    unique_traders INTEGER,
    current_yes_price NUMERIC,
    current_no_price NUMERIC,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    market_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.slug,
        e.question,
        e.description,
        e.category,
        e.subcategory,
        e.tags,
        e.image_url,
        e.status,
        e.is_featured,
        e.is_trending,
        e.answer_type,
        e.answer1,
        e.answer2,
        e.starts_at,
        e.trading_closes_at,
        e.resolution_method,
        e.resolution_delay_hours,
        e.initial_liquidity,
        e.total_volume,
        e.total_trades,
        e.unique_traders,
        e.current_yes_price,
        e.current_no_price,
        e.created_by,
        e.created_at,
        e.updated_at,
        COALESCE((SELECT COUNT(*) FROM public.markets m WHERE m.event_id = e.id), 0) as market_count
    FROM public.events e
    WHERE 
        (p_status IS NULL OR e.status = p_status)
        AND (p_category IS NULL OR e.category = p_category)
        AND (p_search IS NULL OR e.search_vector @@ plainto_tsquery('english', p_search)
             OR e.title ILIKE '%' || p_search || '%'
             OR e.question ILIKE '%' || p_search || '%')
    ORDER BY e.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Update event status with validation
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
    v_result JSONB;
BEGIN
    SELECT status INTO v_current_status FROM public.events WHERE id = p_event_id;
    
    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Event not found');
    END IF;
    
    -- Status transition validation
    IF p_new_status = 'active' AND v_current_status NOT IN ('draft', 'pending', 'paused') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Cannot activate from status: ' || v_current_status);
    END IF;
    
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
        UPDATE public.events SET
            status = p_new_status
        WHERE id = p_event_id;
    END IF;
    
    RETURN jsonb_build_object('success', TRUE, 'message', 'Status updated to ' || p_new_status);
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- 8. Comments
COMMENT ON TABLE public.events IS 'Core events table for prediction market event containers';
COMMENT ON FUNCTION create_event_complete IS 'Creates event with linked market and resolution config atomically';
COMMENT ON FUNCTION get_admin_events IS 'Paginated admin event listing with market counts and search';
COMMENT ON FUNCTION update_event_status IS 'Updates event status with transition validation';
