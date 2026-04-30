-- ===================================
-- MAKER REBATE TRACKING
-- ===================================

-- Add maker rebate tracking columns to trades table
ALTER TABLE public.trades
ADD COLUMN IF NOT EXISTS maker_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS maker_rebate_amount NUMERIC(12, 4) DEFAULT 0;

-- Index for efficient maker rebate queries
CREATE INDEX IF NOT EXISTS idx_trades_maker ON public.trades(market_id, maker_id);
CREATE INDEX IF NOT EXISTS idx_trades_maker_rebate ON public.trades(maker_rebate_amount) WHERE maker_rebate_amount > 0;
