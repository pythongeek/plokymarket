-- 017_atomic_order_commitment.sql
-- Implements Atomic Order Placement with Collateral Locking

CREATE OR REPLACE FUNCTION place_atomic_order(
    p_market_id UUID,
    p_side order_side,
    p_outcome outcome_type,
    p_price NUMERIC(5, 4),
    p_quantity BIGINT,
    p_order_type order_type DEFAULT 'limit'
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_total_cost NUMERIC(12, 2);
    v_wallet_balance NUMERIC(12, 2);
    v_order_id UUID;
BEGIN
    -- 1. Get current user ID from session
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Calculate required collateral
    v_total_cost := p_price * p_quantity;

    -- 3. Lock wallet row and verify balance (Defensive check)
    -- Using FOR UPDATE for row-level locking
    SELECT balance INTO v_wallet_balance
    FROM public.wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_wallet_balance < v_total_cost THEN
        RAISE EXCEPTION 'INSUFFICIENT_BALANCE' USING ERRCODE = 'P0002';
    END IF;

    -- 4. Lock collateral atomically
    UPDATE public.wallets
    SET 
        balance = balance - v_total_cost,
        locked_balance = locked_balance + v_total_cost,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- 5. Insert order with 'open' status
    INSERT INTO public.orders (
        market_id,
        user_id,
        order_type,
        side,
        outcome,
        price,
        quantity,
        filled_quantity,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_market_id,
        v_user_id,
        p_order_type,
        p_side,
        p_outcome,
        p_price,
        p_quantity,
        0,
        'open',
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;

    -- 6. Immediately trigger matching engine within the same transaction
    -- If matching succeeds/fails, it will commit/rollback as one unit
    PERFORM public.match_order(v_order_id);

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION place_atomic_order(UUID, order_side, outcome_type, NUMERIC, BIGINT, order_type) TO authenticated;
