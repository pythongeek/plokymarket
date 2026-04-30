-- Migration 00002: Functions and Triggers
-- Generated 2026-04-30 from live cx33 database

-- Trigger function: update updated_at
CREATE OR REPLACE FUNCTION plokymarket_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: create wallet on user creation
CREATE OR REPLACE FUNCTION plokymarket_create_wallet_on_user()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.id;
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        VALUES (NEW.id, 0, 0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: get market prices (order book pricing)
CREATE OR REPLACE FUNCTION plokymarket_get_market_prices(p_market_id UUID)
RETURNS TABLE(
    yes_price NUMERIC,
    no_price NUMERIC,
    yes_volume BIGINT,
    no_volume BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH yes_orders AS (
        SELECT
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_yes_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_yes_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id
            AND outcome = 'YES'
            AND status IN ('open', 'partially_filled')
    ),
    no_orders AS (
        SELECT
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_no_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_no_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as no_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as no_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id
            AND outcome = 'NO'
            AND status IN ('open', 'partially_filled')
    )
    SELECT
        CASE
            WHEN y.best_yes_ask > 0 THEN LEAST(y.best_yes_ask, 1 - COALESCE(n.best_no_bid, 0))
            ELSE 0.5
        END as yes_price,
        CASE
            WHEN n.best_no_ask > 0 THEN LEAST(n.best_no_ask, 1 - COALESCE(y.best_yes_bid, 0))
            ELSE 0.5
        END as no_price,
        COALESCE(y.yes_buy_volume, 0) + COALESCE(y.yes_sell_volume, 0) as yes_volume,
        COALESCE(n.no_buy_volume, 0) + COALESCE(n.no_sell_volume, 0) as no_volume
    FROM yes_orders y, no_orders n;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: get orderbook
CREATE OR REPLACE FUNCTION plokymarket_get_orderbook(
    p_market_id UUID,
    p_outcome outcome_type,
    p_side order_side
)
RETURNS TABLE(
    price NUMERIC,
    quantity BIGINT,
    total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.price,
        SUM(o.quantity - o.filled_quantity)::BIGINT as quantity,
        SUM((o.quantity - o.filled_quantity) * o.price)::BIGINT as total
    FROM public.orders o
    WHERE o.market_id = p_market_id
        AND o.outcome = p_outcome
        AND o.side = p_side
        AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY
        o.price ASC,
        o.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER plokymarket_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

CREATE TRIGGER plokymarket_update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

CREATE TRIGGER plokymarket_update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

CREATE TRIGGER plokymarket_update_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

CREATE TRIGGER plokymarket_wallet_on_user
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION plokymarket_create_wallet_on_user();
