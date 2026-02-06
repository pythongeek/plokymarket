-- Oracle System Migration (Industry Standard / Optimistic)

-- 1. Create text-based ENUM for resolution strategies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'resolution_source_type') THEN
        ALTER TABLE public.markets ADD COLUMN resolution_source_type VARCHAR(20) DEFAULT 'MANUAL' 
        CHECK (resolution_source_type IN ('AI', 'ADMIN', 'API', 'UMA', 'MANUAL'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'resolution_data') THEN
        ALTER TABLE public.markets ADD COLUMN resolution_data JSONB; 
    END IF;
END $$;

-- 2. Create Oracle Messages/Requests Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.oracle_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('initial', 'dispute', 'confirmation')),
    
    -- Proposal Data
    proposer_id UUID REFERENCES public.users(id),
    proposed_outcome VARCHAR(50), 
    confidence_score DECIMAL(5, 4), 
    evidence_text TEXT,
    evidence_urls TEXT[],
    ai_analysis JSONB,
    
    -- Economic Security (Optimistic Oracle)
    bond_amount DECIMAL(20, 2) DEFAULT 0,
    bond_currency VARCHAR(10) DEFAULT 'BDT',
    challenge_window_ends_at TIMESTAMPTZ,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'proposed', 'challenged', 'disputed', 'resolved', 'finalized', 'failed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    finalized_at TIMESTAMPTZ
);

-- 3. Create Oracle Disputes Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.oracle_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.oracle_requests(id) ON DELETE CASCADE,
    disputer_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Bond Logic
    bond_amount DECIMAL(20, 2) NOT NULL, -- Challenger matches or exceeds proposer bond
    
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
    
    -- Final Resolution by "High Court" (Admin/Token Holders)
    resolution_outcome VARCHAR(50), 
    resolved_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 4. Oracle Assertions (History of proposals for a request)
CREATE TABLE IF NOT EXISTS public.oracle_assertions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.oracle_requests(id) ON DELETE CASCADE,
    asserter_id UUID REFERENCES public.users(id),
    outcome VARCHAR(50) NOT NULL,
    bond_amount DECIMAL(20, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_current_best BOOLEAN DEFAULT false
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_oracle_requests_market ON public.oracle_requests(market_id);
CREATE INDEX IF NOT EXISTS idx_oracle_requests_status ON public.oracle_requests(status);
CREATE INDEX IF NOT EXISTS idx_oracle_requests_challenge_end ON public.oracle_requests(challenge_window_ends_at);
CREATE INDEX IF NOT EXISTS idx_oracle_disputes_request ON public.oracle_disputes(request_id);
