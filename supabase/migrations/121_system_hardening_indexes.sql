-- disable-transaction

-- Order book queries: Optimizing for active orders only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_book 
  ON orders (market_id, outcome, side, status, price) 
  WHERE status IN ('open', 'partially_filled');

-- User active orders: Optimizing dashboard loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_active 
  ON orders (user_id, status, created_at DESC) 
  WHERE status NOT IN ('filled', 'cancelled', 'expired');

-- Trades: Optimizing history lookups for both buyers and sellers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_user 
  ON trades (buyer_id, seller_id, created_at DESC);
