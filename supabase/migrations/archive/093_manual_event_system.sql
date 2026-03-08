-- ===============================================
-- Manual Event Creation System Migration
-- Bangladesh Context Optimized
-- ===============================================

-- 1. Markets Table Extensions (if not exists)
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'subcategory') THEN
    ALTER TABLE markets ADD COLUMN subcategory VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'tags') THEN
    ALTER TABLE markets ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'resolution_delay_hours') THEN
    ALTER TABLE markets ADD COLUMN resolution_delay_hours INTEGER DEFAULT 24;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'initial_liquidity') THEN
    ALTER TABLE markets ADD COLUMN initial_liquidity NUMERIC DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'slug') THEN
    ALTER TABLE markets ADD COLUMN slug VARCHAR(100) UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'answer_type') THEN
    ALTER TABLE markets ADD COLUMN answer_type VARCHAR(20) DEFAULT 'binary';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'answer1') THEN
    ALTER TABLE markets ADD COLUMN answer1 VARCHAR(100) DEFAULT 'হ্যাঁ (Yes)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'answer2') THEN
    ALTER TABLE markets ADD COLUMN answer2 VARCHAR(100) DEFAULT 'না (No)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'is_featured') THEN
    ALTER TABLE markets ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'created_by') THEN
    ALTER TABLE markets ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 2. Resolution Systems Table
CREATE TABLE IF NOT EXISTS resolution_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  -- Resolution Method
  primary_method VARCHAR(50) DEFAULT 'manual_admin' 
    CHECK (primary_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api')),
  
  -- AI Oracle Config
  ai_keywords TEXT[] DEFAULT '{}',
  ai_sources TEXT[] DEFAULT '{}',
  confidence_threshold INTEGER DEFAULT 85 CHECK (confidence_threshold BETWEEN 70 AND 99),
  
  -- Expert Panel Config
  expert_panel_id UUID,
  min_expert_votes INTEGER DEFAULT 3,
  
  -- External API Config
  external_api_endpoint TEXT,
  external_api_key TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_event_resolution UNIQUE (event_id)
);

-- 3. AI Resolution Pipelines Table
CREATE TABLE IF NOT EXISTS ai_resolution_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  pipeline_id VARCHAR(100),
  
  -- Query Data
  query JSONB,
  retrieval_output JSONB,
  synthesis_output JSONB,
  deliberation_output JSONB,
  explanation_output JSONB,
  
  -- Results
  final_outcome VARCHAR(10),
  final_confidence NUMERIC(5, 2),
  confidence_level VARCHAR(20),
  recommended_action VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'running' 
    CHECK (status IN ('running', 'completed', 'failed', 'paused')),
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_execution_time_ms INTEGER,
  
  -- Model Info
  synthesis_model_version TEXT,
  deliberation_model_version TEXT,
  explanation_model_version TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_subcategory ON markets(subcategory);
CREATE INDEX IF NOT EXISTS idx_markets_tags ON markets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_markets_created_by ON markets(created_by);
CREATE INDEX IF NOT EXISTS idx_markets_is_featured ON markets(is_featured) WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_resolution_systems_event ON resolution_systems(event_id);
CREATE INDEX IF NOT EXISTS idx_resolution_systems_method ON resolution_systems(primary_method);
CREATE INDEX IF NOT EXISTS idx_resolution_systems_status ON resolution_systems(status);

CREATE INDEX IF NOT EXISTS idx_ai_pipelines_market ON ai_resolution_pipelines(market_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_status ON ai_resolution_pipelines(status);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_pipeline_id ON ai_resolution_pipelines(pipeline_id);

-- 5. RLS Policies

-- Resolution Systems Policies
DROP POLICY IF EXISTS "resolution_systems_admin" ON resolution_systems;
CREATE POLICY "resolution_systems_admin"
  ON resolution_systems FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- AI Pipelines Policies
DROP POLICY IF EXISTS "ai_pipelines_admin_select" ON ai_resolution_pipelines;
DROP POLICY IF EXISTS "ai_pipelines_admin_all" ON ai_resolution_pipelines;

CREATE POLICY "ai_pipelines_admin_select"
  ON ai_resolution_pipelines FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "ai_pipelines_admin_all"
  ON ai_resolution_pipelines FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- 6. Functions

-- Update resolution_systems timestamp
CREATE OR REPLACE FUNCTION update_resolution_system_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resolution_system_updated ON resolution_systems;
CREATE TRIGGER trg_resolution_system_updated
  BEFORE UPDATE ON resolution_systems
  FOR EACH ROW EXECUTE FUNCTION update_resolution_system_timestamp();

-- Create event with resolution config
CREATE OR REPLACE FUNCTION create_event_with_resolution(
  p_event_data JSONB,
  p_resolution_config JSONB,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    event_id,
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

-- Get events with resolution status
CREATE OR REPLACE FUNCTION get_events_with_resolution(
  p_status VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  category VARCHAR,
  subcategory VARCHAR,
  tags TEXT[],
  trading_closes_at TIMESTAMPTZ,
  status VARCHAR,
  resolution_method VARCHAR,
  resolution_status VARCHAR,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.question,
    m.category,
    m.subcategory,
    m.tags,
    m.trading_closes_at,
    m.status,
    rs.primary_method as resolution_method,
    rs.status as resolution_status,
    m.created_at
  FROM markets m
  LEFT JOIN resolution_systems rs ON rs.market_id = m.id
  WHERE 
    (p_status IS NULL OR m.status = p_status)
    AND (p_category IS NULL OR m.category = p_category)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 7. Comments
COMMENT ON TABLE resolution_systems IS 'Event resolution configuration and status';
COMMENT ON TABLE ai_resolution_pipelines IS 'AI analysis pipeline results for event resolution';
COMMENT ON FUNCTION create_event_with_resolution IS 'Creates event with resolution config in single transaction';
COMMENT ON FUNCTION get_events_with_resolution IS 'Returns events with their resolution status';
