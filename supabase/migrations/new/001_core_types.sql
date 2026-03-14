-- ============================================================
-- DOMAIN: core_types
-- PURPOSE: Single source of truth for all ENUMs and domains
-- ============================================================

-- Market lifecycle states
DO $$ BEGIN
  CREATE TYPE market_status AS ENUM (
    'draft', 'active', 'paused', 'closed', 'resolved', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order states
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'open', 'filled', 'partially_filled', 
    'cancelled', 'expired', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order direction
DO $$ BEGIN
  CREATE TYPE order_side AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order execution types
DO $$ BEGIN
  CREATE TYPE order_type AS ENUM (
    'limit', 'market', 'stop_limit', 'ioc', 'fok', 'gtc'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Outcome types (Binary markets)
DO $$ BEGIN
  CREATE TYPE outcome_type AS ENUM ('YES', 'NO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- KYC verification states  
DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM (
    'not_started', 'pending', 'approved', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Event answer types
DO $$ BEGIN
  CREATE TYPE answer_type AS ENUM (
    'binary', 'categorical', 'scalar'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Transaction types
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'settlement', 'refund'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment methods
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Oracle status
DO $$ BEGIN
  CREATE TYPE oracle_status AS ENUM ('pending', 'verified', 'disputed', 'finalized');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Canonical JSONB domain for event tags
DO $$ BEGIN
  CREATE DOMAIN event_tags_domain AS JSONB;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
