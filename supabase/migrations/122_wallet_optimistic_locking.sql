-- Migration 122: Wallet Optimistic Locking Implementation
-- Ensures all balance-altering operations increment the version column for concurrency control.

-- 1. Update freeze_funds
CREATE OR REPLACE FUNCTION public.freeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row_count INTEGER;
BEGIN
  UPDATE public.wallets 
  SET balance = balance - p_amount, 
      locked_balance = locked_balance + p_amount, 
      version = version + 1,
      updated_at = NOW() 
  WHERE user_id = p_user_id AND balance >= p_amount;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$;

-- 2. Update unfreeze_funds
CREATE OR REPLACE FUNCTION public.unfreeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  UPDATE public.wallets 
  SET balance = balance + p_amount, 
      locked_balance = locked_balance - p_amount, 
      version = version + 1,
      updated_at = NOW() 
  WHERE user_id = p_user_id;
END; $$;

-- 3. Update settle_trade_cash
CREATE OR REPLACE FUNCTION public.settle_trade_cash(p_buyer_id UUID, p_seller_id UUID, p_amount DECIMAL)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  -- Buyer pays from locked balance
  UPDATE public.wallets 
  SET locked_balance = locked_balance - p_amount,
      version = version + 1,
      updated_at = NOW()
  WHERE user_id = p_buyer_id;

  -- Seller receives into usable balance
  UPDATE public.wallets 
  SET balance = balance + p_amount,
      version = version + 1,
      updated_at = NOW()
  WHERE user_id = p_seller_id;
END; $$;

-- 4. Update request_withdrawal
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
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be positive.';
    END IF;

    SELECT COALESCE(kyc_level, 0) INTO v_kyc_level
    FROM public.user_profiles
    WHERE id = p_user_id;

    IF p_amount >= 5000 THEN
        IF v_kyc_level < 1 THEN
            RAISE EXCEPTION 'Withdrawal of % BDT requires KYC Level 1 verification.', p_amount;
        END IF;
        v_status := 'pending';
    ELSE
        v_status := 'processing';
    END IF;

    -- Atomic Balance Check & Lock Funds with version increment
    UPDATE public.wallets
    SET 
        balance = balance - p_amount,
        locked_balance = locked_balance + p_amount,
        version = version + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id AND balance >= p_amount;

    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    IF v_row_count = 0 THEN
        RAISE EXCEPTION 'Insufficient balance or user not found for withdrawal.';
    END IF;

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

-- 5. Update process_deposit_tx
CREATE OR REPLACE FUNCTION public.process_deposit_tx(
  p_user_id UUID,
  p_amount DECIMAL,
  p_txid TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update wallet with version increment
  UPDATE public.wallets
  SET 
    usdt_balance = usdt_balance + p_amount,
    total_deposited = total_deposited + p_amount,
    version = version + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.usdt_transactions (
    user_id,
    type,
    amount,
    balance_after,
    reference,
    created_at
  )
  SELECT 
    p_user_id,
    'deposit',
    p_amount,
    usdt_balance,
    p_txid,
    NOW()
  FROM public.wallets
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
