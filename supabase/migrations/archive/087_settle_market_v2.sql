-- Migration 087: Create settle_market_v2 function for market settlement
-- This function handles wallet distribution and market resolution atomically

CREATE OR REPLACE FUNCTION settle_market_v2(
    p_market_id UUID,
    p_winning_outcome outcome_type
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_market_record RECORD;
    v_total_distributed NUMERIC := 0;
    v_affected_positions INTEGER := 0;
BEGIN
    -- Validate market exists and is in correct state
    SELECT id, status, question INTO v_market_record
    FROM markets
    WHERE id = p_market_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found: %', p_market_id;
    END IF;

    IF v_market_record.status = 'resolved' THEN
        RAISE EXCEPTION 'Market already resolved: %', p_market_id;
    END IF;

    IF v_market_record.status NOT IN ('closed', 'active') THEN
        RAISE EXCEPTION 'Market must be closed or active to resolve. Current status: %', v_market_record.status;
    END IF;

    -- Validate winning outcome
    IF p_winning_outcome NOT IN ('YES', 'NO') THEN
        RAISE EXCEPTION 'Invalid winning outcome: %. Must be YES or NO', p_winning_outcome;
    END IF;

    -- Start transaction logging
    RAISE NOTICE 'Starting settlement for market: %, winning outcome: %', p_market_id, p_winning_outcome;

    -- Update winning positions and distribute funds
    WITH winning_positions AS (
        SELECT 
            p.user_id,
            p.quantity,
            p.outcome,
            w.balance as current_balance
        FROM positions p
        JOIN wallets w ON w.user_id = p.user_id
        WHERE p.market_id = p_market_id
        AND p.outcome = p_winning_outcome
        AND p.quantity > 0
        FOR UPDATE OF w
    ),
    distribution AS (
        UPDATE wallets w
        SET 
            balance = w.balance + (wp.quantity * 1.00),
            updated_at = NOW()
        FROM winning_positions wp
        WHERE w.user_id = wp.user_id
        RETURNING w.user_id, wp.quantity, w.balance as new_balance
    )
    SELECT 
        COUNT(*),
        COALESCE(SUM(quantity), 0)
    INTO v_affected_positions, v_total_distributed
    FROM distribution;

    -- Log the distribution
    RAISE NOTICE 'Distributed % to % winning positions', v_total_distributed, v_affected_positions;

    -- Insert transaction records for audit trail
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        description,
        metadata,
        status
    )
    SELECT 
        p.user_id,
        'settlement',
        p.quantity,
        'Market settlement: ' || v_market_record.question,
        jsonb_build_object(
            'market_id', p_market_id,
            'winning_outcome', p_winning_outcome,
            'position_outcome', p.outcome,
            'quantity', p.quantity
        ),
        'completed'
    FROM positions p
    WHERE p.market_id = p_market_id
    AND p.outcome = p_winning_outcome
    AND p.quantity > 0;

    -- Update market status to resolved
    UPDATE markets 
    SET 
        status = 'resolved',
        outcome = CASE 
            WHEN p_winning_outcome = 'YES' THEN 1
            WHEN p_winning_outcome = 'NO' THEN 2
        END,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_market_id;

    -- Update resolution_systems record
    UPDATE resolution_systems
    SET 
        resolution_status = 'resolved',
        proposed_outcome = CASE 
            WHEN p_winning_outcome = 'YES' THEN 1
            WHEN p_winning_outcome = 'NO' THEN 2
        END,
        resolved_at = NOW(),
        updated_at = NOW()
    WHERE event_id = p_market_id;

    -- Log admin activity
    INSERT INTO admin_activity_logs (
        admin_id,
        action_type,
        resource_type,
        resource_id,
        change_summary,
        new_values,
        reason
    )
    VALUES (
        auth.uid(),
        'resolve_event',
        'market',
        p_market_id,
        'Market resolved with outcome: ' || p_winning_outcome,
        jsonb_build_object(
            'winning_outcome', p_winning_outcome,
            'total_distributed', v_total_distributed,
            'winning_positions', v_affected_positions
        ),
        'Manual admin resolution'
    );

    RAISE NOTICE 'Market settlement completed for: %', p_market_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Settlement failed for market %: %', p_market_id, SQLERRM;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION settle_market_v2(UUID, outcome_type) IS 
'Atomically settles a market by distributing funds to winning positions and updating market status.
Parameters:
  - p_market_id: UUID of the market to settle
  - p_winning_outcome: The winning outcome (YES or NO)
Returns: VOID
Raises exception if market not found, already resolved, or invalid outcome.';

-- Grant execute permission to authenticated users (admin check in application layer)
GRANT EXECUTE ON FUNCTION settle_market_v2(UUID, outcome_type) TO authenticated;
GRANT EXECUTE ON FUNCTION settle_market_v2(UUID, outcome_type) TO service_role;
