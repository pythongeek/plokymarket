-- Migration: Add 'draft', 'paused', 'rejected' to market_status enum
-- This is needed because the admin panel uses these statuses for market creation

DO $$ 
BEGIN
    -- Check if 'draft' already exists to avoid errors on re-run
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'draft' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'market_status')
    ) THEN
        ALTER TYPE market_status ADD VALUE 'draft';
    END IF;
END
$$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'paused' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'market_status')
    ) THEN
        ALTER TYPE market_status ADD VALUE 'paused';
    END IF;
END
$$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'rejected' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'market_status')
    ) THEN
        ALTER TYPE market_status ADD VALUE 'rejected';
    END IF;
END
$$;
