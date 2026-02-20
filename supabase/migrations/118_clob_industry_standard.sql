-- ===============================================
-- CLOB TRADES SCHEMA REFACTOR
-- Migration 118 - Industry Standard Refactor
-- ===============================================

-- We are renaming `buyer_id` and `seller_id` in the `trades` table to `maker_id` and `taker_id`, 
-- which is the industry standard for Central Limit Order Books (like Polymarket, Binance, etc.)
-- where trades are defined by liquidity provision rather than just buying/selling.

-- 1. Rename the columns safely
ALTER TABLE public.trades 
  RENAME COLUMN buyer_id TO maker_id;

ALTER TABLE public.trades 
  RENAME COLUMN seller_id TO taker_id;

-- 2. Due to the rename, we need to recreate the market_metrics materialized view from migration 117
-- to use the new column names so it doesn't break.
DROP MATERIALIZED VIEW IF EXISTS public.market_metrics CASCADE;

CREATE MATERIALIZED VIEW public.market_metrics AS
SELECT 
  e.id,
  e.title as name,
  e.category,
  e.total_volume as volume,
  e.initial_liquidity,
  e.created_at,
  e.ends_at,
  -- Now using the industry-standard maker/taker columns!
  COUNT(DISTINCT t.maker_id) + COUNT(DISTINCT t.taker_id) AS unique_traders,
  COUNT(t.id) AS total_trades,
  AVG(t.price) AS avg_trade_price,
  STDDEV(t.price) AS price_volatility,
  MAX(t.price) AS price_high,
  MIN(t.price) AS price_low
FROM public.events e
LEFT JOIN public.markets m ON m.event_id = e.id
LEFT JOIN public.trades t ON t.market_id = m.id
WHERE e.created_at > NOW() - INTERVAL '30 days'
GROUP BY e.id;

-- Recreate index & permissions for the view
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_metrics_id ON public.market_metrics(id);
GRANT SELECT ON public.market_metrics TO authenticated;
GRANT SELECT ON public.market_metrics TO anon;
