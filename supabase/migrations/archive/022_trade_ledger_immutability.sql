-- ============================================
-- TRADE LEDGER IMMUTABILITY & STP SYSTEM
-- Cryptographic Chaining, Settlement Queue, Self-Trade Prevention
-- ============================================

-- ============================================
-- 1. IMMUTABLE TRADE LEDGER
-- ============================================

CREATE TABLE trade_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trade reference
  trade_id UUID NOT NULL UNIQUE REFERENCES trades(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  
  -- Trade data
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  price DECIMAL(36, 18) NOT NULL,
  quantity DECIMAL(36, 18) NOT NULL,
  total_value DECIMAL(36, 18) NOT NULL,
  
  -- Cryptographic chaining
  previous_hash VARCHAR(64) NOT NULL,
  trade_data_hash VARCHAR(64) NOT NULL,
  combined_hash VARCHAR(64) NOT NULL,
  
  -- Merkle tree
  merkle_leaf_hash VARCHAR(64),
  merkle_root_hash VARCHAR(64),
  merkle_tree_level INTEGER,
  merkle_sibling_hash VARCHAR(64),
  
  -- Blockchain anchoring
  blockchain_tx_hash VARCHAR(66),
  blockchain_anchor_height BIGINT,
  anchored_at TIMESTAMPTZ,
  
  -- Sequence for ordering
  sequence_number BIGINT NOT NULL UNIQUE,
  ledger_sequence BIGINT NOT NULL, -- Position in ledger
  
  -- Checkpoint reference
  checkpoint_id UUID,
  
  -- Timestamp (nanosecond precision)
  executed_at_ns BIGINT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- WORM storage marker
  is_sealed BOOLEAN DEFAULT FALSE,
  sealed_at TIMESTAMPTZ
);

-- Indexes for efficient verification
CREATE INDEX idx_trade_ledger_sequence ON trade_ledger(ledger_sequence);
CREATE INDEX idx_trade_ledger_checkpoint ON trade_ledger(checkpoint_id);
CREATE INDEX idx_trade_ledger_market ON trade_ledger(market_id, executed_at_ns);
CREATE INDEX idx_trade_ledger_anchor ON trade_ledger(blockchain_anchor_height) WHERE blockchain_anchor_height IS NOT NULL;

-- ============================================
-- 2. CHECKPOINTS FOR VERIFICATION
-- ============================================

CREATE TABLE ledger_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Checkpoint data
  checkpoint_sequence BIGINT NOT NULL UNIQUE,
  start_trade_sequence BIGINT NOT NULL,
  end_trade_sequence BIGINT NOT NULL,
  
  -- Hashes
  start_hash VARCHAR(64) NOT NULL,
  end_hash VARCHAR(64) NOT NULL,
  merkle_root VARCHAR(64) NOT NULL,
  
  -- Blockchain anchoring
  blockchain_tx_hash VARCHAR(66),
  anchor_timestamp TIMESTAMPTZ,
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'corrupted')),
  corruption_detected_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. HASH CALCULATION FUNCTIONS
-- ============================================

-- Calculate SHA-256 hash of trade data
CREATE OR REPLACE FUNCTION calculate_trade_hash(
  p_trade_id UUID,
  p_market_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID,
  p_price DECIMAL,
  p_quantity DECIMAL,
  p_executed_at_ns BIGINT
)
RETURNS VARCHAR(64)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data TEXT;
  v_hash TEXT;
BEGIN
  -- Concatenate trade data
  v_data := p_trade_id::TEXT || 
            p_market_id::TEXT || 
            p_buyer_id::TEXT || 
            p_seller_id::TEXT || 
            p_price::TEXT || 
            p_quantity::TEXT || 
            p_executed_at_ns::TEXT;
  
  -- Calculate SHA-256
  SELECT encode(digest(v_data, 'sha256'), 'hex') INTO v_hash;
  
  RETURN v_hash;
END;
$$;

-- Get previous ledger entry hash
CREATE OR REPLACE FUNCTION get_previous_ledger_hash()
RETURNS VARCHAR(64)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash VARCHAR(64);
BEGIN
  SELECT combined_hash INTO v_hash
  FROM trade_ledger
  ORDER BY ledger_sequence DESC
  LIMIT 1;
  
  RETURN COALESCE(v_hash, '0' || repeat('0', 63)); -- Genesis hash
END;
$$;

-- ============================================
-- 4. LEDGER RECORDING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION record_trade_to_ledger(
  p_trade_id UUID,
  p_market_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID,
  p_price DECIMAL,
  p_quantity DECIMAL,
  p_executed_at_ns BIGINT
)
RETURNS TABLE(
  ledger_id UUID,
  sequence_number BIGINT,
  combined_hash VARCHAR(64)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_hash VARCHAR(64);
  v_trade_hash VARCHAR(64);
  v_combined_hash VARCHAR(64);
  v_sequence BIGINT;
  v_ledger_sequence BIGINT;
  v_ledger_id UUID;
BEGIN
  -- Get previous hash
  v_previous_hash := get_previous_ledger_hash();
  
  -- Calculate trade data hash
  v_trade_hash := calculate_trade_hash(
    p_trade_id, p_market_id, p_buyer_id, p_seller_id,
    p_price, p_quantity, p_executed_at_ns
  );
  
  -- Calculate combined hash (previous + current)
  SELECT encode(digest(v_previous_hash || v_trade_hash, 'sha256'), 'hex')
  INTO v_combined_hash;
  
  -- Get sequences
  SELECT COALESCE(MAX(sequence_number), 0) + 1,
         COALESCE(MAX(ledger_sequence), 0) + 1
  INTO v_sequence, v_ledger_sequence
  FROM trade_ledger;
  
  -- Insert ledger entry
  INSERT INTO trade_ledger (
    trade_id,
    market_id,
    buyer_id,
    seller_id,
    price,
    quantity,
    total_value,
    previous_hash,
    trade_data_hash,
    combined_hash,
    sequence_number,
    ledger_sequence,
    executed_at_ns
  ) VALUES (
    p_trade_id,
    p_market_id,
    p_buyer_id,
    p_seller_id,
    p_price,
    p_quantity,
    p_price * p_quantity,
    v_previous_hash,
    v_trade_hash,
    v_combined_hash,
    v_sequence,
    v_ledger_sequence,
    p_executed_at_ns
  )
  RETURNING id INTO v_ledger_id;
  
  RETURN QUERY SELECT v_ledger_id, v_sequence, v_combined_hash;
END;
$$;

-- ============================================
-- 5. MERKLE TREE FUNCTIONS
-- ============================================

-- Calculate Merkle root for a range of trades
CREATE OR REPLACE FUNCTION calculate_merkle_root(
  p_start_sequence BIGINT,
  p_end_sequence BIGINT
)
RETURNS VARCHAR(64)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hashes TEXT[];
  v_level_hashes TEXT[];
  v_combined TEXT;
  v_result VARCHAR(64);
BEGIN
  -- Get all hashes in range
  SELECT array_agg(combined_hash ORDER BY ledger_sequence)
  INTO v_hashes
  FROM trade_ledger
  WHERE ledger_sequence BETWEEN p_start_sequence AND p_end_sequence;
  
  IF array_length(v_hashes, 1) IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Build Merkle tree
  v_level_hashes := v_hashes;
  
  WHILE array_length(v_level_hashes, 1) > 1 LOOP
    DECLARE
      v_next_level TEXT[] := '{}';
      v_i INTEGER;
    BEGIN
      FOR v_i IN 1..coalesce(array_length(v_level_hashes, 1), 0) BY 2 LOOP
        IF v_i + 1 <= array_length(v_level_hashes, 1) THEN
          v_combined := v_level_hashes[v_i] || v_level_hashes[v_i + 1];
        ELSE
          v_combined := v_level_hashes[v_i] || v_level_hashes[v_i]; -- Duplicate last if odd
        END IF;
        
        SELECT encode(digest(v_combined, 'sha256'), 'hex')
        INTO v_result;
        
        v_next_level := array_append(v_next_level, v_result);
      END LOOP;
      
      v_level_hashes := v_next_level;
    END;
  END LOOP;
  
  RETURN v_level_hashes[1];
END;
$$;

-- Create checkpoint with Merkle root
CREATE OR REPLACE FUNCTION create_ledger_checkpoint(
  p_checkpoint_sequence BIGINT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_seq BIGINT;
  v_end_seq BIGINT;
  v_start_hash VARCHAR(64);
  v_end_hash VARCHAR(64);
  v_merkle_root VARCHAR(64);
  v_checkpoint_id UUID;
BEGIN
  -- Calculate range (every 1000 trades)
  v_start_seq := (p_checkpoint_sequence - 1) * 1000 + 1;
  v_end_seq := p_checkpoint_sequence * 1000;
  
  -- Get boundary hashes
  SELECT combined_hash INTO v_start_hash
  FROM trade_ledger WHERE ledger_sequence = v_start_seq;
  
  SELECT combined_hash INTO v_end_hash
  FROM trade_ledger WHERE ledger_sequence = v_end_seq;
  
  -- Calculate Merkle root
  v_merkle_root := calculate_merkle_root(v_start_seq, v_end_seq);
  
  -- Create checkpoint
  INSERT INTO ledger_checkpoints (
    checkpoint_sequence,
    start_trade_sequence,
    end_trade_sequence,
    start_hash,
    end_hash,
    merkle_root
  ) VALUES (
    p_checkpoint_sequence,
    v_start_seq,
    v_end_seq,
    v_start_hash,
    v_end_hash,
    v_merkle_root
  )
  RETURNING id INTO v_checkpoint_id;
  
  -- Update trade ledger with checkpoint reference
  UPDATE trade_ledger
  SET checkpoint_id = v_checkpoint_id
  WHERE ledger_sequence BETWEEN v_start_seq AND v_end_seq;
  
  RETURN v_checkpoint_id;
END;
$$;

-- ============================================
-- 6. LEDGER VERIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION verify_ledger_chain(
  p_start_sequence BIGINT DEFAULT 1,
  p_end_sequence BIGINT DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  corrupted_at_sequence BIGINT,
  corrupted_trade_id UUID,
  expected_hash VARCHAR(64),
  actual_hash VARCHAR(64)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end_seq BIGINT;
  v_current RECORD;
  v_expected_hash VARCHAR(64);
  v_calculated_hash VARCHAR(64);
BEGIN
  v_end_seq := COALESCE(p_end_sequence, (SELECT MAX(ledger_sequence) FROM trade_ledger));
  v_expected_hash := '0' || repeat('0', 63); -- Genesis
  
  FOR v_current IN
    SELECT * FROM trade_ledger
    WHERE ledger_sequence BETWEEN p_start_sequence AND v_end_seq
    ORDER BY ledger_sequence
  LOOP
    -- Verify previous hash matches
    IF v_current.previous_hash != v_expected_hash THEN
      RETURN QUERY SELECT 
        FALSE,
        v_current.ledger_sequence,
        v_current.trade_id,
        v_expected_hash,
        v_current.previous_hash;
      RETURN;
    END IF;
    
    -- Verify trade data hash
    v_calculated_hash := calculate_trade_hash(
      v_current.trade_id,
      v_current.market_id,
      v_current.buyer_id,
      v_current.seller_id,
      v_current.price,
      v_current.quantity,
      v_current.executed_at_ns
    );
    
    IF v_calculated_hash != v_current.trade_data_hash THEN
      RETURN QUERY SELECT 
        FALSE,
        v_current.ledger_sequence,
        v_current.trade_id,
        v_current.trade_data_hash,
        v_calculated_hash;
      RETURN;
    END IF;
    
    -- Verify combined hash
    SELECT encode(digest(v_current.previous_hash || v_current.trade_data_hash, 'sha256'), 'hex')
    INTO v_calculated_hash;
    
    IF v_calculated_hash != v_current.combined_hash THEN
      RETURN QUERY SELECT 
        FALSE,
        v_current.ledger_sequence,
        v_current.trade_id,
        v_current.combined_hash,
        v_calculated_hash;
      RETURN;
    END IF;
    
    v_expected_hash := v_current.combined_hash;
  END LOOP;
  
  RETURN QUERY SELECT TRUE, NULL::BIGINT, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR;
END;
$$;

-- ============================================
-- 7. SETTLEMENT QUEUE
-- ============================================

CREATE TYPE settlement_priority AS ENUM ('P0', 'P1', 'P2', 'P3');
CREATE TYPE settlement_status AS ENUM ('pending', 'processing', 'submitted', 'confirmed', 'failed', 'manual_review');

CREATE TABLE settlement_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Trade reference
  trade_id UUID NOT NULL REFERENCES trades(id),
  ledger_id UUID REFERENCES trade_ledger(id),
  
  -- Priority and status
  priority settlement_priority NOT NULL DEFAULT 'P1',
  status settlement_status NOT NULL DEFAULT 'pending',
  
  -- Priority criteria
  trade_value DECIMAL(36, 18) NOT NULL,
  is_market_closing BOOLEAN DEFAULT FALSE,
  has_user_withdrawal BOOLEAN DEFAULT FALSE,
  is_retry BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  
  -- Blockchain details
  blockchain_network VARCHAR(20) DEFAULT 'ethereum',
  tx_hash VARCHAR(66),
  tx_nonce INTEGER,
  gas_price_gwei DECIMAL(18),
  gas_used INTEGER,
  block_number BIGINT,
  block_timestamp TIMESTAMPTZ,
  
  -- Timing
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Batch info
  batch_id UUID,
  
  -- Created at
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settlement_queue_priority ON settlement_queue(priority, created_at);
CREATE INDEX idx_settlement_queue_status ON settlement_queue(status, priority);
CREATE INDEX idx_settlement_queue_trade ON settlement_queue(trade_id);

-- ============================================
-- 8. SETTLEMENT PRIORITY CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_settlement_priority(
  p_trade_value DECIMAL,
  p_is_market_closing BOOLEAN,
  p_has_user_withdrawal BOOLEAN,
  p_is_retry BOOLEAN
)
RETURNS settlement_priority
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- P0: Critical
  IF p_trade_value > 10000 OR p_is_market_closing OR p_has_user_withdrawal THEN
    RETURN 'P0';
  END IF;
  
  -- P3: Manual review for retries
  IF p_is_retry THEN
    RETURN 'P3';
  END IF;
  
  -- P1: Standard
  RETURN 'P1';
END;
$$;

-- Add to settlement queue
CREATE OR REPLACE FUNCTION add_to_settlement_queue(
  p_trade_id UUID,
  p_ledger_id UUID,
  p_trade_value DECIMAL,
  p_is_market_closing BOOLEAN DEFAULT FALSE,
  p_has_user_withdrawal BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_priority settlement_priority;
  v_queue_id UUID;
BEGIN
  v_priority := calculate_settlement_priority(
    p_trade_value, p_is_market_closing, p_has_user_withdrawal, FALSE
  );
  
  INSERT INTO settlement_queue (
    trade_id,
    ledger_id,
    priority,
    trade_value,
    is_market_closing,
    has_user_withdrawal
  ) VALUES (
    p_trade_id,
    p_ledger_id,
    v_priority,
    p_trade_value,
    p_is_market_closing,
    p_has_user_withdrawal
  )
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$;

-- ============================================
-- 9. SELF-TRADE PREVENTION (STP)
-- ============================================

CREATE TYPE stp_mode AS ENUM ('prevent', 'decrease', 'cancel_both', 'allow');

CREATE TABLE user_stp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  
  -- STP configuration
  stp_mode stp_mode NOT NULL DEFAULT 'prevent',
  cross_market_stp_enabled BOOLEAN DEFAULT TRUE,
  organizational_stp_enabled BOOLEAN DEFAULT FALSE,
  
  -- Risk settings
  is_wash_trading_monitored BOOLEAN DEFAULT FALSE,
  wash_trade_alert_threshold DECIMAL(5, 2) DEFAULT 0.7, -- ML confidence
  
  -- Beneficial ownership (for organizational STP)
  beneficial_owner_id UUID,
  organization_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-market relationships
CREATE TABLE related_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_a_id UUID NOT NULL REFERENCES markets(id),
  market_b_id UUID NOT NULL REFERENCES markets(id),
  relationship_type VARCHAR(50) NOT NULL, -- 'inverse', 'correlated', 'synthetic'
  correlation_coefficient DECIMAL(5, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(market_a_id, market_b_id)
);

-- STP violations log
CREATE TABLE stp_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Orders involved
  order_a_id UUID NOT NULL REFERENCES order_book(id),
  order_b_id UUID NOT NULL REFERENCES order_book(id),
  
  -- User info
  user_id UUID NOT NULL REFERENCES auth.users(id),
  beneficial_owner_id UUID,
  
  -- Violation details
  violation_type VARCHAR(50) NOT NULL, -- 'self_match', 'cross_market', 'organizational', 'wash_trade'
  detection_method VARCHAR(50) NOT NULL, -- 'stp_config', 'ml_model', 'heuristic'
  
  -- Action taken
  action_taken VARCHAR(50) NOT NULL, -- 'blocked', 'decreased', 'cancelled', 'flagged', 'allowed'
  
  -- ML confidence (for wash trading)
  ml_confidence DECIMAL(5, 4),
  ml_features JSONB,
  
  -- Metadata
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX idx_stp_violations_user ON stp_violations(user_id, detected_at);
CREATE INDEX idx_stp_violations_type ON stp_violations(violation_type, action_taken);

-- ============================================
-- 10. STP CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_self_trade(
  p_order_id UUID,
  p_user_id UUID,
  p_market_id UUID,
  p_side VARCHAR(4),
  p_price DECIMAL,
  p_size DECIMAL
)
RETURNS TABLE(
  is_violation BOOLEAN,
  violation_type VARCHAR(50),
  action_taken VARCHAR(50),
  matched_order_id UUID,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stp_config RECORD;
  v_opposite_side VARCHAR(4);
  v_matched_order RECORD;
  v_related_market RECORD;
BEGIN
  -- Get user STP config
  SELECT * INTO v_stp_config
  FROM user_stp_config
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create default config
    INSERT INTO user_stp_config (user_id, stp_mode)
    VALUES (p_user_id, 'prevent')
    RETURNING * INTO v_stp_config;
  END IF;
  
  -- If mode is 'allow', skip checks but log
  IF v_stp_config.stp_mode = 'allow' THEN
    RETURN QUERY SELECT 
      FALSE,
      NULL::VARCHAR,
      'allowed'::VARCHAR,
      NULL::UUID,
      'STP mode is allow - trade flagged for surveillance'::TEXT;
    RETURN;
  END IF;
  
  v_opposite_side := CASE WHEN p_side = 'BUY' THEN 'SELL' ELSE 'BUY' END;
  
  -- Check 1: Direct self-match in same market
  SELECT * INTO v_matched_order
  FROM order_book
  WHERE market_id = p_market_id
    AND side = v_opposite_side
    AND user_id = p_user_id
    AND status IN ('OPEN', 'PARTIAL')
    AND CASE 
      WHEN p_side = 'BUY' THEN price <= p_price
      ELSE price >= p_price
    END
  LIMIT 1;
  
  IF FOUND THEN
    -- Log violation
    INSERT INTO stp_violations (
      order_a_id, order_b_id, user_id, beneficial_owner_id,
      violation_type, detection_method, action_taken
    ) VALUES (
      p_order_id, v_matched_order.id, p_user_id, v_stp_config.beneficial_owner_id,
      'self_match', 'stp_config', v_stp_config.stp_mode::VARCHAR
    );
    
    RETURN QUERY SELECT 
      TRUE,
      'self_match'::VARCHAR,
      v_stp_config.stp_mode::VARCHAR,
      v_matched_order.id,
      'Self-match detected in same market'::TEXT;
    RETURN;
  END IF;
  
  -- Check 2: Cross-market STP
  IF v_stp_config.cross_market_stp_enabled THEN
    FOR v_related_market IN
      SELECT rm.*
      FROM related_markets rm
      WHERE (rm.market_a_id = p_market_id OR rm.market_b_id = p_market_id)
        AND rm.relationship_type IN ('inverse', 'synthetic')
    LOOP
      -- Check for matching orders in related markets
      SELECT * INTO v_matched_order
      FROM order_book
      WHERE market_id = CASE 
        WHEN v_related_market.market_a_id = p_market_id THEN v_related_market.market_b_id
        ELSE v_related_market.market_a_id
      END
        AND side = v_opposite_side
        AND user_id = p_user_id
        AND status IN ('OPEN', 'PARTIAL')
      LIMIT 1;
      
      IF FOUND THEN
        INSERT INTO stp_violations (
          order_a_id, order_b_id, user_id,
          violation_type, detection_method, action_taken
        ) VALUES (
          p_order_id, v_matched_order.id, p_user_id,
          'cross_market', 'stp_config', 'prevent'
        );
        
        RETURN QUERY SELECT 
          TRUE,
          'cross_market'::VARCHAR,
          'prevent'::VARCHAR,
          v_matched_order.id,
          'Cross-market self-trade detected'::TEXT;
        RETURN;
      END IF;
    END LOOP;
  END IF;
  
  -- Check 3: Organizational STP
  IF v_stp_config.organizational_stp_enabled AND v_stp_config.beneficial_owner_id IS NOT NULL THEN
    SELECT * INTO v_matched_order
    FROM order_book ob
    JOIN user_stp_config usc ON usc.user_id = ob.user_id
    WHERE ob.market_id = p_market_id
      AND ob.side = v_opposite_side
      AND ob.status IN ('OPEN', 'PARTIAL')
      AND usc.beneficial_owner_id = v_stp_config.beneficial_owner_id
      AND ob.user_id != p_user_id
    LIMIT 1;
    
    IF FOUND THEN
      INSERT INTO stp_violations (
        order_a_id, order_b_id, user_id, beneficial_owner_id,
        violation_type, detection_method, action_taken
      ) VALUES (
        p_order_id, v_matched_order.id, p_user_id, v_stp_config.beneficial_owner_id,
        'organizational', 'stp_config', 'prevent'
      );
      
      RETURN QUERY SELECT 
        TRUE,
        'organizational'::VARCHAR,
        'prevent'::VARCHAR,
        v_matched_order.id,
        'Organizational self-trade detected'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- No violation
  RETURN QUERY SELECT 
    FALSE,
    NULL::VARCHAR,
    NULL::VARCHAR,
    NULL::UUID,
    NULL::TEXT;
END;
$$;

-- ============================================
-- 11. WASH TRADING DETECTION
-- ============================================

CREATE TABLE wash_trading_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User and time window
  user_id UUID NOT NULL REFERENCES auth.users(id),
  detection_window_start TIMESTAMPTZ NOT NULL,
  detection_window_end TIMESTAMPTZ NOT NULL,
  
  -- ML features and score
  temporal_correlation_score DECIMAL(5, 4),
  size_relationship_score DECIMAL(5, 4),
  price_impact_score DECIMAL(5, 4),
  network_analysis_score DECIMAL(5, 4),
  behavioral_score DECIMAL(5, 4),
  
  overall_confidence DECIMAL(5, 4) NOT NULL,
  
  -- Details
  suspicious_trades UUID[],
  feature_breakdown JSONB,
  
  -- Action
  alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('none', 'low', 'medium', 'high', 'critical')),
  action_taken VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_wash_trading_scores_user ON wash_trading_scores(user_id, created_at);
CREATE INDEX idx_wash_trading_scores_confidence ON wash_trading_scores(overall_confidence) WHERE overall_confidence > 0.7;

-- Calculate wash trading score
CREATE OR REPLACE FUNCTION calculate_wash_trading_score(
  p_user_id UUID,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS DECIMAL(5, 4)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_temporal_score DECIMAL(5, 4) := 0;
  v_size_score DECIMAL(5, 4) := 0;
  v_price_score DECIMAL(5, 4) := 0;
  v_network_score DECIMAL(5, 4) := 0;
  v_behavioral_score DECIMAL(5, 4) := 0;
  v_overall DECIMAL(5, 4);
BEGIN
  -- Temporal correlation (25%): Buy-sell within 100ms
  SELECT COUNT(*)::DECIMAL / 10 INTO v_temporal_score
  FROM trades t1
  JOIN trades t2 ON t1.buyer_id = p_user_id AND t2.seller_id = p_user_id
  WHERE ABS(EXTRACT(EPOCH FROM (t1.created_at - t2.created_at))) < 0.1
    AND t1.created_at > NOW() - INTERVAL '1 hour' * p_window_hours;
  
  v_temporal_score := LEAST(v_temporal_score, 1);
  
  -- Size relationships (20%): Identical or simple ratio quantities
  -- (Simplified calculation)
  SELECT 0.5 INTO v_size_score; -- Placeholder
  
  -- Price impact (20%): Orders moving price followed by reversal
  -- (Simplified calculation)
  SELECT 0.3 INTO v_price_score; -- Placeholder
  
  -- Network analysis (20%): Common IP, device, funding source
  -- (Simplified calculation)
  SELECT 0.2 INTO v_network_score; -- Placeholder
  
  -- Behavioral (15%): Velocity spikes, session anomalies
  -- (Simplified calculation)
  SELECT 0.4 INTO v_behavioral_score; -- Placeholder
  
  -- Weighted average
  v_overall := (v_temporal_score * 0.25 +
                v_size_score * 0.20 +
                v_price_score * 0.20 +
                v_network_score * 0.20 +
                v_behavioral_score * 0.15);
  
  RETURN v_overall;
END;
$$;

-- ============================================
-- 12. RLS POLICIES
-- ============================================

ALTER TABLE trade_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE stp_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_trading_scores ENABLE ROW LEVEL SECURITY;

-- Trade ledger: Public can verify, users can see their own
CREATE POLICY "Public can view trade ledger"
ON trade_ledger FOR SELECT
USING (true);

-- Settlement queue: Users can see their own
CREATE POLICY "Users can view their settlement queue"
ON settlement_queue FOR SELECT
USING (EXISTS (
  SELECT 1 FROM trades t 
  WHERE t.id = settlement_queue.trade_id 
  AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
));

-- STP config: Users can view/modify their own
CREATE POLICY "Users can manage their STP config"
ON user_stp_config FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Violations: Users can see their own
CREATE POLICY "Users can view their violations"
ON stp_violations FOR SELECT
USING (user_id = auth.uid());

-- Wash trading scores: Users can see their own
CREATE POLICY "Users can view their wash trading scores"
ON wash_trading_scores FOR SELECT
USING (user_id = auth.uid());
