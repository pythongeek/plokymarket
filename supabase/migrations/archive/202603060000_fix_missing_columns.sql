-- ============================================
-- FIX MISSING COLUMNS
-- Migration: Add missing columns to markets and workflow_executions
-- ============================================

BEGIN;

-- ============================================
-- 1. Add missing columns to markets table
-- ============================================

-- Add trading_ends column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'markets' AND column_name = 'trading_ends'
    ) THEN
        ALTER TABLE markets ADD COLUMN trading_ends TIMESTAMPTZ;
        RAISE NOTICE 'Added trading_ends column to markets';
    ELSE
        RAISE NOTICE 'trading_ends column already exists in markets';
    END IF;
END $$;

-- Add name_bn column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'markets' AND column_name = 'name_bn'
    ) THEN
        ALTER TABLE markets ADD COLUMN name_bn TEXT;
        RAISE NOTICE 'Added name_bn column to markets';
    ELSE
        RAISE NOTICE 'name_bn column already exists in markets';
    END IF;
END $$;

-- ============================================
-- 2. Add missing columns to workflow_executions table
-- ============================================

-- Add execution_time column if not exists (in milliseconds)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflow_executions' AND column_name = 'execution_time'
    ) THEN
        ALTER TABLE workflow_executions ADD COLUMN execution_time INTEGER;
        RAISE NOTICE 'Added execution_time column to workflow_executions';
    ELSE
        RAISE NOTICE 'execution_time column already exists in workflow_executions';
    END IF;
END $$;

-- ============================================
-- 3. Create index for trading_ends if not exists
-- ============================================

CREATE INDEX IF NOT EXISTS idx_markets_trading_ends ON markets(trading_ends);

COMMIT;

-- ============================================
-- SUMMARY:
-- 1. Added trading_ends to markets
-- 2. Added name_bn to markets  
-- 3. Added execution_time to workflow_executions
-- 4. Created idx_markets_trading_ends index
-- ============================================
