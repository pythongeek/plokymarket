-- Activity Feed Migration

CREATE TYPE public.activity_type AS ENUM (
    'TRADE', 
    'MARKET_CREATE', 
    'MARKET_RESOLVE', 
    'LEAGUE_UP', 
    'LEAGUE_DOWN',
    'COMMENT',
    'USER_JOIN'
);

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    
    -- Generic JSON payload for flexibility
    -- e.g. { "marketId": "...", "marketQuestion": "...", "amount": 100, "outcome": "YES" }
    data JSONB NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast feed retrieval
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id);
