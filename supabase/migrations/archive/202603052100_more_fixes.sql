-- ============================================
-- MORE DATABASE FIXES
-- Migration: Fix missing columns and tables
-- ============================================

BEGIN;

-- ============================================
-- 1. Add outcome column to workflow_executions (if not exists)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflow_executions' AND column_name = 'outcome'
    ) THEN
        ALTER TABLE workflow_executions ADD COLUMN outcome TEXT;
        RAISE NOTICE 'Added outcome column to workflow_executions';
    ELSE
        RAISE NOTICE 'outcome column already exists in workflow_executions';
    END IF;
END $$;

-- ============================================
-- 2. market_creation_drafts table already exists with creator_id
-- Just ensure the RLS policies are correct (using creator_id not user_id)
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE market_creation_drafts ENABLE ROW LEVEL SECURITY;

-- Drop old policies that may reference wrong column and recreate with correct column
DROP POLICY IF EXISTS "Users can view own drafts" ON market_creation_drafts;
CREATE POLICY "Users can view own drafts" ON market_creation_drafts 
    FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can insert own drafts" ON market_creation_drafts;
CREATE POLICY "Users can insert own drafts" ON market_creation_drafts 
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own drafts" ON market_creation_drafts;
CREATE POLICY "Users can update own drafts" ON market_creation_drafts 
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete own drafts" ON market_creation_drafts;
CREATE POLICY "Users can delete own drafts" ON market_creation_drafts 
    FOR DELETE USING (auth.uid() = creator_id);

-- ============================================
-- 3. Ensure exchange_rates table has proper columns (with IF NOT EXISTS)
-- ============================================

ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS source VARCHAR(50);
ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS rate NUMERIC(18, 2);

-- Note: updated_at and created_at may already exist, use IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exchange_rates' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE exchange_rates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exchange_rates' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE exchange_rates ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

COMMIT;

-- ============================================
-- SUMMARY:
-- 1. Added outcome column to workflow_executions (if not exists)
-- 2. Fixed market_creation_drafts RLS policies to use creator_id
-- 3. Ensured exchange_rates columns exist (if not exists)
-- ============================================
