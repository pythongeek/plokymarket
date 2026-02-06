-- Leaderboard System Migration (Advanced)

-- 1. Enhanced Leaderboard Cache (Add Advanced Metrics)
-- We first check if columns exist to avoid errors on re-run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaderboard_cache' AND column_name = 'roi') THEN
        ALTER TABLE public.leaderboard_cache ADD COLUMN roi NUMERIC(10, 2) DEFAULT 0; -- Percentage
        ALTER TABLE public.leaderboard_cache ADD COLUMN current_streak INT DEFAULT 0;
        ALTER TABLE public.leaderboard_cache ADD COLUMN best_streak INT DEFAULT 0;
        ALTER TABLE public.leaderboard_cache ADD COLUMN risk_score NUMERIC(5, 2) DEFAULT 0; -- 0-10 Volatility
    END IF;
END $$;

-- 2. Leagues System
CREATE TABLE IF NOT EXISTS public.leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Bronze, Silver, Gold, Platinum, Diamond
    tier_order INT NOT NULL UNIQUE, -- 1, 2, 3, 4, 5
    min_rank_percentile INT, -- e.g., Top 20% promote
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Leagues
INSERT INTO public.leagues (name, tier_order, icon_url) VALUES
('Bronze', 1, '/badges/bronze_league.png'),
('Silver', 2, '/badges/silver_league.png'),
('Gold', 3, '/badges/gold_league.png'),
('Platinum', 4, '/badges/platinum_league.png'),
('Diamond', 5, '/badges/diamond_league.png')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_leagues (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    league_id INT REFERENCES public.leagues(id),
    current_points NUMERIC(12, 2) DEFAULT 0, -- Points for current week's league
    is_promoted BOOLEAN DEFAULT FALSE,
    is_relegated BOOLEAN DEFAULT FALSE,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Badges System
CREATE TABLE IF NOT EXISTS public.badges (
    id VARCHAR(50) PRIMARY KEY, -- 'sniper', 'whale', 'og'
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon_url TEXT,
    condition_type VARCHAR(50), -- 'volume', 'streak', 'roi'
    condition_value NUMERIC(12, 2),
    rarity VARCHAR(20) DEFAULT 'COMMON', -- COMMON, RARE, EPIC, LEGENDARY
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Badges
INSERT INTO public.badges (id, name, description, condition_type, condition_value, rarity) VALUES
('first_trade', 'Rookie Trader', 'Completed first trade', 'trades_count', 1, 'COMMON'),
('getting_serious', 'Pro Trader', 'Completed 50 trades', 'trades_count', 50, 'RARE'),
('whale', 'The Whale', 'Traded over 100k volume', 'volume', 100000, 'EPIC'),
('sniper', 'The Sniper', 'Win rate > 80% (min 10 trades)', 'win_rate', 80, 'RARE'),
('streak_master', 'On Fire', 'Won 5 trades in a row', 'streak', 5, 'RARE'),
('streak_legend', 'Unstoppable', '10 consecutive profitable trades', 'streak', 10, 'LEGENDARY'),
('diamond_hands', 'Diamond Hands', 'Held position > 1 month', 'holding_period', 30, 'EPIC')
ON CONFLICT (id) DO NOTHING;

-- 4. Copy Trading System
CREATE TABLE IF NOT EXISTS public.copy_trading_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    allocation_type VARCHAR(20) DEFAULT 'PERCENTAGE', -- FIXED, PERCENTAGE
    allocation_amount NUMERIC(12, 2) DEFAULT 10, -- 10% or 10 BDT
    max_position_size NUMERIC(12, 2) DEFAULT 1000,
    stop_loss_percent NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscriptions (For Copy Trading)
CREATE TABLE IF NOT EXISTS public.trader_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    trader_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, trader_id)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_user_leagues_points ON public.user_leagues(league_id, current_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_roi ON public.leaderboard_cache(timeframe, roi DESC);
