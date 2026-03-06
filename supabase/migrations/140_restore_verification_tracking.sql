-- Migration: Restore Verification Tracking Columns
-- Purpose: Fix analytics cron job by adding missing columns to workflow_executions
-- that were dropped during consolidation in migration 097.

BEGIN;

-- 1. Add missing columns to workflow_executions
ALTER TABLE public.workflow_executions 
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES public.verification_workflows(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS outcome VARCHAR(20) CHECK (outcome IN ('YES', 'NO', 'URCENTAIN', 'ESCALATED', 'yes', 'no', 'uncertain', 'escalated')),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
  ADD COLUMN IF NOT EXISTS mismatch_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sources JSONB,
  ADD COLUMN IF NOT EXISTS evidence JSONB,
  ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT false;

-- 2. Create indexes for the restored columns
CREATE INDEX IF NOT EXISTS idx_workflow_executions_event_id ON public.workflow_executions(event_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_outcome ON public.workflow_executions(outcome);

-- 3. Add comment to clarify the dual use of this table
COMMENT ON TABLE public.workflow_executions IS 'Tracks both automated system workflows and event verification history';

COMMIT;
