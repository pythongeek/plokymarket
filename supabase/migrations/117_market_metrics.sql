-- ===============================================
-- METRICS AGGREGATION MIGRATION
-- Migration 117 - Realtime Market Metrics
-- ===============================================

-- 1. Create materialized view for market performance
CREATE MATERIALIZED VIEW IF NOT EXISTS public.market_metrics AS
SELECT 
  e.id,
  e.title as name,
  e.category,
  e.total_volume as volume,
  e.initial_liquidity,
  e.created_at,
  e.ends_at,
  COUNT(DISTINCT t.buyer_id) + COUNT(DISTINCT t.seller_id) AS unique_traders,
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

-- 2. Create unique index for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_metrics_id ON public.market_metrics(id);

-- 3. Grant permissions
GRANT SELECT ON public.market_metrics TO authenticated;
GRANT SELECT ON public.market_metrics TO anon;

-- 4. Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_market_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh the materialized view concurrently so we don't block reads
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.market_metrics;
END;
$$;
