-- ============================================================
-- Workflow Schedule Configuration Table
-- Purpose: Store configurable schedule settings for each workflow
-- This allows admin to set auto-run schedules or run manually
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workflow_schedule_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key VARCHAR(100) NOT NULL UNIQUE CHECK (workflow_key ~* '^[a-z0-9-]+$'),
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    endpoint_url VARCHAR(500) NOT NULL,
    cron_expression VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_enabled BOOLEAN DEFAULT true,
    is_auto_run BOOLEAN DEFAULT false,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_schedule_configs_key ON public.workflow_schedule_configs(workflow_key);
CREATE INDEX IF NOT EXISTS idx_workflow_schedule_configs_enabled ON public.workflow_schedule_configs(is_enabled, is_auto_run);
CREATE INDEX IF NOT EXISTS idx_workflow_schedule_configs_next_run 
  ON public.workflow_schedule_configs(next_run_at) 
  WHERE is_enabled = true AND is_auto_run = true;

-- RLS - Allow authenticated users (admins handled in API layer)
ALTER TABLE public.workflow_schedule_configs ENABLE ROW LEVEL SECURITY;

-- Read policy: Anyone authenticated can read
CREATE POLICY "Allow authenticated read workflow configs"
  ON public.workflow_schedule_configs FOR SELECT
  TO authenticated
  WITH CHECK (true);

-- Insert/Update/Delete: Only via service_role (handled in API)
-- This allows the API to manage configs while RLS provides read access

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS workflow_schedule_configs_updated_at ON public.workflow_schedule_configs;
CREATE TRIGGER workflow_schedule_configs_updated_at
  BEFORE UPDATE ON public.workflow_schedule_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Seed Default Workflow Configurations
-- ============================================================

INSERT INTO public.workflow_schedule_configs 
  (workflow_key, workflow_name, description, endpoint_url, cron_expression, timezone, is_enabled, is_auto_run)
VALUES 
  -- High priority - every 30 min
  ('execute-crypto', 'Crypto Market Data', 'Fetch crypto market data and update prices', '/api/workflows/execute-crypto', '*/30 * * * *', 'UTC', true, true),
  ('execute-sports', 'Sports Market Data', 'Fetch sports market data', '/api/workflows/execute-sports', '*/30 * * * *', 'UTC', true, true),
  ('market-close-check', 'Market Close Check', 'Check and close markets at trading end time', '/api/workflows/market-close-check', '*/30 * * * *', 'UTC', true, true),
  ('update-exchange-rate', 'USDT Exchange Rate', 'Update USDT/BDT exchange rate', '/api/workflows/update-exchange-rate', '*/30 * * * *', 'UTC', true, true),
  ('check-escalations', 'Check Escalations', 'Process escalated workflows and disputes', '/api/workflows/check-escalations', '*/30 * * * *', 'UTC', true, true),
  ('auto-verify', 'Auto Verification', 'Auto-verify markets with AI oracle', '/api/workflows/auto-verify', '*/30 * * * *', 'UTC', true, true),
  
  -- Medium priority - every hour
  ('execute-news', 'News Market Data', 'Fetch news and update news markets', '/api/workflows/execute-news', '0 * * * *', 'UTC', true, true),
  ('price-snapshot', 'Price Snapshot', 'Take hourly price snapshots for analytics', '/api/workflows/price-snapshot', '0 * * * *', 'UTC', true, true),
  ('analytics-daily', 'Daily Analytics', 'Calculate daily platform analytics', '/api/workflows/analytics/daily', '0 * * * *', 'UTC', true, true),
  
  -- Lower priority - once or twice daily
  ('batch-markets', 'Batch Markets', 'Process batch market operations', '/api/cron/batch-markets', '0 */2 * * *', 'UTC', true, true),
  ('sync-orphaned', 'Sync Orphaned Events', 'Sync orphaned events with external sources', '/api/cron/sync-orphaned-events', '0 */4 * * *', 'UTC', true, true),
  ('leaderboard', 'Leaderboard Update', 'Update user leaderboard rankings', '/api/leaderboard/cron', '0 0 * * *', 'UTC', true, true),
  ('daily-report', 'Daily Report', 'Generate and send daily platform report', '/api/workflows/daily-report', '30 1 * * *', 'UTC', true, true),
  ('cleanup-expired', 'Cleanup Expired Deposits', 'Clean up expired deposit requests', '/api/workflows/cleanup-expired', '0 3 * * *', 'UTC', true, true),
  
  -- AI Workflows - less frequent
  ('ai-topics', 'AI Daily Topics', 'Generate AI-powered daily topics', '/api/cron/daily-ai-topics', '30 0 * * *', 'UTC', true, true),
  ('dispute-workflow', 'Dispute Workflow', 'Process dispute resolutions', '/api/dispute-workflow', '0 */6 * * *', 'UTC', true, true),
  ('resolution-trigger', 'Resolution Trigger', 'Trigger market resolutions', '/api/workflows/resolution-trigger', '*/15 * * * *', 'UTC', true, true)
ON CONFLICT (workflow_key) DO NOTHING;

-- ============================================================
-- Function to calculate next run time from cron expression
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_next_run_at(
    p_cron_expression VARCHAR,
    p_timezone VARCHAR DEFAULT 'UTC'
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_next_run TIMESTAMPTZ;
    v_parts TEXT[];
    v_minute TEXT;
    v_hour TEXT;
    v_dom TEXT;
    v_month TEXT;
    v_dow TEXT;
BEGIN
    -- Simple cron parser for common patterns
    -- This is a basic implementation
    
    IF p_cron_expression IS NULL OR p_cron_expression = '' THEN
        RETURN NULL;
    END IF;
    
    -- Parse cron: minute hour dom month dow
    v_parts := string_to_array(p_cron_expression, ' ');
    
    IF array_length(v_parts, 1) < 5 THEN
        RETURN NULL;
    END IF;
    
    v_minute := v_parts[1];
    v_hour := v_parts[2];
    v_dom := v_parts[3];
    v_month := v_parts[4];
    v_dow := v_parts[5];
    
    -- Calculate next run based on cron pattern
    -- Start from now
    v_next_run := NOW() AT TIME ZONE p_timezone;
    
    -- Simple implementation: add minimum interval
    IF v_minute LIKE '*/%' THEN
        -- Every X minutes
        v_next_run := v_next_run + (interval '1 minute' * substring(v_minute FROM 3 FOR 2)::int);
    ELSIF v_hour LIKE '*/%' THEN
        -- Every X hours
        v_next_run := v_next_run + (interval '1 hour' * substring(v_hour FROM 3 FOR 2)::int);
    ELSIF v_dom = '0' AND v_dow = '*' THEN
        -- Daily at specific hour
        v_next_run := v_next_run + interval '1 day';
        -- Set to specific hour and minute
        v_next_run := date_trunc('day', v_next_run) + 
            (v_hour::int * interval '1 hour') + 
            (v_minute::int * interval '1 minute');
    ELSE
        -- Default: add 1 hour
        v_next_run := v_next_run + interval '1 hour';
    END IF;
    
    RETURN v_next_run AT TIME ZONE 'UTC';
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- Function to update workflow run stats
-- ============================================================

CREATE OR REPLACE FUNCTION log_workflow_run(
    p_workflow_key VARCHAR,
    p_status VARCHAR,
    p_error_message TEXT DEFAULT NULL,
    p_cpu_time_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_config RECORD;
BEGIN
    -- Get the workflow config
    SELECT * INTO v_config 
    FROM public.workflow_schedule_configs 
    WHERE workflow_key = p_workflow_key;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Update the config record
    UPDATE public.workflow_schedule_configs
    SET 
        last_run_at = NOW(),
        run_count = run_count + 1,
        failure_count = CASE 
            WHEN p_status = 'failed' THEN failure_count + 1 
            ELSE failure_count 
        END,
        last_error = p_error_message,
        next_run_at = calculate_next_run_at(cron_expression, timezone),
        updated_at = NOW()
    WHERE workflow_key = p_workflow_key;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

COMMENT ON TABLE public.workflow_schedule_configs IS 'Stores configurable schedule settings for each workflow - allows admin to set auto-run schedules or run manually';
