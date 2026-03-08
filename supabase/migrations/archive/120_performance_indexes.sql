-- 120_performance_indexes.sql
-- Optimizes database performance for high-traffic queries as per Section 5.2

-- Drop existing indexes if they exist to maintain idempotency
DROP INDEX IF EXISTS idx_events_category_ends_at;
DROP INDEX IF EXISTS idx_events_category_closes_at;
DROP INDEX IF EXISTS idx_events_volume_desc;
DROP INDEX IF EXISTS idx_comments_event_created;

-- 1. Index for filtered browsing
-- Matches: WHERE category = 'Sports' AND ends_at > NOW()
CREATE INDEX idx_events_category_ends_at ON events (category, ends_at);

-- Auxiliary index for the UI which often relies on trading_closes_at
CREATE INDEX idx_events_category_closes_at ON events (category, trading_closes_at);

-- 2. Index for Trending Markets
-- Matches: ORDER BY total_volume DESC LIMIT 50
CREATE INDEX idx_events_volume_desc ON events (total_volume DESC);

-- 3. Index for Market Page Load
-- Matches: WHERE event_id = X ORDER BY created_at DESC
CREATE INDEX idx_comments_event_created ON comments (event_id, created_at DESC);
