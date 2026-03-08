-- ============================================================
-- Migration 142b: Upstash QStash Infrastructure + n8n Migration
-- CRITICAL: Creates workflow tracking tables for QStash jobs
-- 
-- Replaces: n8n workflow automation
-- New tables: upstash_workflow_runs, workflow_dlq, workflow_schedules
-- ============================================================

BEGIN;

-- ===================================
-- STEP 1: Create upstash_workflow_runs table
-- ===================================
CREATE TABLE IF NOT EXISTS public.upstash_workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- QStash identifiers
    workflow_run_id TEXT UNIQUE NOT NULL,
    message_id TEXT,
    
    -- Event/Market linkage
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
    
    -- Workflow type and status
    workflow_type VARCHAR(50) NOT NULL CHECK (
        workflow_type IN (
            'event_creation',
            'market_resolution',
            'deposit_notification',
            'withdrawal_processing',
            'daily_report',
            'auto_verification',
            'exchange_rate_update',
            'price_snapshot',
            'market_close_check',
            'settlement',
            'ai_oracle',
            'batch_markets',
            'cleanup'
        )
    ),
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED')
    ),
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    
    -- Retry tracking
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Error handling
    error_message TEXT,
    error_details JSONB DEFAULT '{}'::jsonb,
    
    -- Payload and result
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    
    -- Execution metadata
    execution_time_ms INTEGER,
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 1,
    
    -- Source tracking (for migrated records)
    source VARCHAR(20) DEFAULT 'upstash' CHECK (source IN ('upstash', 'n8n_migrated', 'manual')),
    migrated_from_id TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for upstash_workflow_runs
CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_event_id 
    ON public.upstash_workflow_runs(event_id) 
    WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_market_id 
    ON public.upstash_workflow_runs(market_id) 
    WHERE market_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_status 
    ON public.upstash_workflow_runs(status);

CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_workflow_type 
    ON public.upstash_workflow_runs(workflow_type);

CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_workflow_run_id 
    ON public.upstash_workflow_runs(workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_created_at 
    ON public.upstash_workflow_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_next_run 
    ON public.upstash_workflow_runs(next_run_at) 
    WHERE next_run_at IS NOT NULL AND status IN ('PENDING', 'RETRYING');

COMMENT ON TABLE public.upstash_workflow_runs IS 'Tracks all Upstash QStash workflow executions';

-- ===================================
-- STEP 2: Create workflow_dlq (Dead Letter Queue)
-- ===================================
CREATE TABLE IF NOT EXISTS public.workflow_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to original workflow run
    workflow_run_id TEXT NOT NULL REFERENCES public.upstash_workflow_runs(workflow_run_id),
    
    -- Error details
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_code VARCHAR(50),
    
    -- Context
    failed_at TIMESTAMPTZ DEFAULT NOW(),
    failed_step VARCHAR(100),
    payload_snapshot JSONB DEFAULT '{}'::jsonb,
    
    -- Resolution tracking
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_action VARCHAR(20) CHECK (
        resolution_action IN ('retry', 'discard', 'manual_resolve', 'archived')
    ),
    resolution_notes TEXT,
    
    -- Retry attempts from DLQ
    retry_attempts INTEGER DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workflow_dlq
CREATE INDEX IF NOT EXISTS idx_workflow_dlq_workflow_run_id 
    ON public.workflow_dlq(workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_workflow_dlq_failed_at 
    ON public.workflow_dlq(failed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_dlq_resolved 
    ON public.workflow_dlq(resolved_at) 
    WHERE resolved_at IS NULL;

COMMENT ON TABLE public.workflow_dlq IS 'Dead Letter Queue for failed workflow executions';

-- ===================================
-- STEP 3: Create workflow_schedules table
-- ===================================
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schedule configuration
    schedule_id TEXT UNIQUE, -- QStash schedule ID
    name VARCHAR(100) NOT NULL UNIQUE,
    workflow_type VARCHAR(50) NOT NULL,
    
    -- Cron configuration
    cron_expression TEXT NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    
    -- Target endpoint
    endpoint_url TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'POST',
    headers JSONB DEFAULT '{}'::jsonb,
    default_payload JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20),
    next_run_at TIMESTAMPTZ,
    
    -- Statistics
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    
    -- Metadata
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workflow_schedules
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_active 
    ON public.workflow_schedules(is_active) 
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_type 
    ON public.workflow_schedules(workflow_type);

COMMENT ON TABLE public.workflow_schedules IS 'Stores QStash schedule configurations';

-- ===================================
-- STEP 4: Migrate data from n8n tables (if they exist)
-- ===================================
DO $$
BEGIN
    -- Check if n8n_resolutions table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'n8n_resolutions'
    ) THEN
        -- Migrate n8n resolution records
        INSERT INTO public.upstash_workflow_runs (
            workflow_run_id,
            event_id,
            market_id,
            workflow_type,
            status,
            started_at,
            completed_at,
            result,
            error_message,
            source,
            migrated_from_id
        )
        SELECT 
            COALESCE(n8n_execution_id, 'n8n-migrated-' || id::text) as workflow_run_id,
            event_id,
            market_id,
            'market_resolution' as workflow_type,
            CASE 
                WHEN resolved_at IS NOT NULL THEN 'COMPLETED'
                WHEN error_message IS NOT NULL THEN 'FAILED'
                ELSE 'CANCELLED'
            END as status,
            COALESCE(created_at, NOW()) as started_at,
            resolved_at as completed_at,
            jsonb_build_object(
                'outcome', outcome,
                'confidence', confidence_score,
                'sources', sources,
                'reasoning', reasoning
            ) as result,
            error_message,
            'n8n_migrated' as source,
            id::text as migrated_from_id
        FROM public.n8n_resolutions
        ON CONFLICT (workflow_run_id) DO NOTHING;
        
        RAISE NOTICE 'Migrated % records from n8n_resolutions', 
            (SELECT COUNT(*) FROM public.n8n_resolutions);
    ELSE
        RAISE NOTICE 'n8n_resolutions table does not exist, skipping migration';
    END IF;
END $$;

-- ===================================
-- STEP 5: Create updated_at trigger function
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_upstash_workflow_runs_updated_at ON public.upstash_workflow_runs;
CREATE TRIGGER trigger_upstash_workflow_runs_updated_at
    BEFORE UPDATE ON public.upstash_workflow_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_workflow_dlq_updated_at ON public.workflow_dlq;
CREATE TRIGGER trigger_workflow_dlq_updated_at
    BEFORE UPDATE ON public.workflow_dlq
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_workflow_schedules_updated_at ON public.workflow_schedules;
CREATE TRIGGER trigger_workflow_schedules_updated_at
    BEFORE UPDATE ON public.workflow_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- STEP 6: Enable RLS
-- ===================================
ALTER TABLE public.upstash_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow admin read workflow runs"
    ON public.upstash_workflow_runs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

CREATE POLICY "Allow admin read DLQ"
    ON public.workflow_dlq
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

CREATE POLICY "Allow admin manage DLQ"
    ON public.workflow_dlq
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

CREATE POLICY "Allow admin read schedules"
    ON public.workflow_schedules
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

-- Service role bypass
CREATE POLICY "Service role full access workflow runs"
    ON public.upstash_workflow_runs
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Service role full access DLQ"
    ON public.workflow_dlq
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Service role full access schedules"
    ON public.workflow_schedules
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ===================================
-- STEP 7: Create helper functions
-- ===================================

-- Function to record workflow start
CREATE OR REPLACE FUNCTION record_workflow_start(
    p_workflow_run_id TEXT,
    p_workflow_type VARCHAR,
    p_event_id UUID DEFAULT NULL,
    p_market_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_message_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.upstash_workflow_runs (
        workflow_run_id,
        message_id,
        workflow_type,
        event_id,
        market_id,
        status,
        payload,
        started_at
    ) VALUES (
        p_workflow_run_id,
        p_message_id,
        p_workflow_type,
        p_event_id,
        p_market_id,
        'RUNNING',
        p_payload,
        NOW()
    )
    ON CONFLICT (workflow_run_id) 
    DO UPDATE SET 
        status = 'RUNNING',
        started_at = NOW(),
        retry_count = public.upstash_workflow_runs.retry_count + 1,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record workflow completion
CREATE OR REPLACE FUNCTION record_workflow_complete(
    p_workflow_run_id TEXT,
    p_status VARCHAR,
    p_result JSONB DEFAULT '{}'::jsonb,
    p_error_message TEXT DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.upstash_workflow_runs
    SET 
        status = p_status,
        result = p_result,
        error_message = p_error_message,
        completed_at = NOW(),
        execution_time_ms = p_execution_time_ms,
        updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add to DLQ
CREATE OR REPLACE FUNCTION add_to_workflow_dlq(
    p_workflow_run_id TEXT,
    p_error_message TEXT,
    p_error_stack TEXT DEFAULT NULL,
    p_failed_step VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Get payload snapshot from workflow run
    INSERT INTO public.workflow_dlq (
        workflow_run_id,
        error_message,
        error_stack,
        failed_step,
        payload_snapshot
    )
    SELECT 
        p_workflow_run_id,
        p_error_message,
        p_error_stack,
        p_failed_step,
        COALESCE(payload, '{}'::jsonb)
    FROM public.upstash_workflow_runs
    WHERE workflow_run_id = p_workflow_run_id
    RETURNING id INTO v_id;
    
    -- Update workflow run status to FAILED
    UPDATE public.upstash_workflow_runs
    SET 
        status = 'FAILED',
        error_message = p_error_message,
        updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- STEP 8: Insert default schedules
-- ===================================
INSERT INTO public.workflow_schedules (name, workflow_type, cron_expression, endpoint_url, description)
VALUES 
    ('daily-market-close-check', 'market_close_check', '0 */6 * * *', '/api/cron/market-close-check', 'Check markets for closing every 6 hours'),
    ('daily-price-snapshot', 'price_snapshot', '0 */4 * * *', '/api/cron/price-snapshot', 'Take price snapshots every 4 hours'),
    ('daily-exchange-rate', 'exchange_rate_update', '*/5 * * * *', '/api/workflows/update-exchange-rate', 'Update exchange rate every 5 minutes'),
    ('daily-report', 'daily_report', '0 9 * * *', '/api/workflows/daily-report', 'Daily report at 9 AM Bangladesh time')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ===================================
-- POST-MIGRATION: Drop n8n tables after verification (run after 48h)
-- ===================================
-- Uncomment after full verification:
-- DROP TABLE IF EXISTS public.n8n_resolutions CASCADE;
-- DROP TABLE IF EXISTS public.n8n_executions CASCADE;
-- DROP TABLE IF EXISTS public.n8n_workflow_logs CASCADE;
