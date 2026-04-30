-- ============================================================
-- DOMAIN: orders
-- FIXES: atomic order signatures and constraints
-- ============================================================

CREATE TABLE IF NOT EXISTS orders_v2 (
  id                UUID DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  side              order_side NOT NULL,
  type              order_type NOT NULL,
  
  price             NUMERIC NOT NULL,
  quantity          NUMERIC NOT NULL,
  filled_quantity   NUMERIC NOT NULL DEFAULT 0,
  
  status            order_status NOT NULL DEFAULT 'open',
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Default partitions for 2026/2027 operations
CREATE TABLE IF NOT EXISTS orders_2026_03 PARTITION OF orders_v2 FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS orders_2026_04 PARTITION OF orders_v2 FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS orders_2026_05 PARTITION OF orders_v2 FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace AND relkind = 'r') THEN
     
     RAISE NOTICE 'TRACE: Found legacy orders table (relkind r), running migration...';
     INSERT INTO orders_v2 SELECT * FROM orders;
     ALTER TABLE orders RENAME TO orders_legacy;
     ALTER TABLE orders_v2 RENAME TO orders;
  ELSIF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace) THEN
     RAISE NOTICE 'TRACE: Found no orders table, directly renaming v2 to active...';
     ALTER TABLE orders_v2 RENAME TO orders;
  ELSE
     RAISE NOTICE 'TRACE: Found orders but it evaluates as NEITHER missing nor legacy r! Relkind: %', (SELECT relkind FROM pg_class WHERE relname = 'orders');
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_market_status_price ON orders(market_id, status, price);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: orders
-- Version: v2
-- Replaces: place_order_atomic versions (e.g. 20260305201431_order_system_fix.sql, 017_atomic_order_commitment.sql)
-- Callers: app/api/orders/route.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION place_order_atomic_v2(
  p_user_id         UUID,
  p_market_id       UUID,
  p_side            order_side,
  p_type            order_type,
  p_price           NUMERIC,
  p_quantity        NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cost NUMERIC;
  v_freeze_res JSONB;
BEGIN
  v_cost := p_price * p_quantity;
  
  -- Atomically deduct wallet balances holding the pessimistic lock
  v_freeze_res := freeze_funds_v2(p_user_id, v_cost);
  IF NOT COALESCE((v_freeze_res->>'success')::BOOLEAN, false) THEN
    RETURN v_freeze_res;
  END IF;

  INSERT INTO orders (
    user_id, market_id, side, type, price, quantity, status
  ) VALUES (
    p_user_id, p_market_id, p_side, p_type, p_price, p_quantity, 'open'
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
