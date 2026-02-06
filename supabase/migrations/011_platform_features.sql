-- Platform Infrastructure Migration

-- 1. Notifications System
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'ORDER_FILLED', 'ACHIEVEMENT_UNLOCKED', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- 2. Enhanced Market Settings (Fees & Liquidity)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'fee_percent') THEN
        ALTER TABLE public.markets ADD COLUMN fee_percent NUMERIC(5, 2) DEFAULT 2.0;
        ALTER TABLE public.markets ADD COLUMN initial_liquidity NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE public.markets ADD COLUMN maker_rebate_percent NUMERIC(5, 2) DEFAULT 0.05;
    END IF;
END $$;

-- 3. Fee Tiers and Maker Rebates tracking
CREATE TABLE IF NOT EXISTS public.user_trading_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    thirty_day_volume NUMERIC(15, 2) DEFAULT 0,
    total_maker_rebates_earned NUMERIC(12, 2) DEFAULT 0,
    last_reset_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Realtime for Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
