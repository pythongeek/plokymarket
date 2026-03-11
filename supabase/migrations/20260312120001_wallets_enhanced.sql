-- ============================================================
-- PHASE 4A: Wallets Enhancement (Production-Safe)
-- Production: 14 columns, 10 rows, includes USDT fields
-- Fixes: freeze_funds return type conflict, adds new RPCs
-- ============================================================

-- ── 1. ADD MISSING WALLET COLUMNS ──────────────────────────
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_deposited NUMERIC DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_withdrawn NUMERIC DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_earned NUMERIC DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS total_fees_paid NUMERIC DEFAULT 0;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_deposit_at TIMESTAMPTZ;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMPTZ;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDT';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS daily_withdrawal_limit NUMERIC DEFAULT 1000;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS monthly_withdrawal_limit NUMERIC DEFAULT 10000;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS risk_score NUMERIC DEFAULT 0;

-- ── 2. WALLET INDEXES ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wallets_balance ON wallets(balance DESC) WHERE balance > 0;

-- ── 3. FIX FREEZE_FUNDS WRAPPER (return type conflict) ─────
-- Old freeze_funds returns BOOLEAN; we need it to return JSONB
-- Must DROP with exact old signature, then recreate
DO $$ BEGIN
  -- Drop the old BOOLEAN version if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'freeze_funds'
    AND pg_get_function_result(p.oid) = 'boolean'
  ) THEN
    DROP FUNCTION public.freeze_funds(uuid, numeric);
    RAISE NOTICE 'Dropped old freeze_funds(uuid, numeric) -> boolean';
  END IF;
END $$;

-- Recreate as a JSONB wrapper → v2
CREATE OR REPLACE FUNCTION freeze_funds(
  p_user_id UUID, p_amount NUMERIC
) RETURNS JSONB AS $$
BEGIN
  RETURN freeze_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. CANONICAL WALLET RPCs ───────────────────────────────

-- 4a. deposit_funds_v2: Credit funds to wallet with tracking
CREATE OR REPLACE FUNCTION deposit_funds_v2(
  p_user_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'bank_transfer',
  p_reference TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  UPDATE wallets SET
    balance = balance + p_amount,
    total_deposited = total_deposited + p_amount,
    last_deposit_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, metadata)
  VALUES (
    p_user_id, 'deposit', p_amount, v_wallet.balance, v_wallet.balance + p_amount,
    jsonb_build_object('method', p_method, 'reference', p_reference)
  );

  RETURN jsonb_build_object(
    'success', true, 'new_balance', v_wallet.balance + p_amount,
    'total_deposited', v_wallet.total_deposited + p_amount
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4b. withdraw_funds_v2: Debit funds with limit checks
CREATE OR REPLACE FUNCTION withdraw_funds_v2(
  p_user_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'bank_transfer',
  p_destination TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_wallet RECORD;
  v_daily_total NUMERIC;
  v_monthly_total NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF NOT v_wallet.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet is frozen');
  END IF;
  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds',
      'available', v_wallet.balance, 'requested', p_amount);
  END IF;

  -- Check daily withdrawal limit
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM transactions 
  WHERE user_id = p_user_id AND type = 'withdrawal' 
    AND created_at >= NOW() - INTERVAL '24 hours';
  IF v_daily_total + p_amount > v_wallet.daily_withdrawal_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily withdrawal limit exceeded',
      'limit', v_wallet.daily_withdrawal_limit, 'used', v_daily_total);
  END IF;

  -- Check monthly withdrawal limit
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_total
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal'
    AND created_at >= date_trunc('month', NOW());
  IF v_monthly_total + p_amount > v_wallet.monthly_withdrawal_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Monthly withdrawal limit exceeded',
      'limit', v_wallet.monthly_withdrawal_limit, 'used', v_monthly_total);
  END IF;

  -- Deduct
  UPDATE wallets SET
    balance = balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    last_withdrawal_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, metadata)
  VALUES (
    p_user_id, 'withdrawal', p_amount, v_wallet.balance, v_wallet.balance - p_amount,
    jsonb_build_object('method', p_method, 'destination', p_destination)
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_wallet.balance - p_amount);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4c. release_funds_v2: Reverse of freeze — unlock locked balance back
CREATE OR REPLACE FUNCTION release_funds_v2(
  p_user_id UUID, p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE v_wallet RECORD;
BEGIN
  SELECT * INTO v_wallet FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF v_wallet.locked_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient locked balance');
  END IF;

  UPDATE wallets SET
    locked_balance = locked_balance - p_amount,
    balance = balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'released', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4d. get_wallet_summary_v2: Full wallet state for dashboard
CREATE OR REPLACE FUNCTION get_wallet_summary_v2(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'balance', w.balance,
    'locked_balance', w.locked_balance,
    'total_equity', w.balance + w.locked_balance,
    'total_deposited', w.total_deposited,
    'total_withdrawn', w.total_withdrawn,
    'total_earned', w.total_earned,
    'total_fees_paid', w.total_fees_paid,
    'is_active', w.is_active,
    'currency', w.currency,
    'usdt_address', w.usdt_address,
    'network_type', w.network_type,
    'daily_withdrawal_limit', w.daily_withdrawal_limit,
    'monthly_withdrawal_limit', w.monthly_withdrawal_limit,
    'recent_transactions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id, 'type', t.type, 'amount', t.amount,
        'balance_after', t.balance_after, 'created_at', t.created_at
      ) ORDER BY t.created_at DESC), '[]'::jsonb)
      FROM (SELECT * FROM transactions WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 10) t
    )
  ) INTO v_result
  FROM wallets w WHERE w.user_id = p_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('error', 'Wallet not found'));
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 4e. freeze_wallet_v2: Admin function to freeze/unfreeze a wallet
CREATE OR REPLACE FUNCTION freeze_wallet_v2(
  p_user_id UUID, p_freeze BOOLEAN DEFAULT TRUE, p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE wallets SET is_active = NOT p_freeze, updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'frozen', p_freeze, 'reason', p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. EXCHANGE RATE ENHANCEMENTS ──────────────────────────
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS previous_rate NUMERIC;
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS change_percentage NUMERIC;

-- 5a. Get latest exchange rate with change info
CREATE OR REPLACE FUNCTION get_exchange_rate_v2(
  p_currency_pair TEXT DEFAULT 'USDT/BDT'
) RETURNS JSONB AS $$
DECLARE v_rate RECORD;
BEGIN
  SELECT * INTO v_rate FROM exchange_rates WHERE currency_pair = p_currency_pair;
  IF v_rate IS NULL THEN
    RETURN jsonb_build_object('found', false, 'pair', p_currency_pair);
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'pair', v_rate.currency_pair,
    'rate', v_rate.rate,
    'previous_rate', v_rate.previous_rate,
    'change_pct', v_rate.change_percentage,
    'recorded_at', v_rate.recorded_at
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- ── 6. FIX update_exchange_rate wrapper ────────────────────
-- Old returns jsonb, wrapper returns void → DROP old, recreate
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_exchange_rate'
    AND pg_get_function_result(p.oid) = 'jsonb'
  ) THEN
    DROP FUNCTION public.update_exchange_rate(text, numeric);
    RAISE NOTICE 'Dropped old update_exchange_rate -> jsonb';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not drop old update_exchange_rate: %', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION update_exchange_rate(
  currency_pair TEXT, rate NUMERIC, recorded_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM update_exchange_rate_v2(currency_pair, rate, recorded_at);
END;
$$;
