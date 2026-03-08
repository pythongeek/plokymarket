-- ============================================================
-- DOMAIN: users
-- FIXES: admin_wallet_functions.sql permission bug (is_admin missing)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address    TEXT UNIQUE,
  email             TEXT UNIQUE,
  display_name      TEXT,
  avatar_url        TEXT,
  
  -- THE FIX: this column being missing broke all admin RPCs
  is_admin          BOOLEAN NOT NULL DEFAULT FALSE,
  
  kyc_status        kyc_status NOT NULL DEFAULT 'not_started',
  kyc_verified_at   TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auth lookup hot paths (B-Tree UNIQUE — these are called on every request)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet_email 
  ON users(wallet_address, email) WHERE wallet_address IS NOT NULL AND email IS NOT NULL;

-- Admin lookup (used in every SECURITY DEFINER function)
CREATE INDEX IF NOT EXISTS idx_users_is_admin 
  ON users(id) WHERE is_admin = TRUE;

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
