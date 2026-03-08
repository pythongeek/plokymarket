-- 2FA Security for Withdrawals Add-On
-- Migration: 097_withdrawal_2fa.sql
-- Creates an OTP verification mechanism before inserting into withdrawal_requests

CREATE TABLE IF NOT EXISTS public.withdrawal_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    withdrawal_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_withdrawal_verif_user ON public.withdrawal_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_verif_expires ON public.withdrawal_verifications(expires_at);

-- Set up RLS
ALTER TABLE public.withdrawal_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_verifications FORCE ROW LEVEL SECURITY;

-- Users can insert and read their own verifications (but the API handles this via service role usually or direct query)
DROP POLICY IF EXISTS "Users can view own verifications" ON public.withdrawal_verifications;
CREATE POLICY "Users can view own verifications"
  ON public.withdrawal_verifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage verifications" ON public.withdrawal_verifications;
CREATE POLICY "Service role can manage verifications"
  ON public.withdrawal_verifications FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Trigger for updated_at or other utilities if needed? We rely mainly on created_at and expires_at.
