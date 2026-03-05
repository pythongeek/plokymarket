-- ============================================
-- ORDER SYSTEM RELIABILITY FIX
-- Migration: 124_order_system_fix
--
-- Features:
-- 1. Foreign Key fixes for positions referencing events
-- 2. Atomic order placement with race condition prevention (FOR UPDATE locks)
-- 3. Automated liquidity seeding for new events
-- ============================================

BEGIN;

-- ============================================
-- 1. FK FIXES FOR POSITIONS TABLE
-- ============================================

-- Drop old FK if exists and create new one pointing to events
ALTER TABLE public.positions
    DROP CONSTRAINT IF EXISTS positions_market_id_fkey;

-- Note: positions now references events(id) via market_id column
ALTER TABLE public.positions
    ADD CONSTRAINT positions_market_id_fkey 
    FOREIGN KEY (market_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- ============================================
-- 2. ATOMIC ORDER PLACEMENT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.place_order_atomic(
    p_user_id UUID,
    p_market_id UUID,
    p_side TEXT, -- 'yes' or 'no' 
    p_amount DECIMAL,
    p_price DECIMAL
) RETURNS JSONB AS $$
DECLARE
    v_user_balance DECIMAL;
    v_total_cost DECIMAL;
    v_order_id UUID;
    v_existing_order UUID;
BEGIN
    -- Validate inputs
    IF p_amount <= 0 OR p_price <= 0 THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Invalid amount or price');
    END IF;
    
    IF p_side NOT IN ('yes', 'no', 'YES', 'NO') THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Side must be yes or no');
    END IF;

    -- Normalize side to uppercase
    p_side := UPPER(p_side);

    -- Calculate total cost
    v_total_cost := p_amount * p_price;

    -- Get user balance with row lock to prevent race conditions
    SELECT balance INTO v_user_balance 
    FROM public.wallets 
    WHERE user_id = p_user_id 
    FOR UPDATE;

    -- Check sufficient balance
    IF v_user_balance < v_total_cost THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Insufficient balance');
    END IF;

    -- Deduct balance (atomic operation)
    UPDATE public.wallets 
    SET balance = balance - v_total_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Insert into orders table
    INSERT INTO public.orders (user_id, market_id, side, amount, price, status, outcome)
    VALUES (p_user_id, p_market_id, p_side, p_amount, p_price, 'open', p_side)
    RETURNING id INTO v_order_id;

    -- Insert or update position (UPSERT)
    INSERT INTO public.positions (user_id, market_id, side, size, outcome)
    VALUES (p_user_id, p_market_id, p_side, p_amount, p_side)
    ON CONFLICT (user_id, market_id, side) 
    DO UPDATE SET 
        size = positions.size + p_amount,
        updated_at = NOW();

    RETURN jsonb_build_object(
        'status', 'success', 
        'order_id', v_order_id,
        'amount', p_amount,
        'price', p_price,
        'side', p_side,
        'total_cost', v_total_cost
    );

EXCEPTION WHEN OTHERS THEN
    -- Auto rollback on any error
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. AUTOMATED LIQUIDITY SEEDING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.seed_initial_liquidity(
    p_event_id UUID,
    p_initial_price DECIMAL DEFAULT 0.5,
    p_liquidity DECIMAL DEFAULT 1000
) RETURNS JSONB AS $$
DECLARE
    v_spread DECIMAL := 0.04;
    v_liquidity_per_side DECIMAL;
    v_order_id UUID;
    v_orders_created INTEGER := 0;
BEGIN
    -- Calculate liquidity per side
    v_liquidity_per_side := p_liquidity / 4;

    -- Check if event exists
    IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_event_id) THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Event not found');
    END IF;

    -- Check if already seeded
    IF EXISTS (SELECT 1 FROM order_book WHERE market_id = p_event_id LIMIT 1) THEN
        RETURN jsonb_build_object('status', 'warning', 'message', 'Event already has liquidity');
    END IF;

    -- YES Outcome: Create BIDS (Buy orders at lower prices)
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', p_initial_price - v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', 'YES');
    v_orders_created := v_orders_created + 1;

    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', p_initial_price - v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', 'YES');
    v_orders_created := v_orders_created + 1;

    -- YES Outcome: Create ASKS (Sell orders at higher prices)
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', p_initial_price + v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', 'YES');
    v_orders_created := v_orders_created + 1;

    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', p_initial_price + v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', 'YES');
    v_orders_created := v_orders_created + 1;

    -- NO Outcome: Create BIDS
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', (1 - p_initial_price) - v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', 'NO');
    v_orders_created := v_orders_created + 1;

    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'BUY', (1 - p_initial_price) - v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', 'NO');
    v_orders_created := v_orders_created + 1;

    -- NO Outcome: Create ASKS
    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', (1 - p_initial_price) + v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', 'NO');
    v_orders_created := v_orders_created + 1;

    v_order_id := gen_random_uuid();
    INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, outcome)
    VALUES (v_order_id, p_event_id, NULL, 'SELL', (1 - p_initial_price) + v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', 'NO');
    v_orders_created := v_orders_created + 1;

    RETURN jsonb_build_object(
        'status', 'success',
        'event_id', p_event_id,
        'orders_created', v_orders_created,
        'liquidity', p_liquidity
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. TRIGGER FOR AUTO-SEEDING ON EVENT ACTIVATION
-- ============================================

CREATE OR REPLACE FUNCTION trigger_auto_seed_liquidity()
RETURNS TRIGGER AS $$
BEGIN
    -- Seed liquidity when event becomes active
    IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
        PERFORM seed_initial_liquidity(
            NEW.id, 
            0.5, 
            COALESCE(NEW.initial_liquidity, 1000)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS auto_seed_liquidity_on_event_activate ON events;

CREATE TRIGGER auto_seed_liquidity_on_event_activate
    AFTER UPDATE OF status ON events
    FOR EACH ROW
    WHEN (NEW.status = 'active')
    EXECUTE FUNCTION trigger_auto_seed_liquidity();

-- ============================================
-- 5. GRANT EXECUTE PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.place_order_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_initial_liquidity TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_atomic TO anon;
GRANT EXECUTE ON FUNCTION public.seed_initial_liquidity TO anon;

COMMIT;

-- ============================================
-- SUMMARY:
-- 1. Added positions -> events FK constraint
-- 2. Created place_order_atomic() with FOR UPDATE locks
-- 3. Created seed_initial_liquidity() for auto-seeding
-- 4. Created trigger for auto-seeding on event activation
-- ============================================
