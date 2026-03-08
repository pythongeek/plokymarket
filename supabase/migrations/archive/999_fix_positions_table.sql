-- =============================================
-- POSITIONS TABLE REFERENCE FIX
-- Migration 999d - Fix Positions Table Foreign Keys
--
-- Problem: positions table has wrong ID references
-- causing "No shares found" in portfolio
--
-- Solution: Add proper foreign keys and indexes
-- =============================================

BEGIN;

-- =============================================
-- STEP 1: Ensure positions table has correct references
-- =============================================

-- Drop old constraint if exists
ALTER TABLE public.positions 
    DROP CONSTRAINT IF EXISTS positions_market_id_fkey;

-- Add outcome_index column if missing
ALTER TABLE public.positions 
    ADD COLUMN IF NOT EXISTS outcome_index INTEGER;

-- Add market_id column if missing (references events after schema fix)
ALTER TABLE public.positions
    ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- =============================================
-- STEP 2: Sync market_id from events if needed
-- =============================================

DO $$
DECLARE
    p_row RECORD;
    synced_count INTEGER := 0;
BEGIN
    -- Find positions without market_id but linked to markets table
    FOR p_row IN 
        SELECT p.id as position_id, m.id as market_id
        FROM positions p
        JOIN markets m ON m.event_id = p.market_id
        WHERE p.market_id IS NULL
        LIMIT 1000
    LOOP
        UPDATE positions 
        SET market_id = p_row.market_id 
        WHERE id = p_row.position_id;
        synced_count := synced_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Synced market_id for % positions', synced_count;
END $$;

-- =============================================
-- STEP 3: Create Index for faster portfolio loading
-- =============================================

CREATE INDEX IF NOT EXISTS idx_positions_user_market 
    ON public.positions(user_id, market_id);

CREATE INDEX IF NOT EXISTS idx_positions_user_outcome 
    ON public.positions(user_id, outcome_index);

-- =============================================
-- STEP 4: Verification View for AI Agent
-- =============================================

CREATE OR REPLACE VIEW user_portfolio_v2 AS
SELECT 
    p.id as position_id,
    p.user_id,
    e.id as event_id,
    e.question,
    e.title as event_title,
    p.outcome_index,
    p.quantity as shares_count,
    p.average_price,
    p.realized_pnl,
    p.created_at,
    p.updated_at
FROM public.positions p
JOIN public.events e ON p.market_id = e.id;

-- =============================================
-- STEP 5: Grant permissions
-- =============================================

GRANT SELECT ON user_portfolio_v2 TO authenticated;
GRANT SELECT ON user_portfolio_v2 TO anon;

-- =============================================
-- VERIFY
-- =============================================

DO $$
DECLARE
    pos_count INTEGER;
    with_market_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO pos_count FROM positions;
    SELECT COUNT(*) INTO with_market_id FROM positions WHERE market_id IS NOT NULL;
    
    RAISE NOTICE '=== POSITIONS TABLE STATUS ===';
    RAISE NOTICE 'Total positions: %', pos_count;
    RAISE NOTICE 'Positions with market_id: %', with_market_id;
    
    IF pos_count > 0 AND with_market_id = 0 THEN
        RAISE WARNING 'No positions have market_id! Check data.';
    ELSE
        RAISE NOTICE '✅ Positions table fix applied successfully!';
    END IF;
END $$;

COMMIT;

-- =============================================
-- SUMMARY:
-- 1. Added market_id column referencing events(id)
-- 2. Added outcome_index column for multi-outcome markets
-- 3. Created indexes for portfolio query performance
-- 4. Created user_portfolio_v2 view for easy fetching
-- =============================================
