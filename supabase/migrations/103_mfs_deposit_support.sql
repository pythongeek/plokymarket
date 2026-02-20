-- Migration 103: MFS Deposit Support
-- Adds bKash/Nagad/Rocket MFS payment support and platform wallet management

-- ============================================
-- 1. Extend deposit_requests table
-- ============================================

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deposit_requests') THEN
        ALTER TABLE public.deposit_requests
          ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'usdt_p2p',
          ADD COLUMN IF NOT EXISTS sender_number VARCHAR(20),
          ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100),
          ADD COLUMN IF NOT EXISTS txn_id VARCHAR(100),
          ADD COLUMN IF NOT EXISTS bdt_amount NUMERIC,
          ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC;
    ELSE
        -- Fallback: Create table if it literally doesn't exist (unexpected but safety first)
        CREATE TABLE public.deposit_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id),
            usdt_amount NUMERIC,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            payment_method VARCHAR(50) DEFAULT 'usdt_p2p',
            sender_number VARCHAR(20),
            sender_name VARCHAR(100),
            txn_id VARCHAR(100),
            bdt_amount NUMERIC,
            exchange_rate NUMERIC
        );
    END IF;
END $$;

-- Add check constraint for payment methods
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deposit_requests_payment_method_check'
  ) THEN
    ALTER TABLE public.deposit_requests
      ADD CONSTRAINT deposit_requests_payment_method_check
      CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'usdt_p2p', 'agent'));
  END IF;
END $$;

-- ============================================
-- 2. Platform wallets table
-- ============================================

CREATE TABLE IF NOT EXISTS public.platform_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method VARCHAR(50) NOT NULL,
  wallet_number VARCHAR(50) NOT NULL,
  wallet_name VARCHAR(100),
  instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT platform_wallets_method_check
    CHECK (method IN ('bkash', 'nagad', 'rocket', 'usdt_trc20', 'usdt_erc20', 'usdt_bep20'))
);

-- Enable RLS
ALTER TABLE public.platform_wallets ENABLE ROW LEVEL SECURITY;

-- Public can read active wallets (needed to show deposit addresses to users)
DROP POLICY IF EXISTS "Public can view active platform wallets" ON public.platform_wallets;
CREATE POLICY "Public can view active platform wallets"
  ON public.platform_wallets FOR SELECT
  USING (is_active = TRUE);

-- Only admins can manage wallets
DROP POLICY IF EXISTS "Admins can manage platform wallets" ON public.platform_wallets;
CREATE POLICY "Admins can manage platform wallets"
  ON public.platform_wallets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    )
  );

-- Seed default wallets (update these with real numbers)
INSERT INTO public.platform_wallets (method, wallet_number, wallet_name, instructions, display_order)
VALUES
  ('bkash', '01XXXXXXXXX', 'Plokymarket Agent', 'Send Money থেকে এই নম্বরে পাঠান। Reference: আপনার User ID', 1),
  ('nagad', '01XXXXXXXXX', 'Plokymarket Agent', 'Send Money থেকে এই নম্বরে পাঠান। Reference: আপনার User ID', 2),
  ('usdt_trc20', 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx', 'Plokymarket USDT (TRC20)', 'TRC20 নেটওয়ার্কে USDT পাঠান। Minimum: 10 USDT', 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. Enhanced deposit verification function
-- ============================================

CREATE OR REPLACE FUNCTION public.verify_and_credit_deposit_v2(
  p_deposit_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit RECORD;
  v_wallet RECORD;
  v_result JSONB;
BEGIN
  -- Get deposit with lock
  SELECT * INTO v_deposit
  FROM public.deposit_requests
  WHERE id = p_deposit_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found: %', p_deposit_id;
  END IF;

  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit already processed. Status: %', v_deposit.status;
  END IF;

  -- Update deposit status
  UPDATE public.deposit_requests
  SET
    status = 'approved',
    admin_notes = p_admin_notes,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = p_deposit_id;

  -- Credit user wallet
  INSERT INTO public.wallets (user_id, usdt_balance)
  VALUES (v_deposit.user_id, v_deposit.usdt_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET
    usdt_balance = wallets.usdt_balance + v_deposit.usdt_amount,
    total_deposited = wallets.total_deposited + v_deposit.usdt_amount,
    updated_at = NOW();

  -- Log transaction
  INSERT INTO public.wallet_transactions (
    user_id, type, amount, reference_id, description
  ) VALUES (
    v_deposit.user_id,
    'deposit',
    v_deposit.usdt_amount,
    p_deposit_id,
    'Deposit approved: ' || COALESCE(v_deposit.payment_method, 'usdt_p2p')
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'deposit_id', p_deposit_id,
    'user_id', v_deposit.user_id,
    'usdt_credited', v_deposit.usdt_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_credit_deposit_v2(UUID, TEXT) TO authenticated;

-- ============================================
-- 4. Reject deposit function
-- ============================================

CREATE OR REPLACE FUNCTION public.reject_deposit_v2(
  p_deposit_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit RECORD;
BEGIN
  SELECT * INTO v_deposit
  FROM public.deposit_requests
  WHERE id = p_deposit_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF v_deposit.status != 'pending' THEN
    RAISE EXCEPTION 'Deposit already processed';
  END IF;

  UPDATE public.deposit_requests
  SET
    status = 'rejected',
    admin_notes = p_reason,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = p_deposit_id;

  RETURN jsonb_build_object('success', TRUE, 'deposit_id', p_deposit_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_deposit_v2(UUID, TEXT) TO authenticated;

-- Add reviewed_at and reviewed_by if missing
ALTER TABLE public.deposit_requests
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
