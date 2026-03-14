-- ============================================================
-- DOMAIN: orders
-- FIXES: atomic order signatures and constraints
-- ============================================================

CREATE TABLE IF NOT EXISTS orders_v2 (
  id                UUID DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,

  side              order_side NOT NULL,
  outcome           outcome_type NOT NULL DEFAULT 'YES',
  type              order_type NOT NULL DEFAULT 'limit'::order_type, -- FIXED: Lowercase 'limit'
  
  price             NUMERIC NOT NULL,
  quantity          NUMERIC NOT NULL,
  filled_quantity   NUMERIC NOT NULL DEFAULT 0,
  
  status            order_status NOT NULL DEFAULT 'open'::order_status,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Default partitions for near future 2026
CREATE TABLE IF NOT EXISTS orders_2026_03 PARTITION OF orders_v2 FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS orders_2026_04 PARTITION OF orders_v2 FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS orders_2026_05 PARTITION OF orders_v2 FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

DO $$
DECLARE
    col_list text;
    sel_list text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace AND relkind = 'r') THEN
        
        -- Fix null types in the old table before migrating (lowercase 'limit')
        BEGIN
            EXECUTE 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS type text DEFAULT ''limit''';
        EXCEPTION WHEN OTHERS THEN END;
        
        BEGIN
            -- Update NULLs or uppercase LIMITs to proper lowercase 'limit'
            EXECUTE 'UPDATE orders SET type = ''limit'' WHERE type IS NULL OR type = ''LIMIT''';
        EXCEPTION WHEN OTHERS THEN END;

        -- Build dynamic column list safely
        SELECT string_agg(column_name, ', ') INTO col_list 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders_v2' 
        AND column_name IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders');
        
        -- Build select list with perfect explicit casting
        SELECT string_agg(
            CASE 
                WHEN udt_name = 'order_type' THEN column_name || '::order_type'
                WHEN udt_name = 'order_side' THEN column_name || '::order_side'
                WHEN udt_name = 'order_status' THEN column_name || '::order_status'
                ELSE column_name 
            END, ', ') INTO sel_list 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'orders_v2' 
        AND column_name IN (SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders');
        
        IF col_list IS NOT NULL THEN 
            EXECUTE 'INSERT INTO orders_v2 (' || col_list || ') SELECT ' || sel_list || ' FROM orders'; 
        END IF;

        ALTER TABLE orders RENAME TO orders_legacy;
        ALTER TABLE orders_v2 RENAME TO orders;
    ELSIF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace) THEN
        ALTER TABLE orders_v2 RENAME TO orders;
    END IF;
END $$;