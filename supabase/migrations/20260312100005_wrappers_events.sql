-- ============================================================
-- DOMAIN: events + markets WRAPPERS (Phase 2)
-- Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls create_event_complete_v3 (v1 signature with TEXT[])
CREATE OR REPLACE FUNCTION create_event_complete(
  p_title          VARCHAR(200),
  p_description    TEXT,
  p_category_id    UUID,
  p_tags           TEXT[],
  p_answer_type    TEXT DEFAULT 'binary',
  p_resolution_src TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN create_event_complete_v3(
    p_title             := p_title,
    p_description       := p_description,
    p_answer_type       := p_answer_type::answer_type,
    p_tags              := to_jsonb(p_tags),
    p_category_id       := p_category_id,
    p_resolution_source := p_resolution_src,
    p_starts_at         := NULL,
    p_ends_at           := NULL
  );
END;
$$;

-- WRAPPER: deprecated, calls create_event_complete_v3 (v2 signature)
CREATE OR REPLACE FUNCTION create_event_complete_v2(
  title            VARCHAR(200),
  description      TEXT,
  category_id      UUID,
  tags             TEXT[],
  answer_type      TEXT DEFAULT 'binary'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN create_event_complete_v3(
    p_title             := title,
    p_description       := description,
    p_answer_type       := answer_type::answer_type,
    p_tags              := to_jsonb(tags),
    p_category_id       := category_id,
    p_resolution_source := NULL,
    p_starts_at         := NULL,
    p_ends_at           := NULL
  );
END;
$$;
