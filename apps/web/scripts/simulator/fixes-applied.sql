-- ============================================================
-- PLOKY SIMULATOR FIXES - Applied on cx33 PostgreSQL
-- All fixes verified working via matching-engine-test.ts + V2/V3
-- ============================================================

-- 1. DROP positions_quantity_check (blocks short positions)
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_quantity_check;

-- 2. FIX auto_log_market_resolution trigger (schema drift: outcome → winning_outcome)
CREATE OR REPLACE FUNCTION auto_log_market_resolution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    PERFORM log_admin_action(
      COALESCE(NEW.created_by, auth.uid()),
      'resolve_event', 'market', NEW.id,
      jsonb_build_object('status', OLD.status, 'winning_outcome', OLD.winning_outcome),
      jsonb_build_object('status', NEW.status, 'winning_outcome', NEW.winning_outcome),
      'System/Admin resolution'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. FIX log_admin_action (old table name → admin_audit_log)
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id uuid, p_action_type character varying,
  p_resource_type character varying, p_resource_id uuid,
  p_old_values jsonb DEFAULT NULL, p_new_values jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL, p_workflow_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL, p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, action_category, resource, target_id,
    previous_value, new_value, reason, details, ip_address, user_agent, created_at)
  VALUES (p_admin_id, p_action_type, 'system', p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_reason,
    jsonb_build_object('workflow_id', p_workflow_id), p_ip_address::text, p_user_agent, NOW())
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 4. FIX notify_on_market_resolve (enum cast + column names)
CREATE OR REPLACE FUNCTION notify_on_market_resolve()
RETURNS TRIGGER AS $$
DECLARE
  resolution_text TEXT;
  market_name TEXT;
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    resolution_text := COALESCE(NEW.winning_outcome::TEXT, 'Undetermined');
    market_name := COALESCE(NEW.question, NEW.name, 'Market');
    INSERT INTO notifications (user_id, type, title, message, metadata, market_id)
    SELECT DISTINCT p.user_id, 'market_resolved',
      market_name || ' resolved',
      'Outcome: ' || resolution_text,
      jsonb_build_object('outcome', NEW.winning_outcome), NEW.id
    FROM positions p WHERE p.market_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. match_order_jsonb wrapper (PostgREST composite type workaround)
CREATE OR REPLACE FUNCTION match_order_jsonb(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_matched boolean; v_trade_count integer; v_remaining bigint;
BEGIN
  SELECT * INTO v_matched, v_trade_count, v_remaining FROM match_order(p_order_id);
  RETURN jsonb_build_object('matched', v_matched, 'trade_count', v_trade_count, 'remaining', v_remaining);
END;
$$ LANGUAGE plpgsql;

-- 6. Collateral locking trigger (SELL + BUY validation)
CREATE OR REPLACE FUNCTION check_order_funds()
RETURNS TRIGGER AS $$
DECLARE
  v_balance NUMERIC(12,2);
  v_required NUMERIC(12,2);
BEGIN
  SELECT balance INTO v_balance FROM wallets WHERE user_id = NEW.user_id;
  IF NEW.side = 'sell' THEN
    v_required := NEW.quantity * 1.00;
    IF v_balance < v_required THEN
      RAISE EXCEPTION 'Insufficient balance for collateral: required %, available %', v_required, v_balance;
    END IF;
    UPDATE wallets SET balance = balance - v_required, locked_balance = locked_balance + v_required
    WHERE user_id = NEW.user_id;
  ELSIF NEW.side = 'buy' THEN
    v_required := NEW.price * NEW.quantity;
    IF v_balance < v_required THEN
      RAISE EXCEPTION 'Insufficient balance for purchase: required %, available %', v_required, v_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_seller_collateral ON orders;
CREATE TRIGGER trg_check_order_funds
  BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION check_order_funds();

-- 7. Settlement with collateral (winning sellers forfeit, losers release)
CREATE OR REPLACE FUNCTION settle_market_with_collateral(
  p_market_id UUID, p_winning_outcome outcome_type
)
RETURNS TABLE(positions_settled INTEGER, total_payout NUMERIC,
              collateral_released NUMERIC, collateral_forfeited NUMERIC) AS $$
DECLARE
  v_ps INTEGER := 0; v_tp NUMERIC := 0; v_cr NUMERIC := 0; v_cf NUMERIC := 0;
  v_pos RECORD; v_payout NUMERIC; v_seller RECORD; v_forfeit NUMERIC;
BEGIN
  FOR v_seller IN
    SELECT user_id, quantity FROM positions
    WHERE market_id = p_market_id AND quantity < 0 AND outcome = p_winning_outcome
  LOOP
    v_forfeit := ABS(v_seller.quantity) * 1.00;
    UPDATE wallets SET locked_balance = GREATEST(locked_balance - v_forfeit, 0)
    WHERE user_id = v_seller.user_id;
    v_cf := v_cf + v_forfeit;
  END LOOP;
  FOR v_pos IN
    SELECT user_id, quantity FROM positions
    WHERE market_id = p_market_id AND outcome = p_winning_outcome AND quantity > 0
  LOOP
    v_payout := v_pos.quantity * 1.00;
    UPDATE wallets SET balance = balance + v_payout WHERE user_id = v_pos.user_id;
    v_tp := v_tp + v_payout; v_ps := v_ps + 1;
  END LOOP;
  FOR v_seller IN
    SELECT user_id, quantity FROM positions
    WHERE market_id = p_market_id AND quantity < 0 AND outcome != p_winning_outcome
  LOOP
    v_cr := v_cr + ABS(v_seller.quantity);
    UPDATE wallets SET locked_balance = GREATEST(locked_balance - ABS(v_seller.quantity), 0),
                       balance = balance + ABS(v_seller.quantity)
    WHERE user_id = v_seller.user_id;
  END LOOP;
  UPDATE markets SET status = 'resolved', winning_outcome = p_winning_outcome, resolved_at = NOW()
  WHERE id = p_market_id;
  RETURN QUERY SELECT v_ps, v_tp, v_cr, v_cf;
END;
$$ LANGUAGE plpgsql;
