-- Migration: Workflow Consolidation Tracking Tables
-- Created: 2026-02-18
-- Purpose: Track workflow executions and admin triggers

-- Drop existing objects to avoid conflicts with stale schema
DROP VIEW IF EXISTS public.workflow_execution_summary CASCADE;
DROP TABLE IF EXISTS public.admin_workflow_triggers CASCADE;
DROP TABLE IF EXISTS public.workflow_executions CASCADE;

-- Table: workflow_executions
-- Tracks all automated workflow executions
CREATE TABLE public.workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  results JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for querying by workflow name and date
CREATE INDEX IF NOT EXISTS idx_workflow_executions_name_date 
  ON public.workflow_executions(workflow_name, created_at DESC);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status 
  ON public.workflow_executions(status, created_at DESC);

-- Table: admin_workflow_triggers
-- Tracks manual workflow triggers by admins
CREATE TABLE public.admin_workflow_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workflow_name VARCHAR(100) NOT NULL,
  endpoint TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
  response JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for querying by admin
CREATE INDEX IF NOT EXISTS idx_admin_workflow_triggers_admin 
  ON public.admin_workflow_triggers(admin_id, created_at DESC);

-- Index for querying by workflow
CREATE INDEX IF NOT EXISTS idx_admin_workflow_triggers_workflow 
  ON public.admin_workflow_triggers(workflow_name, created_at DESC);

-- RLS Policies for workflow_executions
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage workflow executions"
  ON public.workflow_executions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view workflow executions"
  ON public.workflow_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for admin_workflow_triggers
ALTER TABLE public.admin_workflow_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all workflow triggers"
  ON public.admin_workflow_triggers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Service role can insert workflow triggers"
  ON public.admin_workflow_triggers FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.workflow_executions IS 'Tracks automated workflow execution history';
COMMENT ON TABLE public.admin_workflow_triggers IS 'Tracks manual workflow triggers by admins';

-- Create a view for workflow execution summary
CREATE OR REPLACE VIEW public.workflow_execution_summary AS
SELECT 
  workflow_name,
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'partial') as partial,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  MAX(created_at) as last_execution,
  AVG(duration_ms) as avg_duration_ms
FROM public.workflow_executions
GROUP BY workflow_name;

-- Grant access to the view
GRANT SELECT ON public.workflow_execution_summary TO authenticated;
