-- =============================================
-- SCHEMA ALIGNMENT: Events vs Markets
-- Migration 999 - Fix Foreign Key References
-- 
-- Problem: System shifted from markets to events table
-- but foreign keys still point to markets(id)
--
-- Solution: Update FK constraints to reference events(id)
-- =============================================

BEGIN;

-- =============================================
-- 0. FIRST: Sync events from markets if needed
-- This ensures all market_ids have corresponding event records
-- =============================================

DO $$
DECLARE
    m_row RECORD;
    synced_count INTEGER := 0;
BEGIN
    -- Check if markets table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'markets' AND table_schema = 'public') THEN
        -- Insert events for markets that don't have corresponding events
        FOR m_row IN 
            SELECT id, question, description, created_at
            FROM markets 
            WHERE id NOT IN (SELECT id FROM events)
            LIMIT 1000
        LOOP
            INSERT INTO events (id, question, description, status, created_at, updated_at)
            VALUES (m_row.id, m_row.question, m_row.description, 'active', m_row.created_at, NOW())
            ON CONFLICT (id) DO NOTHING;
            synced_count := synced_count + 1;
        END LOOP;
        RAISE NOTICE 'Synced % markets to events', synced_count;
    END IF;
END $$;

-- =============================================
-- 1. ORDER BOOK TABLE - Drop old FK first
-- =============================================

ALTER TABLE order_book 
    DROP CONSTRAINT IF EXISTS order_book_market_id_fkey;

-- =============================================
-- 2. POSITIONS TABLE - Drop old FK first
-- =============================================

ALTER TABLE positions 
    DROP CONSTRAINT IF EXISTS positions_market_id_fkey;

-- =============================================
-- 3. TRADES TABLE - Drop old FK first
-- =============================================

ALTER TABLE trades 
    DROP CONSTRAINT IF EXISTS trades_market_id_fkey;

-- =============================================
-- 4. ORDERS TABLE (if exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE orders 
            DROP CONSTRAINT IF EXISTS orders_market_id_fkey;
    END IF;
END $$;

-- =============================================
-- 5. NOTIFICATIONS TABLE
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'market_id') THEN
        ALTER TABLE notifications 
            DROP CONSTRAINT IF EXISTS notifications_market_id_fkey;
        
        ALTER TABLE notifications 
            ADD CONSTRAINT notifications_event_id_fkey 
            FOREIGN KEY (market_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 6. USER FOLLOWS TABLE
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_follows' AND table_schema = 'public') THEN
        ALTER TABLE user_follows 
            DROP CONSTRAINT IF EXISTS user_follows_market_id_fkey;
        
        ALTER TABLE user_follows 
            ADD CONSTRAINT user_follows_event_id_fkey 
            FOREIGN KEY (market_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 7. MARKET CREATION DRAFTS
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'market_creation_drafts' AND table_schema = 'public') THEN
        ALTER TABLE market_creation_drafts 
            DROP CONSTRAINT IF EXISTS market_creation_drafts_deployed_market_id_fkey;
        
        ALTER TABLE market_creation_drafts 
            ADD CONSTRAINT market_creation_drafts_deployed_event_id_fkey 
            FOREIGN KEY (deployed_market_id) REFERENCES events(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- =============================================
-- 8. PRICE HISTORY
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_history' AND table_schema = 'public') THEN
        ALTER TABLE price_history 
            DROP CONSTRAINT IF EXISTS price_history_market_id_fkey;
        
        ALTER TABLE price_history 
            ADD CONSTRAINT price_history_event_id_fkey 
            FOREIGN KEY (market_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 9. EXPERT PANEL VOTES
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expert_votes' AND table_schema = 'public') THEN
        ALTER TABLE expert_votes 
            DROP CONSTRAINT IF EXISTS expert_votes_event_id_fkey;
        
        ALTER TABLE expert_votes 
            ADD CONSTRAINT expert_votes_event_id_fkey 
            FOREIGN KEY (event_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 10. VERIFICATION WORKFLOWS
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_workflows' AND table_schema = 'public') THEN
        ALTER TABLE verification_workflows 
            DROP CONSTRAINT IF EXISTS verification_workflows_event_id_fkey;
        
        ALTER TABLE verification_workflows 
            ADD CONSTRAINT verification_workflows_event_id_fkey 
            FOREIGN KEY (event_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 11. ORACLE VERIFICATIONS
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oracle_verifications' AND table_schema = 'public') THEN
        ALTER TABLE oracle_verifications 
            DROP CONSTRAINT IF EXISTS oracle_verifications_market_id_fkey;
        
        ALTER TABLE oracle_verifications 
            ADD CONSTRAINT oracle_verifications_event_id_fkey 
            FOREIGN KEY (market_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 12. TRANSACTIONS
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'market_id') THEN
        ALTER TABLE transactions 
            DROP CONSTRAINT IF EXISTS transactions_market_id_fkey;
        
        ALTER TABLE transactions 
            ADD CONSTRAINT transactions_event_id_fkey 
            FOREIGN KEY (market_id) REFERENCES events(id) 
            ON DELETE SET NULL;
    END IF;
END $$;

-- =============================================
-- 13. NOW ADD NEW FK CONSTRAINTS (after data sync)
-- =============================================

-- Add new constraint pointing to events for order_book
ALTER TABLE order_book 
    ADD CONSTRAINT order_book_event_id_fkey 
    FOREIGN KEY (market_id) REFERENCES events(id) 
    ON DELETE CASCADE;

-- Add new constraint for positions
ALTER TABLE positions 
    ADD CONSTRAINT positions_event_id_fkey 
    FOREIGN KEY (market_id) REFERENCES events(id) 
    ON DELETE CASCADE;

-- Add new constraint for trades
ALTER TABLE trades 
    ADD CONSTRAINT trades_event_id_fkey 
    FOREIGN KEY (market_id) REFERENCES events(id) 
    ON DELETE CASCADE;

-- Add new constraint for orders
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        ALTER TABLE orders 
            ADD CONSTRAINT orders_event_id_fkey 
            FOREIGN KEY (market_id) REFERENCES events(id) 
            ON DELETE CASCADE;
    END IF;
END $$;

-- =============================================
-- 14. VERIFY MIGRATION
-- =============================================

DO $$ 
BEGIN
    -- Verify constraints were created
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_book_event_id_fkey' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Schema alignment migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️ Some constraints may not have been created. Check manually.';
    END IF;
END $$;

COMMIT;

-- =============================================
-- NOTE: After running this migration:
-- 1. All trading operations will use events(id) as the primary key
-- 2. The markets table becomes deprecated (but can still exist for historical data)
-- 3. All queries should now use event_id instead of market_id
-- =============================================
