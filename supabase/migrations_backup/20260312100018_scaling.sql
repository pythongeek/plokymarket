-- ============================================================
-- DOMAIN: scaling (Phase 5) — PRODUCTION SAFE
-- Conditional pg_cron setup — skips if extension not available
-- ============================================================

DO $$ BEGIN
  -- Only attempt pg_cron if extension is available
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
    
    -- Schedule leaderboard refresh (1 min)
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'leaderboard_mv') THEN
      PERFORM cron.schedule('refresh_leaderboard_cache', '* * * * *', 
        $q$ REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_mv; $q$);
    END IF;
    
    RAISE NOTICE 'pg_cron configured successfully';
  ELSE
    RAISE NOTICE 'pg_cron not available — skipping scaling cron setup';
  END IF;
END $$;
