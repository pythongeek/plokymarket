-- ============================================================
-- DOMAIN: events  (Phase 2)
-- FIXES: JSONB vs TEXT[] casting errors (most reported bug)
-- FIXES: Missing title, answer_type columns
-- PRODUCTION-SAFE: Uses ALTER TABLE ADD COLUMN IF NOT EXISTS
-- ============================================================

-- Add missing columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE events ADD COLUMN IF NOT EXISTS answer_type answer_type DEFAULT 'binary';
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolution_source TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status market_status DEFAULT 'draft';
ALTER TABLE events ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolves_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS resolution_value TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Safely convert tags column from TEXT[] to JSONB if it exists as TEXT[]
-- This is the core fix for the most reported production bug
DO $$
BEGIN
  -- Check if tags column exists and is text[]
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'tags' AND udt_name = '_text'
  ) THEN
    -- Drop any triggers that depend on the tags column
    DROP TRIGGER IF EXISTS trg_events_search_vector ON events;
    
    -- Must drop default first, then convert type, then set new default
    ALTER TABLE events ALTER COLUMN tags DROP DEFAULT;
    ALTER TABLE events ALTER COLUMN tags TYPE JSONB
      USING COALESCE(to_jsonb(tags), '[]'::JSONB);
    ALTER TABLE events ALTER COLUMN tags SET DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Converted events.tags from TEXT[] to JSONB';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'tags'
  ) THEN
    ALTER TABLE events ADD COLUMN tags JSONB DEFAULT '[]'::JSONB;
    RAISE NOTICE 'Added events.tags as JSONB (new column)';
  ELSE
    RAISE NOTICE 'events.tags already exists as JSONB — no conversion needed';
  END IF;
END $$;

-- Indexes (already idempotent)
CREATE INDEX IF NOT EXISTS idx_events_status_category ON events(status, category_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug) WHERE slug IS NOT NULL;

-- ── COMPATIBILITY SHIM ──────────────────────────────────────
-- Now that tags is guaranteed JSONB, this function works correctly
CREATE OR REPLACE FUNCTION event_tags_as_text_array(p_event_id UUID)
RETURNS TEXT[] AS $$
  SELECT ARRAY(SELECT jsonb_array_elements_text(tags))
  FROM events WHERE id = p_event_id;
$$ LANGUAGE sql STABLE;

-- ── CANONICAL RPC ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_event_complete_v3(
  p_title           VARCHAR(200),
  p_description     TEXT,
  p_answer_type     answer_type,
  p_tags            JSONB,
  p_category_id     UUID,
  p_resolution_source TEXT,
  p_starts_at       TIMESTAMPTZ,
  p_ends_at         TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO events (
    title, description, answer_type, tags, 
    category_id, resolution_source, starts_at, ends_at
  ) VALUES (
    p_title, p_description, p_answer_type, p_tags,
    p_category_id, p_resolution_source, p_starts_at, p_ends_at
  ) RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('success', true, 'event_id', v_event_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
