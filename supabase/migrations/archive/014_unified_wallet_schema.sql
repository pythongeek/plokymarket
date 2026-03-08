-- 014_unified_wallet_schema.sql
-- Merges Risk Engine (trading) and Advanced Deposit Management into a single robust table.

-- 1. Ensure columns exist (Idempotent ALTERs)
DO $$ 
BEGIN
    -- Add Risk Engine Columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'balance') THEN
        ALTER TABLE public.wallets ADD COLUMN balance DECIMAL(36, 18) DEFAULT 0 CHECK (balance >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'locked_balance') THEN
        ALTER TABLE public.wallets ADD COLUMN locked_balance DECIMAL(36, 18) DEFAULT 0 CHECK (locked_balance >= 0);
    END IF;

    -- Add Deposit Management Columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'usdt_address') THEN
        ALTER TABLE public.wallets ADD COLUMN usdt_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'usdc_address') THEN
        ALTER TABLE public.wallets ADD COLUMN usdc_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'qr_code_url') THEN
        ALTER TABLE public.wallets ADD COLUMN qr_code_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'network_type') THEN
        ALTER TABLE public.wallets ADD COLUMN network_type VARCHAR(20) DEFAULT 'TRC20';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'address_type') THEN
        ALTER TABLE public.wallets ADD COLUMN address_type VARCHAR(20) DEFAULT 'DYNAMIC';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'is_active') THEN
        ALTER TABLE public.wallets ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 2. Constraints and Indexes
-- Add unique constraint if not present (safest way is to drop and recreate or use a conditional block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_wallets_usdt_address') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'usdt_address') THEN
        -- Only add if not null to avoid issues with existing nulls
        ALTER TABLE public.wallets ADD CONSTRAINT uq_wallets_usdt_address UNIQUE (usdt_address);
    END IF;
END $$;

-- Performance index for active addresses
CREATE INDEX IF NOT EXISTS idx_wallets_active_usdt ON wallets(usdt_address) WHERE usdt_address IS NOT NULL AND is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_wallets_active_usdc ON wallets(usdc_address) WHERE usdc_address IS NOT NULL AND is_active = TRUE;

-- 3. RLS Refinement (Improved plan caching with SELECT auth.uid())
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wallets" ON wallets;
CREATE POLICY "Users can view their own wallets"
ON wallets FOR SELECT
USING ( (SELECT auth.uid()) = user_id );

DROP POLICY IF EXISTS "Service role bypass" ON wallets;
CREATE POLICY "Service role bypass"
ON wallets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Real-time Synchronization
-- Ensure publication exists or create it (Supabase standard)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    -- Try to add, will skip if already added
    ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Publication already contains wallets or permission denied.';
END $$;

-- 5. Updated At Trigger (Best practice for tracking changes)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_wallets_updated_at ON wallets;
CREATE TRIGGER tr_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 6. Risk Engine Functions (Synced with locked_balance)
CREATE OR REPLACE FUNCTION freeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_balance DECIMAL;
BEGIN
  SELECT balance INTO v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN RETURN FALSE; END IF;
  UPDATE wallets SET balance = balance - p_amount, locked_balance = locked_balance + p_amount, updated_at = NOW() WHERE user_id = p_user_id;
  RETURN TRUE;
END; $$;

CREATE OR REPLACE FUNCTION unfreeze_funds(p_user_id UUID, p_amount DECIMAL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE wallets SET balance = balance + p_amount, locked_balance = locked_balance - p_amount, updated_at = NOW() WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION settle_trade_cash(p_buyer_id UUID, p_seller_id UUID, p_amount DECIMAL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE wallets SET locked_balance = locked_balance - p_amount WHERE user_id = p_buyer_id;
  UPDATE wallets SET balance = balance + p_amount WHERE user_id = p_seller_id;
END; $$;
