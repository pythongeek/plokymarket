-- Migration: Add Trading Phases and Auction Support to Markets

-- 1. Create Enum for Trading Phases
-- Check if type exists first to avoid errors on re-runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trading_phase_type') THEN
        CREATE TYPE trading_phase_type AS ENUM ('PRE_OPEN', 'CONTINUOUS', 'AUCTION', 'HALTED', 'CLOSED');
    END IF;
END $$;

-- 2. Add Columns to Markets Table
ALTER TABLE public.markets 
ADD COLUMN IF NOT EXISTS trading_phase trading_phase_type DEFAULT 'CONTINUOUS',
ADD COLUMN IF NOT EXISTS next_phase_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auction_data JSONB; -- Stores { "indicative_price": ..., "indicative_volume": ... }

-- 3. Index for filtering active markets by phase
CREATE INDEX IF NOT EXISTS idx_markets_trading_phase ON public.markets(trading_phase);

-- 4. Comment on columns
COMMENT ON COLUMN public.markets.trading_phase IS 'Current market state: PRE_OPEN, CONTINUOUS, AUCTION, HALTED, CLOSED';
COMMENT ON COLUMN public.markets.next_phase_time IS 'Scheduled time for the next phase transition';
COMMENT ON COLUMN public.markets.auction_data IS 'Real-time auction information like indicative clearing price/volume';
