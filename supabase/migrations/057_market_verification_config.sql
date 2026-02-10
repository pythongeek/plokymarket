-- ============================================
-- MARKET VERIFICATION CONFIG & ADMIN BYPASS
-- ============================================
-- Adds admin bypass flags, verification configuration,
-- and additional market creation parameters.

-- Add admin bypass columns
ALTER TABLE market_creation_drafts
  ADD COLUMN IF NOT EXISTS admin_bypass_liquidity BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_bypass_legal_review BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_bypass_simulation BOOLEAN NOT NULL DEFAULT FALSE;

-- Add verification/oracle configuration
ALTER TABLE market_creation_drafts
  ADD COLUMN IF NOT EXISTS verification_method JSONB DEFAULT '{"type": "MANUAL", "sources": []}'::jsonb,
  ADD COLUMN IF NOT EXISTS required_confirmations INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confidence_threshold DECIMAL(5,2) DEFAULT 80.00;

-- Add additional market parameters
ALTER TABLE market_creation_drafts
  ADD COLUMN IF NOT EXISTS trading_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS trading_end_type VARCHAR(20) NOT NULL DEFAULT 'date',
  ADD COLUMN IF NOT EXISTS liquidity_amount DECIMAL(20,8) NOT NULL DEFAULT 0;

-- Add constraint for trading_end_type
ALTER TABLE market_creation_drafts
  ADD CONSTRAINT chk_trading_end_type 
  CHECK (trading_end_type IN ('date', 'manual', 'event_triggered'));

-- Add constraint for required_confirmations
ALTER TABLE market_creation_drafts
  ADD CONSTRAINT chk_required_confirmations 
  CHECK (required_confirmations BETWEEN 1 AND 5);

-- Add constraint for trading_fee_percent  
ALTER TABLE market_creation_drafts
  ADD CONSTRAINT chk_trading_fee_percent
  CHECK (trading_fee_percent BETWEEN 0 AND 10);

-- ============================================
-- UPDATE deploy_market_full FUNCTION
-- ============================================
-- Creates market in production tables, respecting admin bypass flags

CREATE OR REPLACE FUNCTION deploy_market_full(
  p_draft_id UUID,
  p_deployer_id UUID
)
RETURNS UUID AS $$
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

  -- Create market in production markets table
  INSERT INTO public.markets (
    question,
    description,
    category,
    image_url,
    trading_closes_at,
    event_date,
    resolution_source,
    status,
    creator_id
  ) VALUES (
    v_draft.question,
    v_draft.description,
    COALESCE(v_draft.category, 'General'),
    v_draft.image_url,
    v_draft.resolution_deadline,
    v_draft.resolution_deadline,
    v_draft.resolution_source,
    'active',
    v_draft.creator_id
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
      -- categorical_markets table may not exist yet
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
      -- scalar_markets table may not exist yet
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the update_draft_stage function to handle new fields
CREATE OR REPLACE FUNCTION update_draft_stage(
    p_draft_id UUID,
    p_stage VARCHAR(50),
    p_stage_data JSONB
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql;
