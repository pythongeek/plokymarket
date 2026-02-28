-- ===============================================
-- Migration 132: Fix Resolution Method Constraint
-- Purpose: Ensure resolution_method accepts all valid values
--          and sync with frontend ORACLE_TYPES
-- Date: 2026-03-01
-- ===============================================

BEGIN;

-- Drop existing constraint if it exists to avoid conflicts
ALTER TABLE public.events 
    DROP CONSTRAINT IF EXISTS events_resolution_method_check;

-- Add updated constraint with all valid resolution methods
-- These values must match the ORACLE_TYPES in:
-- apps/web/src/components/admin/EventCreationPanel.tsx
ALTER TABLE public.events 
    ADD CONSTRAINT events_resolution_method_check 
    CHECK (resolution_method IN (
        'manual_admin',      -- Manual admin resolution
        'ai_oracle',         -- AI Oracle (Vertex/Kimi)
        'expert_panel',      -- Expert panel verification
        'external_api',      -- External API (sports/finance data)
        'community_vote',    -- Community voting
        'hybrid'             -- Hybrid AI + Human system
    ));

-- Update any legacy values to the new standard
UPDATE public.events 
    SET resolution_method = 'manual_admin' 
    WHERE resolution_method IN ('MANUAL', 'manual', 'admin');

UPDATE public.events 
    SET resolution_method = 'ai_oracle' 
    WHERE resolution_method IN ('AI', 'ai', 'oracle');

UPDATE public.events 
    SET resolution_method = 'external_api' 
    WHERE resolution_method IN ('CHAINLINK', 'chainlink', 'API', 'api');

UPDATE public.events 
    SET resolution_method = 'hybrid' 
    WHERE resolution_method IN ('MULTI', 'multi', 'multi_source', 'UMA', 'uma');

-- Set default for NULL values
UPDATE public.events 
    SET resolution_method = 'manual_admin' 
    WHERE resolution_method IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.events.resolution_method IS 
    'Resolution method: manual_admin, ai_oracle, expert_panel, external_api, community_vote, hybrid';

COMMIT;
