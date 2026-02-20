/**
 * Targeted production migration: Apply only event-creation-critical fixes.
 * This avoids the naming conflicts with the trading `transactions` table
 * and only patches the pieces needed for the admin event creation flow.
 */
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    ssl: { rejectUnauthorized: false }
});

const SQL_PATCHES = [
    // 1. Ensure resolution_systems table exists (required by the API)
    {
        name: 'Create resolution_systems table',
        sql: `
      CREATE TABLE IF NOT EXISTS resolution_systems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
        primary_method VARCHAR(50) DEFAULT 'manual_admin'
          CHECK (primary_method IN ('manual_admin', 'ai_oracle', 'expert_panel', 'external_api')),
        ai_keywords TEXT[] DEFAULT '{}',
        ai_sources TEXT[] DEFAULT '{}',
        confidence_threshold INTEGER DEFAULT 85 CHECK (confidence_threshold BETWEEN 70 AND 99),
        expert_panel_id UUID,
        min_expert_votes INTEGER DEFAULT 3,
        external_api_endpoint TEXT,
        external_api_key TEXT,
        status VARCHAR(20) DEFAULT 'pending'
          CHECK (status IN ('pending', 'active', 'completed', 'failed')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_event_resolution UNIQUE (event_id)
      );
    `
    },
    // 2. RLS for resolution_systems
    {
        name: 'RLS for resolution_systems',
        sql: `
      ALTER TABLE resolution_systems ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "resolution_systems_public_read" ON resolution_systems;
      CREATE POLICY "resolution_systems_public_read"
        ON resolution_systems FOR SELECT USING (true);

      DROP POLICY IF EXISTS "resolution_systems_service_all" ON resolution_systems;
      CREATE POLICY "resolution_systems_service_all"
        ON resolution_systems FOR ALL TO service_role USING (true) WITH CHECK (true);
    `
    },
    // 3. Ensure markets has all required columns
    {
        name: 'Add missing markets columns',
        sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'initial_liquidity') THEN
          ALTER TABLE public.markets ADD COLUMN initial_liquidity NUMERIC DEFAULT 1000;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'created_by') THEN
          ALTER TABLE public.markets ADD COLUMN created_by UUID REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'slug') THEN
          ALTER TABLE public.markets ADD COLUMN slug VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'answer_type') THEN
          ALTER TABLE public.markets ADD COLUMN answer_type VARCHAR(20) DEFAULT 'binary';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'answer1') THEN
          ALTER TABLE public.markets ADD COLUMN answer1 VARCHAR(100) DEFAULT 'Yes';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'answer2') THEN
          ALTER TABLE public.markets ADD COLUMN answer2 VARCHAR(100) DEFAULT 'No';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'resolution_delay_hours') THEN
          ALTER TABLE public.markets ADD COLUMN resolution_delay_hours INTEGER DEFAULT 24;
        END IF;
      END $$;
    `
    },
    // 4. Fix markets RLS to allow public reads and service_role inserts
    {
        name: 'Fix markets RLS',
        sql: `
      DROP POLICY IF EXISTS "Public can view markets" ON public.markets;
      CREATE POLICY "Public can view markets"
        ON public.markets FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Service role can manage markets" ON public.markets;
      CREATE POLICY "Service role can manage markets"
        ON public.markets FOR ALL TO service_role USING (true) WITH CHECK (true);
    `
    },
    // 5. Fix events table RLS
    {
        name: 'Fix events RLS',
        sql: `
      DROP POLICY IF EXISTS "Public can view events" ON public.events;
      CREATE POLICY "Public can view events"
        ON public.events FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Service role can manage events" ON public.events;
      CREATE POLICY "Service role can manage events"
        ON public.events FOR ALL TO service_role USING (true) WITH CHECK (true);
    `
    },
    // 6. Fix get_events_with_resolution function
    {
        name: 'Fix get_events_with_resolution function',
        sql: `
      CREATE OR REPLACE FUNCTION get_events_with_resolution(
        p_status VARCHAR DEFAULT NULL,
        p_category VARCHAR DEFAULT NULL,
        p_limit INTEGER DEFAULT 50
      )
      RETURNS TABLE (
        id UUID,
        name TEXT,
        question TEXT,
        category VARCHAR,
        subcategory VARCHAR,
        tags TEXT[],
        trading_closes_at TIMESTAMPTZ,
        status VARCHAR,
        resolution_method VARCHAR,
        resolution_status VARCHAR,
        created_at TIMESTAMPTZ
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          m.id,
          m.name,
          m.question,
          m.category,
          m.subcategory,
          m.tags,
          m.trading_closes_at,
          m.status,
          COALESCE(rs.primary_method, 'manual_admin') as resolution_method,
          COALESCE(rs.status, 'pending') as resolution_status,
          m.created_at
        FROM markets m
        LEFT JOIN resolution_systems rs ON rs.event_id = m.id
        WHERE
          (p_status IS NULL OR m.status = p_status)
          AND (p_category IS NULL OR m.category = p_category)
        ORDER BY m.created_at DESC
        LIMIT p_limit;
      END;
      $$;
    `
    }
];

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to production DB');

        for (const patch of SQL_PATCHES) {
            try {
                await client.query(patch.sql);
                console.log(`✅ ${patch.name}`);
            } catch (err) {
                if (err.message.includes('already exists')) {
                    console.log(`⏭️  ${patch.name} (already exists, skipped)`);
                } else {
                    console.error(`❌ ${patch.name}: ${err.message}`);
                }
            }
        }

        // Verify final state
        console.log('\n--- Verification ---');
        const tables = ['events', 'markets', 'resolution_systems'];
        for (const t of tables) {
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}'`);
            console.log(`${t}: ${res.rows.length} columns`);
        }

        console.log('\n🎉 All patches applied successfully!');
    } catch (err) {
        console.error('Critical error:', err.message);
    } finally {
        await client.end();
    }
}

run();
