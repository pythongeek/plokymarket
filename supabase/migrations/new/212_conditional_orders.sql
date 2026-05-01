-- ============================================================
-- DOMAIN: conditional_orders
-- PURPOSE: Add support for stop-loss, take-profit, OCO, and trailing stop orders
-- Created: 2026-05-01
-- ============================================================

-- ============================================================
-- PART 1: EXTEND ORDER_TYPE ENUM
-- ============================================================
DO $$ BEGIN
    CREATE TYPE order_condition_type AS ENUM ('stop_loss', 'stop_limit', 'oco', 'trailing_stop', 'take_profit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- PART 2: CONDITIONAL ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conditional_orders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    market_id               UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    
    -- Order identification
    parent_order_id         UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    oco_group_id            UUID,
    
    -- Order type and side
    condition_type          order_condition_type NOT NULL,
    side                    order_side NOT NULL,
    outcome                 outcome_type NOT NULL,
    
    -- Pricing
    trigger_price           NUMERIC(5, 4) NOT NULL,
    limit_price             NUMERIC(5, 4),
    
    -- Trailing stop specific
    trail_amount            NUMERIC(5, 4),
    trail_type              VARCHAR(20),
    highest_price           NUMERIC(5, 4),
    lowest_price            NUMERIC(5, 4),
    
    -- Quantity
    quantity                BIGINT NOT NULL CHECK (quantity > 0),
    filled_quantity         BIGINT DEFAULT 0 CHECK (filled_quantity <= quantity),
    
    -- Status
    status                  VARCHAR(30) NOT NULL DEFAULT 'pending',
    triggered_at            TIMESTAMPTZ,
    executed_at             TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancel_reason           TEXT,
    
    -- Execution tracking
    executed_order_id       UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    execution_price        NUMERIC(5, 4),
    
    -- Metadata
    metadata                JSONB DEFAULT '{}'::JSONB,
    
    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at              TIMESTAMPTZ
);

-- ============================================================
-- PART 3: ADD COLUMNS TO EXISTING ORDERS TABLE
-- ============================================================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS stop_price NUMERIC(5, 4),
ADD COLUMN IF NOT EXISTS trail_amount NUMERIC(5, 4),
ADD COLUMN IF NOT EXISTS trail_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS oco_group_id UUID,
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conditional_order_id UUID REFERENCES public.conditional_orders(id) ON DELETE SET NULL;

-- ============================================================
-- PART 4: CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conditional_orders_user_market 
    ON public.conditional_orders(user_id, market_id);

CREATE INDEX IF NOT EXISTS idx_conditional_orders_status 
    ON public.conditional_orders(status) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_conditional_orders_trigger 
    ON public.conditional_orders(market_id, condition_type, trigger_price) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_conditional_orders_oco 
    ON public.conditional_orders(oco_group_id) 
    WHERE oco_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_conditional 
    ON public.orders(conditional_order_id) 
    WHERE conditional_order_id IS NOT NULL;

-- ============================================================
-- PART 5: CREATE TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.conditional_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plokymarket_update_conditional_orders_updated_at ON public.conditional_orders;
CREATE TRIGGER plokymarket_update_conditional_orders_updated_at 
    BEFORE UPDATE ON public.conditional_orders
    FOR EACH ROW EXECUTE FUNCTION public.conditional_orders_updated_at();

-- ============================================================
-- PART 6: CREATE EXECUTION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.execute_conditional_order(p_conditional_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cond_order RECORD;
    v_order_id UUID;
    v_market RECORD;
    v_executed_price NUMERIC(5, 4);
    v_order RECORD;
BEGIN
    -- Get conditional order
    SELECT * INTO v_cond_order
    FROM conditional_orders
    WHERE id = p_conditional_order_id AND status = 'pending'
    FOR UPDATE;

    IF v_cond_order IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Conditional order not found or already processed'
        );
    END IF;

    -- Get market info
    SELECT * INTO v_market
    FROM markets
    WHERE id = v_cond_order.market_id
    FOR UPDATE;

    IF v_market.status != 'active' THEN
        -- Update status to expired
        UPDATE conditional_orders 
        SET status = 'expired', 
            cancel_reason = 'Market no longer active',
            updated_at = NOW()
        WHERE id = p_conditional_order_id;

        RETURN jsonb_build_object(
            'success', false,
            'error', 'Market is no longer active'
        );
    END IF;

    -- Determine execution price
    IF v_cond_order.condition_type = 'oco' THEN
        -- OCO uses limit price
        v_executed_price := v_cond_order.limit_price;
    ELSIF v_cond_order.condition_type = 'trailing_stop' THEN
        -- Trailing stop calculates dynamically
        v_executed_price := v_cond_order.trigger_price;
    ELSE
        -- Stop orders use trigger price or limit price
        v_executed_price := COALESCE(v_cond_order.limit_price, v_cond_order.trigger_price);
    END IF;

    -- Create the actual order
    INSERT INTO orders (
        market_id,
        user_id,
        order_type,
        side,
        outcome,
        price,
        quantity,
        filled_quantity,
        status,
        stop_price,
        conditional_order_id
    ) VALUES (
        v_cond_order.market_id,
        v_cond_order.user_id,
        CASE 
            WHEN v_cond_order.condition_type IN ('stop_loss', 'stop_limit', 'trailing_stop') THEN 'limit'
            ELSE 'limit'
        END,
        v_cond_order.side,
        v_cond_order.outcome,
        v_executed_price,
        v_cond_order.quantity - v_cond_order.filled_quantity,
        0,
        'open',
        v_cond_order.trigger_price,
        v_cond_order.id
    ) RETURNING id INTO v_order_id;

    -- Update conditional order
    UPDATE conditional_orders
    SET status = 'triggered',
        triggered_at = NOW(),
        executed_order_id = v_order_id,
        execution_price = v_executed_price,
        updated_at = NOW()
    WHERE id = p_conditional_order_id;

    -- Cancel OCO sibling if exists
    IF v_cond_order.oco_group_id IS NOT NULL THEN
        UPDATE conditional_orders
        SET status = 'cancelled',
            cancelled_at = NOW(),
            cancel_reason = 'OCO sibling triggered',
            updated_at = NOW()
        WHERE oco_group_id = v_cond_order.oco_group_id
          AND id != p_conditional_order_id
          AND status = 'pending';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'conditional_order_id', p_conditional_order_id,
        'executed_order_id', v_order_id,
        'execution_price', v_executed_price
    );
END;
$$;

-- ============================================================
-- PART 7: CREATE CONDITION CHECKING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_conditional_orders(p_market_id UUID, p_current_price NUMERIC(5, 4))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_triggered_orders UUID[];
    v_order RECORD;
BEGIN
    -- Find orders that should trigger
    FOR v_order IN
        SELECT co.id, co.condition_type, co.side, co.trigger_price, co.limit_price
        FROM conditional_orders co
        WHERE co.market_id = p_market_id
          AND co.status = 'pending'
          AND (co.expires_at IS NULL OR co.expires_at > NOW())
    LOOP
        -- Check stop-loss conditions
        IF v_order.condition_type = 'stop_loss' THEN
            IF v_order.side = 'sell' AND p_current_price <= v_order.trigger_price THEN
                v_triggered_orders := array_append(v_triggered_orders, v_order.id);
            ELSIF v_order.side = 'buy' AND p_current_price >= v_order.trigger_price THEN
                v_triggered_orders := array_append(v_triggered_orders, v_order.id);
            END IF;
        END IF;

        -- Check stop-limit conditions
        IF v_order.condition_type = 'stop_limit' THEN
            IF v_order.side = 'sell' AND p_current_price <= v_order.trigger_price THEN
                v_triggered_orders := array_append(v_triggered_orders, v_order.id);
            ELSIF v_order.side = 'buy' AND p_current_price >= v_order.trigger_price THEN
                v_triggered_orders := array_append(v_triggered_orders, v_order.id);
            END IF;
        END IF;

        -- Check take-profit conditions
        IF v_order.condition_type = 'take_profit' THEN
            IF v_order.side = 'sell' AND p_current_price >= v_order.trigger_price THEN
                v_triggered_orders := array_append(v_triggered_orders, v_order.id);
            ELSIF v_order.side = 'buy' AND p_current_price <= v_order.trigger_price THEN
                v_triggered_orders := array_append(v_triggered_orders, v_order.id);
            END IF;
        END IF;
    END LOOP;

    -- Execute triggered orders
    FOR i IN 1..coalesce(array_length(v_triggered_orders, 1), 0) LOOP
        PERFORM public.execute_conditional_order(v_triggered_orders[i]);
    END LOOP;

    RETURN jsonb_build_object(
        'checked_market', p_market_id,
        'current_price', p_current_price,
        'triggered_count', coalesce(array_length(v_triggered_orders, 1), 0),
        'triggered_orders', v_triggered_orders
    );
END;
$$;

-- ============================================================
-- PART 8: RLS POLICIES
-- ============================================================
ALTER TABLE public.conditional_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conditional orders
CREATE POLICY "conditional_orders_select_own" ON public.conditional_orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conditional_orders_insert_own" ON public.conditional_orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "conditional_orders_update_own" ON public.conditional_orders
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "conditional_orders_delete_own" ON public.conditional_orders
    FOR DELETE USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "conditional_orders_service_all" ON public.conditional_orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Migration completed
-- ============================================================
SELECT 'Migration 212 completed: Conditional orders system added' AS status;
