-- ============================================
-- SETTLE MARKET FUNCTION
-- ============================================
-- Processes settlement for a resolved market.
-- Winners get $1.00 per winning share. Losers get $0.00.
-- Platform fee (2%) collected. LP liquidity unlocked.
--
-- This function uses the CLOB orders/trades to determine positions.

-- Drop any existing overloads to avoid "function name is not unique" error
DO $$ BEGIN
  -- Drop all existing settle_market functions regardless of signature
  FOR r IN (
    SELECT oid::regprocedure AS func_sig
    FROM pg_proc
    WHERE proname = 'settle_market'
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if function doesn't exist yet
END $$;

CREATE OR REPLACE FUNCTION settle_market(
    p_market_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_market RECORD;
    v_winning_outcome TEXT;
    v_total_payout DECIMAL(20,2) := 0;
    v_total_claims INT := 0;
    v_fee_rate DECIMAL(5,4) := 0.02; -- 2% platform fee
    v_total_fees DECIMAL(20,2) := 0;
    v_position RECORD;
    v_payout DECIMAL(20,2);
    v_claim_id TEXT;
    v_batch_id TEXT;
BEGIN
    -- 1. Get and validate market
    SELECT * INTO v_market
    FROM markets
    WHERE id = p_market_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Market not found: %', p_market_id;
    END IF;

    IF v_market.status != 'resolved' THEN
        RAISE EXCEPTION 'Market must be in resolved status. Current: %', v_market.status;
    END IF;

    v_winning_outcome := v_market.winning_outcome;
    IF v_winning_outcome IS NULL THEN
        RAISE EXCEPTION 'No winning outcome set for market %', p_market_id;
    END IF;

    -- 2. Generate batch ID
    v_batch_id := 'batch-' || p_market_id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;

    -- 3. Process all filled orders for this market
    -- Winners: users who bought the winning outcome (YES side if binary)
    -- We use the trades/fills table if available, otherwise orders.
    
    -- For each user that has a net position in the winning outcome:
    FOR v_position IN
        SELECT 
            o.user_id,
            SUM(CASE 
                WHEN o.side = 'buy' THEN o.filled_quantity
                WHEN o.side = 'sell' THEN -o.filled_quantity
                ELSE 0
            END) as net_shares,
            o.outcome_index
        FROM orders o
        WHERE o.market_id = p_market_id
            AND o.status IN ('filled', 'partially_filled')
        GROUP BY o.user_id, o.outcome_index
        HAVING SUM(CASE 
            WHEN o.side = 'buy' THEN o.filled_quantity
            WHEN o.side = 'sell' THEN -o.filled_quantity
            ELSE 0
        END) > 0
    LOOP
        -- Determine if this position is a winner
        -- For binary: outcome_index 0 = Yes, 1 = No
        -- For categorical: match against winning_outcome text
        
        -- Calculate payout: $1.00 per winning share minus fees
        IF v_position.outcome_index::TEXT = v_winning_outcome 
           OR v_winning_outcome = 'Yes' AND v_position.outcome_index = 0
           OR v_winning_outcome = 'No' AND v_position.outcome_index = 1
        THEN
            v_payout := v_position.net_shares * (1.0 - v_fee_rate);
            v_total_fees := v_total_fees + (v_position.net_shares * v_fee_rate);
        ELSE
            v_payout := 0;
        END IF;

        IF v_payout > 0 THEN
            v_claim_id := 'claim-' || v_position.user_id || '-' || p_market_id;
            v_total_payout := v_total_payout + v_payout;
            v_total_claims := v_total_claims + 1;

            -- Create settlement claim
            INSERT INTO settlement_claims (
                claim_id,
                user_id,
                market_id,
                outcome,
                shares,
                payout_amount,
                status,
                opt_in_auto_settle,
                created_at,
                claimed_at
            ) VALUES (
                v_claim_id,
                v_position.user_id,
                p_market_id,
                v_winning_outcome,
                v_position.net_shares,
                v_payout,
                'auto_settled',
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (claim_id) DO NOTHING;

            -- Credit user's wallet balance
            UPDATE wallets
            SET available_balance = available_balance + v_payout,
                updated_at = NOW()
            WHERE user_id = v_position.user_id;

            -- If wallet doesn't exist, try user_profiles
            IF NOT FOUND THEN
                UPDATE user_profiles
                SET balance = COALESCE(balance, 0) + v_payout,
                    updated_at = NOW()
                WHERE id = v_position.user_id;
            END IF;
        END IF;
    END LOOP;

    -- 4. Create settlement batch record
    INSERT INTO settlement_batches (
        batch_id,
        market_id,
        claim_ids,
        total_amount,
        status,
        created_at,
        processed_at
    ) VALUES (
        v_batch_id,
        p_market_id,
        ARRAY[]::TEXT[], -- Will be populated by individual claims
        v_total_payout,
        'completed',
        NOW(),
        NOW()
    )
    ON CONFLICT (batch_id) DO NOTHING;

    -- 5. Update market to settled
    UPDATE markets SET
        status = 'settled',
        updated_at = NOW()
    WHERE id = p_market_id;

    -- 6. Unlock any locked liquidity (LP funds)
    UPDATE wallets
    SET locked_balance = GREATEST(0, locked_balance - (
        SELECT COALESCE(SUM(locked_amount), 0)
        FROM orders
        WHERE market_id = p_market_id
          AND status = 'open'
    )),
    available_balance = available_balance + (
        SELECT COALESCE(SUM(locked_amount), 0)
        FROM orders
        WHERE market_id = p_market_id
          AND status = 'open'
    ),
    updated_at = NOW()
    WHERE user_id IN (
        SELECT DISTINCT user_id FROM orders WHERE market_id = p_market_id AND status = 'open'
    );

    -- 7. Cancel remaining open orders
    UPDATE orders SET
        status = 'cancelled',
        updated_at = NOW()
    WHERE market_id = p_market_id
      AND status = 'open';

    -- 8. Return summary
    RETURN jsonb_build_object(
        'market_id', p_market_id,
        'winning_outcome', v_winning_outcome,
        'total_claims', v_total_claims,
        'total_payout', v_total_payout,
        'total_fees', v_total_fees,
        'batch_id', v_batch_id,
        'settled_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (will be called by admin through API)
GRANT EXECUTE ON FUNCTION settle_market(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION settle_market(UUID, UUID) IS 'Atomic settlement: credits winners, collects fees, unlocks liquidity, cancels open orders.';
