-- Migration 143b: Upstash Workflows Base Tables
-- Replaces n8n execution tracking

BEGIN;

-- Table for tracking generic Upstash Workflow execution runs
DROP TABLE IF EXISTS public.upstash_workflow_runs CASCADE;
CREATE TABLE public.upstash_workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL,
    qstash_message_id TEXT,
    status TEXT DEFAULT 'queued',
    retry_count INT DEFAULT 0,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Index for querying runs by event or status
CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_event ON public.upstash_workflow_runs(event_id);
CREATE INDEX IF NOT EXISTS idx_upstash_workflow_runs_status ON public.upstash_workflow_runs(status);

-- Dead Letter Queue (DLQ) for failed workflows
DROP TABLE IF EXISTS public.workflow_dlq CASCADE;
CREATE TABLE public.workflow_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    workflow_type TEXT NOT NULL,
    payload JSONB,
    error TEXT,
    failed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_dlq_event ON public.workflow_dlq(event_id);

-- RLS Policies
ALTER TABLE public.upstash_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_dlq ENABLE ROW LEVEL SECURITY;

-- Admins can view runs
DROP POLICY IF EXISTS "Admins can view workflow runs" ON public.upstash_workflow_runs;
CREATE POLICY "Admins can view workflow runs"
    ON public.upstash_workflow_runs FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Service role bypasses RLS
DROP POLICY IF EXISTS "Service role bypass workflow runs" ON public.upstash_workflow_runs;
CREATE POLICY "Service role bypass workflow runs" ON public.upstash_workflow_runs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role bypass dlq" ON public.workflow_dlq;
CREATE POLICY "Service role bypass dlq" ON public.workflow_dlq FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
