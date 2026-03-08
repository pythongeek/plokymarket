-- ============================================================
-- DOMAIN: users
-- FIXES: admin_wallet_functions.sql permission bug (is_admin missing)
-- ============================================================

-- Add safe additive columns for the existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- THE FIX: this column being missing broke all admin RPCs
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status kyc_status NOT NULL DEFAULT 'not_started';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

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
