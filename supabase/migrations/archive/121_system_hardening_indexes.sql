-- disable-transaction

-- Order book queries: Optimizing for active orders only
CREATE INDEX IF NOT EXISTS idx_orders_book 
  ON orders (market_id, outcome, side, status, price) 
  WHERE status IN ('open', 'partially_filled');

-- User active orders: Optimizing dashboard loading
CREATE INDEX IF NOT EXISTS idx_orders_user_active 
  ON orders (user_id, status, created_at DESC) 
  WHERE status NOT IN ('filled', 'cancelled', 'expired');

-- Trades: Optimizing history lookups for both makers and takers
CREATE INDEX IF NOT EXISTS idx_trades_user 
  ON trades (maker_id, taker_id, created_at DESC);
