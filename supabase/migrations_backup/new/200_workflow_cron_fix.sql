-- ===============================================
-- Workflow Cron Fix Migration
-- Fixes: CPU Usage, Database Missing Tables, AI Topics Failure
-- Created: 2026-03-15
-- ===============================================

-- ===============================================
-- STEP 1: Create workflow_configs table (idempotent)
-- ===============================================

CREATE TABLE IF NOT EXISTS public.workflow_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    endpoint TEXT NOT NULL,
    cron_expression TEXT DEFAULT '0 */4 * * *',
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    last_status TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_is_active ON public.workflow_configs(is_active);

ALTER TABLE public.workflow_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Service role full access workflow_configs" ON public.workflow_configs;
DROP POLICY IF EXISTS "Admin read workflow_configs" ON public.workflow_configs;

CREATE POLICY "Service role full access workflow_configs"
    ON public.workflow_configs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin read workflow_configs"
    ON public.workflow_configs FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true));

-- ===============================================
-- STEP 2: Insert default workflow configurations
-- ===============================================

INSERT INTO public.workflow_configs (name, endpoint, cron_expression, is_active) VALUES
('Batch Markets', '/api/cron/batch-markets', '0 23 * * 6', true),
('Sync Orphaned', '/api/cron/sync-orphaned-events', '0 18 * * *', true),
('Dispute Workflow', '/api/dispute-workflow', '0 18 * * *', true),
('Leaderboard', '/api/leaderboard/cron', '0 18 * * *', true),
('Analytics', '/api/workflows/analytics/daily', '0 23 * * *', true),
('Auto Verify', '/api/workflows/auto-verify', '0 23 * * *', true),
('Escalations', '/api/workflows/check-escalations', '0 23 * * *', true),
('Cleanup Deposits', '/api/workflows/cleanup-expired', '0 18 * * *', true),
('Daily Report', '/api/workflows/daily-report', '0 9 * * *', true),
('Crypto Market', '/api/workflows/execute-crypto', '0 */4 * * *', true),
('News Market', '/api/workflows/execute-news', '0 */6 * * *', true),
('Sports', '/api/workflows/execute-sports', '0 */4 * * *', true),
('Market Close', '/api/workflows/market-close-check', '0 */2 * * *', true),
('Price Snapshot', '/api/workflows/price-snapshot', '0 * * * *', true),
('Exchange Rate', '/api/workflows/update-exchange-rate', '0 */2 * * *', true),
('AI Topics', '/api/cron/daily-ai-topics', '0 6 * * *', true)
ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- STEP 3: Fix AI Topics - Ensure admin_ai_settings table exists
-- ===============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_ai_settings' AND table_schema = 'public') THEN
        CREATE TABLE public.admin_ai_settings (
            id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
            custom_instruction TEXT DEFAULT 'Generate engaging prediction market topics relevant to Bangladesh users',
            target_region VARCHAR(50) DEFAULT 'Bangladesh',
            default_categories VARCHAR(50)[] DEFAULT ARRAY['Sports', 'Politics', 'Economy', 'Entertainment'],
            auto_generate_enabled BOOLEAN DEFAULT FALSE,
            auto_generate_time TIME DEFAULT '08:00:00',
            max_daily_topics INTEGER DEFAULT 5,
            gemini_model VARCHAR(50) DEFAULT 'gemini-1.5-flash',
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            updated_by UUID REFERENCES auth.users(id)
        );
        
        ALTER TABLE public.admin_ai_settings ENABLE ROW LEVEL SECURITY;
        
        -- Drop if exists for idempotency
        DROP POLICY IF EXISTS "Service role full access admin_ai_settings" ON public.admin_ai_settings;
        
        CREATE POLICY "Service role full access admin_ai_settings"
            ON public.admin_ai_settings FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        
        INSERT INTO public.admin_ai_settings (id, auto_generate_enabled) VALUES (1, true);
        
        RAISE NOTICE 'Created admin_ai_settings table';
    ELSE
        RAISE NOTICE 'admin_ai_settings already exists - ensuring auto_generate_enabled is true';
        -- Ensure auto_generate is enabled
        UPDATE public.admin_ai_settings SET auto_generate_enabled = true WHERE id = 1;
    END IF;
END $$;

-- ===============================================
-- STEP 4: Update cron frequencies (if table exists)
-- ===============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_schedule_configs' AND table_schema = 'public') THEN
        UPDATE public.workflow_schedule_configs 
        SET cron_expression = '0 */2 * * *', 
            updated_at = NOW()
        WHERE workflow_key = 'update-exchange-rate';

        RAISE NOTICE 'Updated workflow_schedule_configs cron frequencies';
    ELSE
        RAISE NOTICE 'workflow_schedule_configs table not found - skipping cron update';
    END IF;
END $$;

-- ===============================================
-- STEP 5: Create diagnostic function for workflow health
-- ===============================================

CREATE OR REPLACE FUNCTION public.check_workflow_health()
RETURNS TABLE (
    workflow_key VARCHAR,
    current_status VARCHAR,
    next_run TIMESTAMPTZ,
    last_run TIMESTAMPTZ,
    is_healthy BOOLEAN,
    issues TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_schedule_configs' AND table_schema = 'public') THEN
        RETURN QUERY
        SELECT 
            w.workflow_key,
            w.status::VARCHAR,
            w.next_run_at,
            w.last_run_at,
            CASE 
                WHEN w.status = 'active' AND w.is_enabled = true AND w.is_auto_run = true THEN true
                ELSE false
            END AS is_healthy,
            CASE 
                WHEN w.status != 'active' THEN 'Workflow is not active'
                WHEN w.is_enabled = false THEN 'Workflow is disabled'
                WHEN w.is_auto_run = false THEN 'Auto-run is disabled'
                WHEN w.next_run_at < NOW() - INTERVAL '1 hour' THEN 'Next run is overdue'
                ELSE NULL
            END AS issues
        FROM public.workflow_schedule_configs w
        ORDER BY w.workflow_key;
    ELSE
        RETURN QUERY
        SELECT 
            'N/A'::VARCHAR AS workflow_key,
            'table_missing'::VARCHAR AS current_status,
            NULL::TIMESTAMPTZ AS next_run,
            NULL::TIMESTAMPTZ AS last_run,
            false::BOOLEAN AS is_healthy,
            'workflow_schedule_configs table does not exist'::TEXT AS issues;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_workflow_health() TO authenticated;

-- ===============================================
-- STEP 6: Create diagnostic function for AI Topics
-- ===============================================

CREATE OR REPLACE FUNCTION public.check_ai_topics_health()
RETURNS TABLE (
    check_name VARCHAR,
    status VARCHAR,
    details TEXT,
    is_healthy BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_ai_settings' AND table_schema = 'public') THEN
        RETURN QUERY
        SELECT 
            'admin_ai_settings exists'::VARCHAR AS check_name,
            'OK'::VARCHAR AS status,
            'Table exists'::TEXT AS details,
            true::BOOLEAN AS is_healthy
        UNION ALL
        SELECT 
            'auto_generate_enabled'::VARCHAR,
            CASE WHEN (SELECT auto_generate_enabled FROM public.admin_ai_settings WHERE id = 1) = true THEN 'ENABLED' ELSE 'DISABLED' END,
            'Auto-generation setting'::TEXT,
            (SELECT auto_generate_enabled FROM public.admin_ai_settings WHERE id = 1) = true
        UNION ALL
        SELECT 
            'gemini_api_configured'::VARCHAR,
            CASE WHEN (SELECT gemini_model FROM public.admin_ai_settings WHERE id = 1) IS NOT NULL THEN 'OK' ELSE 'MISSING' END,
            'AI model configuration'::TEXT,
            (SELECT gemini_model FROM public.admin_ai_settings WHERE id = 1) IS NOT NULL;
    ELSE
        RETURN QUERY
        SELECT 
            'admin_ai_settings'::VARCHAR AS check_name,
            'MISSING'::VARCHAR AS status,
            'Table does not exist'::TEXT AS details,
            false::BOOLEAN AS is_healthy;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_ai_topics_health() TO authenticated;

-- ===============================================
-- Summary
-- ===============================================
