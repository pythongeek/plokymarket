-- ============================================================
-- DOMAIN: admin
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls log_admin_action_v2
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id        UUID,
  p_action          TEXT,
  p_details         TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- We parse text into diff_jsonb to fit the new v2 schema smoothly
  RETURN log_admin_action_v2(
    p_admin_id     := p_admin_id,
    p_action       := p_action,
    p_diff_jsonb   := CASE WHEN p_details IS NOT NULL THEN jsonb_build_object('legacy_details', p_details) ELSE NULL END
  );
END;
$$;
