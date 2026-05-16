-- ============================================================================
-- Migration 20260513_03: Financial Integrity Constraints
-- Fixes: V2 (race conditions), W3 (negative balances), W4 (state transitions)
-- Rule 12: FAIL LOUD if existing data violates constraints
-- ============================================================================

-- ============================================================================
-- PRE-CHECK 1: Wallet negative balances
-- If any wallet has balance < 0, this migration MUST abort.
-- Negative balances indicate existing data corruption that must be fixed FIRST.
-- ============================================================================
DO $$
DECLARE
    v_negative_wallet_count INT;
BEGIN
    SELECT COUNT(*) INTO v_negative_wallet_count
    FROM public.wallets
    WHERE balance < 0 OR locked_balance < 0;

    IF v_negative_wallet_count > 0 THEN
        RAISE EXCEPTION 'FAIL LOUD: % wallets have negative balance or locked_balance. Fix data before applying constraints. Query: SELECT id, user_id, balance, locked_balance FROM wallets WHERE balance < 0 OR locked_balance < 0;', v_negative_wallet_count;
    END IF;

    RAISE NOTICE 'Pre-check passed: all wallets have non-negative balances';
END;
$$;

-- ============================================================================
-- PRE-CHECK 2: Orders with filled_quantity > quantity
-- ============================================================================
DO $$
DECLARE
    v_overfilled_count INT;
BEGIN
    SELECT COUNT(*) INTO v_overfilled_count
    FROM public.orders
    WHERE filled_quantity > quantity;

    IF v_overfilled_count > 0 THEN
        RAISE EXCEPTION 'FAIL LOUD: % orders have filled_quantity > quantity. Fix data before applying constraints.', v_overfilled_count;
    END IF;

    RAISE NOTICE 'Pre-check passed: no over-filled orders';
END;
$$;

-- ============================================================================
-- PRE-CHECK 3: Orders with zero or negative quantity
-- ============================================================================
DO $$
DECLARE
    v_invalid_quantity_count INT;
BEGIN
    SELECT COUNT(*) INTO v_invalid_quantity_count
    FROM public.orders
    WHERE quantity <= 0;

    IF v_invalid_quantity_count > 0 THEN
        RAISE EXCEPTION 'FAIL LOUD: % orders have quantity <= 0. Fix data before applying constraints.', v_invalid_quantity_count;
    END IF;

    RAISE NOTICE 'Pre-check passed: no invalid order quantities';
END;
$$;

-- ============================================================================
-- CONSTRAINT 1: Wallet balance must never be negative
-- This is the database-level guardrail against double-spending.
-- Combined with FOR UPDATE locks in the matching engine, this makes
-- negative balances physically impossible.
-- ============================================================================
ALTER TABLE public.wallets
    ADD CONSTRAINT chk_wallet_balance_nonnegative
    CHECK (balance >= 0);

ALTER TABLE public.wallets
    ADD CONSTRAINT chk_wallet_locked_nonnegative
    CHECK (locked_balance >= 0);

-- ============================================================================
-- CONSTRAINT 2: Order quantity integrity
-- filled_quantity can never exceed quantity (prevents over-fill bugs)
-- ============================================================================
ALTER TABLE public.orders
    ADD CONSTRAINT chk_order_filled_not_exceeds
    CHECK (filled_quantity <= quantity);

-- ============================================================================
-- CONSTRAINT 3: Order quantity must be positive
-- ============================================================================
ALTER TABLE public.orders
    ADD CONSTRAINT chk_order_quantity_positive
    CHECK (quantity > 0);

-- ============================================================================
-- CONSTRAINT 4: Price bounds for binary markets
-- Prices must be in (0, 1) for yes/no outcomes
-- ============================================================================
ALTER TABLE public.orders
    ADD CONSTRAINT chk_order_price_bounds
    CHECK (price > 0 AND price < 1);

-- ============================================================================
-- Post-migration verification (run manually):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'wallets'::regclass;
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'orders'::regclass;
-- ============================================================================
