-- 1. Audit log — record every wallet change here
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  amount        DECIMAL(36, 18) NOT NULL,
  type          TEXT NOT NULL CHECK (type IN (
                  'deposit','withdrawal','freeze',
                  'unfreeze','trade_settle','refund')),
  reference_id  TEXT,   -- txid / order_id / trade_id
  balance_before DECIMAL(36, 18) NOT NULL,
  balance_after  DECIMAL(36, 18) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user
  ON wallet_transactions(user_id, created_at DESC);

-- 2. Idempotency keys — to block duplicate requests
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key         TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  operation   TEXT NOT NULL,
  result      JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auto-expiring or quick lookups
CREATE INDEX IF NOT EXISTS idx_idem_user
  ON idempotency_keys(user_id, created_at);

-- 3. settle_trade_cash — with row locks and audit log
CREATE OR REPLACE FUNCTION settle_trade_cash(
  p_buyer_id  UUID,
  p_seller_id UUID,
  p_amount    DECIMAL,
  p_trade_id  TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_buyer_locked  DECIMAL;
  v_seller_bal    DECIMAL;
BEGIN
  -- Prevent deadlocks by always locking the smaller user_id first
  IF p_buyer_id < p_seller_id THEN
    SELECT locked_balance INTO v_buyer_locked
      FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
    SELECT balance INTO v_seller_bal
      FROM wallets WHERE user_id = p_seller_id FOR UPDATE;
  ELSE
    SELECT balance INTO v_seller_bal
      FROM wallets WHERE user_id = p_seller_id FOR UPDATE;
    SELECT locked_balance INTO v_buyer_locked
      FROM wallets WHERE user_id = p_buyer_id FOR UPDATE;
  END IF;

  -- Buyer: deduct from locked_balance (balance was already frozen)
  UPDATE wallets
    SET locked_balance = locked_balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_buyer_id;

  -- Seller: increase balance
  UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_seller_id;

  -- Audit log
  INSERT INTO wallet_transactions
    (user_id, amount, type, reference_id, balance_before, balance_after)
  VALUES
    (p_buyer_id,  -p_amount, 'trade_settle', p_trade_id,
     v_buyer_locked, v_buyer_locked - p_amount),
    (p_seller_id,  p_amount, 'trade_settle', p_trade_id,
     v_seller_bal,  v_seller_bal + p_amount);
END;
$$;

-- 4. unfreeze_funds — with validation and row lock
DROP FUNCTION IF EXISTS unfreeze_funds(UUID, DECIMAL);

CREATE OR REPLACE FUNCTION unfreeze_funds(
  p_user_id UUID,
  p_amount  DECIMAL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_locked DECIMAL;
BEGIN
  SELECT locked_balance INTO v_locked
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_locked IS NULL OR v_locked < p_amount THEN
    RETURN FALSE;  -- Not enough locked funds
  END IF;

  UPDATE wallets
    SET balance        = balance + p_amount,
        locked_balance = locked_balance - p_amount,
        updated_at     = NOW()
    WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$;

-- 5. place_order_atomic — balance check + freeze in a single transaction
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_user_id        UUID,
  p_market_id      UUID,
  p_side           TEXT,
  p_outcome        TEXT,
  p_price          DECIMAL,
  p_quantity       DECIMAL,
  p_order_type     TEXT DEFAULT 'limit',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance     DECIMAL;
  v_required    DECIMAL;
  v_order_id    UUID;
  v_existing    JSONB;
BEGIN
  -- Idempotency check: has this key been used before for an order?
  IF p_idempotency_key IS NOT NULL THEN
    SELECT result INTO v_existing FROM idempotency_keys
      WHERE key = p_idempotency_key AND user_id = p_user_id;
    IF FOUND THEN RETURN v_existing; END IF;
  END IF;

  v_required := p_price * p_quantity;

  -- Row-level lock before balance check
  SELECT balance INTO v_balance
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_balance IS NULL OR v_balance < v_required THEN
    RETURN jsonb_build_object('error', 'Insufficient balance');
  END IF;

  -- Fund freeze (no race condition here, row is already locked)
  IF p_side = 'buy' THEN
    UPDATE wallets
      SET balance        = balance - v_required,
          locked_balance = locked_balance + v_required,
          updated_at     = NOW()
      WHERE user_id = p_user_id;
  END IF;

  -- Order insert
  INSERT INTO orders
    (user_id, market_id, side, outcome, order_type,
     price, quantity, filled_quantity, status)
  VALUES
    (p_user_id, p_market_id, p_side, p_outcome, p_order_type,
     p_price, p_quantity, 0, 'open')
  RETURNING id INTO v_order_id;

  -- Idempotency key save
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO idempotency_keys (key, user_id, operation, result)
    VALUES (p_idempotency_key, p_user_id, 'place_order',
      jsonb_build_object('success', true, 'order_id', v_order_id))
    ON CONFLICT (key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;

-- 6. process_deposit_tx - idempotency enabled
DROP FUNCTION IF EXISTS process_deposit_tx(UUID, DECIMAL, TEXT);

CREATE OR REPLACE FUNCTION process_deposit_tx(
  p_user_id UUID,
  p_amount  DECIMAL,
  p_txid    TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  -- Idempotency: check if this txid was already processed
  IF EXISTS (
    SELECT 1 FROM idempotency_keys
    WHERE key = 'deposit-' || p_txid
  ) THEN
    RETURN TRUE;  -- Already processed, safe to return
  END IF;

  -- Balance lock and update
  SELECT balance INTO v_balance
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

  UPDATE wallets
    SET balance    = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO wallet_transactions
    (user_id, amount, type, reference_id, balance_before, balance_after)
  VALUES
    (p_user_id, p_amount, 'deposit', p_txid,
     v_balance, v_balance + p_amount);

  -- Idempotency key save
  INSERT INTO idempotency_keys (key, user_id, operation, result)
  VALUES ('deposit-' || p_txid, p_user_id, 'deposit',
    jsonb_build_object('amount', p_amount))
  ON CONFLICT (key) DO NOTHING;

  RETURN TRUE;
END;
$$;
