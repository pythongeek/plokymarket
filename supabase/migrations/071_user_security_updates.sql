-- ============================================
-- 071_user_security_updates.sql
-- Add KYC Level, Account Status, and Trading Eligibility Triggers
-- ============================================

-- 1. Create Enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_account_status AS ENUM ('active', 'restricted', 'dormant', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fix: Ensure agent_wallets and manual_deposits exist (from 070)
CREATE TABLE IF NOT EXISTS public.agent_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method VARCHAR(10) CHECK (method IN ('bkash', 'nagad')),
  wallet_type VARCHAR(20) CHECK (wallet_type IN ('send_money', 'cashout', 'payment')),
  phone_number VARCHAR(15) NOT NULL,
  account_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  daily_limit_bdt DECIMAL(12,2) DEFAULT 100000,
  used_today_bdt DECIMAL(12,2) DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.manual_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  method VARCHAR(10),
  amount_bdt DECIMAL(10,2),
  agent_wallet_id UUID REFERENCES agent_wallets(id),
  user_phone_number VARCHAR(15),
  transaction_id VARCHAR(100) UNIQUE,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  usdt_sent_to_user DECIMAL(18,6),
  usdt_rate_used DECIMAL(18,6),
  agent_notes TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expiry_warning_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update user_profiles table (the equivalent of public.users in this project)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status user_account_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flags JSONB DEFAULT '{}';

-- 3. Update handle_new_user() to set defaults explicitly on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        full_name, 
        email, 
        is_admin,
        kyc_level,
        status,
        flags
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE),
        0,         -- Default KYC Level 0 (Unverified)
        'active',  -- Default status 'active'
        '{}'::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trading Eligibility Security Function
CREATE OR REPLACE FUNCTION check_trading_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_user_status user_account_status;
    v_kyc_level INTEGER;
BEGIN
    -- Get user status and KYC level
    SELECT status, kyc_level INTO v_user_status, v_kyc_level
    FROM public.user_profiles
    WHERE id = NEW.user_id;

    -- Check 1: Is user banned or restricted?
    IF v_user_status != 'active' THEN
        RAISE EXCEPTION 'আপনার অ্যাকাউন্টটি বর্তমানে লেনদেনের জন্য সচল নয়। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন। (Account status: %)', v_user_status;
    END IF;

    -- Check 2: KYC Level check for high-value trades (e.g., > 500 BDT)
    -- Assuming size and price are available in order_book
    IF TG_TABLE_NAME = 'order_book' THEN
        IF v_kyc_level < 1 AND (NEW.size * NEW.price) > 500 THEN
            RAISE EXCEPTION '৫০০ টাকার বেশি ট্রেড করতে হলে KYC লেভেল ১ সম্পন্ন করুন। বর্তমান লেভেল: %', v_kyc_level;
        END IF;
    END IF;

    -- Check 3: Deposit check (if manual_deposits)
    IF TG_TABLE_NAME = 'manual_deposits' THEN
        IF v_kyc_level < 1 THEN
            RAISE EXCEPTION 'ডিপোজিট করতে হলে নূন্যতম KYC লেভেল ১ সম্পন্ন করুন।';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Trigger for orders (order_book table)
DROP TRIGGER IF EXISTS check_user_eligibility_before_order ON public.order_book;
CREATE TRIGGER check_user_eligibility_before_order
BEFORE INSERT ON public.order_book
FOR EACH ROW EXECUTE FUNCTION check_trading_eligibility();

-- 6. Add same trigger to manual_deposits
DROP TRIGGER IF EXISTS check_user_eligibility_before_deposit ON public.manual_deposits;
CREATE TRIGGER check_user_eligibility_before_deposit
BEFORE INSERT ON public.manual_deposits
FOR EACH ROW EXECUTE FUNCTION check_trading_eligibility();

-- 7. Update RLS Policies to reflect KYC Level requirements
-- For order_book
DROP POLICY IF EXISTS "Users can create orders" ON public.order_book;
CREATE POLICY "Users can create orders if active"
ON public.order_book FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND status = 'active'
    )
);

-- For manual_deposits
DROP POLICY IF EXISTS "Users can create manual deposits" ON public.manual_deposits;
CREATE POLICY "Users can create manual deposits if KYC level 1"
ON public.manual_deposits FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND status = 'active' AND kyc_level >= 1
    )
);
