-- Workflow Execution Tracking System
-- Migration: 095_workflow_tracking.sql
-- For Upstash Workflow monitoring and retry logic

-- Workflow execution tracking table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  execution_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workflow execution log for audit trail
CREATE TABLE IF NOT EXISTS public.workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  step_status VARCHAR(20) NOT NULL 
    CHECK (step_status IN ('started', 'completed', 'failed')),
  step_data JSONB DEFAULT '{}',
  error_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status 
  ON public.workflow_executions(status, created_at);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_type 
  ON public.workflow_executions(workflow_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_retry 
  ON public.workflow_executions(status, next_retry_at) 
  WHERE status IN ('pending', 'retrying');

CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution 
  ON public.workflow_execution_logs(execution_id, created_at);

-- Function to update workflow execution timestamp
CREATE OR REPLACE FUNCTION update_workflow_execution_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_executions_timestamp
  BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_workflow_execution_timestamp();

-- Function to log workflow step
CREATE OR REPLACE FUNCTION public.log_workflow_step(
  p_execution_id UUID,
  p_step_name VARCHAR(100),
  p_step_status VARCHAR(20),
  p_step_data JSONB DEFAULT '{}',
  p_error_details TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.workflow_execution_logs (
    execution_id,
    step_name,
    step_status,
    step_data,
    error_details
  ) VALUES (
    p_execution_id,
    p_step_name,
    p_step_status,
    p_step_data,
    p_error_details
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create workflow execution
CREATE OR REPLACE FUNCTION public.create_workflow_execution(
  p_workflow_type VARCHAR(50),
  p_payload JSONB DEFAULT '{}',
  p_max_retries INTEGER DEFAULT 3
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id UUID;
BEGIN
  INSERT INTO public.workflow_executions (
    workflow_type,
    payload,
    status,
    max_retries
  ) VALUES (
    p_workflow_type,
    p_payload,
    'pending',
    p_max_retries
  )
  RETURNING id INTO v_execution_id;
  
  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow status
CREATE OR REPLACE FUNCTION public.update_workflow_status(
  p_execution_id UUID,
  p_status VARCHAR(20),
  p_error_message TEXT DEFAULT NULL,
  p_increment_retry BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workflow_executions
  SET 
    status = p_status,
    error_message = COALESCE(p_error_message, error_message),
    retry_count = CASE 
      WHEN p_increment_retry THEN retry_count + 1 
      ELSE retry_count 
    END,
    next_retry_at = CASE 
      WHEN p_status = 'retrying' THEN NOW() + (retry_count + 1) * INTERVAL '5 minutes'
      ELSE next_retry_at
    END,
    completed_at = CASE 
      WHEN p_status IN ('completed', 'failed') THEN NOW()
      ELSE completed_at
    END,
    execution_duration_ms = CASE 
      WHEN p_status IN ('completed', 'failed') THEN 
        EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
      ELSE execution_duration_ms
    END
  WHERE id = p_execution_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending workflows for retry
CREATE OR REPLACE FUNCTION public.get_pending_workflows(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  workflow_type VARCHAR(50),
  payload JSONB,
  retry_count INTEGER,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    we.id,
    we.workflow_type,
    we.payload,
    we.retry_count,
    we.created_at
  FROM public.workflow_executions we
  WHERE we.status IN ('pending', 'retrying')
    AND (we.next_retry_at IS NULL OR we.next_retry_at <= NOW())
    AND we.retry_count < we.max_retries
  ORDER BY we.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access workflow tables
CREATE POLICY "Service role full access on workflow_executions"
  ON public.workflow_executions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on workflow_execution_logs"
  ON public.workflow_execution_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view workflow logs
CREATE POLICY "Admins can view workflow executions"
  ON public.workflow_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view workflow logs"
  ON public.workflow_execution_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.workflow_executions IS 'Tracks Upstash workflow execution status and retries';
COMMENT ON TABLE public.workflow_execution_logs IS 'Detailed step-by-step logs for workflow executions';
