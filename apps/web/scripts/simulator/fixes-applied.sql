-- ============================================================
-- PLOKY SIMULATOR FIXES - Applied on cx33 PostgreSQL
-- All fixes verified working via matching-engine-test.ts
-- ============================================================

-- 1. FIX: positions table blocked negative quantities (short positions)
-- The matching engine creates -100 for sellers, but check constraint rejected it
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_quantity_check;

-- 2. FIX: auto_log_market_resolution trigger referenced OLD.outcome (doesn't exist)
-- Column is winning_outcome
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

-- 3. FIX: log_admin_action wrote to old admin_activity_logs table
-- Redirect to new admin_audit_log table
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id uuid,
    p_action_type character varying,
    p_resource_type character varying,
    p_resource_id uuid,
    p_old_values jsonb DEFAULT NULL::jsonb,
    p_new_values jsonb DEFAULT NULL::jsonb,
    p_reason text DEFAULT NULL::text,
    p_ip_address inet DEFAULT NULL::inet,
    p_user_agent text DEFAULT NULL::text,
    p_workflow_id character varying DEFAULT NULL::character varying
)
RETURNS uuid AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_audit_log (
        admin_id, action, action_category, resource, target_id,
        previous_value, new_value, reason, details,
        ip_address, user_agent, created_at
    ) VALUES (
        p_admin_id, p_action_type, 'system', p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_reason,
        jsonb_build_object('workflow_id', p_workflow_id, 'source', 'trigger_auto_log'),
        p_ip_address::text, p_user_agent, NOW()
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 4. FIX: notify_on_market_resolve had multiple schema drift issues
-- - resolution_outcome -> winning_outcome
-- - outcome_type enum vs TEXT coercion in COALESCE
-- - title_bn, body, body_bn columns don't exist in notifications table
CREATE OR REPLACE FUNCTION notify_on_market_resolve()
RETURNS TRIGGER AS $$
DECLARE
  resolution_text TEXT;
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    resolution_text := COALESCE(NEW.winning_outcome::TEXT, 'নির্ধারিত');
    INSERT INTO notifications (user_id, type, title, message, metadata, market_id)
    SELECT DISTINCT
      p.user_id,
      'market_resolved',
      NEW.name || ' resolved: ' || resolution_text,
      'Market ' || NEW.name || ' has been resolved. Outcome: ' || resolution_text,
      jsonb_build_object('outcome', NEW.winning_outcome, 'market_name', NEW.name),
      NEW.id
    FROM positions p WHERE p.market_id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. HELPER: JSONB wrapper for match_order (PostgREST can't parse TABLE returns)
CREATE OR REPLACE FUNCTION match_order_jsonb(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_matched boolean;
    v_trade_count integer;
    v_remaining bigint;
BEGIN
    SELECT * INTO v_matched, v_trade_count, v_remaining
    FROM match_order(p_order_id);
    RETURN jsonb_build_object(
        'matched', v_matched,
        'trade_count', v_trade_count,
        'remaining', v_remaining
    );
END;
$$ LANGUAGE plpgsql;
