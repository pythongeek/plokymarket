-- ============================================================
-- DOMAIN: wallets (Phase 4) — PRODUCTION SAFE
-- Adds missing columns + canonical RPCs + exchange_rates
-- ============================================================

-- Add missing columns to existing wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS locked_balance NUMERIC DEFAULT 0.00;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS asset TEXT DEFAULT 'USDT';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS network_type TEXT;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

DROP TRIGGER IF EXISTS wallets_updated_at ON wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC: freeze_funds_v2 ─────────────────────────
CREATE OR REPLACE FUNCTION freeze_funds_v2(
  p_user_id UUID, p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE v_wallet_id UUID; v_balance NUMERIC;
BEGIN
  SELECT id, balance INTO v_wallet_id, v_balance 
  FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;
  UPDATE wallets SET balance = balance - p_amount, locked_balance = locked_balance + p_amount WHERE id = v_wallet_id;
  RETURN jsonb_build_object('success', true, 'wallet_id', v_wallet_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ── EXCHANGE RATES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair TEXT NOT NULL UNIQUE,
  rate NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_exchange_rate_v2(
  p_currency_pair TEXT, p_rate NUMERIC, p_recorded_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID AS $$
BEGIN
  INSERT INTO exchange_rates (currency_pair, rate, recorded_at)
  VALUES (p_currency_pair, p_rate, COALESCE(p_recorded_at, NOW()))
  ON CONFLICT (currency_pair) DO UPDATE 
  SET rate = EXCLUDED.rate, recorded_at = EXCLUDED.recorded_at;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
