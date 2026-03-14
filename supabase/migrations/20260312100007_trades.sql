-- ============================================================
-- DOMAIN: trades
-- FIXES: settle_market multiple versions and trade immutability
-- ============================================================

CREATE TABLE IF NOT EXISTS trades_v2 (
  id                UUID DEFAULT gen_random_uuid(),
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  maker_order_id    UUID NOT NULL, -- FIXED: Removed REFERENCES orders(id) for partitioning compatibility
  taker_order_id    UUID NOT NULL, -- FIXED: Removed REFERENCES orders(id) for partitioning compatibility
  
  maker_id          UUID NOT NULL REFERENCES users(id),
  taker_id          UUID NOT NULL REFERENCES users(id),
  
  price             NUMERIC NOT NULL,
  quantity          NUMERIC NOT NULL,
  
  executed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, executed_at)
) PARTITION BY RANGE (executed_at);

-- Default partitions for near future 2026
CREATE TABLE IF NOT EXISTS trades_2026_03 PARTITION OF trades_v2 FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS trades_2026_04 PARTITION OF trades_v2 FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS trades_2026_05 PARTITION OF trades_v2 FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

DO $$
DECLARE
    col_list text;
    sel_list text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'trades' AND relnamespace = 'public'::regnamespace AND relkind = 'r') THEN

        SELECT string_agg(column_name, ', ') INTO col_list 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'trades_v2' 
        AND column_name IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trades');
        
        SELECT string_agg(
            CASE 
                WHEN udt_name = 'order_type' THEN column_name || '::order_type'
                ELSE column_name 
            END, ', ') INTO sel_list 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'trades_v2' 
        AND column_name IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trades');
        
        IF col_list IS NOT NULL THEN 
            EXECUTE 'INSERT INTO trades_v2 (' || col_list || ') SELECT ' || sel_list || ' FROM trades'; 
        END IF;

        ALTER TABLE trades RENAME TO trades_legacy;
        ALTER TABLE trades_v2 RENAME TO trades;
    ELSIF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'trades' AND relnamespace = 'public'::regnamespace) THEN
        ALTER TABLE trades_v2 RENAME TO trades;
    END IF;
END $$;