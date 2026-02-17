-- Migration 075: KYC Documents and Withdrawal Logic
-- Create kyc_documents table and necessary policies

-- ============================================
-- 1. Create KYC Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('NID', 'Passport', 'Driving License')),
    document_front_url TEXT NOT NULL,
    document_back_url TEXT,
    selfie_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own documents" 
ON public.kyc_documents FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can upload own documents" 
ON public.kyc_documents FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view and update all documents" 
ON public.kyc_documents FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true));

-- ============================================
-- 2. Ensure KYC Level in User Profiles
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'kyc_level') THEN
        ALTER TABLE public.user_profiles ADD COLUMN kyc_level INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- 3. Withdrawal Permission Check Function
-- ============================================
CREATE OR REPLACE FUNCTION check_withdrawal_eligibility(
    p_user_id UUID,
    p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_kyc_level INTEGER;
BEGIN
    -- Get user KYC level
    SELECT COALESCE(kyc_level, 0) INTO v_kyc_level
    FROM public.user_profiles
    WHERE id = p_user_id;

    -- Check limit
    IF p_amount > 5000 AND v_kyc_level < 1 THEN
        RAISE EXCEPTION 'Withdrawal of % BDT requires KYC Level 1 verification (Limit: 5000 BDT for Unverified).', p_amount;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions calls
GRANT ALL ON public.kyc_documents TO authenticated;
GRANT EXECUTE ON FUNCTION check_withdrawal_eligibility TO authenticated;
