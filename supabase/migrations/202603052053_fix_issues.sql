-- ============================================
-- FIX FK RELATIONSHIPS AND MISSING FUNCTIONS
-- Migration: Fix positions FK and update_exchange_rate
-- ============================================

BEGIN;

-- ============================================
-- 1. FIX POSITIONS FK - Add relationship to events
-- ============================================

-- First check if market_id column exists in positions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'positions' AND column_name = 'market_id'
    ) THEN
        -- Add FK to events table if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'positions_market_id_fkey' 
            AND table_name = 'positions'
        ) THEN
            ALTER TABLE public.positions
            ADD CONSTRAINT positions_market_id_fkey
            FOREIGN KEY (market_id) REFERENCES public.events(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added positions -> events FK constraint';
        ELSE
            RAISE NOTICE 'FK constraint already exists';
        END IF;
    ELSE
        RAISE NOTICE 'market_id column does not exist in positions';
    END IF;
END $$;

-- ============================================
-- 2. ADD MISSING update_exchange_rate FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.update_exchange_rate(
    p_source TEXT DEFAULT 'binance',
    p_usdt_to_bdt NUMERIC DEFAULT 125.00
)
RETURNS JSONB AS $$
DECLARE
    v_rate_id UUID;
    v_updated BOOLEAN := FALSE;
BEGIN
    -- Try to update existing rate
    UPDATE exchange_rates
    SET rate = p_usdt_to_bdt,
        updated_at = NOW()
    WHERE source = p_source
    RETURNING id INTO v_rate_id;

    -- If no row was updated, insert new rate
    IF v_rate_id IS NULL THEN
        INSERT INTO exchange_rates (source, rate, updated_at)
        VALUES (p_source, p_usdt_to_bdt, NOW())
        RETURNING id INTO v_rate_id;
        v_updated := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'source', p_source,
        'rate', p_usdt_to_bdt,
        'created', v_updated
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINer;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_exchange_rate TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_exchange_rate TO anon;

-- ============================================
-- 3. ENSURE exchange_rates TABLE EXISTS
-- ============================================

CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL UNIQUE,
    rate NUMERIC(18, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Public can read exchange rates" ON exchange_rates;
CREATE POLICY "Public can read exchange rates" ON exchange_rates FOR SELECT USING (true);

-- Create policy for authenticated write
DROP POLICY IF EXISTS "Auth can update exchange rates" ON exchange_rates;
CREATE POLICY "Auth can update exchange rates" ON exchange_rates FOR ALL USING (auth.role() = 'authenticated');

COMMIT;

-- ============================================
-- SUMMARY:
-- 1. Added positions -> events FK constraint
-- 2. Added update_exchange_rate() function
-- 3. Created exchange_rates table if not exists
-- ============================================
