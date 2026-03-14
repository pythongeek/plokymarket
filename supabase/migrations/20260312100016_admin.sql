-- ============================================================
-- DOMAIN: admin
-- FIXES: admin_wallet_functions broken access path securely
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action            TEXT NOT NULL,
  performed_by      UUID REFERENCES users(id) ON DELETE RESTRICT,
  target_table      TEXT,
  target_id         UUID,
  diff_jsonb        JSONB,
  ip_address        INET,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FIX: Ensure ALL required columns exist before creating indexes (handles schema drift safely)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='action') THEN
        ALTER TABLE admin_audit_log ADD COLUMN action TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='performed_by') THEN
        ALTER TABLE admin_audit_log ADD COLUMN performed_by UUID REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='target_table') THEN
        ALTER TABLE admin_audit_log ADD COLUMN target_table TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='target_id') THEN
        ALTER TABLE admin_audit_log ADD COLUMN target_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='diff_jsonb') THEN
        ALTER TABLE admin_audit_log ADD COLUMN diff_jsonb JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' AND column_name='ip_address') THEN
        ALTER TABLE admin_audit_log ADD COLUMN ip_address INET;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_performed_by ON admin_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_table, target_id);

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: admin
-- Version: v2
-- Replaces: admin_wallet_functions, log_admin_action
-- Callers: app/api/admin/action/route.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION log_admin_action_v2(
  p_admin_id        UUID,
  p_action          TEXT,
  p_target_table    TEXT DEFAULT NULL,
  p_target_id       UUID DEFAULT NULL,
  p_diff_jsonb      JSONB DEFAULT NULL,
  p_ip_address      INET DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_log_id UUID;
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO admin_audit_log (action, performed_by, target_table, target_id, diff_jsonb, ip_address)
  VALUES (p_action, p_admin_id, p_target_table, p_target_id, p_diff_jsonb, p_ip_address)
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;