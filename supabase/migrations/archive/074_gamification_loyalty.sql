-- Migration 074: Gamification & Loyalty System
-- Advanced User Level System with Automated Progression

-- ============================================
-- 1. Create Levels Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_volume DECIMAL(20, 2) NOT NULL DEFAULT 0,
    kyc_required INTEGER DEFAULT 0, -- 0=None, 1=Basic, 2=Full
    benefits JSONB DEFAULT '{}'::jsonb, -- Store fees, limits, etc.
    icon_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on levels (Public read, admin write)
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Levels are viewable by everyone" 
ON public.levels FOR SELECT USING (true);

CREATE POLICY "Admins can manage levels" 
ON public.levels FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true));

-- Insert Initial Levels
INSERT INTO public.levels (name, min_volume, kyc_required, benefits, description) VALUES
('Novice', 0, 0, '{"withdrawal_limit": 500, "trading_fee_discount": 0}'::jsonb, 'Start your journey. Basic limits apply.'),
('Trader', 50000, 0, '{"withdrawal_limit": 5000, "trading_fee_discount": 5}'::jsonb, 'For active traders. Lower fees and higher limits.'),
('Pro', 200000, 1, '{"withdrawal_limit": 50000, "trading_fee_discount": 10, "instant_withdrawal": true}'::jsonb, 'Serious trading. Instant withdrawals and pro features.'),
('Expert', 1000000, 1, '{"withdrawal_limit": 500000, "trading_fee_discount": 20, "vip_support": true, "custom_markets": true}'::jsonb, 'Market makers and heavy volume traders.'),
('Whale', 5000000, 2, '{"withdrawal_limit": -1, "trading_fee_discount": 100, "direct_admin_access": true}'::jsonb, 'The elite tier. Zero maker fees and unlimited access.')
ON CONFLICT (name) DO UPDATE SET 
    min_volume = EXCLUDED.min_volume,
    kyc_required = EXCLUDED.kyc_required,
    benefits = EXCLUDED.benefits,
    description = EXCLUDED.description;

-- ============================================
-- 2. Update User Profiles
-- ============================================

-- Fix: Ensure user_trading_stats has total_volume (if 058/070 missed it)
ALTER TABLE public.user_trading_stats 
ADD COLUMN IF NOT EXISTS total_volume DECIMAL(20, 2) DEFAULT 0;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS current_level_id INTEGER REFERENCES public.levels(id) DEFAULT 1;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON public.user_profiles(current_level_id);

-- ============================================
-- 3. Automated Level Up Logic
-- ============================================

-- Function to calculate and update user level
CREATE OR REPLACE FUNCTION public.update_user_level() 
RETURNS TRIGGER AS $$
DECLARE
    v_new_level_id INTEGER;
    v_current_level_id INTEGER;
    v_user_kyc_level INTEGER;
    v_total_volume DECIMAL(20, 2);
BEGIN
    -- Get user's current KYC level
    SELECT kyc_level INTO v_user_kyc_level
    FROM public.user_profiles
    WHERE id = NEW.id;

    -- Use new total volume
    v_total_volume := NEW.total_volume;

    -- Find the highest level the user qualifies for
    SELECT id INTO v_new_level_id
    FROM public.levels
    WHERE min_volume <= v_total_volume
      AND kyc_required <= COALESCE(v_user_kyc_level, 0)
    ORDER BY min_volume DESC, kyc_required DESC
    LIMIT 1;

    -- Get current level to check for change
    SELECT current_level_id INTO v_current_level_id
    FROM public.user_profiles
    WHERE id = NEW.id;

    -- Update if level changed
    IF v_new_level_id IS NOT NULL AND v_new_level_id != v_current_level_id THEN
        UPDATE public.user_profiles
        SET current_level_id = v_new_level_id
        WHERE id = NEW.id;

        -- Optional: Log level change or send notification here
        -- PERFORM create_notification(NEW.id, 'level_up', 'Congratulations! You reached a new level.');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run after stats update
DROP TRIGGER IF EXISTS trigger_update_user_level ON public.user_trading_stats;

CREATE TRIGGER trigger_update_user_level
AFTER UPDATE OF total_volume ON public.user_trading_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_user_level();

-- ============================================
-- 4. Helper View for Frontend
-- ============================================
CREATE OR REPLACE VIEW public.user_level_progress AS
SELECT 
    up.id AS user_id,
    l.id AS current_level_id,
    l.name AS current_level_name,
    l.benefits AS current_benefits,
    COALESCE(uts.total_volume, 0) AS total_volume,
    nl.id AS next_level_id,
    nl.name AS next_level_name,
    nl.min_volume AS next_level_requirement,
    (nl.min_volume - COALESCE(uts.total_volume, 0)) AS volume_needed,
    CASE 
        WHEN nl.id IS NULL THEN 100 
        ELSE LEAST(100, (COALESCE(uts.total_volume, 0) / NULLIF(nl.min_volume, 0)) * 100)
    END AS progress_percentage
FROM public.user_profiles up
LEFT JOIN public.levels l ON up.current_level_id = l.id
LEFT JOIN public.user_trading_stats uts ON up.id = uts.user_id
LEFT JOIN public.levels nl ON nl.min_volume > l.min_volume
ORDER BY nl.min_volume ASC;
-- Note: The view logic for 'next_level' is simplified. 
-- A more robust query would use a subquery or window function to find the *immediate* next level.
-- Redefining for correctness using LATERAL join:

CREATE OR REPLACE VIEW public.user_level_progress AS
SELECT 
    up.id AS user_id,
    l.id AS current_level_id,
    l.name AS current_level_name,
    l.min_volume AS current_level_min_volume,
    l.benefits AS current_benefits,
    COALESCE(uts.total_volume, 0) AS total_volume,
    next_l.id AS next_level_id,
    next_l.name AS next_level_name,
    next_l.min_volume AS next_level_requirement,
    GREATEST(0, next_l.min_volume - COALESCE(uts.total_volume, 0)) AS volume_needed,
    CASE 
        WHEN next_l.id IS NULL THEN 100.00
        WHEN next_l.min_volume = 0 THEN 100.00 
        ELSE ROUND((COALESCE(uts.total_volume, 0) / next_l.min_volume) * 100, 2)
    END AS progress_percentage
FROM public.user_profiles up
LEFT JOIN public.levels l ON up.current_level_id = l.id
LEFT JOIN public.user_trading_stats uts ON up.id = uts.user_id
LEFT JOIN LATERAL (
    SELECT id, name, min_volume 
    FROM public.levels 
    WHERE min_volume > l.min_volume 
    ORDER BY min_volume ASC 
    LIMIT 1
) next_l ON true;

-- Grant permissions
GRANT SELECT ON public.user_level_progress TO authenticated;
