-- ============================================================
-- DOMAIN: users
-- PURPOSE: User profiles and metadata (extends Supabase Auth)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL, -- For standalone installations
  phone             TEXT UNIQUE,
  full_name         TEXT NOT NULL,
  is_admin          BOOLEAN NOT NULL DEFAULT FALSE,
  is_super_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  kyc_status        kyc_status NOT NULL DEFAULT 'not_started',
  kyc_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extended profile data (optional)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url        TEXT,
  display_name      TEXT,
  bio               TEXT,
  twitter_handle    TEXT,
  tg_handle         TEXT,
  preferences       JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) WHERE is_admin = TRUE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
