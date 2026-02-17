-- ===============================================
-- Market Resolution System Migration
-- ===============================================

-- 1. Cleanup legacy tables as requested
DROP TABLE IF EXISTS public.oracle_verifications CASCADE;
DROP TABLE IF EXISTS public.oracle_disputes CASCADE;
DROP TABLE IF EXISTS public.oracle_assertions CASCADE;
DROP TABLE IF EXISTS public.oracle_requests CASCADE;

-- 2. Create the unified resolution_systems table
CREATE TABLE public.resolution_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  
  primary_method VARCHAR(50) NOT NULL CHECK (
    primary_method IN ('ai_oracle', 'manual_admin', 'expert_panel', 'dispute_tribunal', 'external_oracle')
  ),
  fallback_methods VARCHAR(50)[] DEFAULT ARRAY['manual_admin'],
  
  ai_oracle_config JSONB DEFAULT '{
    "sources": ["prothomalo.com", "thedailystar.net", "bdnews24.com"],
    "keywords": [],
    "confidence_threshold": 90,
    "min_sources_required": 2
  }'::jsonb,
  
  assigned_experts UUID[],
  expert_votes JSONB DEFAULT '[]'::jsonb,
  expert_consensus_threshold NUMERIC(3, 2) DEFAULT 0.75,
  
  dispute_count INTEGER DEFAULT 0,
  disputes JSONB DEFAULT '[]'::jsonb,
  dispute_bond_amount NUMERIC(10, 2) DEFAULT 100.00,
  
  external_oracle_type VARCHAR(50), 
  external_api_endpoint TEXT,
  external_api_key_encrypted TEXT,
  external_last_check TIMESTAMPTZ,
  
  resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (
    resolution_status IN ('pending', 'in_progress', 'resolved', 'disputed', 'failed')
  ),
  
  proposed_outcome INTEGER CHECK (proposed_outcome IN (1, 2, NULL)), -- 1 = YES, 2 = NO
  confidence_level NUMERIC(5, 2),
  evidence JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT unique_event_resolution UNIQUE (event_id)
);

-- 3. Create Supporting Tables (Registry)
CREATE TABLE IF NOT EXISTS public.expert_panel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  expert_name VARCHAR(100) NOT NULL,
  specializations VARCHAR(50)[] NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  total_votes INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_expert_user_v2 UNIQUE (user_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_resolution_event ON public.resolution_systems(event_id);
CREATE INDEX IF NOT EXISTS idx_resolution_status ON public.resolution_systems(resolution_status);

-- 5. RLS Policies
ALTER TABLE public.resolution_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_panel ENABLE ROW LEVEL SECURITY;

-- Select: Public (Anyone can view resolution status)
CREATE POLICY "Public can view resolution systems"
  ON public.resolution_systems FOR SELECT
  TO public
  USING (true);

-- Manage: Admin only
CREATE POLICY "Admins can manage resolution systems"
  ON public.resolution_systems FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_pro = TRUE)
  );

-- Expert Panel Policies
CREATE POLICY "Experts are public"
  ON public.expert_panel FOR SELECT
  TO public
  USING (true);

-- 6. Functions & Triggers
CREATE OR REPLACE FUNCTION public.sync_resolution_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_resolution_updated_at
  BEFORE UPDATE ON public.resolution_systems
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_resolution_updated_at();
