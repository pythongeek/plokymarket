-- Migration: Create Verification Workflows Tables
-- Created: 2024
-- Purpose: Enable workflow configuration and execution tracking

-- 1. Verification Workflows Table
-- Stores custom workflow configurations created by admins
CREATE TABLE IF NOT EXISTS verification_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_category VARCHAR(50) NOT NULL,
  
  -- Configuration (JSON)
  -- Contains: { steps: [...], globalTimeout, escalationThreshold }
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  CONSTRAINT event_category_valid CHECK (event_category IN ('crypto', 'sports', 'politics', 'news', 'complex', 'general'))
);

-- 2. Workflow Executions Table
-- Stores results of workflow executions for audit and analytics
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  event_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES verification_workflows(id) ON DELETE CASCADE,
  
  -- Results
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('yes', 'no', 'uncertain', 'escalated')),
  confidence NUMERIC(5, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Execution Details
  execution_time INTEGER, -- milliseconds
  mismatch_detected BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false,
  
  -- Data
  sources JSONB, -- Array of source results
  evidence JSONB, -- Collection of evidence from sources
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_event_workflow_execution UNIQUE (event_id, workflow_id, created_at)
);

-- 3. Indexes for Performance

-- Workflow lookup and filtering
CREATE INDEX idx_verification_workflows_category ON verification_workflows(event_category);
CREATE INDEX idx_verification_workflows_enabled ON verification_workflows(enabled);
CREATE INDEX idx_verification_workflows_created_at ON verification_workflows(created_at DESC);

-- Execution history and analytics
CREATE INDEX idx_workflow_executions_event_id ON workflow_executions(event_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_outcome ON workflow_executions(outcome);
CREATE INDEX idx_workflow_executions_escalated ON workflow_executions(escalated);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_workflow_created ON workflow_executions(workflow_id, created_at DESC);

-- 4. Enable Row Level Security

ALTER TABLE verification_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Workflow - Admins can view all, users can only view enabled
CREATE POLICY workflows_view_policy ON verification_workflows
  FOR SELECT
  USING (
    enabled = true 
    OR (auth.uid() IS NOT NULL AND 
        EXISTS(
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() AND users.is_admin = true
        ))
  );

CREATE POLICY workflows_admin_insert ON verification_workflows
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS(
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY workflows_admin_update ON verification_workflows
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS(
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS(
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    ) AND
    is_default = false -- Prevent updates to default workflows
  );

CREATE POLICY workflows_admin_delete ON verification_workflows
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS(
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    ) AND
    is_default = false -- Prevent deletion of default workflows
  );

-- Executions - Admins can view all, anyone can insert (via API)
CREATE POLICY executions_view_policy ON workflow_executions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS(
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

CREATE POLICY executions_insert_policy ON workflow_executions
  FOR INSERT
  WITH CHECK (true); -- Executed via authenticated API calls

-- 6. Seed Default Workflows (can be populated from app)

-- NOTE: Default workflows are created at runtime from WorkflowBuilder.ts
-- The following INSERT statements can be run to pre-populate defaults:

/*
INSERT INTO verification_workflows (name, description, event_category, config, is_default, enabled)
VALUES (
  'Cryptocurrency Price Verification',
  'Verifies crypto prices using 3 independent sources: Coinbase API, Chainlink Oracle, News consensus',
  'crypto',
  jsonb_build_object(
    'steps', jsonb_build_array(
      jsonb_build_object(
        'id', 'primary-price-sources',
        'name', 'Primary Price Sources',
        'sources', jsonb_build_array(
          jsonb_build_object('method', 'api_price_feed', 'weight', 40, 'timeout', 10000),
          jsonb_build_object('method', 'chainlink_oracle', 'weight', 40, 'timeout', 15000),
          jsonb_build_object('method', 'news_consensus', 'weight', 20, 'timeout', 30000)
        ),
        'logic', 'weighted_consensus',
        'requiredConfidence', 90
      )
    ),
    'globalTimeout', 300000,
    'escalationThreshold', 75
  ),
  true,
  true
) ON CONFLICT DO NOTHING;
*/

-- 7. Add notified column for escalation tracking
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- 8. Create daily analytics table
CREATE TABLE IF NOT EXISTS workflow_analytics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_executions INTEGER DEFAULT 0,
  yes_count INTEGER DEFAULT 0,
  no_count INTEGER DEFAULT 0,
  escalated_count INTEGER DEFAULT 0,
  avg_confidence NUMERIC(5, 2),
  avg_execution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on analytics table
ALTER TABLE workflow_analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS policy for analytics
CREATE POLICY analytics_view_policy ON workflow_analytics_daily
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    EXISTS(
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Index on analytics date
CREATE INDEX idx_workflow_analytics_date ON workflow_analytics_daily(date DESC);

-- 9. View for Execution Analytics
CREATE OR REPLACE VIEW workflow_execution_stats AS
SELECT 
  w.id,
  w.name,
  COUNT(we.id) as total_executions,
  COUNT(CASE WHEN we.outcome = 'yes' THEN 1 END) as yes_count,
  COUNT(CASE WHEN we.outcome = 'no' THEN 1 END) as no_count,
  COUNT(CASE WHEN we.escalated = true THEN 1 END) as escalated_count,
  ROUND(AVG(we.confidence)::numeric, 2) as avg_confidence,
  ROUND(AVG(we.execution_time)::numeric, 2) as avg_execution_time,
  MIN(we.created_at) as first_execution,
  MAX(we.created_at) as last_execution
FROM verification_workflows w
LEFT JOIN workflow_executions we ON w.id = we.workflow_id
GROUP BY w.id, w.name;

-- Grant access to authenticated users for stats view
GRANT SELECT ON workflow_execution_stats TO authenticated;

COMMENT ON TABLE verification_workflows IS 'Stores verification workflow configurations for event resolution';
COMMENT ON TABLE workflow_executions IS 'Audit log of all workflow executions and their results';
COMMENT ON TABLE workflow_analytics_daily IS 'Daily aggregated workflow analytics';
COMMENT ON VIEW workflow_execution_stats IS 'Analytics view for workflow performance metrics';
