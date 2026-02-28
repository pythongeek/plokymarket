-- ============================================================================
-- Migration 138: Fix Events Constraints
-- Problem: status check constraint doesn't include 'published'
-- Solution: Update constraint to include all valid status values
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current constraints
-- ============================================================================
DO $$
DECLARE
    con_record RECORD;
BEGIN
    RAISE NOTICE 'Current check constraints on events table:';
    FOR con_record IN 
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'events'::regclass AND contype = 'c'
    LOOP
        RAISE NOTICE 'Constraint: % - %', con_record.conname, con_record.definition;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Drop existing status check constraint if it exists
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'events'::regclass 
        AND conname = 'events_status_check'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT events_status_check;
        RAISE NOTICE 'Dropped existing events_status_check constraint';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 3: Create new status check constraint with all valid values
-- ============================================================================
DO $$
BEGIN
    ALTER TABLE public.events
    ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'pending', 'active', 'paused', 'closed', 'resolved', 'cancelled', 'published'));
    RAISE NOTICE 'Created new events_status_check constraint with published included';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: Also check and fix resolution_method constraint
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'events'::regclass 
        AND conname = 'events_resolution_method_check'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT events_resolution_method_check;
        RAISE NOTICE 'Dropped existing events_resolution_method_check constraint';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop resolution_method constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE public.events
    ADD CONSTRAINT events_resolution_method_check 
    CHECK (resolution_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api', 'community_vote', 'hybrid'));
    RAISE NOTICE 'Created new events_resolution_method_check constraint';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create resolution_method constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 5: Check and fix answer_type constraint
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'events'::regclass 
        AND conname = 'events_answer_type_check'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT events_answer_type_check;
        RAISE NOTICE 'Dropped existing events_answer_type_check constraint';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop answer_type constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE public.events
    ADD CONSTRAINT events_answer_type_check 
    CHECK (answer_type IN ('binary', 'multiple', 'scalar'));
    RAISE NOTICE 'Created new events_answer_type_check constraint';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create answer_type constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 6: Ensure markets table has proper constraints too
-- ============================================================================

-- Fix markets status constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'markets'::regclass 
        AND conname = 'markets_status_check'
    ) THEN
        ALTER TABLE public.markets DROP CONSTRAINT markets_status_check;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop markets status constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    ALTER TABLE public.markets
    ADD CONSTRAINT markets_status_check 
    CHECK (status IN ('draft', 'pending', 'active', 'paused', 'closed', 'resolved', 'cancelled'));
    RAISE NOTICE 'Created markets_status_check constraint';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create markets status constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 7: Test direct insert with published status
-- ============================================================================
DO $$
DECLARE
    test_event_id UUID;
    v_admin_id UUID;
BEGIN
    -- Find admin user
    SELECT id INTO v_admin_id
    FROM public.user_profiles
    WHERE is_admin = true
    LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'No admin user found, skipping test insert';
        RETURN;
    END IF;
    
    -- Try test insert
    BEGIN
        INSERT INTO public.events (
            title,
            name,
            name_en,
            question,
            category,
            status,
            event_date,
            trading_closes_at,
            created_by
        ) VALUES (
            'Test Event After Constraint Fix',
            'Test Event After Constraint Fix',
            'Test Event After Constraint Fix',
            'Will this work now?',
            'sports',
            'published',
            NOW() + INTERVAL '7 days',
            NOW() + INTERVAL '7 days',
            v_admin_id
        )
        RETURNING id INTO test_event_id;
        
        RAISE NOTICE 'SUCCESS! Test event created with ID: %', test_event_id;
        
        -- Clean up test event
        DELETE FROM public.events WHERE id = test_event_id;
        RAISE NOTICE 'Test event cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'FAILED: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- STEP 8: Reload PostgREST schema
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    con_record RECORD;
BEGIN
    RAISE NOTICE '=== Final check constraints on events table ===';
    FOR con_record IN 
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'events'::regclass AND contype = 'c'
        ORDER BY conname
    LOOP
        RAISE NOTICE '%: %', con_record.conname, con_record.definition;
    END LOOP;
END $$;
