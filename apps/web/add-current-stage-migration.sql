-- ============================================================
-- COMPREHENSIVE MIGRATION FOR PLOKYMARKET
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → your project → SQL Editor
-- ============================================================

-- Add oracle_type column to markets table (this is the one causing the current error)
ALTER TABLE markets ADD COLUMN IF NOT EXISTS oracle_type VARCHAR(50) DEFAULT 'MANUAL';

-- Add current_stage column to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS current_stage VARCHAR(100) DEFAULT 'deployed';

-- Add creator_id column  
ALTER TABLE markets ADD COLUMN IF NOT EXISTS creator_id UUID;

-- Add deployed_at column
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ;

-- Add legal review columns to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_review_status VARCHAR(50);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_review_notes TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_reviewed_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS legal_reviewer_id UUID;

-- Add liquidity commitment fields to markets
ALTER TABLE markets ADD COLUMN IF NOT EXISTS liquidity_commitment NUMERIC;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS liquidity_deposited BOOLEAN DEFAULT FALSE;

-- Add deployment config fields
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deployment_config JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS deployment_tx_hash VARCHAR(100);

-- Add simulation fields
ALTER TABLE markets ADD COLUMN IF NOT EXISTS simulation_config JSONB;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS simulation_results JSONB;

-- Add admin bypass fields
ALTER TABLE markets ADD COLUMN IF NOT EXISTS admin_bypass_legal_review BOOLEAN DEFAULT FALSE;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS admin_bypass_liquidity BOOLEAN DEFAULT FALSE;

-- Add to events table if needed
ALTER TABLE events ADD COLUMN IF NOT EXISTS current_stage VARCHAR(100) DEFAULT 'published';
ALTER TABLE events ADD COLUMN IF NOT EXISTS creator_id UUID;

-- ============================================================
-- VERIFY: Run this to check columns were added:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'markets' AND column_name IN ('oracle_type', 'current_stage', 'creator_id');
-- ============================================================
