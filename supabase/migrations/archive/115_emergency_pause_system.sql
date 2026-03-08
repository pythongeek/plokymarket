-- ===============================================
-- EMERGENCY PAUSE SYSTEM
-- Migration 115 - Granular Circuit Breaker
-- ===============================================

-- 1. Add trading_status to events
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'trading_status') THEN
        ALTER TABLE public.events ADD COLUMN trading_status VARCHAR(20) 
            DEFAULT 'active' 
            CHECK (trading_status IN ('active', 'paused', 'resolved', 'cancelled'));
    END IF;
END $$;

-- 2. Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default trading pause flag
INSERT INTO public.platform_settings (key, value, description)
VALUES ('trading_paused', 'false'::jsonb, 'Platform-wide trading pause flag')
ON CONFLICT (key) DO NOTHING;

-- 3. Category Settings Table
CREATE TABLE IF NOT EXISTS public.category_settings (
    category VARCHAR(100) PRIMARY KEY,
    trading_status VARCHAR(20) DEFAULT 'active' CHECK (trading_status IN ('active', 'paused')),
    pause_reason TEXT,
    paused_at TIMESTAMPTZ,
    paused_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS for new tables
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings are viewable by everyone" ON public.platform_settings;
CREATE POLICY "Platform settings are viewable by everyone" ON public.platform_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update platform settings" ON public.platform_settings;
CREATE POLICY "Only admins can update platform settings" ON public.platform_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "Category settings are viewable by everyone" ON public.category_settings;
CREATE POLICY "Category settings are viewable by everyone" ON public.category_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can update category settings" ON public.category_settings;
CREATE POLICY "Only admins can update category settings" ON public.category_settings
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- 5. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_platform_settings_timestamp ON public.platform_settings;
CREATE TRIGGER update_platform_settings_timestamp
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_category_settings_timestamp ON public.category_settings;
CREATE TRIGGER update_category_settings_timestamp
    BEFORE UPDATE ON public.category_settings
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 6. Helper Function for Realtime Broadcast (Optional but good for manual triggers)
-- Note: Supabase Realtime handles postgres_changes automatically.
