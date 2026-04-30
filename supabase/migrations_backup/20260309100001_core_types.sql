-- ============================================================
-- DOMAIN: core_types
-- PURPOSE: Single source of truth for all ENUMs and domains
-- GENERATED: Step 3 of DB Migration Remediation
-- ============================================================

-- Market lifecycle states (canonical from 101_spec_alignment)
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

-- KYC verification states  
DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM (
    'not_started', 'pending', 'approved', 'rejected', 'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Event answer types (fixes missing answer_type column root cause)
DO $$ BEGIN
  CREATE TYPE answer_type AS ENUM (
    'binary', 'categorical', 'scalar'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Canonical JSONB domain for event tags
-- This ends the JSONB vs TEXT[] war
DO $$ BEGIN
  CREATE DOMAIN event_tags_domain AS JSONB;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
