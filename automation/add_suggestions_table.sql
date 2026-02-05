-- Add market_suggestions table for News Scraper workflow
CREATE TABLE IF NOT EXISTS public.market_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT,
    ai_confidence NUMERIC(3, 2),
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.market_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage
CREATE POLICY "Admins can manage suggestions" ON public.market_suggestions FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));
