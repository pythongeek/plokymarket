-- ============================================
-- 066_fix_kyc_tables.sql
-- SAFE RE-RUNNABLE SCRIPT
-- ============================================

-- 1. Create KYC Settings Table (Safe)
CREATE TABLE IF NOT EXISTS kyc_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    withdrawal_threshold DECIMAL(20, 2) NOT NULL DEFAULT 5000.00,
    required_documents JSONB NOT NULL DEFAULT '["id_front", "selfie"]'::jsonb,
    auto_approve_enabled BOOLEAN DEFAULT FALSE,
    auto_approve_max_risk_score INTEGER DEFAULT 30,
    kyc_globally_required BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);
INSERT INTO kyc_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. Create Admin Overrides Table (Safe)
CREATE TABLE IF NOT EXISTS kyc_admin_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    override_type VARCHAR(20) NOT NULL CHECK (override_type IN ('force_kyc', 'waive_kyc')),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES auth.users(id)
);

-- 3. Create KYC Submissions Table (Safe)
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submitted_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS (Safe)
ALTER TABLE kyc_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_admin_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid "already exists" error)
DROP POLICY IF EXISTS "Admins can manage KYC settings" ON kyc_settings;
CREATE POLICY "Admins can manage KYC settings" ON kyc_settings FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage KYC overrides" ON kyc_admin_overrides;
CREATE POLICY "Admins can manage KYC overrides" ON kyc_admin_overrides FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own KYC submissions" ON kyc_submissions;
CREATE POLICY "Users can view own KYC submissions" ON kyc_submissions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own KYC submissions" ON kyc_submissions;
CREATE POLICY "Users can create own KYC submissions" ON kyc_submissions FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all KYC submissions" ON kyc_submissions;
CREATE POLICY "Admins can manage all KYC submissions" ON kyc_submissions FOR ALL USING (is_admin(auth.uid()));

-- 6. Storage (Safe bucket insert)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', false) 
ON CONFLICT (id) DO NOTHING;

-- 7. Storage Policies (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload own KYC documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
CREATE POLICY "Users can view own KYC documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
CREATE POLICY "Admins can view all KYC documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'kyc-documents' AND 
  is_admin(auth.uid())
);
