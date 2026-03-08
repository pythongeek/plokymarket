-- ============================================================
-- DOMAIN: events  
-- FIXES: JSONB vs TEXT[] casting errors (most reported bug)
-- FIXES: Missing title, answer_type columns
-- ============================================================

CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- These two columns were missing in many migrations — now canonical
  title             VARCHAR(200) NOT NULL,
  answer_type       answer_type NOT NULL DEFAULT 'binary',
  
  description       TEXT,
  slug              TEXT UNIQUE,
  category_id       UUID,
  resolution_source TEXT,
  
  -- JSONB is the canonical type — ends the TEXT[] war
  tags              JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  status            market_status NOT NULL DEFAULT 'draft',
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  resolves_at       TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ,
  resolution_value  TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status_category ON events(status, category_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- ── COMPATIBILITY SHIM ──────────────────────────────────────
-- Any frontend still calling with TEXT[] continues to work.
-- Drop this function after all callers migrate to JSONB.
-- Callers: app/api/events/route.ts, supabase/functions/admin-create/index.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION event_tags_as_text_array(p_event_id UUID)
RETURNS TEXT[] AS $$
  SELECT ARRAY(SELECT jsonb_array_elements_text(tags))
  FROM events WHERE id = p_event_id;
$$ LANGUAGE sql STABLE;

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: events
-- Version: v3 (consolidates all previous create_event_complete versions)
-- Replaces: all previous create_event_complete definitions
-- Callers: app/api/events/route.ts, supabase/functions/admin-create/index.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION create_event_complete_v3(
  p_title           VARCHAR(200),
  p_description     TEXT,
  p_answer_type     answer_type,
  p_tags            JSONB,           -- canonical: accepts JSONB
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
