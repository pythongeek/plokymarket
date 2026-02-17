-- Migration 079: Update Withdrawal Logic for Automation
-- Withdrawals < 5000 BDT -> 'processing' (for n8n/automation)
-- Withdrawals >= 5000 BDT -> 'pending' (for admin review)

CREATE OR REPLACE FUNCTION request_withdrawal(
    p_user_id UUID,
    p_amount DECIMAL,
    p_address TEXT,
    p_network TEXT
)
RETURNS UUID AS $$
DECLARE
    v_balance DECIMAL;
    v_kyc_level INTEGER;
    v_tx_id UUID;
    v_status VARCHAR(20);
BEGIN
    -- 1. Input Validation
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be positive.';
    END IF;

    -- 2. Check KYC Limit and Determine Status
    SELECT COALESCE(kyc_level, 0) INTO v_kyc_level
    FROM public.user_profiles
    WHERE id = p_user_id;

    IF p_amount >= 5000 THEN
        IF v_kyc_level < 1 THEN
            RAISE EXCEPTION 'Withdrawal of % BDT requires KYC Level 1 verification.', p_amount;
        END IF;
        v_status := 'pending'; -- Manual Review
    ELSE
        -- Small amount, set to processing for automation
        v_status := 'processing';
    END IF;

    -- 3. Check Balance & Lock Funds
    SELECT balance INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance for withdrawal.';
    END IF;

    -- Deduct from Available, Add to Locked
    UPDATE public.wallets
    SET 
        balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 4. Create Transaction Record
    INSERT INTO public.wallet_transactions (
        user_id,
        transaction_type,
        amount,
        currency,
        network_type,
        wallet_address,
        status,
        description
    ) VALUES (
        p_user_id,
        'withdrawal',
        p_amount,
        'BDT',
        p_network,
        p_address,
        v_status,
        'Withdrawal request via ' || p_network
    )
    RETURNING id INTO v_tx_id;

    RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
