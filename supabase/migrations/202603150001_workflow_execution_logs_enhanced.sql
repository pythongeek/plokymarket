-- ============================================================
-- Workflow Execution Logging Enhancement
-- Purpose: Track detailed execution logs for each workflow run
-- This helps monitor CPU usage and debug issues
-- ============================================================

-- Add execution tracking columns to workflow_executions if it exists
-- Note: This will fail gracefully if the table doesn't exist or columns already exist

DO $$ 
BEGIN
    -- Try to add columns to workflow_executions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_executions' AND table_schema = 'public') THEN
        ALTER TABLE public.workflow_executions
        ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(20) DEFAULT 'scheduled',
        ADD COLUMN IF NOT EXISTS trigger_admin_id UUID,
        ADD COLUMN IF NOT EXISTS cpu_time_ms INTEGER,
        ADD COLUMN IF NOT EXISTS memory_used_mb INTEGER;
        
        -- Add index on trigger_source for filtering
        CREATE INDEX IF NOT EXISTS idx_workflow_executions_trigger_source 
        ON public.workflow_executions(trigger_source);
    END IF;
END $$;

-- ============================================================
-- Create table for tracking each workflow's individual runs
-- This provides detailed logging without bloating workflow_executions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workflow_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key VARCHAR(100) NOT NULL,
    execution_id UUID, -- Can link to workflow_executions if available
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
    error_message TEXT,
    cpu_time_ms INTEGER,
    memory_used_mb INTEGER,
    rows_processed INTEGER DEFAULT 0,
    api_response_code INTEGER,
    api_response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_workflow_run_logs_workflow 
  ON public.workflow_run_logs(workflow_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_run_logs_status 
  ON public.workflow_run_logs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_run_logs_completed 
  ON public.workflow_run_logs(completed_at) 
  WHERE status = 'running';

-- RLS
ALTER TABLE public.workflow_run_logs ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone authenticated can read
CREATE POLICY "Allow authenticated read workflow run logs"
  ON public.workflow_run_logs FOR SELECT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- Function to start a workflow run log
-- ============================================================

CREATE OR REPLACE FUNCTION start_workflow_run_log(
    p_workflow_key VARCHAR,
    p_execution_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.workflow_run_logs (workflow_key, execution_id, status, started_at)
    VALUES (p_workflow_key, p_execution_id, 'running', NOW())
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- Function to complete a workflow run log
-- ============================================================

CREATE OR REPLACE FUNCTION complete_workflow_run_log(
    p_log_id UUID,
    p_status VARCHAR,
    p_error_message TEXT DEFAULT NULL,
    p_cpu_time_ms INTEGER DEFAULT NULL,
    p_memory_used_mb INTEGER DEFAULT NULL,
    p_rows_processed INTEGER DEFAULT 0,
    p_api_response_code INTEGER DEFAULT NULL,
    p_api_response_time_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE public.workflow_run_logs
    SET 
        completed_at = NOW(),
        status = p_status,
        error_message = p_error_message,
        cpu_time_ms = p_cpu_time_ms,
        memory_used_mb = p_memory_used_mb,
        rows_processed = p_rows_processed,
        api_response_code = p_api_response_code,
        api_response_time_ms = p_api_response_time_ms
    WHERE id = p_log_id;
    
    -- Also log to workflow_schedule_configs
    PERFORM log_workflow_run(
        (SELECT workflow_key FROM public.workflow_run_logs WHERE id = p_log_id),
        p_status,
        p_error_message,
        p_cpu_time_ms
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- Function to get workflow statistics
-- ============================================================

CREATE OR REPLACE FUNCTION get_workflow_stats(
    p_workflow_key VARCHAR DEFAULT NULL,
    p_days INTEGER DEFAULT 7
) RETURNS TABLE (
    workflow_key VARCHAR,
    total_runs INTEGER,
    successful_runs INTEGER,
    failed_runs INTEGER,
    avg_cpu_time_ms NUMERIC,
    avg_response_time_ms NUMERIC,
    last_run_at TIMESTAMPTZ,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.workflow_key,
        COUNT(*)::INTEGER AS total_runs,
        COUNT(*) FILTER (WHERE w.status = 'success')::INTEGER AS successful_runs,
        COUNT(*) FILTER (WHERE w.status = 'failed')::INTEGER AS failed_runs,
        AVG(w.cpu_time_ms)::NUMERIC(10,2) AS avg_cpu_time_ms,
        AVG(w.api_response_time_ms)::NUMERIC(10,2) AS avg_response_time_ms,
        MAX(w.started_at) AS last_run_at,
        (COUNT(*) FILTER (WHERE w.status = 'success')::NUMERIC / NULLIF(COUNT(*), 0) * 100)::NUMERIC(5,2) AS success_rate
    FROM public.workflow_run_logs w
    WHERE w.created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND (p_workflow_key IS NULL OR w.workflow_key = p_workflow_key)
    GROUP BY w.workflow_key
    ORDER BY total_runs DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

COMMENT ON TABLE public.workflow_run_logs IS 'Detailed logging for each workflow execution run - helps monitor CPU usage and debug issues';
COMMENT ON FUNCTION get_workflow_stats IS 'Get workflow execution statistics for the last N days';
