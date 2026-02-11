-- ============================================
-- KYC STORAGE SETUP
-- ============================================

-- Create bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false) -- Private bucket
ON CONFLICT (id) DO NOTHING;

-- RLS Policies

-- 1. Users can upload their own files (folder must match user ID)
-- Path convention: {user_id}/{filename}
CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Users can view their own files
CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Admins can view all files
CREATE POLICY "Admins can view all KYC documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
  )
);
