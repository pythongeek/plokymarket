-- ============================================
-- DEPLOY MARKET WITH EVENT LINKAGE
-- ============================================
-- Updates deploy_market_full to set event_id on the created market.
-- Also adds resolution_source_type for oracle strategy selection.

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure markets table has the columns we reference
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS resolution_source_type VARCHAR(50) DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS resolution_source_url TEXT,
  ADD COLUMN IF NOT EXISTS winning_outcome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

COMMENT ON COLUMN public.markets.resolution_source_type IS 'Oracle strategy: AI, MANUAL, API, UMA, CENTRALIZED';
COMMENT ON COLUMN public.markets.winning_outcome IS 'The winning outcome after resolution';
