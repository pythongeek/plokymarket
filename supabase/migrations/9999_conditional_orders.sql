-- ============================================================
-- Conditional Orders Table for Stop-Loss / Take-Profit
-- ============================================================

CREATE TABLE IF NOT EXISTS conditional_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('stop_loss', 'stop_win', 'take_profit')),
    trigger_price NUMERIC NOT NULL CHECK (trigger_price > 0 AND trigger_price < 1),
    order_side TEXT NOT NULL CHECK (order_side IN ('buy', 'sell')),
    order_outcome TEXT NOT NULL CHECK (order_outcome IN ('YES', 'NO')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    slippage_tolerance NUMERIC DEFAULT 0.5 CHECK (slippage_tolerance >= 0 AND slippage_tolerance <= 10),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'expired', 'cancelled', 'failed')),
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
);

-- Index for fast trigger checks on active orders
CREATE INDEX IF NOT EXISTS idx_conditional_orders_active
    ON conditional_orders(market_id, status, trigger_price)
    WHERE status = 'active';

-- Index for user order management
CREATE INDEX IF NOT EXISTS idx_conditional_orders_user
    ON conditional_orders(user_id, status, created_at DESC);

-- Index for cleanup of expired orders
CREATE INDEX IF NOT EXISTS idx_conditional_orders_expires
    ON conditional_orders(expires_at)
    WHERE status = 'active';

-- ============================================================
-- Trigger: Log conditional order creation
-- ============================================================

CREATE OR REPLACE FUNCTION log_conditional_order_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO admin_audit_log (admin_id, action, resource, metadata)
    VALUES (
        NEW.user_id,
        'conditional_order_created',
        'conditional_orders',
        jsonb_build_object(
            'order_id', NEW.id,
            'market_id', NEW.market_id,
            'type', NEW.type,
            'trigger_price', NEW.trigger_price,
            'quantity', NEW.quantity
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_conditional_order_created
    AFTER INSERT ON conditional_orders
    FOR EACH ROW EXECUTE FUNCTION log_conditional_order_created();

-- ============================================================
-- Trigger: Log conditional order triggers
-- ============================================================

CREATE OR REPLACE FUNCTION log_conditional_order_triggered()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'triggered' AND OLD.status = 'active' THEN
        INSERT INTO admin_audit_log (admin_id, action, resource, metadata)
        VALUES (
            NEW.user_id,
            'conditional_order_triggered',
            'conditional_orders',
            jsonb_build_object(
                'order_id', NEW.id,
                'market_id', NEW.market_id,
                'triggered_at', NEW.triggered_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_conditional_order_triggered
    AFTER UPDATE OF status ON conditional_orders
    FOR EACH ROW EXECUTE FUNCTION log_conditional_order_triggered();

-- ============================================================
-- Function: Check and trigger conditional orders
-- Called by cron job /api/cron/check-conditional-orders
-- ============================================================

CREATE OR REPLACE FUNCTION check_conditional_orders_for_market(p_market_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_current_price NUMERIC;
    v_order RECORD;
    v_triggered_count INT := 0;
BEGIN
    -- Get current market price from most recent trade
    SELECT INTO v_current_price
        COALESCE(
            (SELECT price FROM trades WHERE market_id = p_market_id ORDER BY created_at DESC LIMIT 1),
            0.5
        );

    -- Find active orders to trigger
    FOR v_order IN
        SELECT co.*, u.id as owner_id
        FROM conditional_orders co
        JOIN auth.users u ON u.id = co.user_id
        WHERE co.market_id = p_market_id
          AND co.status = 'active'
          AND (
              (co.type = 'stop_loss' AND co.trigger_price >= v_current_price) OR
              (co.type = 'stop_win' AND co.trigger_price <= v_current_price) OR
              (co.type = 'take_profit' AND co.trigger_price <= v_current_price)
          )
          AND (co.expires_at IS NULL OR co.expires_at > NOW())
    LOOP
        -- Mark as triggered
        UPDATE conditional_orders
        SET status = 'triggered', triggered_at = NOW()
        WHERE id = v_order.id;

        -- Log trigger (actual order execution would happen via matching engine)
        INSERT INTO activity_feed (user_id, activity_type, metadata)
        VALUES (
            v_order.user_id,
            'conditional_order_triggered',
            jsonb_build_object(
                'order_id', v_order.id,
                'market_id', p_market_id,
                'type', v_order.type,
                'trigger_price', v_order.trigger_price,
                'executed_price', v_current_price
            )
        );

        v_triggered_count := v_triggered_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'market_id', p_market_id,
        'current_price', v_current_price,
        'triggered_count', v_triggered_count
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_conditional_orders_for_market IS
'Check active conditional orders for a market and trigger those whose price conditions are met.
 Called by the check-conditional-orders cron endpoint.';
