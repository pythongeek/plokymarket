-- Migration: Add Admin Wallet Management Functions
-- Purpose: Allow admins to credit/debit user wallets and view wallet details

-- Function for admin to credit user wallet
CREATE OR REPLACE FUNCTION admin_credit_wallet(
    p_admin_id UUID,
    p_user_id UUID,
    p_amount DECIMAL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL;
    v_balance_after DECIMAL;
BEGIN
    -- Verify admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND is_admin = true) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;

    -- Get current balance
    SELECT id, balance INTO v_wallet_id, v_balance_before
    FROM wallets WHERE user_id = p_user_id;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;

    -- Credit the wallet
    UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_balance_after;

    -- Log transaction
    INSERT INTO wallet_transactions (
        user_id, transaction_type, amount, status, description
    ) VALUES (
        p_user_id, 'admin_credit', p_amount, 'completed',
        COALESCE(p_reason, 'Admin credit') || ' - Admin: ' || p_admin_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_before', v_balance_before,
        'balance_after', v_balance_after,
        'amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for admin to debit user wallet
CREATE OR REPLACE FUNCTION admin_debit_wallet(
    p_admin_id UUID,
    p_user_id UUID,
    p_amount DECIMAL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL;
    v_balance_after DECIMAL;
BEGIN
    -- Verify admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND is_admin = true) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;

    -- Get current balance
    SELECT id, balance INTO v_wallet_id, v_balance_before
    FROM wallets WHERE user_id = p_user_id;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;

    -- Check sufficient balance
    IF v_balance_before < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Debit the wallet
    UPDATE wallets
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_balance_after;

    -- Log transaction
    INSERT INTO wallet_transactions (
        user_id, transaction_type, amount, status, description
    ) VALUES (
        p_user_id, 'admin_debit', p_amount, 'completed',
        COALESCE(p_reason, 'Admin debit') || ' - Admin: ' || p_admin_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'balance_before', v_balance_before,
        'balance_after', v_balance_after,
        'amount', p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user wallet details for admin
CREATE OR REPLACE FUNCTION admin_get_user_wallet(
    p_admin_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_transactions RECORD;
    v_transactions_list JSONB;
BEGIN
    -- Verify admin
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_admin_id AND is_admin = true) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
    END IF;

    -- Get wallet details
    SELECT * INTO v_wallet
    FROM wallets WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;

    -- Get recent transactions
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'transaction_type', transaction_type,
            'amount', amount,
            'status', status,
            'description', description,
            'created_at', created_at
        )
    ) INTO v_transactions_list
    FROM (
        SELECT id, transaction_type, amount, status, description, created_at
        FROM wallet_transactions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 20
    ) t;

    RETURN jsonb_build_object(
        'success', true,
        'wallet', jsonb_build_object(
            'id', v_wallet.id,
            'user_id', v_wallet.user_id,
            'balance', v_wallet.balance,
            'locked_balance', v_wallet.locked_balance,
            'available_balance', v_wallet.balance - COALESCE(v_wallet.locked_balance, 0),
            'currency', v_wallet.currency,
            'created_at', v_wallet.created_at,
            'updated_at', v_wallet.updated_at
        ),
        'transactions', COALESCE(v_transactions_list, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION admin_credit_wallet IS 'Admin: Credit user wallet with amount';
COMMENT ON FUNCTION admin_debit_wallet IS 'Admin: Debit user wallet with amount';
COMMENT ON FUNCTION admin_get_user_wallet IS 'Admin: Get user wallet details and recent transactions';
