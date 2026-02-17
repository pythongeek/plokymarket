-- ===============================================
-- PRODUCTION RESOLUTION SYSTEM MIGRATION
-- Simplified version for compatibility
-- ===============================================

-- 1. Cleanup legacy tables
DROP TABLE IF EXISTS public.oracle_verifications CASCADE;
DROP TABLE IF EXISTS public.oracle_disputes CASCADE;
DROP TABLE IF EXISTS public.oracle_assertions CASCADE;
DROP TABLE IF EXISTS public.oracle_requests CASCADE;

-- 2. Create new tables only (resolution_systems already exists from 082)

-- AI Resolution Pipelines
CREATE TABLE IF NOT EXISTS public.ai_resolution_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id VARCHAR(100) UNIQUE NOT NULL,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  query JSONB,
  retrieval_output JSONB,
  synthesis_output JSONB,
  deliberation_output JSONB,
  explanation_output JSONB,
  final_outcome VARCHAR(10),
  final_confidence NUMERIC(5, 2),
  confidence_level VARCHAR(20),
  recommended_action VARCHAR(50),
  status VARCHAR(20) DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_execution_time_ms INTEGER,
  synthesis_model_version TEXT,
  deliberation_model_version TEXT,
  explanation_model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human Review Queue
CREATE TABLE IF NOT EXISTS public.human_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES public.ai_resolution_pipelines(id),
  ai_proposed_outcome VARCHAR(10),
  ai_confidence NUMERIC(5, 2),
  ai_reasoning TEXT,
  evidence_summary JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  final_outcome VARCHAR(10),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_market_review UNIQUE (market_id)
);

-- Expert Panel
CREATE TABLE IF NOT EXISTS public.expert_panel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  expert_name VARCHAR(100) NOT NULL,
  specializations VARCHAR(50)[],
  is_verified BOOLEAN DEFAULT FALSE,
  total_votes INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_expert_user UNIQUE (user_id)
);

-- Resolution Audit Log
CREATE TABLE IF NOT EXISTS public.resolution_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_market ON public.ai_resolution_pipelines(market_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON public.ai_resolution_pipelines(status);
CREATE INDEX IF NOT EXISTS idx_review_status ON public.human_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_assigned ON public.human_review_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_audit_market ON public.resolution_audit_log(market_id);

-- 4. Enable RLS
ALTER TABLE public.ai_resolution_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_panel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_audit_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- AI Pipeline Policies
DROP POLICY IF EXISTS "ai_pipeline_select" ON public.ai_resolution_pipelines;
DROP POLICY IF EXISTS "ai_pipeline_admin" ON public.ai_resolution_pipelines;

CREATE POLICY "ai_pipeline_select"
  ON public.ai_resolution_pipelines FOR SELECT
  TO public USING (true);

CREATE POLICY "ai_pipeline_admin"
  ON public.ai_resolution_pipelines FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

-- Human Review Queue Policies
DROP POLICY IF EXISTS "review_queue_admin" ON public.human_review_queue;

CREATE POLICY "review_queue_admin"
  ON public.human_review_queue FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

-- Expert Panel Policies
DROP POLICY IF EXISTS "expert_select" ON public.expert_panel;
DROP POLICY IF EXISTS "expert_admin" ON public.expert_panel;

CREATE POLICY "expert_select"
  ON public.expert_panel FOR SELECT
  TO public USING (true);

CREATE POLICY "expert_admin"
  ON public.expert_panel FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

-- Audit Log Policies
DROP POLICY IF EXISTS "audit_admin" ON public.resolution_audit_log;

CREATE POLICY "audit_admin"
  ON public.resolution_audit_log FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

-- 6. Functions

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.sync_resolution_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS tr_pipeline_updated_at ON public.ai_resolution_pipelines;
DROP TRIGGER IF EXISTS tr_review_updated_at ON public.human_review_queue;
DROP TRIGGER IF EXISTS tr_auto_resolve ON public.ai_resolution_pipelines;
DROP TRIGGER IF EXISTS tr_create_review ON public.ai_resolution_pipelines;

-- Create triggers
CREATE TRIGGER tr_pipeline_updated_at
  BEFORE UPDATE ON public.ai_resolution_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.sync_resolution_updated_at();

CREATE TRIGGER tr_review_updated_at
  BEFORE UPDATE ON public.human_review_queue
  FOR EACH ROW EXECUTE FUNCTION public.sync_resolution_updated_at();

-- Auto-resolve function
CREATE OR REPLACE FUNCTION public.auto_resolve_market()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.recommended_action = 'AUTO_RESOLVE' AND NEW.final_outcome IS NOT NULL THEN
    
    UPDATE public.markets
    SET status = 'resolved',
        winning_outcome = NEW.final_outcome,
        resolved_at = NOW(),
        resolution_details = jsonb_build_object('source', 'AI_ORACLE', 'confidence', NEW.final_confidence, 'auto_resolved', true)
    WHERE id = NEW.market_id;
    
    UPDATE public.resolution_systems
    SET resolution_status = 'resolved',
        proposed_outcome = CASE NEW.final_outcome WHEN 'YES' THEN 1 WHEN 'NO' THEN 2 END,
        confidence_level = NEW.final_confidence,
        resolved_at = NOW()
    WHERE event_id = NEW.market_id;
    
    INSERT INTO public.resolution_audit_log (market_id, action, details)
    VALUES (NEW.market_id, 'AUTO_RESOLVED', jsonb_build_object('outcome', NEW.final_outcome, 'confidence', NEW.final_confidence));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_auto_resolve
  AFTER UPDATE ON public.ai_resolution_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.auto_resolve_market();

-- Create human review function
CREATE OR REPLACE FUNCTION public.create_human_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recommended_action = 'HUMAN_REVIEW' THEN
    INSERT INTO public.human_review_queue (market_id, pipeline_id, ai_proposed_outcome, ai_confidence, status)
    VALUES (NEW.market_id, NEW.id, NEW.final_outcome, NEW.final_confidence, 'pending')
    ON CONFLICT (market_id) DO UPDATE
    SET pipeline_id = NEW.id, ai_proposed_outcome = NEW.final_outcome, ai_confidence = NEW.final_confidence, status = 'pending', updated_at = NOW();
    
    UPDATE public.resolution_systems
    SET resolution_status = 'in_progress'
    WHERE event_id = NEW.market_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_create_review
  AFTER INSERT ON public.ai_resolution_pipelines
  FOR EACH ROW EXECUTE FUNCTION public.create_human_review();

-- Manual resolve function
CREATE OR REPLACE FUNCTION public.manual_resolve_market(p_market_id UUID, p_outcome VARCHAR(10), p_admin_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
  IF p_outcome NOT IN ('YES', 'NO') THEN
    RAISE EXCEPTION 'Invalid outcome. Must be YES or NO';
  END IF;
  
  UPDATE public.markets
  SET status = 'resolved', winning_outcome = p_outcome, resolved_at = NOW(),
      resolution_details = jsonb_build_object('source', 'MANUAL_ADMIN', 'resolved_by', p_admin_id, 'notes', p_notes)
  WHERE id = p_market_id;
  
  UPDATE public.resolution_systems
  SET resolution_status = 'resolved', proposed_outcome = CASE p_outcome WHEN 'YES' THEN 1 WHEN 'NO' THEN 2 END, resolved_at = NOW()
  WHERE event_id = p_market_id;
  
  UPDATE public.human_review_queue
  SET status = 'approved', final_outcome = p_outcome, reviewer_notes = p_notes, reviewed_at = NOW()
  WHERE market_id = p_market_id;
  
  INSERT INTO public.resolution_audit_log (market_id, action, performed_by, details)
  VALUES (p_market_id, 'MANUAL_RESOLVED', p_admin_id, jsonb_build_object('outcome', p_outcome, 'notes', p_notes));
  
  RETURN jsonb_build_object('success', true, 'market_id', p_market_id, 'outcome', p_outcome);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Admin Dashboard View
CREATE OR REPLACE VIEW public.admin_resolution_dashboard AS
SELECT 
  m.id as market_id, m.question, m.category, m.status as market_status,
  m.trading_closes_at, m.event_date, rs.resolution_status, rs.primary_method,
  rs.proposed_outcome, rs.confidence_level, rs.resolved_at,
  hrq.status as review_status, hrq.ai_confidence, hrq.ai_proposed_outcome,
  hrq.assigned_to, hrq.priority, p.pipeline_id, p.final_outcome as ai_outcome,
  p.recommended_action, p.status as pipeline_status
FROM public.markets m
LEFT JOIN public.resolution_systems rs ON m.id = rs.event_id
LEFT JOIN public.human_review_queue hrq ON m.id = hrq.market_id
LEFT JOIN public.ai_resolution_pipelines p ON m.id = p.market_id
WHERE m.status IN ('closed', 'resolved') OR (m.status = 'active' AND m.trading_closes_at < NOW());

GRANT SELECT ON public.admin_resolution_dashboard TO authenticated;
