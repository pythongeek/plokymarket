-- ===============================================
-- RESOLUTION TRIGGER INTERFACE
-- Migration 116 - Atomic Settlement Execution
-- ===============================================

-- 1. Automated resolve_market function (per Section 2.3.2)
CREATE OR REPLACE FUNCTION public.resolve_market(
  p_event_id UUID,
  p_winner INTEGER,  -- 1 or 2, matching answer1/answer2
  p_resolver_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_event RECORD;
  v_winning_token VARCHAR(255);
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT * INTO v_event FROM public.events 
  WHERE id = p_event_id AND trading_status = 'active'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or not in active trading status';
  END IF;
  
  -- Determine the winning token/side
  v_winning_token := CASE p_winner 
    WHEN 1 THEN v_event.token1 
    WHEN 2 THEN v_event.token2 
    ELSE NULL 
  END;
  
  -- Update Event Status (Atomic change)
  UPDATE public.events SET
    trading_status = 'resolved',
    resolved_outcome = p_winner,
    resolved_at = NOW(),
    resolved_by = p_resolver_id,
    winning_token = v_winning_token,
    updated_at = NOW()
  WHERE id = p_event_id;

  -- Sync with linked markets (if any)
  UPDATE public.markets SET
    status = 'resolved',
    outcome = p_winner,
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE event_id = p_event_id AND status != 'resolved';
  
  -- Trigger payout calculation (separate async process via QStash/Upstash)
  -- This notification is picked up by a webhook listener or poller
  PERFORM pg_notify('market_resolved', json_build_object(
    'event_id', p_event_id,
    'winner', p_winner,
    'winning_token', v_winning_token,
    'timestamp', NOW()
  )::text);

  -- Log the resolution in audit trail
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    change_summary
  ) VALUES (
    p_resolver_id,
    'resolve_event',
    'event',
    p_event_id,
    'Event resolved with winner: ' || p_winner
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. View for resolvable events (per Section 2.3.1)
-- Filters: ends_at passed, status active, and resolution_delay passed
CREATE OR REPLACE VIEW public.view_resolvable_events AS
SELECT 
    e.*,
    (e.ends_at + (e.resolution_delay || ' minutes')::INTERVAL) as resolution_available_at,
    CASE 
        WHEN CURRENT_TIMESTAMP > (e.ends_at + (e.resolution_delay || ' minutes')::INTERVAL) THEN true
        ELSE false
    END as is_ready_for_resolution
FROM public.events e
WHERE e.trading_status = 'active'
  AND e.ends_at < CURRENT_TIMESTAMP;

-- 3. Permissions
GRANT SELECT ON public.view_resolvable_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_market(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_market(UUID, INTEGER, UUID) TO service_role;

COMMENT ON FUNCTION public.resolve_market IS 'Executes atomic market resolution and triggers payout workflow';
COMMENT ON VIEW public.view_resolvable_events IS 'Displays events that have ended and are reaching their resolution maturity';
