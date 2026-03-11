-- ============================================================
-- PHASE 4C FIX: Oracle RPCs (matches actual production schema)
-- oracle_requests: id, market_id, request_type, proposer_id, proposed_outcome,
--   confidence_score, evidence_text, evidence_urls, ai_analysis, bond_amount,
--   bond_currency, challenge_window_ends_at, status, created_at, updated_at,
--   processed_at, resolved_at, finalized_at
-- oracle_disputes: id, request_id, disputer_id, bond_amount, reason,
--   evidence_urls, status, resolution_outcome, resolved_by, created_at, resolved_at
-- ============================================================

-- Add any missing enhancement columns (additive only)
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS reasoning TEXT;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS dispute_count INT DEFAULT 0;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN DEFAULT FALSE;
ALTER TABLE oracle_requests ADD COLUMN IF NOT EXISTS resolution TEXT;

ALTER TABLE oracle_disputes ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- ── 1. submit_oracle_request_v2 ────────────────────────────
CREATE OR REPLACE FUNCTION submit_oracle_request_v2(
  p_market_id UUID,
  p_requested_by UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_req_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM oracle_requests WHERE market_id = p_market_id AND status = 'pending') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Resolution already pending');
  END IF;

  INSERT INTO oracle_requests (market_id, request_type, proposer_id, status)
  VALUES (p_market_id, 'resolution', COALESCE(p_requested_by, auth.uid()), 'pending')
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. submit_oracle_verdict_v2 ────────────────────────────
CREATE OR REPLACE FUNCTION submit_oracle_verdict_v2(
  p_request_id UUID,
  p_resolution TEXT,
  p_confidence NUMERIC,
  p_reasoning TEXT,
  p_evidence JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB AS $$
BEGIN
  UPDATE oracle_requests SET
    proposed_outcome = p_resolution,
    resolution = p_resolution,
    confidence_score = p_confidence,
    reasoning = p_reasoning,
    ai_analysis = p_reasoning,
    evidence_urls = p_evidence,
    status = CASE 
      WHEN p_confidence >= 0.9 THEN 'auto_resolved'
      WHEN p_confidence >= 0.7 THEN 'pending_review'
      ELSE 'low_confidence'
    END,
    processed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Auto-settle if high confidence
  IF p_confidence >= 0.9 THEN
    PERFORM settle_market_v2(
      (SELECT market_id FROM oracle_requests WHERE id = p_request_id), 
      p_resolution
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'auto_settled', p_confidence >= 0.9,
    'status', CASE 
      WHEN p_confidence >= 0.9 THEN 'auto_resolved'
      WHEN p_confidence >= 0.7 THEN 'pending_review'
      ELSE 'low_confidence'
    END
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. dispute_resolution_v2 ───────────────────────────────
CREATE OR REPLACE FUNCTION dispute_resolution_v2(
  p_request_id UUID,
  p_reason TEXT,
  p_evidence_url TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_dispute_id UUID;
  v_market_id UUID;
BEGIN
  SELECT market_id INTO v_market_id FROM oracle_requests WHERE id = p_request_id;
  IF v_market_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oracle request not found');
  END IF;

  INSERT INTO oracle_disputes (request_id, disputer_id, reason, evidence_urls, status)
  VALUES (p_request_id, auth.uid(), p_reason, 
    CASE WHEN p_evidence_url IS NOT NULL THEN jsonb_build_array(p_evidence_url) ELSE '[]'::JSONB END,
    'open')
  RETURNING id INTO v_dispute_id;

  UPDATE oracle_requests SET 
    is_disputed = true, 
    dispute_count = dispute_count + 1,
    status = 'under_review'
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'dispute_id', v_dispute_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. resolve_dispute_v2 ──────────────────────────────────
CREATE OR REPLACE FUNCTION resolve_dispute_v2(
  p_dispute_id UUID,
  p_admin_response TEXT,
  p_override_resolution TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE v_dispute RECORD;
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_dispute FROM oracle_disputes WHERE id = p_dispute_id FOR UPDATE;
  IF v_dispute IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Dispute not found');
  END IF;

  UPDATE oracle_disputes SET
    status = 'resolved', 
    admin_response = p_admin_response, 
    resolution_outcome = COALESCE(p_override_resolution, 'upheld'),
    resolved_by = auth.uid(),
    resolved_at = NOW()
  WHERE id = p_dispute_id;

  IF p_override_resolution IS NOT NULL THEN
    UPDATE oracle_requests SET
      resolution = p_override_resolution, 
      proposed_outcome = p_override_resolution,
      status = 'admin_override',
      resolved_at = NOW()
    WHERE id = v_dispute.request_id;

    PERFORM settle_market_v2(
      (SELECT market_id FROM oracle_requests WHERE id = v_dispute.request_id), 
      p_override_resolution
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'overridden', p_override_resolution IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. get_oracle_status_v2 ────────────────────────────────
CREATE OR REPLACE FUNCTION get_oracle_status_v2(
  p_market_id UUID
) RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'request_id', r.id,
    'market_id', r.market_id,
    'status', r.status,
    'resolution', r.resolution,
    'proposed_outcome', r.proposed_outcome,
    'confidence', r.confidence_score,
    'reasoning', COALESCE(r.reasoning, r.ai_analysis),
    'evidence', r.evidence_urls,
    'is_disputed', r.is_disputed,
    'dispute_count', r.dispute_count,
    'bond_amount', r.bond_amount,
    'created_at', r.created_at,
    'disputes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', d.id, 'reason', d.reason, 'status', d.status,
        'resolution_outcome', d.resolution_outcome,
        'admin_response', d.admin_response, 'created_at', d.created_at
      )), '[]'::JSONB)
      FROM oracle_disputes d WHERE d.request_id = r.id
    )
  ) INTO v_result
  FROM oracle_requests r
  WHERE r.market_id = p_market_id
  ORDER BY r.created_at DESC LIMIT 1;

  RETURN COALESCE(v_result, jsonb_build_object('found', false));
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
