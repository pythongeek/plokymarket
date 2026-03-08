-- ============================================
-- REGULATORY REPORTING & SCALABILITY
-- SAR Generation, Market Sharding, Performance Layers
-- ============================================

-- ============================================
-- 1. REGULATORY REPORTS
-- ============================================

CREATE TYPE report_type AS ENUM ('SAR_US', 'STR_EU', 'FIU_GLOBAL', 'INTERNAL_REVIEW');
CREATE TYPE report_status AS ENUM ('draft', 'pending_review', 'submitted', 'acknowledged', 'closed');
CREATE TYPE report_trigger AS ENUM ('confirmed_wash_trading', 'suspicious_pattern', 'cross_platform_coordination', 'manual_review');

CREATE TABLE regulatory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report identification
  report_type report_type NOT NULL,
  report_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., SAR-2024-001234
  
  -- Trigger information
  trigger_type report_trigger NOT NULL,
  trigger_trade_ids UUID[],
  trigger_amount DECIMAL(36, 18),
  
  -- Subject information
  subject_user_id UUID REFERENCES auth.users(id),
  subject_account_ids TEXT[],
  beneficial_owner_id UUID,
  
  -- Report content
  report_content JSONB NOT NULL,
  trade_history JSONB,
  account_relationships JSONB,
  detection_methodology JSONB,
  risk_score DECIMAL(5, 4),
  
  -- Timeline
  detected_at TIMESTAMPTZ NOT NULL,
  report_due_date TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  
  -- Status
  status report_status DEFAULT 'draft',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Transmission
  transmission_method VARCHAR(50), -- 'secure_email', 'api', 'portal'
  transmission_confirmation_id VARCHAR(128),
  transmission_confirmed_at TIMESTAMPTZ,
  
  -- Metadata
  jurisdiction VARCHAR(10) NOT NULL, -- 'US', 'EU', 'GLOBAL'
  filing_institution VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regulatory_reports_user ON regulatory_reports(subject_user_id);
CREATE INDEX idx_regulatory_reports_status ON regulatory_reports(status, report_due_date);
CREATE INDEX idx_regulatory_reports_type ON regulatory_reports(report_type, created_at);

-- ============================================
-- 2. CROSS-PLATFORM COORDINATION
-- ============================================

CREATE TABLE partner_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  jurisdiction VARCHAR(50) NOT NULL,
  api_endpoint VARCHAR(255),
  encryption_public_key TEXT,
  agreement_type VARCHAR(50),
  information_sharing_enabled BOOLEAN DEFAULT FALSE,
  response_time_sla INTEGER, -- hours
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cross_platform_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL,
  subject_identifier VARCHAR(255), -- hashed/tokens
  subject_user_id UUID REFERENCES auth.users(id),
  
  -- Partner information
  originating_exchange UUID REFERENCES partner_exchanges(id),
  recipient_exchange UUID REFERENCES partner_exchanges(id),
  
  -- Content
  alert_data JSONB NOT NULL,
  risk_indicators TEXT[],
  
  -- Timeline
  shared_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'shared', 'acknowledged', 'responded', 'closed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cross_platform_alerts_user ON cross_platform_alerts(subject_user_id);
CREATE INDEX idx_cross_platform_alerts_status ON cross_platform_alerts(status, created_at);

-- ============================================
-- 3. SAR GENERATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION generate_sar_report(
  p_subject_user_id UUID,
  p_trigger_type report_trigger,
  p_trigger_trade_ids UUID[],
  p_jurisdiction VARCHAR(10)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id UUID;
  v_report_number VARCHAR(50);
  v_due_date TIMESTAMPTZ;
  v_total_amount DECIMAL(36, 18);
  v_trade_history JSONB;
  v_relationships JSONB;
  v_detection_method JSONB;
  v_risk_score DECIMAL(5, 4);
BEGIN
  -- Generate report number
  v_report_number := 'SAR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('report_seq')::TEXT, 6, '0');
  
  -- Calculate due date (30 days for confirmed, 90 days for internal)
  IF p_trigger_type = 'confirmed_wash_trading' THEN
    v_due_date := NOW() + INTERVAL '30 days';
  ELSE
    v_due_date := NOW() + INTERVAL '90 days';
  END IF;
  
  -- Calculate total amount
  SELECT COALESCE(SUM(total_value), 0)
  INTO v_total_amount
  FROM trade_ledger
  WHERE trade_id = ANY(p_trigger_trade_ids);
  
  -- Get trade history
  SELECT jsonb_agg(
    jsonb_build_object(
      'trade_id', tl.trade_id,
      'executed_at', tl.executed_at_ns,
      'price', tl.price,
      'quantity', tl.quantity,
      'total_value', tl.total_value,
      'counterparty', CASE WHEN tl.buyer_id = p_subject_user_id THEN tl.seller_id ELSE tl.buyer_id END
    )
    ORDER BY tl.executed_at_ns
  )
  INTO v_trade_history
  FROM trade_ledger tl
  WHERE tl.trade_id = ANY(p_trigger_trade_ids);
  
  -- Get account relationships
  SELECT jsonb_build_object(
    'beneficial_owner', bo.full_name,
    'organization', org.name,
    'linked_accounts', (
      SELECT array_agg(DISTINCT usc.user_id)
      FROM user_stp_config usc
      WHERE usc.beneficial_owner_id = config.beneficial_owner_id
        AND usc.user_id != p_subject_user_id
    )
  )
  INTO v_relationships
  FROM user_stp_config config
  LEFT JOIN users bo ON bo.id = config.beneficial_owner_id
  LEFT JOIN organizations org ON org.id = config.organization_id
  WHERE config.user_id = p_subject_user_id;
  
  -- Get detection methodology
  SELECT jsonb_build_object(
    'trigger_type', p_trigger_type,
    'ml_confidence', MAX(wts.overall_confidence),
    'detection_features', jsonb_agg(DISTINCT wts.feature_breakdown),
    'violation_count', COUNT(sv.id)
  )
  INTO v_detection_method
  FROM wash_trading_scores wts
  LEFT JOIN stp_violations sv ON sv.user_id = p_subject_user_id
  WHERE wts.user_id = p_subject_user_id
    AND wts.created_at > NOW() - INTERVAL '90 days';
  
  -- Calculate risk score
  SELECT COALESCE(MAX(overall_confidence), 0.5)
  INTO v_risk_score
  FROM wash_trading_scores
  WHERE user_id = p_subject_user_id
    AND created_at > NOW() - INTERVAL '30 days';
  
  -- Create report
  INSERT INTO regulatory_reports (
    report_type,
    report_number,
    trigger_type,
    trigger_trade_ids,
    trigger_amount,
    subject_user_id,
    report_content,
    trade_history,
    account_relationships,
    detection_methodology,
    risk_score,
    detected_at,
    report_due_date,
    jurisdiction,
    filing_institution
  ) VALUES (
    CASE 
      WHEN p_jurisdiction = 'US' THEN 'SAR_US'::report_type
      WHEN p_jurisdiction = 'EU' THEN 'STR_EU'::report_type
      ELSE 'FIU_GLOBAL'::report_type
    END,
    v_report_number,
    p_trigger_type,
    p_trigger_trade_ids,
    v_total_amount,
    p_subject_user_id,
    jsonb_build_object(
      'summary', 'Automated SAR generation for suspected market manipulation',
      'narrative', 'Pattern analysis indicates potential wash trading activity',
      'supporting_documents', ARRAY['trade_ledger', 'wash_trading_scores', 'stp_violations']
    ),
    v_trade_history,
    v_relationships,
    v_detection_method,
    v_risk_score,
    NOW(),
    v_due_date,
    p_jurisdiction,
    'Plokymarket Exchange'
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$;

-- Sequence for report numbers
CREATE SEQUENCE IF NOT EXISTS report_seq START 1;

-- ============================================
-- 4. MARKET SHARDING
-- ============================================

CREATE TYPE shard_strategy AS ENUM ('activity_based', 'correlation_based', 'geographic', 'hybrid');

CREATE TABLE market_shards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Shard identification
  shard_number INTEGER NOT NULL UNIQUE,
  shard_name VARCHAR(50) NOT NULL,
  
  -- Strategy
  strategy shard_strategy NOT NULL,
  
  -- Assignment rules
  market_id_range_start INTEGER,
  market_id_range_end INTEGER,
  market_category_filter VARCHAR(50)[],
  geographic_region VARCHAR(50),
  
  -- Infrastructure
  primary_node VARCHAR(100) NOT NULL,
  secondary_node VARCHAR(100),
  database_connection_string TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_read_only BOOLEAN DEFAULT FALSE,
  
  -- Metrics
  total_markets INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  avg_latency_ms DECIMAL(10, 3),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE market_shard_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  shard_id UUID NOT NULL REFERENCES market_shards(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(market_id)
);

CREATE INDEX idx_shard_assignments_shard ON market_shard_assignments(shard_id);
CREATE INDEX idx_shard_assignments_market ON market_shard_assignments(market_id);

-- ============================================
-- 5. SHARD ASSIGNMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION assign_market_to_shard(
  p_market_id UUID,
  p_strategy shard_strategy DEFAULT 'activity_based'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shard_id UUID;
  v_market_category VARCHAR(50);
  v_market_hash INTEGER;
BEGIN
  -- Get market info
  SELECT category INTO v_market_category
  FROM markets
  WHERE id = p_market_id;
  
  -- Find appropriate shard based on strategy
  CASE p_strategy
    WHEN 'activity_based' THEN
      -- Hash-based assignment
      v_market_hash := hashtextextended(p_market_id::TEXT, 0);
      
      SELECT id INTO v_shard_id
      FROM market_shards
      WHERE is_active = TRUE
        AND strategy = 'activity_based'
      ORDER BY (
        v_market_hash % (
          SELECT COUNT(*) FROM market_shards 
          WHERE is_active = TRUE AND strategy = 'activity_based'
        )
      )
      LIMIT 1;
      
    WHEN 'correlation_based' THEN
      -- Category-based assignment
      SELECT id INTO v_shard_id
      FROM market_shards
      WHERE is_active = TRUE
        AND strategy = 'correlation_based'
        AND v_market_category = ANY(market_category_filter)
      LIMIT 1;
      
      -- Fallback to activity-based if no category match
      IF v_shard_id IS NULL THEN
        SELECT assign_market_to_shard(p_market_id, 'activity_based') INTO v_shard_id;
      END IF;
      
    WHEN 'geographic' THEN
      -- Geographic assignment (simplified)
      SELECT id INTO v_shard_id
      FROM market_shards
      WHERE is_active = TRUE
        AND strategy = 'geographic'
      ORDER BY RANDOM()
      LIMIT 1;
      
    ELSE
      -- Hybrid: Try correlation first, then activity
      SELECT assign_market_to_shard(p_market_id, 'correlation_based') INTO v_shard_id;
  END CASE;
  
  -- Assign market to shard
  IF v_shard_id IS NOT NULL THEN
    INSERT INTO market_shard_assignments (market_id, shard_id)
    VALUES (p_market_id, v_shard_id)
    ON CONFLICT (market_id) DO UPDATE
    SET shard_id = EXCLUDED.shard_id,
        assigned_at = NOW();
        
    -- Update shard metrics
    UPDATE market_shards
    SET total_markets = (
      SELECT COUNT(*) FROM market_shard_assignments WHERE shard_id = v_shard_id
    ),
    updated_at = NOW()
    WHERE id = v_shard_id;
  END IF;
  
  RETURN v_shard_id;
END;
$$;

-- ============================================
-- 6. PERFORMANCE LAYERS
-- ============================================

CREATE TYPE storage_layer AS ENUM ('hot', 'warm', 'cold', 'archive');

CREATE TABLE storage_layer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  layer storage_layer NOT NULL UNIQUE,
  
  -- Technology
  technology VARCHAR(100) NOT NULL,
  storage_format VARCHAR(50),
  
  -- Durability
  durability_description TEXT,
  max_data_loss_ms INTEGER,
  
  -- Recovery
  recovery_time_sla INTEGER, -- seconds
  recovery_procedure TEXT,
  
  -- Replication
  replication_factor INTEGER DEFAULT 1,
  replication_regions TEXT[],
  
  -- Performance
  target_latency_ms INTEGER,
  max_throughput_ops INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize storage layers
INSERT INTO storage_layer_config (
  layer, technology, storage_format, durability_description, 
  max_data_loss_ms, recovery_time_sla, replication_factor, 
  target_latency_ms, max_throughput_ops
) VALUES
(
  'hot', 'Rust-based, lock-free', 'Memory', 
  'None (reconstructible from WAL)', 0, 1, 0,
  1, 1000000
),
(
  'warm', 'Custom binary, mmap', 'Binary WAL',
  '10ms data loss max', 10, 1, 2,
  10, 100000
),
(
  'cold', 'PostgreSQL', 'Relational',
  'Transaction committed', 0, 5, 3,
  50, 10000
),
(
  'archive', 'S3/Glacier', 'Immutable objects',
  'Permanent, cross-region', 0, 3600, 6,
  3600000, 100
)
ON CONFLICT (layer) DO NOTHING;

-- ============================================
-- 7. CHECKPOINT MANAGEMENT
-- ============================================

CREATE TABLE order_book_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  shard_id UUID REFERENCES market_shards(id),
  checkpoint_sequence BIGINT NOT NULL,
  
  -- State hash
  state_hash VARCHAR(64) NOT NULL,
  order_count INTEGER NOT NULL,
  total_volume DECIMAL(36, 18) NOT NULL,
  
  -- Storage location
  hot_storage_reference TEXT,
  warm_storage_path TEXT,
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verification_hash VARCHAR(64),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkpoints_shard ON order_book_checkpoints(shard_id, checkpoint_sequence);

-- ============================================
-- 8. RECOVERY PROTOCOL
-- ============================================

CREATE TYPE recovery_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

CREATE TABLE recovery_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  shard_id UUID REFERENCES market_shards(id),
  
  -- Recovery details
  recovery_type VARCHAR(50) NOT NULL, -- 'checkpoint', 'wal_replay', 'full_restore'
  source_checkpoint UUID REFERENCES order_book_checkpoints(id),
  
  -- Status
  status recovery_status DEFAULT 'pending',
  
  -- Progress
  total_operations INTEGER,
  completed_operations INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  
  -- Verification
  consistency_verified BOOLEAN DEFAULT FALSE,
  verification_result JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. HOT STANDBY
-- ============================================

CREATE TABLE hot_standby_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  shard_id UUID REFERENCES market_shards(id),
  
  -- Node info
  node_name VARCHAR(100) NOT NULL,
  node_address VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Replication
  replication_lag_ms INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  
  -- Failover
  failover_priority INTEGER DEFAULT 1,
  auto_failover_enabled BOOLEAN DEFAULT TRUE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'syncing' CHECK (status IN ('syncing', 'synced', 'lagging', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. RLS POLICIES
-- ============================================

ALTER TABLE regulatory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_platform_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_shards ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_shard_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_operations ENABLE ROW LEVEL SECURITY;

-- Regulatory reports: Admin only
CREATE POLICY "Only admins can access regulatory reports"
ON regulatory_reports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Cross-platform alerts: Admin only
CREATE POLICY "Only admins can access cross-platform alerts"
ON cross_platform_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Market shards: Public read
CREATE POLICY "Public can view market shards"
ON market_shards FOR SELECT
USING (true);

-- Shard assignments: Public read
CREATE POLICY "Public can view shard assignments"
ON market_shard_assignments FOR SELECT
USING (true);

-- Recovery operations: Admin only
CREATE POLICY "Only admins can access recovery operations"
ON recovery_operations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- ============================================
-- 11. VIEWS FOR MONITORING
-- ============================================

-- Shard distribution view
CREATE VIEW shard_distribution AS
SELECT 
  ms.shard_number,
  ms.shard_name,
  ms.strategy,
  ms.primary_node,
  ms.is_active,
  COUNT(msa.market_id) as assigned_markets,
  ms.total_orders,
  ms.avg_latency_ms
FROM market_shards ms
LEFT JOIN market_shard_assignments msa ON msa.shard_id = ms.id
GROUP BY ms.id, ms.shard_number, ms.shard_name, ms.strategy, ms.primary_node, ms.is_active, ms.total_orders, ms.avg_latency_ms;

-- Pending SARs view
CREATE VIEW pending_sars AS
SELECT 
  rr.*,
  u.full_name as subject_name,
  (rr.report_due_date - NOW()) as time_remaining
FROM regulatory_reports rr
LEFT JOIN users u ON u.id = rr.subject_user_id
WHERE rr.status IN ('draft', 'pending_review')
ORDER BY rr.report_due_date ASC;

-- Hot standby status view
CREATE VIEW hot_standby_status AS
SELECT 
  hsn.*,
  ms.shard_name,
  ms.is_active as shard_active
FROM hot_standby_nodes hsn
JOIN market_shards ms ON ms.id = hsn.shard_id
ORDER BY hsn.shard_id, hsn.failover_priority;
