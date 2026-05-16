-- ===================================
-- MATCHING ENGINE FUNCTIONS
-- ===================================

-- Match Order Function
CREATE OR REPLACE FUNCTION match_order(p_order_id UUID)
RETURNS TABLE(matched BOOLEAN, trades_created INT, remaining_quantity BIGINT) AS $$
DECLARE
    v_order RECORD;
    v_match RECORD;
    v_trade_quantity BIGINT;
    v_trade_price NUMERIC(5, 4);
    v_trades_count INT := 0;
    v_remaining BIGINT;
    v_maker_id UUID;
    v_maker_rebate_amount NUMERIC(12, 4);
    v_maker_rebate_percent NUMERIC(5, 2);
    v_is_maker_order BOOLEAN;
BEGIN
    -- Lock and get the order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;
    
    IF NOT FOUND OR v_order.status NOT IN ('open', 'partially_filled') THEN
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT;
        RETURN;
    END IF;
    
    -- Get maker rebate percent from market
    SELECT maker_rebate_percent INTO v_maker_rebate_percent
    FROM public.markets
    WHERE id = v_order.market_id;
    
    -- Default to 0 if not found
    v_maker_rebate_percent := COALESCE(v_maker_rebate_percent, 0);
    
    v_remaining := v_order.quantity - v_order.filled_quantity;
    
    WHILE v_remaining > 0 LOOP
        IF v_order.side = 'buy' THEN
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND (
                  (side = 'sell' AND outcome = v_order.outcome AND price <= v_order.price)
                  OR
                  (side = 'buy' 
                   AND outcome != v_order.outcome 
                   AND (price + v_order.price) <= 1.00)
              )
            ORDER BY 
              CASE 
                WHEN side = 'sell' THEN price
                ELSE (1.00 - price)
              END ASC,
              created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        ELSE
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND side = 'buy'
              AND outcome = v_order.outcome
              AND price >= v_order.price
            ORDER BY price DESC, created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        END IF;
        
        EXIT WHEN NOT FOUND;
        
        v_trade_quantity := LEAST(v_remaining, v_match.quantity - v_match.filled_quantity);
        
        IF v_order.created_at < v_match.created_at THEN
            v_trade_price := v_order.price;
            v_is_maker_order := TRUE;
            v_maker_id := v_order.user_id;
        ELSE
            v_trade_price := v_match.price;
            v_is_maker_order := FALSE;
            v_maker_id := v_match.user_id;
        END IF;
        
        -- Calculate maker rebate amount
        v_maker_rebate_amount := v_trade_quantity * v_trade_price * v_maker_rebate_percent;
        
        -- Create trade with maker rebate tracking
        INSERT INTO public.trades (
            market_id, buy_order_id, sell_order_id, outcome,
            price, quantity, buyer_id, seller_id,
            maker_id, maker_rebate_amount
        ) VALUES (
            v_order.market_id,
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_order.outcome,
            v_trade_price,
            v_trade_quantity,
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END,
            v_maker_id,
            v_maker_rebate_amount
        );
        
        -- Update orders
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END
        WHERE id = v_order.id;
        
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END
        WHERE id = v_match.id;
        
        -- Update positions
        PERFORM update_position(
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, v_order.outcome, v_trade_quantity, v_trade_price
        );
        
        PERFORM update_position(
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, v_order.outcome, -v_trade_quantity, v_trade_price
        );
        
        -- Process settlement
        PERFORM process_trade_settlement(
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_trade_quantity, v_trade_price
        );
        
        v_remaining := v_remaining - v_trade_quantity;
        v_trades_count := v_trades_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_trades_count > 0, v_trades_count, v_remaining;
END;
$$ LANGUAGE plpgsql;

-- Position update helper
CREATE OR REPLACE FUNCTION update_position(
    p_user_id UUID, p_market_id UUID, p_outcome outcome_type,
    p_quantity_delta BIGINT, p_price NUMERIC(5, 4)
) RETURNS VOID AS $$
DECLARE
    v_position RECORD;
BEGIN
    SELECT * INTO v_position
    FROM public.positions
    WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome
    FOR UPDATE;
    
    IF NOT FOUND THEN
        INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price)
        VALUES (p_user_id, p_market_id, p_outcome, p_quantity_delta, p_price);
    ELSE
        UPDATE public.positions SET 
            quantity = quantity + p_quantity_delta,
            average_price = CASE 
                WHEN p_quantity_delta > 0 THEN
                    (average_price * quantity + p_price * p_quantity_delta) / (quantity + p_quantity_delta)
                ELSE average_price
            END
        WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trade settlement
CREATE OR REPLACE FUNCTION process_trade_settlement(
    p_buy_order_id UUID, p_sell_order_id UUID,
    p_quantity BIGINT, p_price NUMERIC(5, 4)
) RETURNS VOID AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_total_cost NUMERIC(12, 2);
BEGIN
    SELECT user_id INTO v_buyer_id FROM public.orders WHERE id = p_buy_order_id;
    SELECT user_id INTO v_seller_id FROM public.orders WHERE id = p_sell_order_id;
    
    v_total_cost := p_quantity * p_price;
    
    -- LOCK wallets in deterministic order to prevent deadlocks
    -- Order by user_id ensures consistent lock acquisition across concurrent match_order calls
    IF v_buyer_id < v_seller_id THEN
        PERFORM 1 FROM public.wallets WHERE user_id = v_buyer_id FOR UPDATE;
        PERFORM 1 FROM public.wallets WHERE user_id = v_seller_id FOR UPDATE;
    ELSE
        PERFORM 1 FROM public.wallets WHERE user_id = v_seller_id FOR UPDATE;
        PERFORM 1 FROM public.wallets WHERE user_id = v_buyer_id FOR UPDATE;
    END IF;
    
    -- Update buyer wallet (deduct from available balance)
    UPDATE public.wallets SET 
        balance = balance - v_total_cost
    WHERE user_id = v_buyer_id;
    
    -- Update seller wallet (add to available balance)
    UPDATE public.wallets SET 
        balance = balance + v_total_cost
    WHERE user_id = v_seller_id;
    
    -- Log transactions
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, order_id)
    SELECT user_id, 'trade_buy'::transaction_type, -v_total_cost, 
           balance + v_total_cost, balance, p_buy_order_id
    FROM public.wallets WHERE user_id = v_buyer_id;
    
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, order_id)
    SELECT user_id, 'trade_sell'::transaction_type, v_total_cost, 
           balance - v_total_cost, balance, p_sell_order_id
    FROM public.wallets WHERE user_id = v_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Market settlement
CREATE OR REPLACE FUNCTION settle_market(p_market_id UUID, p_winning_outcome outcome_type)
RETURNS TABLE(users_settled INT, total_payout NUMERIC(12, 2)) AS $$
DECLARE
    v_position RECORD;
    v_payout NUMERIC(12, 2);
    v_count INT := 0;
    v_total NUMERIC(12, 2) := 0;
BEGIN
    UPDATE public.markets SET 
        status = 'resolved'::market_status,
        winning_outcome = p_winning_outcome,
        resolved_at = NOW()
    WHERE id = p_market_id;
    
    FOR v_position IN
        SELECT user_id, outcome, quantity
        FROM public.positions
        WHERE market_id = p_market_id AND quantity > 0
    LOOP
        IF v_position.outcome = p_winning_outcome THEN
            v_payout := v_position.quantity * 1.00;
            
            UPDATE public.wallets SET balance = balance + v_payout
            WHERE user_id = v_position.user_id;
            
            INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, market_id)
            SELECT user_id, 'settlement'::transaction_type, v_payout,
                   balance - v_payout, balance, p_market_id
            FROM public.wallets WHERE user_id = v_position.user_id;
            
            v_total := v_total + v_payout;
        END IF;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_count, v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get total maker rebates for a user
CREATE OR REPLACE FUNCTION get_user_maker_rebates(p_user_id UUID, p_start_date TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()), p_end_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE(total_rebate NUMERIC(12, 4), trade_count BIGINT) AS $$
BEGIN
    RETURN QUERY 
    SELECT COALESCE(SUM(maker_rebate_amount), 0), COUNT(*)
    FROM public.trades
    WHERE maker_id = p_user_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get maker rebates by market
CREATE OR REPLACE FUNCTION get_market_maker_rebates(p_market_id UUID)
RETURNS TABLE(maker_id UUID, total_rebate NUMERIC(12, 4), trade_count BIGINT) AS $$
BEGIN
    RETURN QUERY 
    SELECT maker_id, COALESCE(SUM(maker_rebate_amount), 0), COUNT(*)
    FROM public.trades
    WHERE market_id = p_market_id
      AND maker_id IS NOT NULL
      AND maker_rebate_amount > 0
    GROUP BY maker_id;
END;
$$ LANGUAGE plpgsql;
