-- Migration: Add credit_wallet function
-- Purpose: Fix RPC mismatch - frontend calls credit_wallet but function didn't exist
-- This function credits the wallets table balance directly

-- Function to credit user wallet balance (for settlement payouts)
CREATE OR REPLACE FUNCTION credit_wallet(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    UPDATE wallets
    SET 
        balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user: %', p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to debit user wallet balance (for trades/withdrawals)
CREATE OR REPLACE FUNCTION debit_wallet(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Get current balance with lock
    SELECT balance INTO v_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    UPDATE wallets
    SET 
        balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to lock funds in wallet (for pending orders)
CREATE OR REPLACE FUNCTION lock_wallet_funds(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available DECIMAL;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Calculate available balance (balance - locked_balance)
    SELECT balance - COALESCE(locked_balance, 0) INTO v_available
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_available IS NULL OR v_available < p_amount THEN
        RETURN FALSE;
    END IF;

    UPDATE wallets
    SET 
        locked_balance = COALESCE(locked_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock funds in wallet
CREATE OR REPLACE FUNCTION unlock_wallet_funds(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    UPDATE wallets
    SET 
        locked_balance = COALESCE(locked_balance, 0) - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Ensure locked_balance doesn't go negative
    UPDATE wallets
    SET locked_balance = GREATEST(COALESCE(locked_balance, 0), 0)
    WHERE user_id = p_user_id AND COALESCE(locked_balance, 0) < 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION credit_wallet IS 'Credits user wallet balance - used for settlement payouts';
COMMENT ON FUNCTION debit_wallet IS 'Debits user wallet balance atomically with balance check';
COMMENT ON FUNCTION lock_wallet_funds IS 'Locks funds in wallet for pending orders';
COMMENT ON FUNCTION unlock_wallet_funds IS 'Unlocks previously locked funds in wallet';
