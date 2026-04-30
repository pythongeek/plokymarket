-- ============================================================
-- DOMAIN: wallets
-- FIXES: unified_wallet_schema bugs and concurrency locking
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  balance           NUMERIC NOT NULL DEFAULT 0.00,
  locked_balance    NUMERIC NOT NULL DEFAULT 0.00,
  
  asset             TEXT NOT NULL DEFAULT 'USDT',
  network_type      TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS wallets_updated_at ON wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: wallets
-- Version: v2
-- Replaces: freeze_funds versions
-- Callers: app/api/wallets/freeze/route.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION freeze_funds_v2(
  p_user_id         UUID,
  p_amount          NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_wallet_id UUID;
  v_balance   NUMERIC;
BEGIN
  -- Strict row level pessimistic locking to prevent race conditions
  SELECT id, balance INTO v_wallet_id, v_balance 
  FROM wallets 
  WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  UPDATE wallets 
  SET balance = balance - p_amount, 
      locked_balance = locked_balance + p_amount 
  WHERE id = v_wallet_id;

  RETURN jsonb_build_object('success', true, 'wallet_id', v_wallet_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- EXCHANGE RATES
-- ============================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_pair     TEXT NOT NULL UNIQUE,
  rate              NUMERIC NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_exchange_rate_v2(
  p_currency_pair TEXT,
  p_rate          NUMERIC,
  p_recorded_at   TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID AS $$
BEGIN
  INSERT INTO exchange_rates (currency_pair, rate, recorded_at)
  VALUES (p_currency_pair, p_rate, COALESCE(p_recorded_at, NOW()))
  ON CONFLICT (currency_pair) DO UPDATE 
  SET rate = EXCLUDED.rate, recorded_at = EXCLUDED.recorded_at;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- WALLET TRANSACTIONS (Partitioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions_v2 (
  id                UUID DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id         UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type              transaction_type NOT NULL,
  amount            NUMERIC NOT NULL,
  balance_after     NUMERIC NOT NULL,
  description       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- RANGE by year 
CREATE TABLE IF NOT EXISTS wallet_transactions_2026 PARTITION OF wallet_transactions_v2 FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE IF NOT EXISTS wallet_transactions_2027 PARTITION OF wallet_transactions_v2 FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'transactions' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND relkind = 'r') AND 
     NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'wallet_transactions_legacy' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
     
     -- Direct data migration attempt if columns align natively, else just swap structure 
     ALTER TABLE transactions RENAME TO wallet_transactions_legacy;
     ALTER TABLE wallet_transactions_v2 RENAME TO wallet_transactions;
  ELSIF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'wallet_transactions' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
     ALTER TABLE wallet_transactions_v2 RENAME TO wallet_transactions;
  END IF;
END $$;

-- B-Tree Composite for financial ledger history
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON wallet_transactions(user_id, created_at DESC);
