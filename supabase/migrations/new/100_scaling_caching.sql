-- ============================================================
-- DOMAIN: scaling (Traffic & Caching Layer)
-- PURPOSE: Configures pg_cron to aggressively offload DB compute
-- ============================================================

-- 1. Ensure pg_cron extension is active for background caching
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 2. Leaderboard Rankings (1-minute TTL Cache via Materialized View)
-- Note: 'leaderboard_mv' was created in 070_analytics.sql with a UNIQUE index 
-- allowing for zero-downtime CONCURRENTLY refreshes.
SELECT cron.schedule(
    'refresh_leaderboard_cache',
    '* * * * *', -- Every 1 minute
    $$ REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_mv; $$
);

-- 3. Price History & Changes (5-minute TTL Cache)
-- Runs the update_price_changes() function from phase 2 analytics
-- to update the 24h price deltas on active markets.
SELECT cron.schedule(
    'refresh_price_history_changes',
    '*/5 * * * *', -- Every 5 minutes
    $$ SELECT update_price_changes(); $$
);

-- 4. Hourly Snapshot Record (Runs exactly on the hour)
SELECT cron.schedule(
    'record_hourly_price_snapshots',
    '0 * * * *', -- At minute 0 past every hour
    $$ SELECT record_price_snapshots(); $$
);

-- 5. Daily OHLC Calculation (Runs at midnight)
SELECT cron.schedule(
    'calculate_daily_ohlc_aggregates',
    '5 0 * * *', -- At 00:05 every day
    $$ SELECT calculate_daily_ohlc(CURRENT_DATE - INTERVAL '1 day'); $$
);

-- Note: Other cache mechanisms (Vercel Edge, Upstash Redis) 
-- are handled completely at the application/CDN layer and do not 
-- require Postgres-level migrations.
