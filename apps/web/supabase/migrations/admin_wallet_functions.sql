-- Admin Wallet Management Functions
-- This migration creates RPC functions for admin to manage user wallets

-- Drop existing functions if they exist (required to change return types)
DROP FUNCTION IF EXISTS admin_get_user_wallet(UUID, UUID);
DROP FUNCTION IF EXISTS admin_credit_wallet(UUID, UUID, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS admin_debit_wallet(UUID, UUID, NUMERIC, TEXT);

-- Function to get user wallet data for admin
CREATE FUNCTION admin_get_user_wallet(
    p_admin_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    balance NUMERIC(20, 2),
    locked_balance NUMERIC(20, 2),
    available_balance NUMERIC(20, 2),
    currency TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    transactions JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    RETURN QUERY
    SELECT 
        w.id,
        w.user_id,
        w.balance,
        w.locked_balance,
        w.available_balance,
        w.currency,
        w.created_at,
        w.updated_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', t.id,
                        'transaction_type', t.transaction_type,
                        'amount', t.amount,
                        'status', t.status,
                        'description', t.description,
                        'created_at', t.created_at
                    )
                )
                FROM transactions t
                WHERE t.user_id = p_user_id
                ORDER BY t.created_at DESC
                LIMIT 50
            ),
            '[]'::jsonb
        ) as transactions
    FROM wallets w
    WHERE w.user_id = p_user_id;
END;
$$;

-- Function to credit user wallet (admin)
CREATE FUNCTION admin_credit_wallet(
    p_admin_id UUID,
    p_user_id UUID,
    p_amount NUMERIC(20, 2),
    p_reason TEXT DEFAULT 'Admin credit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance NUMERIC(20, 2);
    v_transaction_id UUID;
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin access required'
        );
    END IF;

    -- Get wallet
    SELECT id, balance INTO v_wallet_id, v_new_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Wallet not found'
        );
    END IF;

    -- Update wallet balance
    UPDATE wallets
    SET 
        balance = balance + p_amount,
        available_balance = available_balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    v_new_balance := v_new_balance + p_amount;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        status,
        description,
        created_at
    ) VALUES (
        p_user_id,
        'admin_credit',
        p_amount,
        'completed',
        p_reason || ' - Admin: ' || p_admin_id,
        NOW()
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'wallet', jsonb_build_object(
            'id', v_wallet_id,
            'user_id', p_user_id,
            'balance', v_new_balance,
            'available_balance', v_new_balance
        ),
        'transaction_id', v_transaction_id
    );
END;
$$;

-- Function to debit user wallet (admin)
CREATE FUNCTION admin_debit_wallet(
    p_admin_id UUID,
    p_user_id UUID,
    p_amount NUMERIC(20, 2),
    p_reason TEXT DEFAULT 'Admin debit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet_id UUID;
    v_available_balance NUMERIC(20, 2);
    v_new_balance NUMERIC(20, 2);
    v_transaction_id UUID;
BEGIN
    -- Check if admin has permission
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND (is_admin = true OR is_super_admin = true)
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Admin access required'
        );
    END IF;

    -- Get wallet
    SELECT id, balance, available_balance INTO v_wallet_id, v_new_balance, v_available_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Wallet not found'
        );
    END IF;

    -- Check if sufficient balance
    IF v_available_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient balance'
        );
    END IF;

    -- Update wallet balance
    UPDATE wallets
    SET 
        balance = balance - p_amount,
        available_balance = available_balance - p_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    v_new_balance := v_new_balance - p_amount;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        status,
        description,
        created_at
    ) VALUES (
        p_user_id,
        'admin_debit',
        p_amount,
        'completed',
        p_reason || ' - Admin: ' || p_admin_id,
        NOW()
    ) RETURNING id INTO v_transaction_id;

    RETURN jsonb_build_object(
        'success', true,
        'wallet', jsonb_build_object(
            'id', v_wallet_id,
            'user_id', p_user_id,
            'balance', v_new_balance,
            'available_balance', v_new_balance
        ),
        'transaction_id', v_transaction_id
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_user_wallet TO service_role;
GRANT EXECUTE ON FUNCTION admin_credit_wallet TO service_role;
GRANT EXECUTE ON FUNCTION admin_debit_wallet TO service_role;
