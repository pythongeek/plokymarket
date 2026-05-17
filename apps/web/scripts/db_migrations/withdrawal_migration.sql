-- ============================================================
-- Withdrawal System Enhancement Migration
-- Plokymarket CX33 Production
-- Adds: USDT Crypto + Bank Transfer + Fee Config
-- ============================================================

-- 1. Create withdrawal_method enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_method') THEN
        CREATE TYPE withdrawal_method AS ENUM ('mfs', 'crypto', 'bank');
    END IF;
END $$;

-- 2. Add new columns to withdrawal_requests
ALTER TABLE withdrawal_requests
    ADD COLUMN IF NOT EXISTS withdrawal_method withdrawal_method DEFAULT 'mfs',
    ADD COLUMN IF NOT EXISTS crypto_network character varying(20),
    ADD COLUMN IF NOT EXISTS wallet_address text,
    ADD COLUMN IF NOT EXISTS tx_hash character varying(100),
    ADD COLUMN IF NOT EXISTS memo text,
    ADD COLUMN IF NOT EXISTS bank_name text,
    ADD COLUMN IF NOT EXISTS account_number character varying(50),
    ADD COLUMN IF NOT EXISTS account_holder_name text,
    ADD COLUMN IF NOT EXISTS branch_name text,
    ADD COLUMN IF NOT EXISTS withdrawal_fee_usdt numeric(12,6) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS processed_by_agent_id uuid,
    ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone;

-- 3. Backfill existing rows
UPDATE withdrawal_requests
SET withdrawal_method = 'mfs'
WHERE withdrawal_method IS NULL;

-- 4. Create withdrawal fee configuration table
CREATE TABLE IF NOT EXISTS withdrawal_fees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    method withdrawal_method NOT NULL DEFAULT 'mfs',
    crypto_network character varying(20),
    fee_usdt numeric(12,6) NOT NULL DEFAULT 0,
    fee_percent numeric(5,2) NOT NULL DEFAULT 0,
    min_amount numeric(12,2) NOT NULL DEFAULT 10,
    max_amount numeric(12,2) NOT NULL DEFAULT 100000,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(method, crypto_network)
);

-- 5. Seed default fee config
INSERT INTO withdrawal_fees (method, crypto_network, fee_usdt, fee_percent, min_amount, max_amount)
VALUES
    ('mfs', NULL, 2.00, 0, 10, 50000),
    ('crypto', 'bep20', 0.50, 0, 10, 100000),
    ('crypto', 'trc20', 1.00, 0, 10, 100000),
    ('crypto', 'ton', 0.20, 0, 10, 100000),
    ('crypto', 'erc20', 5.00, 0, 50, 100000),
    ('bank', NULL, 3.00, 0, 100, 1000000)
ON CONFLICT (method, crypto_network) DO NOTHING;

-- 6. Function to get withdrawal fee
CREATE OR REPLACE FUNCTION get_withdrawal_fee(p_method withdrawal_method, p_network character varying)
RETURNS TABLE (fee_usdt numeric, fee_percent numeric, min_amount numeric, max_amount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT wf.fee_usdt, wf.fee_percent, wf.min_amount, wf.max_amount
    FROM withdrawal_fees wf
    WHERE wf.method = p_method
      AND (wf.crypto_network IS NOT DISTINCT FROM p_network)
      AND wf.is_active = true;
END;
$$;

-- 7. Function to assign withdrawal to agent (auto-rotation)
CREATE OR REPLACE FUNCTION assign_withdrawal_to_agent(p_withdrawal_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id uuid;
BEGIN
    SELECT aw.id INTO v_agent_id
    FROM agent_wallets aw
    WHERE aw.is_active = true
      AND aw.is_online = true
      AND aw.current_sessions < 5
    ORDER BY aw.current_sessions ASC, aw.trust_score DESC, random()
    LIMIT 1;

    IF v_agent_id IS NOT NULL THEN
        UPDATE withdrawal_requests
        SET processed_by_agent_id = v_agent_id,
            assigned_at = NOW(),
            status = 'processing'
        WHERE id = p_withdrawal_id;

        UPDATE agent_wallets
        SET current_sessions = COALESCE(current_sessions, 0) + 1
        WHERE id = v_agent_id;
    END IF;

    RETURN v_agent_id;
END;
$$;

-- 8. Function to get agent withdrawal queue
CREATE OR REPLACE FUNCTION get_agent_withdrawal_queue(p_agent_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    usdt_amount numeric,
    bdt_amount numeric,
    withdrawal_method withdrawal_method,
    crypto_network character varying,
    wallet_address text,
    bank_name text,
    account_number character varying,
    account_holder_name text,
    mfs_provider character varying,
    recipient_number character varying,
    recipient_name character varying,
    status character varying,
    created_at timestamp with time zone,
    assigned_at timestamp with time zone,
    admin_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        wr.id,
        wr.user_id,
        wr.usdt_amount,
        wr.bdt_amount,
        wr.withdrawal_method,
        wr.crypto_network,
        wr.wallet_address,
        wr.bank_name,
        wr.account_number,
        wr.account_holder_name,
        wr.mfs_provider,
        wr.recipient_number,
        wr.recipient_name,
        wr.status::character varying,
        wr.created_at,
        wr.assigned_at,
        wr.admin_notes
    FROM withdrawal_requests wr
    WHERE wr.processed_by_agent_id = p_agent_id
      AND wr.status IN ('processing', 'pending')
    ORDER BY wr.assigned_at DESC NULLS LAST, wr.created_at ASC;
END;
$$;

-- 9. Function for admin: bulk update withdrawal status
CREATE OR REPLACE FUNCTION bulk_update_withdrawal_status(p_ids uuid[], p_status text, p_admin_notes text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer := 0;
BEGIN
    UPDATE withdrawal_requests
    SET status = p_status::character varying,
        admin_notes = COALESCE(admin_notes || '; ' || p_admin_notes, p_admin_notes),
        processed_at = CASE WHEN p_status IN ('completed', 'rejected') THEN NOW() ELSE processed_at END
    WHERE id = ANY(p_ids)
      AND status NOT IN ('completed', 'rejected', 'cancelled');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- 10. Update trigger for agent session release on completed/rejected
CREATE OR REPLACE FUNCTION update_withdrawal_agent_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status IN ('completed', 'rejected', 'cancelled')
       AND OLD.status NOT IN ('completed', 'rejected', 'cancelled')
       AND NEW.processed_by_agent_id IS NOT NULL THEN
        UPDATE agent_wallets
        SET current_sessions = GREATEST(COALESCE(current_sessions, 0) - 1, 0)
        WHERE id = NEW.processed_by_agent_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_withdrawal_agent_session ON withdrawal_requests;
CREATE TRIGGER trg_withdrawal_agent_session
    AFTER UPDATE OF status ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawal_agent_session();

-- 11. Create index for performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_method ON withdrawal_requests(withdrawal_method);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_agent ON withdrawal_requests(processed_by_agent_id) WHERE processed_by_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status_created ON withdrawal_requests(status, created_at);
