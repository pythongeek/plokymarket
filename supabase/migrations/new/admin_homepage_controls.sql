-- ============================================================
-- Migration: Admin Homepage Controls
-- Adds tables for:
-- 1. Site announcements (dynamic banners)
-- 2. Category settings (sorting, visibility)
-- 3. Site settings (emergency kill switch, etc.)
-- ============================================================

BEGIN;

-- Drop existing tables if they exist (clean slate for this migration)
DROP TABLE IF EXISTS site_announcements CASCADE;
DROP TABLE IF EXISTS category_settings CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;

-- ============================================================
-- Table: site_announcements
-- Global announcements that appear on homepage
-- ============================================================
CREATE TABLE site_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'maintenance')),
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT true,
    action_text TEXT,
    action_url TEXT,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table: category_settings
-- Controls category order and visibility on homepage
-- ============================================================
CREATE TABLE category_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_key VARCHAR(100) NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    icon_emoji VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table: site_settings
-- Global site settings (emergency controls, etc.)
-- ============================================================
CREATE TABLE site_settings (
    id VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default site settings
INSERT INTO site_settings (id, setting_value, description) VALUES
    ('trading_paused', '{"paused": false, "reason": null}'::jsonb, 'Emergency kill switch for trading'),
    ('maintenance_mode', '{"enabled": false, "message": null}'::jsonb, 'Site maintenance mode'),
    ('featured_markets', '{"market_ids": [], "pinned_until": null}'::jsonb, 'Pinned featured markets for homepage');

-- Insert default category settings
INSERT INTO category_settings (category_key, display_name, display_order, is_visible, icon_emoji) VALUES
    ('trending', '🔥 ট্রেন্ডিং', 1, true, '🔥'),
    ('sports', '🏏 খেলাধুলা', 2, true, '🏏'),
    ('politics', '🏛️ রাজনীতি', 3, true, '🏛️'),
    ('economy', '💰 অর্থনীতি', 4, true, '💰'),
    ('technology', '💻 প্রযুক্তি', 5, true, '💻'),
    ('entertainment', '🎬 বিনোদন', 6, true, '🎬'),
    ('international', '🌍 আন্তর্জাতিক', 7, true, '🌍'),
    ('weather', '🌦️ আবহাওয়া', 8, true, '🌦️'),
    ('infrastructure', '🏗️ অবকাঠামো', 9, true, '🏗️'),
    ('startup', '🚀 স্টার্টআপ', 10, true, '🚀');

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE site_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for site_announcements
CREATE POLICY "Anyone can view active announcements"
    ON site_announcements FOR SELECT
    USING (is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW()));

CREATE POLICY "Admins can manage announcements"
    ON site_announcements FOR ALL
    USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- Policies for category_settings
CREATE POLICY "Anyone can view category settings"
    ON category_settings FOR SELECT
    USING (is_visible = true);

CREATE POLICY "Admins can manage category settings"
    ON category_settings FOR ALL
    USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- Policies for site_settings
CREATE POLICY "Anyone can view site settings"
    ON site_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage site settings"
    ON site_settings FOR ALL
    USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- ============================================================
-- Grant permissions
-- ============================================================
GRANT SELECT ON site_announcements TO anon, authenticated;
GRANT ALL ON site_announcements TO authenticated;
GRANT SELECT ON category_settings TO anon, authenticated;
GRANT ALL ON category_settings TO authenticated;
GRANT SELECT ON site_settings TO anon, authenticated;
GRANT ALL ON site_settings TO authenticated;

-- ============================================================
-- Create function to update timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_site_announcements_updated_at
    BEFORE UPDATE ON site_announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_category_settings_updated_at
    BEFORE UPDATE ON category_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Realtime for site_settings and announcements
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE site_announcements;

COMMIT;

-- ============================================================
-- Verification queries (run separately if needed)
-- ============================================================
-- SELECT * FROM site_settings;
-- SELECT * FROM category_settings ORDER BY display_order;
-- SELECT * FROM site_announcements WHERE is_active = true;
