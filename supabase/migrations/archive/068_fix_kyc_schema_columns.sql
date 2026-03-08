-- ============================================
-- 068_fix_kyc_schema_columns.sql
-- Fix Missing Columns in user_kyc_profiles
-- ============================================

-- 1. Explicitly Add Missing Columns (Idempotent)
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS id_expiry DATE;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS state_province VARCHAR(100);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS id_document_front_url TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS id_document_back_url TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS proof_of_address_url TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 50;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS daily_deposit_limit DECIMAL(20, 8) DEFAULT 1000;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(20, 8) DEFAULT 1000;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_kyc_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';
