-- ============================================
-- EVENTS SYSTEM MIGRATION
-- ============================================

-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    
    -- Schedule
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ, -- Optional: Some events are indefinite until resolved
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Link Markets to Events
-- Add event_id to markets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'event_id') THEN
        ALTER TABLE public.markets ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add event_id to market_creation_drafts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_creation_drafts' AND column_name = 'event_id') THEN
        ALTER TABLE public.market_creation_drafts ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON public.markets(event_id);

-- 4. RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public can view active events
CREATE POLICY "Public read access to active events"
    ON public.events
    FOR SELECT
    USING (is_active = TRUE);

-- Admins can view all events (including inactive)
CREATE POLICY "Admins can view all events"
    ON public.events
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ));

-- Admins can insert/update events
CREATE POLICY "Admins can insert events"
    ON public.events
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ));

CREATE POLICY "Admins can update events"
    ON public.events
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND is_admin = TRUE
    ));

-- 5. Triggers
-- Auto-update updated_at timestamp
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
