-- ============================================================
-- Migration 142c: Workflow Monitoring Views
-- Optional but recommended: Dashboard views for workflow monitoring
-- ============================================================

BEGIN;

-- ===================================
-- STEP 1: Create workflow_status_summary view
-- ===================================
CREATE OR REPLACE VIEW public.workflow_status_summary AS
SELECT 
    workflow_type,
    status,
    COUNT(*) as count,
    MIN(started_at) as oldest_started,
    MAX(started_at) as newest_started,
    AVG(execution_time_ms) as avg_execution_time_ms
FROM public.upstash_workflow_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY workflow_type, status;

COMMENT ON VIEW public.workflow_status_summary IS 'Summary of workflow runs by type and status for the last 7 days';

-- ===================================
-- STEP 2: Create workflow_daily_stats view
-- ===================================
CREATE OR REPLACE VIEW public.workflow_daily_stats AS
SELECT 
    DATE(created_at) as date,
    workflow_type,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as successful,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
    COUNT(*) FILTER (WHERE status = 'RETRYING') as retrying,
    AVG(execution_time_ms) FILTER (WHERE status = 'COMPLETED') as avg_success_time_ms,
    AVG(retry_count) as avg_retries
FROM public.upstash_workflow_runs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), workflow_type
ORDER BY date DESC, workflow_type;

COMMENT ON VIEW public.workflow_daily_stats IS 'Daily workflow statistics for trending analysis';

-- ===================================
-- STEP 3: Create dlq_pending_issues view
-- ===================================
CREATE OR REPLACE VIEW public.dlq_pending_issues AS
SELECT 
    dlq.id as dlq_id,
    dlq.workflow_run_id,
    dlq.error_message,
    dlq.failed_step,
    dlq.failed_at,
    dlq.retry_attempts,
    run.workflow_type,
    run.event_id,
    run.market_id,
    run.payload,
    EXTRACT(EPOCH FROM (NOW() - dlq.failed_at))/3600 as hours_pending
FROM public.workflow_dlq dlq
JOIN public.upstash_workflow_runs run ON run.workflow_run_id = dlq.workflow_run_id
WHERE dlq.resolved_at IS NULL
ORDER BY dlq.failed_at ASC;

COMMENT ON VIEW public.dlq_pending_issues IS 'Unresolved items in the Dead Letter Queue';

-- ===================================
-- STEP 4: Create event_workflow_status view
-- ===================================
CREATE OR REPLACE VIEW public.event_workflow_status AS
SELECT 
    e.id as event_id,
    e.title,
    e.status as event_status,
    COUNT(wfr.id) FILTER (WHERE wfr.workflow_type = 'event_creation') as creation_workflows,
    COUNT(wfr.id) FILTER (WHERE wfr.workflow_type = 'market_resolution') as resolution_workflows,
    MAX(wfr.created_at) as last_workflow_at,
    STRING_AGG(DISTINCT wfr.status, ', ') as workflow_statuses
FROM public.events e
LEFT JOIN public.upstash_workflow_runs wfr ON wfr.event_id = e.id
GROUP BY e.id, e.title, e.status;

COMMENT ON VIEW public.event_workflow_status IS 'Workflow status linked to events';

-- ===================================
-- STEP 5: Create workflow_health_check function
-- ===================================
CREATE OR REPLACE FUNCTION public.workflow_health_check()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT,
    severity TEXT
) AS $$
BEGIN
    -- Check for stuck workflows (running > 1 hour)
    RETURN QUERY
    SELECT 
        'Stuck Workflows'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' workflows running > 1 hour'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 5 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.upstash_workflow_runs
    WHERE status = 'RUNNING'
    AND started_at < NOW() - INTERVAL '1 hour';

    -- Check for DLQ backlog
    RETURN QUERY
    SELECT 
        'DLQ Backlog'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 10 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' unresolved items in DLQ'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 10 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.workflow_dlq
    WHERE resolved_at IS NULL;

    -- Check for recent failures
    RETURN QUERY
    SELECT 
        'Recent Failures (24h)'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 10 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' failed workflows in last 24h'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 10 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.upstash_workflow_runs
    WHERE status = 'FAILED'
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Check for orphaned runs (no event_id or market_id)
    RETURN QUERY
    SELECT 
        'Orphaned Workflow Runs'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'OK'
            WHEN COUNT(*) < 20 THEN 'WARNING'
            ELSE 'CRITICAL'
        END::TEXT,
        COUNT(*) || ' runs without event/market linkage'::TEXT,
        CASE 
            WHEN COUNT(*) = 0 THEN 'info'
            WHEN COUNT(*) < 20 THEN 'warning'
            ELSE 'critical'
        END::TEXT
    FROM public.upstash_workflow_runs
    WHERE event_id IS NULL 
    AND market_id IS NULL
    AND created_at > NOW() - INTERVAL '7 days';

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.workflow_health_check() IS 'Returns workflow system health status';

-- ===================================
-- STEP 6: Grant permissions on views
-- ===================================
GRANT SELECT ON public.workflow_status_summary TO authenticated;
GRANT SELECT ON public.workflow_daily_stats TO authenticated;
GRANT SELECT ON public.dlq_pending_issues TO authenticated;
GRANT SELECT ON public.event_workflow_status TO authenticated;

-- ===================================
-- STEP 7: Create indexes for performance
-- ===================================
CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_created_at_status 
    ON public.upstash_workflow_runs(created_at DESC, status);

COMMIT;
