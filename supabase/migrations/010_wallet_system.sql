-- Wallet System for Risk Engine
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  balance DECIMAL(36, 18) DEFAULT 0 CHECK (balance >= 0),
  frozen_balance DECIMAL(36, 18) DEFAULT 0 CHECK (frozen_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to check balance and freeze funds atomically
CREATE OR REPLACE FUNCTION freeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  -- Lock row
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE wallets
  SET 
    balance = balance - p_amount,
    frozen_balance = frozen_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Function to unfreeze funds (e.g. on cancel)
CREATE OR REPLACE FUNCTION unfreeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE wallets
  SET 
    balance = balance + p_amount,
    frozen_balance = frozen_balance - p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to execute trade (deduct frozen, add asset? Asset tracking is in `user_positions` likely, but here we handle CASH)
-- For a simplified CLOB, the 'trade' implies cash movement.
-- We'll assume strict cash settlement for now.
CREATE OR REPLACE FUNCTION settle_trade_cash(p_buyer_id UUID, p_seller_id UUID, p_amount DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Buyer: Already frozen, so just reduce frozen (burn the cash used)
  UPDATE wallets
  SET frozen_balance = frozen_balance - p_amount
  WHERE user_id = p_buyer_id;

  -- Seller: Receives cash
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE user_id = p_seller_id;
  
  -- Note: This is simplified. Real logic needs to handle fees, etc.
END;
$$;
