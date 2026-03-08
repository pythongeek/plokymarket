-- Comments System Migration

CREATE TABLE IF NOT EXISTS public.market_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.market_comments(id) ON DELETE CASCADE, -- For nested threading
    content TEXT NOT NULL CHECK (length(content) > 0),
    sentiment VARCHAR(10) DEFAULT 'neutral', -- positive, negative, neutral
    upvotes INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Index for fast retrieval by market
CREATE INDEX IF NOT EXISTS idx_comments_market_created ON public.market_comments(market_id, created_at ASC);
