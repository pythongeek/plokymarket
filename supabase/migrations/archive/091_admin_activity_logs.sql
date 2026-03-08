-- Migration 091: Admin Activity Logs System
-- Complete admin activity tracking with Upstash Workflow integration

-- 0. Drop table if exists with wrong schema (clean slate)
DROP TABLE IF EXISTS admin_activity_logs CASCADE;

-- 1. Admin Activity Logs Table
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Admin Info
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Action Details
  action_type VARCHAR(50) NOT NULL CHECK (
    action_type IN (
      'create_event', 'update_event', 'delete_event', 'resolve_event',
      'approve_topic', 'reject_topic', 'pause_market', 'resume_market',
      'add_expert', 'remove_expert', 'resolve_dispute', 'manual_override',
      'update_oracle', 'emergency_action', 'verify_expert', 'create_dispute'
    )
  ),
  
  -- Related Resource
  resource_type VARCHAR(50), -- 'event', 'topic', 'dispute', 'expert', etc.
  resource_id UUID,
  
  -- Change Details
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  
  -- Context
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Workflow Tracking
  workflow_id VARCHAR(100), -- Upstash Workflow ID if applicable
  workflow_status VARCHAR(20), -- 'pending', 'completed', 'failed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_resource ON admin_activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_workflow ON admin_activity_logs(workflow_id);

-- 3. Enable RLS
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Admin logs viewable by admin only"
  ON admin_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Only admin can insert logs"
  ON admin_activity_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- 5. Log Admin Action Function
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action_type VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_workflow_id VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_change_summary TEXT;
BEGIN
  -- Generate change summary
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    v_change_summary := format('Changed %s from %s to %s', 
      p_resource_type, 
      p_old_values::TEXT, 
      p_new_values::TEXT
    );
  ELSIF p_new_values IS NOT NULL THEN
    v_change_summary := format('Created new %s: %s', p_resource_type, p_new_values::TEXT);
  ELSE
    v_change_summary := format('Action: %s on %s', p_action_type, p_resource_type);
  END IF;

  -- Insert log
  INSERT INTO admin_activity_logs (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    change_summary,
    reason,
    ip_address,
    user_agent,
    workflow_id,
    workflow_status
  )
  VALUES (
    p_admin_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    v_change_summary,
    p_reason,
    p_ip_address,
    p_user_agent,
    p_workflow_id,
    CASE WHEN p_workflow_id IS NOT NULL THEN 'pending' ELSE 'completed' END
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 6. Update Workflow Status Function
CREATE OR REPLACE FUNCTION update_admin_log_workflow(
  p_log_id UUID,
  p_workflow_status VARCHAR,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_activity_logs
  SET 
    workflow_status = p_workflow_status,
    new_values = COALESCE(p_new_values, new_values)
  WHERE id = p_log_id;
END;
$$;

-- 7. Get Admin Activity Summary Function
CREATE OR REPLACE FUNCTION get_admin_activity_summary(
  p_admin_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  action_type VARCHAR,
  action_count BIGINT,
  last_action_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 8. Trigger for Auto-Logging Market Resolutions
CREATE OR REPLACE FUNCTION auto_log_market_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    PERFORM log_admin_action(
      COALESCE(NEW.resolved_by, auth.uid()),
      'resolve_event',
      'market',
      NEW.id,
      jsonb_build_object('status', OLD.status, 'outcome', OLD.outcome),
      jsonb_build_object('status', NEW.status, 'outcome', NEW.outcome),
      NEW.resolution_source_type || ' resolution'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trg_auto_log_resolution ON markets;
CREATE TRIGGER trg_auto_log_resolution
  AFTER UPDATE ON markets
  FOR EACH ROW
  EXECUTE FUNCTION auto_log_market_resolution();

-- Comments
COMMENT ON TABLE admin_activity_logs IS 'Tracks all admin actions for audit trail';
COMMENT ON FUNCTION log_admin_action IS 'Logs admin activity with change tracking';
COMMENT ON FUNCTION update_admin_log_workflow IS 'Updates workflow status for async actions';
COMMENT ON FUNCTION get_admin_activity_summary IS 'Returns admin activity summary for reporting';
