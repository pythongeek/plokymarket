-- ============================================================
-- Trust Score Algorithm & Auto-Rotation Migration
-- Plokymarket CX33 Production
-- ============================================================

-- 1. Add missing columns to agent_wallets for trust algorithm
ALTER TABLE agent_wallets
    ADD COLUMN IF NOT EXISTS missed_sessions integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS dispute_losses integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_processed_usdt numeric(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS streak_fast_confirmations integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_confirmed_at timestamp with time zone;

-- 2. Drop and recreate get_matching_agents with trust score algorithm + auto-rotation
DROP FUNCTION IF EXISTS get_matching_agents(numeric);

CREATE OR REPLACE FUNCTION get_matching_agents(p_amount_bdt numeric)
RETURNS TABLE (
    id uuid,
    agent_name text,
    phone_number character varying,
    method character varying,
    trust_score integer,
    avg_response_min integer,
    success_rate numeric,
    is_online boolean,
    current_sessions integer,
    max_session_bdt integer,
    daily_remaining numeric,
    missed_sessions integer,
    dispute_losses integer,
    total_processed_usdt numeric,
    streak_fast_confirmations integer,
    composite_score numeric,
    rank_position integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH agent_data AS (
        SELECT
            aw.id,
            aw.agent_name,
            aw.phone_number,
            aw.method,
            aw.trust_score,
            aw.avg_response_min,
            aw.success_rate,
            aw.is_online,
            aw.current_sessions,
            aw.max_session_bdt,
            COALESCE(aw.daily_limit_bdt, 50000) - COALESCE(aw.used_today_bdt, 0) as daily_remaining,
            COALESCE(aw.missed_sessions, 0) as missed_sessions,
            COALESCE(aw.dispute_losses, 0) as dispute_losses,
            COALESCE(aw.total_processed_usdt, 0) as total_processed_usdt,
            COALESCE(aw.streak_fast_confirmations, 0) as streak_fast_confirmations,
            (
                COALESCE(aw.trust_score, 50) * 1.0
                - (COALESCE(aw.current_sessions, 0) * 8)
                - (COALESCE(aw.avg_response_min, 10) * 1.5)
                + (COALESCE(aw.success_rate, 0) * 0.3)
                - (COALESCE(aw.missed_sessions, 0) * 3)
                - (COALESCE(aw.dispute_losses, 0) * 5)
                + LEAST(COALESCE(aw.total_processed_usdt, 0) / 500, 15)
                + LEAST(COALESCE(aw.streak_fast_confirmations, 0) * 1.5, 8)
            )::numeric as composite_score
        FROM agent_wallets aw
        WHERE aw.is_active = true
          AND aw.is_online = true
          AND COALESCE(aw.daily_limit_bdt, 50000) - COALESCE(aw.used_today_bdt, 0) >= p_amount_bdt
          AND COALESCE(aw.current_sessions, 0) < 5
          AND p_amount_bdt <= COALESCE(aw.max_session_bdt, 50000)
    )
    SELECT
        ad.id,
        ad.agent_name,
        ad.phone_number,
        ad.method,
        ad.trust_score,
        ad.avg_response_min,
        ad.success_rate,
        ad.is_online,
        ad.current_sessions,
        ad.max_session_bdt,
        ad.daily_remaining,
        ad.missed_sessions,
        ad.dispute_losses,
        ad.total_processed_usdt,
        ad.streak_fast_confirmations,
        ad.composite_score,
        ROW_NUMBER() OVER (ORDER BY ad.composite_score DESC, random())::integer as rank_position
    FROM agent_data ad
    ORDER BY ad.composite_score DESC, random()
    LIMIT 3;
END;
$$;

-- 3. Update agent_stats trigger to also compute trust_score
DROP TRIGGER IF EXISTS trg_update_agent_stats ON deposit_sessions;

CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_response_min integer;
    v_is_fast boolean := false;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.payment_sent_at IS NOT NULL AND NEW.confirmed_at IS NOT NULL THEN
            v_response_min := EXTRACT(EPOCH FROM (NEW.confirmed_at - NEW.payment_sent_at)) / 60;
        ELSE
            v_response_min := 5;
        END IF;

        v_is_fast := (v_response_min IS NOT NULL AND v_response_min < 3);

        UPDATE agent_wallets
        SET
            total_transactions = COALESCE(total_transactions, 0) + 1,
            completed_transactions = COALESCE(completed_transactions, 0) + 1,
            used_today_bdt = COALESCE(used_today_bdt, 0) + COALESCE(NEW.amount_bdt, 0),
            total_processed_usdt = COALESCE(total_processed_usdt, 0) + COALESCE(NEW.amount_usdt, 0),
            current_sessions = GREATEST(COALESCE(current_sessions, 0) - 1, 0),
            last_confirmed_at = NOW(),
            avg_response_min = CASE
                WHEN COALESCE(completed_transactions, 0) = 0 THEN v_response_min
                ELSE ROUND((COALESCE(avg_response_min, 10)::numeric * completed_transactions + v_response_min) / (completed_transactions + 1))
            END,
            streak_fast_confirmations = CASE
                WHEN v_is_fast THEN LEAST(COALESCE(streak_fast_confirmations, 0) + 1, 20)
                ELSE 0
            END,
            success_rate = CASE
                WHEN COALESCE(total_transactions, 0) + 1 > 0
                THEN ROUND((COALESCE(completed_transactions, 0) + 1.0) / (COALESCE(total_transactions, 0) + 1.0) * 100, 2)
                ELSE 0
            END,
            trust_score = GREATEST(0, LEAST(100,
                100
                - (COALESCE(missed_sessions, 0) * 5)
                - (COALESCE(avg_response_min, 10) * 2)
                - (COALESCE(dispute_losses, 0) * 10)
                + LEAST(COALESCE(total_processed_usdt, 0) / 1000, 20)
                + LEAST(COALESCE(streak_fast_confirmations, 0) * 2, 10)
            ))
        WHERE id = NEW.agent_id;

    ELSIF NEW.status IN ('expired', 'cancelled') AND OLD.status NOT IN ('expired', 'cancelled', 'completed') THEN
        UPDATE agent_wallets
        SET
            total_transactions = COALESCE(total_transactions, 0) + 1,
            missed_sessions = COALESCE(missed_sessions, 0) + 1,
            current_sessions = GREATEST(COALESCE(current_sessions, 0) - 1, 0),
            streak_fast_confirmations = 0,
            success_rate = CASE
                WHEN COALESCE(total_transactions, 0) + 1 > 0
                THEN ROUND(COALESCE(completed_transactions, 0)::numeric / (COALESCE(total_transactions, 0) + 1.0) * 100, 2)
                ELSE 0
            END,
            trust_score = GREATEST(0, LEAST(100,
                100
                - (COALESCE(missed_sessions, 0) * 5)
                - (COALESCE(avg_response_min, 10) * 2)
                - (COALESCE(dispute_losses, 0) * 10)
                + LEAST(COALESCE(total_processed_usdt, 0) / 1000, 20)
                + LEAST(COALESCE(streak_fast_confirmations, 0) * 2, 10)
            ))
        WHERE id = NEW.agent_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_agent_stats
    AFTER UPDATE OF status ON deposit_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_stats();

-- 4. Backfill existing agents
UPDATE agent_wallets
SET trust_score = GREATEST(0, LEAST(100,
    100
    - (COALESCE(missed_sessions, 0) * 5)
    - (COALESCE(avg_response_min, 10) * 2)
    - (COALESCE(dispute_losses, 0) * 10)
    + LEAST(COALESCE(total_processed_usdt, 0) / 1000, 20)
    + LEAST(COALESCE(streak_fast_confirmations, 0) * 2, 10)
))
WHERE trust_score = 50 OR trust_score IS NULL;

-- 5. Set agent online/offline helper
CREATE OR REPLACE FUNCTION set_agent_online(p_agent_id uuid, p_online boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE agent_wallets SET is_online = p_online WHERE id = p_agent_id;
END;
$$;

-- 6. Agent performance summary
CREATE OR REPLACE FUNCTION get_agent_performance(p_agent_id uuid)
RETURNS TABLE (
    agent_name text,
    trust_score integer,
    total_transactions bigint,
    completed_transactions bigint,
    success_rate numeric,
    avg_response_min integer,
    missed_sessions integer,
    dispute_losses integer,
    total_processed_usdt numeric,
    streak_fast_confirmations integer,
    current_sessions integer,
    daily_remaining numeric,
    last_confirmed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        aw.agent_name,
        aw.trust_score,
        COALESCE(aw.total_transactions, 0)::bigint,
        COALESCE(aw.completed_transactions, 0)::bigint,
        aw.success_rate,
        COALESCE(aw.avg_response_min, 10),
        COALESCE(aw.missed_sessions, 0),
        COALESCE(aw.dispute_losses, 0),
        COALESCE(aw.total_processed_usdt, 0),
        COALESCE(aw.streak_fast_confirmations, 0),
        COALESCE(aw.current_sessions, 0),
        COALESCE(aw.daily_limit_bdt, 50000) - COALESCE(aw.used_today_bdt, 0),
        aw.last_confirmed_at
    FROM agent_wallets aw
    WHERE aw.id = p_agent_id;
END;
$$;
