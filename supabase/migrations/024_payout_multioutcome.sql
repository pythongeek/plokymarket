-- ============================================
-- Payout System, Token Burn, and Multi-Outcome Markets
-- ============================================

-- Payout calculations with tax tracking
CREATE TABLE payout_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  
  -- Position details
  shares_redeemed DECIMAL(24,8) NOT NULL,
  outcome_redeemed VARCHAR(50) NOT NULL,
  
  -- Financial amounts
  gross_payout DECIMAL(24,8) NOT NULL,
  platform_fee DECIMAL(24,8) NOT NULL,
  withholding_tax DECIMAL(24,8) DEFAULT 0,
  vat_amount DECIMAL(24,8) DEFAULT 0,
  net_payout DECIMAL(24,8) NOT NULL,
  
  -- Tax documentation
  cost_basis DECIMAL(24,8),
  holding_period_days INTEGER,
  taxable_gain DECIMAL(24,8),
  tax_form_generated BOOLEAN DEFAULT false,
  nbr_reporting_required BOOLEAN DEFAULT false,
  
  -- Distribution
  distribution_method VARCHAR(20) CHECK (distribution_method IN ('immediate', 'reinvest', 'hold')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'held', 'reinvested')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  held_at TIMESTAMPTZ,
  reinvested_at TIMESTAMPTZ,
  
  -- Blockchain
  transaction_hash VARCHAR(66),
  block_number INTEGER,
  
  CONSTRAINT positive_payout CHECK (gross_payout >= 0)
);

-- Token burn events
CREATE TABLE burn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) UNIQUE NOT NULL,
  market_id UUID NOT NULL REFERENCES markets(id),
  outcome VARCHAR(50) NOT NULL,
  quantity DECIMAL(24,8) NOT NULL,
  
  -- Burn type
  burn_type VARCHAR(20) CHECK (burn_type IN ('logical', 'physical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  
  -- Blockchain (for physical burns)
  transaction_hash VARCHAR(66),
  block_number INTEGER,
  burn_address VARCHAR(42),
  
  -- Trigger and metadata
  triggered_by VARCHAR(50) CHECK (triggered_by IN ('market_resolution', 'expiration_sweep', 'admin')),
  sweep_fee DECIMAL(24,8) DEFAULT 0,
  treasury_allocation DECIMAL(24,8) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT positive_burn CHECK (quantity > 0)
);

-- Categorical markets (2-20 outcomes)
CREATE TABLE categorical_markets (
  id UUID PRIMARY KEY REFERENCES markets(id) ON DELETE CASCADE,
  
  -- Outcome configuration
  outcome_count INTEGER NOT NULL CHECK (outcome_count BETWEEN 2 AND 20),
  outcome_names TEXT[] NOT NULL,
  outcome_symbols TEXT[], -- Optional token symbols
  
  -- Resolution
  winning_outcome_index INTEGER CHECK (winning_outcome_index IS NULL OR (winning_outcome_index >= 0 AND winning_outcome_index < outcome_count)),
  
  -- Liquidity
  liquidity_mechanism VARCHAR(20) DEFAULT 'cpmm' CHECK (liquidity_mechanism IN ('cpmm', 'orderbook', 'amm')),
  
  -- Validation
  invalid_market_detected BOOLEAN DEFAULT false,
  invalid_reason TEXT,
  
  -- Price normalization (ensures Σ = $1.00)
  price_normalization_active BOOLEAN DEFAULT true,
  last_price_sync TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scalar markets (continuous range)
CREATE TABLE scalar_markets (
  id UUID PRIMARY KEY REFERENCES markets(id) ON DELETE CASCADE,
  
  -- Bounds
  lower_bound DECIMAL(24,8) NOT NULL,
  upper_bound DECIMAL(24,8) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- '%', 'BDT', 'runs', '°C', etc.
  
  -- Resolution
  resolved_value DECIMAL(24,8),
  
  -- Bounds management
  bounds_adjusted_at TIMESTAMPTZ,
  bounds_changed_via_vote BOOLEAN DEFAULT false,
  
  -- Liquidity concentration
  current_price DECIMAL(24,8),
  
  CONSTRAINT valid_bounds CHECK (lower_bound < upper_bound),
  CONSTRAINT resolved_in_bounds CHECK (
    resolved_value IS NULL OR 
    (resolved_value >= lower_bound AND resolved_value <= upper_bound)
  )
);

-- Scalar position types
CREATE TYPE scalar_position_type AS ENUM ('long', 'short');

-- LP positions for multi-outcome markets
CREATE TABLE lp_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Liquidity details
  token_amounts DECIMAL(24,8)[] NOT NULL, -- Amount per outcome
  lp_tokens_received DECIMAL(24,8) NOT NULL,
  
  -- For scalar markets
  price_range_lower DECIMAL(24,8),
  price_range_upper DECIMAL(24,8),
  
  -- Fees earned
  fees_earned DECIMAL(24,8) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  
  UNIQUE(market_id, user_id, created_at)
);

-- Bounds change proposals (for scalar markets post-trading)
CREATE TABLE bounds_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES scalar_markets(id),
  proposer VARCHAR(42) NOT NULL,
  
  -- Proposed bounds
  new_lower DECIMAL(24,8) NOT NULL,
  new_upper DECIMAL(24,8) NOT NULL,
  
  -- Voting
  status VARCHAR(20) DEFAULT 'voting' CHECK (status IN ('voting', 'executed', 'rejected', 'expired')),
  votes_for DECIMAL(24,8) DEFAULT 0,
  votes_against DECIMAL(24,8) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deadline_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_proposed_bounds CHECK (new_lower < new_upper)
);

-- Bounds votes
CREATE TABLE bounds_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES bounds_proposals(id),
  voter VARCHAR(42) NOT NULL,
  vote VARCHAR(10) CHECK (vote IN ('for', 'against')),
  shares DECIMAL(24,8) NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(proposal_id, voter)
);

-- Treasury transfers
CREATE TABLE treasury_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id),
  amount DECIMAL(24,8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BDT',
  reason VARCHAR(50) NOT NULL, -- 'expiration_sweep_fee', 'platform_fee', etc.
  transferred_at TIMESTAMPTZ DEFAULT NOW(),
  transaction_hash VARCHAR(66)
);

-- Indexes for performance
CREATE INDEX idx_payout_calculations_user ON payout_calculations(user_id);
CREATE INDEX idx_payout_calculations_market ON payout_calculations(market_id);
CREATE INDEX idx_payout_calculations_year ON payout_calculations(DATE_PART('year', created_at));
CREATE INDEX idx_burn_events_market ON burn_events(market_id);
CREATE INDEX idx_burn_events_status ON burn_events(status);
CREATE INDEX idx_lp_positions_market ON lp_positions(market_id);
CREATE INDEX idx_lp_positions_user ON lp_positions(user_id);
CREATE INDEX idx_bounds_proposals_market ON bounds_proposals(market_id);
CREATE INDEX idx_bounds_votes_proposal ON bounds_votes(proposal_id);

-- Update markets table with new columns
ALTER TABLE markets 
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'binary' CHECK (type IN ('binary', 'categorical', 'scalar')),
  ADD COLUMN IF NOT EXISTS sweep_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trading_started BOOLEAN DEFAULT false;

-- Update positions table
ALTER TABLE positions
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'burned')),
  ADD COLUMN IF NOT EXISTS burned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS burn_event_id UUID REFERENCES burn_events(id),
  ADD COLUMN IF NOT EXISTS burn_tx_hash VARCHAR(66);

-- Functions for bounds voting
CREATE OR REPLACE FUNCTION update_bounds_votes(
  p_proposal UUID,
  p_shares DECIMAL,
  p_vote VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
  IF p_vote = 'for' THEN
    UPDATE bounds_proposals 
    SET votes_for = votes_for + p_shares
    WHERE id = p_proposal;
  ELSE
    UPDATE bounds_proposals 
    SET votes_against = votes_against + p_shares
    WHERE id = p_proposal;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get total market shares
CREATE OR REPLACE FUNCTION get_market_total_shares(p_market UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(shares), 0)
  INTO total
  FROM positions
  WHERE market_id = p_market;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to credit user balance (for reinvestment)
CREATE OR REPLACE FUNCTION credit_user_balance(
  p_user UUID,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET platform_balance = COALESCE(platform_balance, 0) + p_amount
  WHERE id = p_user;
END;
$$ LANGUAGE plpgsql;

-- Function to lock creator liquidity
CREATE OR REPLACE FUNCTION lock_creator_liquidity(
  p_creator VARCHAR(42),
  p_amount DECIMAL,
  p_market UUID
)
RETURNS VOID AS $$
BEGIN
  -- In production: Lock tokens in escrow
  -- For now, just record the commitment
  INSERT INTO creator_liquidity_commitments (
    creator_address,
    market_id,
    amount,
    locked_at
  ) VALUES (
    p_creator,
    p_market,
    p_amount,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Creator liquidity commitments table
CREATE TABLE IF NOT EXISTS creator_liquidity_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_address VARCHAR(42) NOT NULL,
  market_id UUID NOT NULL REFERENCES markets(id),
  amount DECIMAL(24,8) NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  released_reason VARCHAR(50)
);

-- Comments
COMMENT ON TABLE payout_calculations IS 'Tracks all payout calculations with tax documentation';
COMMENT ON TABLE burn_events IS 'Token burn events for losing positions and expired markets';
COMMENT ON TABLE categorical_markets IS 'Multi-outcome markets with 2-20 discrete outcomes';
COMMENT ON TABLE scalar_markets IS 'Continuous range markets with lower/upper bounds';
COMMENT ON TABLE lp_positions IS 'Liquidity provider positions for multi-outcome AMMs';
