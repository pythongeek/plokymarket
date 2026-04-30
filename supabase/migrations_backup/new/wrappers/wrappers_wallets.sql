-- ============================================================
-- DOMAIN: wallets
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls freeze_funds_v2
CREATE OR REPLACE FUNCTION freeze_funds(
  p_user_id         UUID,
  p_amount          NUMERIC
) RETURNS JSONB AS $$
BEGIN
  RETURN freeze_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql;

-- WRAPPER: deprecated, calls update_exchange_rate_v2
CREATE OR REPLACE FUNCTION update_exchange_rate(
  currency_pair TEXT,
  rate          NUMERIC,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM update_exchange_rate_v2(
    p_currency_pair := currency_pair,
    p_rate          := rate,
    p_recorded_at   := recorded_at
  );
END;
$$;

-- WRAPPER: deprecated, calls update_exchange_rate_v2
CREATE OR REPLACE FUNCTION set_exchange_rate(
  pair        TEXT,
  new_rate    NUMERIC
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM update_exchange_rate_v2(
    p_currency_pair := pair,
    p_rate          := new_rate,
    p_recorded_at   := NOW()
  );
END;
$$;
