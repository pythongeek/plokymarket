-- Migration: PMF Margin System
-- Position Margin Feed tables for tracking margin requirements and liquidations

-- Enum for margin event types
CREATE TYPE margin_event_type AS ENUM (
    'margin_check',
    'margin_call',
    'liquidation',
    'margin_deposit',
    'margin_withdrawal',
    'position_opened',
    'position_closed',
    'order_filled',
    'order_cancelled'
);

-- Enum for margin status
CREATE TYPE margin_status AS ENUM (
    'healthy',
    'warning',
    'critical',
    'liquidated'
);

-- Margin history table - audit trail for all margin events
CREATE TABLE IF NOT EXISTS margin_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type margin_event_type NOT NULL,
    margin_before NUMERIC DEFAULT 0,
    margin_after NUMERIC DEFAULT 0,
    pnl_realized NUMERIC DEFAULT 0,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user margin history
CREATE INDEX idx_margin_history_user_id ON margin_history(user_id);
CREATE INDEX idx_margin_history_event_type ON margin_history(event_type);
CREATE INDEX idx_margin_history_created_at ON margin_history(created_at DESC);
CREATE INDEX idx_margin_history_market_id ON margin_history(market_id);

-- Margin locks table - tracks margin locked for pending orders
CREATE TABLE IF NOT EXISTS margin_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ
);

-- Index for margin locks
CREATE INDEX idx_margin_locks_user_id ON margin_locks(user_id);
CREATE INDEX idx_margin_locks_order_id ON margin_locks(order_id);
CREATE INDEX idx_margin_locks_status ON margin_locks(status);

-- User margin settings table - allows users to set their own margin preferences
CREATE TABLE IF NOT EXISTS user_margin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    auto_topup_enabled BOOLEAN DEFAULT FALSE,
    auto_topup_threshold NUMERIC DEFAULT 0.2,
    auto_topup_amount NUMERIC DEFAULT 100,
    preferred_margin_ratio NUMERIC DEFAULT 0.1,
    liquidation_protection_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Margin calculations snapshot for analytics
CREATE TABLE IF NOT EXISTS margin_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_type VARCHAR(20) NOT NULL,
    total_margin_required NUMERIC DEFAULT 0,
    total_margin_available NUMERIC DEFAULT 0,
    margin_utilization_pct NUMERIC DEFAULT 0,
    positions_count INTEGER DEFAULT 0,
    positions_at_risk INTEGER DEFAULT 0,
    snapshot_data JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for margin snapshots
CREATE INDEX idx_margin_snapshots_user_id ON margin_snapshots(user_id);
CREATE INDEX idx_margin_snapshots_recorded_at ON margin_snapshots(recorded_at DESC);
CREATE INDEX idx_margin_snapshots_type ON margin_snapshots(snapshot_type);

-- RPC: Lock margin for order
CREATE OR REPLACE FUNCTION lock_margin_for_order(
    p_user_id UUID,
    p_order_id UUID,
    p_market_id UUID,
    p_margin_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_balance NUMERIC;
    v_locked_balance NUMERIC;
    v_available NUMERIC;
BEGIN
    -- Get current wallet state
    SELECT balance, locked_balance INTO v_wallet_balance, v_locked_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    v_available := v_wallet_balance - v_locked_balance;

    -- Check if enough margin is available
    IF v_available < p_margin_amount THEN
        RAISE EXCEPTION 'Insufficient margin';
    END IF;

    -- Lock the margin
    UPDATE wallets
    SET locked_balance = locked_balance + p_margin_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record the lock
    INSERT INTO margin_locks (user_id, order_id, market_id, amount, status)
    VALUES (p_user_id, p_order_id, p_market_id, p_margin_amount, 'active');

    -- Log the event
    INSERT INTO margin_history (user_id, market_id, order_id, event_type, notes)
    VALUES (p_user_id, p_market_id, p_order_id, 'margin_check', 
            jsonb_build_object('action', 'lock', 'amount', p_margin_amount));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RPC: Release margin for order
CREATE OR REPLACE FUNCTION release_margin_for_order(
    p_user_id UUID,
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_lock_id UUID;
    v_amount NUMERIC;
BEGIN
    -- Find the active lock
    SELECT id, amount INTO v_lock_id, v_amount
    FROM margin_locks
    WHERE order_id = p_order_id AND status = 'active'
    FOR UPDATE;

    IF v_lock_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Release the margin
    UPDATE wallets
    SET locked_balance = locked_balance - v_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Update lock status
    UPDATE margin_locks
    SET status = 'released',
        released_at = NOW()
    WHERE id = v_lock_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RPC: Deposit margin
CREATE OR REPLACE FUNCTION deposit_margin(
    p_user_id UUID,
    p_amount NUMERIC,
    p_source VARCHAR(20) DEFAULT 'deposit'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Get current balance
    SELECT balance INTO v_wallet_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    v_new_balance := v_wallet_balance + p_amount;

    -- Update balance
    UPDATE wallets
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log the deposit
    INSERT INTO margin_history (user_id, event_type, margin_before, margin_after, pnl_realized, notes)
    VALUES (
        p_user_id,
        'margin_deposit',
        v_wallet_balance,
        v_new_balance,
        0,
        jsonb_build_object('source', p_source, 'amount', p_amount)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RPC: Liquidate position
CREATE OR REPLACE FUNCTION liquidate_position(
    p_user_id UUID,
    p_market_id UUID,
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_position RECORD;
    v_market RECORD;
    v_wallet_balance NUMERIC;
    v_liquidation_price NUMERIC;
    v_loss NUMERIC;
BEGIN
    -- Get position to liquidate
    SELECT * INTO v_position
    FROM positions
    WHERE user_id = p_user_id AND market_id = p_market_id AND quantity > 0;

    IF v_position IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Position not found');
    END IF;

    -- Get market data
    SELECT * INTO v_market FROM markets WHERE id = p_market_id;

    -- Get wallet balance
    SELECT balance INTO v_wallet_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;

    -- Calculate liquidation at current price (or 0.5 if not set)
    v_liquidation_price := COALESCE(
        CASE WHEN v_position.outcome = 'YES' THEN v_market.current_yes_price ELSE v_market.current_no_price END,
        0.5
    );

    -- Calculate loss
    v_loss := v_position.quantity * (v_position.average_price - v_liquidation_price);

    -- Close position at current market price
    UPDATE positions
    SET quantity = 0,
        realized_pnl = realized_pnl + v_loss,
        updated_at = NOW()
    WHERE id = v_position.id;

    -- Log liquidation
    INSERT INTO margin_history (user_id, market_id, event_type, margin_before, margin_after, pnl_realized, notes)
    VALUES (
        p_user_id,
        p_market_id,
        'liquidation',
        v_wallet_balance,
        v_wallet_balance + v_loss,
        v_loss,
        jsonb_build_object('admin_id', p_admin_id, 'liquidation_price', v_liquidation_price, 'loss', v_loss)
    );

    RETURN jsonb_build_object(
        'success', true,
        'liquidation_price', v_liquidation_price,
        'loss', v_loss,
        'new_balance', v_wallet_balance + v_loss
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-release margin when order is cancelled
CREATE OR REPLACE FUNCTION trigger_release_margin_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status = 'open' THEN
        PERFORM release_margin_for_order(NEW.user_id, NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_order_cancelled
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_release_margin_on_cancel();
