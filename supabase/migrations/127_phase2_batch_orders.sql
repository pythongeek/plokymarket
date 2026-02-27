-- ============================================================
-- Migration 127: Batch Orders & Atomic Commitments (Phase 2)
-- Bet Slip functionality for submitting multiple orders at once
-- ============================================================
-- Industry Logic:
-- - Atomic Transaction: If one order fails, entire batch can fail or partial
-- - Escrow Integration: User balance locked until orders are matched
-- - Batch tracking for audit and user visibility
-- ============================================================

-- ============================================================
-- Order Batches Table (for bet slip submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'partial', 'failed', 'cancelled')),
  total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
  order_count INT DEFAULT 0,
  filled_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB,                         -- Store original order details
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ                  -- Auto-expire pending batches
);

-- Add batch_id to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES order_batches(id) ON DELETE SET NULL;

-- Index for batch queries
CREATE INDEX IF NOT EXISTS idx_order_batches_user 
  ON order_batches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_batches_status 
  ON order_batches(status);
CREATE INDEX IF NOT EXISTS idx_orders_batch 
  ON orders(batch_id) 
  WHERE batch_id IS NOT NULL;

-- RLS: Users can only see their own batches
ALTER TABLE order_batches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "batches_own_select" ON order_batches FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "batches_own_insert" ON order_batches FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Function: Create batch order with validation
-- ============================================================
CREATE OR REPLACE FUNCTION create_order_batch(
  p_orders JSONB,
  p_total_cost DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_batch_id UUID;
  v_order_count INT;
  v_wallet_balance DECIMAL(18,2);
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_order_count := jsonb_array_length(p_orders);
  
  -- Validate max orders per batch (prevent abuse)
  IF v_order_count > 20 THEN
    RAISE EXCEPTION 'Maximum 20 orders per batch allowed';
  END IF;
  
  IF v_order_count = 0 THEN
    RAISE EXCEPTION 'No orders provided';
  END IF;
  
  -- Check wallet balance
  SELECT available_balance INTO v_wallet_balance
  FROM wallets WHERE user_id = v_user_id;
  
  IF v_wallet_balance IS NULL OR v_wallet_balance < p_total_cost THEN
    RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', 
      p_total_cost, COALESCE(v_wallet_balance, 0);
  END IF;
  
  -- Lock the balance (will be released as orders fill)
  UPDATE wallets 
  SET 
    available_balance = available_balance - p_total_cost,
    locked_balance = locked_balance + p_total_cost
  WHERE user_id = v_user_id;
  
  -- Create batch record
  INSERT INTO order_batches (
    user_id, status, total_cost, metadata, expires_at
  ) VALUES (
    v_user_id, 'processing', p_total_cost, 
    jsonb_build_object('orders', p_orders),
    now() + INTERVAL '1 hour'
  )
  RETURNING id INTO v_batch_id;
  
  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'status', 'processing',
    'total_cost', p_total_cost,
    'order_count', v_order_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Update batch status when orders fill
-- ============================================================
CREATE OR REPLACE FUNCTION update_batch_on_order_fill()
RETURNS TRIGGER AS $$
DECLARE
  v_batch_id UUID;
  v_total_orders INT;
  v_filled_orders INT;
  v_batch_total_cost DECIMAL(18,2);
  v_user_id UUID;
BEGIN
  -- Only process if this order belongs to a batch
  IF NEW.batch_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_batch_id := NEW.batch_id;
  
  -- Get batch info
  SELECT user_id, order_count, total_cost 
  INTO v_user_id, v_total_orders, v_batch_total_cost
  FROM order_batches 
  WHERE id = v_batch_id;
  
  IF v_total_orders IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count filled orders in this batch
  SELECT COUNT(*) INTO v_filled_orders
  FROM orders
  WHERE batch_id = v_batch_id
  AND status IN ('filled', 'partially_filled');
  
  -- Update batch progress
  UPDATE order_batches
  SET 
    filled_count = v_filled_orders,
    status = CASE 
      WHEN v_filled_orders = v_total_orders THEN 'completed'
      WHEN v_filled_orders > 0 THEN 'partial'
      ELSE 'processing'
    END,
    completed_at = CASE 
      WHEN v_filled_orders = v_total_orders THEN now()
      ELSE completed_at
    END
  WHERE id = v_batch_id;
  
  -- Release unused locked balance
  IF v_filled_orders = v_total_orders THEN
    -- All filled - balance already moved to positions
    NULL;
  ELSIF NEW.status = 'filled' OR NEW.status = 'partially_filled' THEN
    -- Release the difference between locked and actual used
    UPDATE wallets
    SET 
      locked_balance = GREATEST(0, locked_balance - (NEW.price * NEW.quantity)),
      available_balance = available_balance + GREATEST(0, (NEW.price * NEW.quantity) - (NEW.filled_quantity * NEW.price))
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_batch_on_fill ON orders;
CREATE TRIGGER trg_update_batch_on_fill
  AFTER UPDATE OF status ON orders
  FOR EACH ROW 
  WHEN (OLD.status != NEW.status)
  EXECUTE FUNCTION update_batch_on_order_fill();

-- ============================================================
-- Function: Cancel pending batch (release locked funds)
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_order_batch(p_batch_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_batch RECORD;
  v_released_amount DECIMAL(18,2);
BEGIN
  -- Get batch info
  SELECT * INTO v_batch
  FROM order_batches
  WHERE id = p_batch_id AND user_id = auth.uid();
  
  IF v_batch IS NULL THEN
    RAISE EXCEPTION 'Batch not found or access denied';
  END IF;
  
  IF v_batch.status NOT IN ('pending', 'processing') THEN
    RAISE EXCEPTION 'Cannot cancel batch with status: %', v_batch.status;
  END IF;
  
  -- Calculate remaining locked amount
  SELECT COALESCE(SUM(price * (quantity - filled_quantity)), 0)
  INTO v_released_amount
  FROM orders
  WHERE batch_id = p_batch_id 
  AND status IN ('open', 'pending');
  
  -- Cancel all open orders in batch
  UPDATE orders
  SET status = 'cancelled', updated_at = now()
  WHERE batch_id = p_batch_id 
  AND status IN ('open', 'pending');
  
  -- Release locked balance
  IF v_released_amount > 0 THEN
    UPDATE wallets
    SET 
      available_balance = available_balance + v_released_amount,
      locked_balance = GREATEST(0, locked_balance - v_released_amount)
    WHERE user_id = auth.uid();
  END IF;
  
  -- Update batch status
  UPDATE order_batches
  SET 
    status = 'cancelled',
    completed_at = now(),
    error_message = 'Cancelled by user'
  WHERE id = p_batch_id;
  
  RETURN jsonb_build_object(
    'batch_id', p_batch_id,
    'status', 'cancelled',
    'released_amount', v_released_amount,
    'cancelled_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Get batch order details
-- ============================================================
CREATE OR REPLACE FUNCTION get_batch_details(p_batch_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_batch RECORD;
  v_orders JSONB;
BEGIN
  SELECT * INTO v_batch
  FROM order_batches
  WHERE id = p_batch_id AND user_id = auth.uid();
  
  IF v_batch IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get orders in batch
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'market_id', o.market_id,
      'outcome', o.outcome,
      'side', o.side,
      'price', o.price,
      'quantity', o.quantity,
      'filled_quantity', o.filled_quantity,
      'status', o.status,
      'created_at', o.created_at
    )
  ) INTO v_orders
  FROM orders o
  WHERE o.batch_id = p_batch_id;
  
  RETURN jsonb_build_object(
    'id', v_batch.id,
    'status', v_batch.status,
    'total_cost', v_batch.total_cost,
    'order_count', v_batch.order_count,
    'filled_count', v_batch.filled_count,
    'failed_count', v_batch.failed_count,
    'created_at', v_batch.created_at,
    'completed_at', v_batch.completed_at,
    'orders', COALESCE(v_orders, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Cleanup expired pending batches (cron job)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_batches()
RETURNS JSONB AS $$
DECLARE
  v_batch RECORD;
  v_released_amount DECIMAL(18,2);
  v_count INT := 0;
BEGIN
  FOR v_batch IN
    SELECT * FROM order_batches
    WHERE status IN ('pending', 'processing')
    AND expires_at < now()
  LOOP
    -- Calculate remaining locked amount
    SELECT COALESCE(SUM(price * (quantity - filled_quantity)), 0)
    INTO v_released_amount
    FROM orders
    WHERE batch_id = v_batch.id 
    AND status IN ('open', 'pending');
    
    -- Cancel open orders
    UPDATE orders
    SET status = 'cancelled', updated_at = now()
    WHERE batch_id = v_batch.id 
    AND status IN ('open', 'pending');
    
    -- Release locked balance
    IF v_released_amount > 0 THEN
      UPDATE wallets
      SET 
        available_balance = available_balance + v_released_amount,
        locked_balance = GREATEST(0, locked_balance - v_released_amount)
      WHERE user_id = v_batch.user_id;
    END IF;
    
    -- Update batch status
    UPDATE order_batches
    SET 
      status = 'failed',
      completed_at = now(),
      error_message = 'Batch expired'
    WHERE id = v_batch.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'expired_batches', v_count,
    'timestamp', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE order_batches IS 'Batch order tracking for bet slip functionality';
COMMENT ON COLUMN order_batches.metadata IS 'Original order details for audit and replay';
