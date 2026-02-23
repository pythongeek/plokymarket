-- Migration 119: Secure Atomic Wallet Updates (Anti-Race Condition Logic)
-- Eliminates 'SELECT balance FOR UPDATE' which causes race conditions under high load.
-- Introduces Database Level Optimistic Locking via 'UPDATE ... WHERE balance >= amount'

-- ==========================================================
-- 1. Atomic `request_withdrawal`
-- Replaces definition from 076/079
-- ==========================================================
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_user_id UUID,
    p_amount DECIMAL,
    p_address TEXT,
    p_network TEXT
)
RETURNS UUID AS $$
DECLARE
    v_kyc_level INTEGER;
    v_tx_id UUID;
    v_status VARCHAR(20);
    v_row_count INTEGER;
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

    -- 3. Atomic Balance Check & Lock Funds
    -- Deduct from Available, Add to Locked atomically
    UPDATE public.wallets
    SET 
        balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND balance >= p_amount;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'Insufficient balance or user not found for withdrawal.';
    END IF;

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


-- ==========================================================
-- 2. Atomic `freeze_funds`
-- Replaces definition from 010/014
-- ==========================================================
CREATE OR REPLACE FUNCTION freeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  -- Atomic deduction
  UPDATE wallets 
  SET balance = balance - p_amount, 
      locked_balance = locked_balance + p_amount, 
      updated_at = NOW() 
  WHERE user_id = p_user_id AND balance >= p_amount;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN 
    RETURN FALSE; 
  END IF;

  RETURN TRUE;
END;
$$;


-- ==========================================================
-- 3. Atomic `lock_dispute_bond`
-- Replaces definition from 089/090
-- ==========================================================
CREATE OR REPLACE FUNCTION lock_dispute_bond(
    p_user_id UUID,
    p_amount NUMERIC,
    p_dispute_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row_count INTEGER;
BEGIN
    -- Atomic deduction
    UPDATE wallets
    SET balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND balance >= p_amount;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'Insufficient balance or user not found for dispute bond.';
    END IF;
    
    INSERT INTO transactions (
        user_id, transaction_type, amount, description, metadata, status
    )
    VALUES (
        p_user_id, 'dispute_bond', -p_amount, 'Dispute bond locked',
        jsonb_build_object('dispute_id', p_dispute_id, 'amount', p_amount, 'type', 'bond_lock'),
        'completed'
    );
    
    RETURN TRUE;
END;
$$;


-- ==========================================================
-- 4. Atomic `create_withdrawal_hold`
-- Replaces definition from 002 (Old USDT logic)
-- Note: This acts on 'profiles' table balance
-- ==========================================================
CREATE OR REPLACE FUNCTION public.create_withdrawal_hold(
  p_user_id UUID,
  p_amount DECIMAL(12,2),
  p_withdrawal_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id UUID;
  v_row_count INTEGER;
BEGIN
  -- Atomic check & deduction from profiles
  UPDATE profiles
  SET 
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id AND balance >= p_amount;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 0 THEN
    RAISE EXCEPTION 'Insufficient balance or user not found for withdrawal.';
  END IF;
  
  -- Create hold logging
  INSERT INTO balance_holds (
    user_id,
    amount,
    reason,
    reference_id,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'withdrawal',
    p_withdrawal_id,
    NOW()
  ) RETURNING id INTO v_hold_id;
  
  RETURN v_hold_id;
END;
$$ LANGUAGE plpgsql;
