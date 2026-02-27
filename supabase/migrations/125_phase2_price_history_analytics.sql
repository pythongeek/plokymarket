-- ============================================================
-- Migration 125: Price History & Market Analytics (Phase 2)
-- OHLC Analytics for Sparklines and 24h Price Delta
-- ============================================================
-- Algorithms & Logic:
-- - OHLC: Open (first trade), High (max price), Low (min price), Close (last price)
-- - Hourly Snapshot: record_price_snapshots() runs via cron job
-- - 24h Change: Calculated from price_history table
-- ============================================================

-- ============================================================
-- Price History Table (for sparklines, 24h delta, historical charts)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome_id UUID REFERENCES outcomes(id) ON DELETE CASCADE,  -- for multi-outcome
  outcome TEXT NOT NULL DEFAULT 'YES',   -- 'YES', 'NO', or outcome label
  price DECIMAL(10,4) NOT NULL,
  volume_at_time DECIMAL(18,2) DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast price history queries
CREATE INDEX IF NOT EXISTS idx_price_history_market_time
  ON price_history(market_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_outcome
  ON price_history(market_id, outcome, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded
  ON price_history(recorded_at DESC);

-- RLS: Price history is read-only for users, system-only for inserts
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "price_history_read" ON price_history FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Only service role can insert (enforced at application level)
DO $$ BEGIN
  CREATE POLICY "price_history_insert_system" ON price_history FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Market Daily Stats (OHLCV aggregates for fast reads)
-- ============================================================
CREATE TABLE IF NOT EXISTS market_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_price DECIMAL(10,4),
  close_price DECIMAL(10,4),
  high_price DECIMAL(10,4),
  low_price DECIMAL(10,4),
  volume DECIMAL(18,2) DEFAULT 0,
  trade_count INT DEFAULT 0,
  unique_traders INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(market_id, date)
);

-- Index for daily stats queries
CREATE INDEX IF NOT EXISTS idx_market_daily_stats 
  ON market_daily_stats(market_id, date DESC);

-- RLS: Daily stats are public read-only
ALTER TABLE market_daily_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "daily_stats_read" ON market_daily_stats FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Extend markets table for price change tracking
-- ============================================================
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS yes_price_change_24h DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_price_change_24h DECIMAL(10,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_traders INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS close_warned BOOLEAN DEFAULT false;  -- For closing-soon notifications

-- ============================================================
-- Function: Record hourly price snapshot (called by cron job)
-- ============================================================
CREATE OR REPLACE FUNCTION record_price_snapshots()
RETURNS void AS $$
BEGIN
  -- Binary markets: snapshot YES price
  INSERT INTO price_history (market_id, outcome, price, volume_at_time)
  SELECT
    m.id,
    'YES',
    COALESCE(m.yes_price, 0.5),
    COALESCE(m.total_volume, 0)
  FROM markets m
  WHERE m.status = 'active';

  -- Multi-outcome: snapshot each outcome
  INSERT INTO price_history (market_id, outcome_id, outcome, price, volume_at_time)
  SELECT
    o.market_id,
    o.id,
    o.label,
    o.current_price,
    COALESCE(m.total_volume, 0)
  FROM outcomes o
  JOIN markets m ON m.id = o.market_id
  WHERE m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Calculate 24h price change for all active markets
-- ============================================================
CREATE OR REPLACE FUNCTION update_price_changes()
RETURNS void AS $$
BEGIN
  -- Update YES price 24h change
  UPDATE markets m
  SET yes_price_change_24h = COALESCE((
    SELECT m.yes_price - ph.price
    FROM price_history ph
    WHERE ph.market_id = m.id
      AND ph.outcome = 'YES'
      AND ph.recorded_at <= now() - INTERVAL '24 hours'
    ORDER BY ph.recorded_at DESC
    LIMIT 1
  ), 0)
  WHERE m.status = 'active';
  
  -- Update NO price 24h change
  UPDATE markets m
  SET no_price_change_24h = COALESCE((
    SELECT m.no_price - ph.price
    FROM price_history ph
    WHERE ph.market_id = m.id
      AND ph.outcome = 'NO'
      AND ph.recorded_at <= now() - INTERVAL '24 hours'
    ORDER BY ph.recorded_at DESC
    LIMIT 1
  ), 0)
  WHERE m.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Get price history for a market (convenience function)
-- ============================================================
CREATE OR REPLACE FUNCTION get_price_history(
  p_market_id UUID,
  p_hours INT DEFAULT 24,
  p_outcome TEXT DEFAULT 'YES'
)
RETURNS TABLE (
  price DECIMAL(10,4),
  volume_at_time DECIMAL(18,2),
  recorded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT ph.price, ph.volume_at_time, ph.recorded_at
  FROM price_history ph
  WHERE ph.market_id = p_market_id
    AND ph.outcome = p_outcome
    AND ph.recorded_at >= now() - (p_hours || ' hours')::INTERVAL
  ORDER BY ph.recorded_at ASC
  LIMIT 500;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Calculate OHLC for a specific date
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_daily_ohlc(p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO market_daily_stats (
    market_id, date, open_price, high_price, low_price, close_price, volume, trade_count
  )
  SELECT
    market_id,
    p_date,
    -- Open: first price of the day
    (SELECT price FROM price_history 
     WHERE market_id = ph.market_id 
     AND DATE(recorded_at) = p_date 
     ORDER BY recorded_at ASC LIMIT 1),
    -- High: max price of the day
    MAX(price),
    -- Low: min price of the day
    MIN(price),
    -- Close: last price of the day
    (SELECT price FROM price_history 
     WHERE market_id = ph.market_id 
     AND DATE(recorded_at) = p_date 
     ORDER BY recorded_at DESC LIMIT 1),
    -- Volume from trades
    COALESCE((
      SELECT SUM(price * quantity) FROM trades 
      WHERE market_id = ph.market_id 
      AND DATE(created_at) = p_date
    ), 0),
    -- Trade count
    COALESCE((
      SELECT COUNT(*) FROM trades 
      WHERE market_id = ph.market_id 
      AND DATE(created_at) = p_date
    ), 0)
  FROM price_history ph
  WHERE DATE(ph.recorded_at) = p_date
  GROUP BY ph.market_id
  ON CONFLICT (market_id, date) DO UPDATE SET
    open_price = EXCLUDED.open_price,
    high_price = EXCLUDED.high_price,
    low_price = EXCLUDED.low_price,
    close_price = EXCLUDED.close_price,
    volume = EXCLUDED.volume,
    trade_count = EXCLUDED.trade_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Get market stats summary
-- ============================================================
CREATE OR REPLACE FUNCTION get_market_stats_summary(p_market_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_volume DECIMAL(18,2);
  v_volume_24h DECIMAL(18,2);
  v_trade_count INT;
  v_unique_traders INT;
  v_follower_count INT;
  v_bookmark_count INT;
BEGIN
  -- Total volume
  SELECT COALESCE(SUM(price * quantity), 0) INTO v_volume
  FROM trades WHERE market_id = p_market_id;
  
  -- 24h volume
  SELECT COALESCE(SUM(price * quantity), 0) INTO v_volume_24h
  FROM trades 
  WHERE market_id = p_market_id 
  AND created_at >= now() - INTERVAL '24 hours';
  
  -- Trade count
  SELECT COUNT(*) INTO v_trade_count
  FROM trades WHERE market_id = p_market_id;
  
  -- Unique traders
  SELECT COUNT(DISTINCT user_id) INTO v_unique_traders
  FROM positions WHERE market_id = p_market_id;
  
  -- Followers
  SELECT COUNT(*) INTO v_follower_count
  FROM market_followers WHERE market_id = p_market_id;
  
  -- Bookmarks
  SELECT COUNT(*) INTO v_bookmark_count
  FROM user_bookmarks WHERE market_id = p_market_id;
  
  v_result := jsonb_build_object(
    'market_id', p_market_id,
    'volume', v_volume,
    'volume_24h', v_volume_24h,
    'trade_count', v_trade_count,
    'unique_traders', v_unique_traders,
    'follower_count', v_follower_count,
    'bookmark_count', v_bookmark_count,
    'updated_at', now()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE price_history IS 'Hourly price snapshots for sparklines and historical charts';
COMMENT ON TABLE market_daily_stats IS 'Daily OHLCV aggregates for market analytics';
