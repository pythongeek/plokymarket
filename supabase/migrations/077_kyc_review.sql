-- Migration 077: KYC Review RPC
-- Securely handle KYC document review and user promotion

CREATE OR REPLACE FUNCTION review_kyc_document(
    p_admin_id UUID,
    p_document_id UUID,
    p_status TEXT, -- 'approved' or 'rejected'
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Validate Admin
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_admin_id AND is_admin = true) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;

    -- 2. Get User ID from document
    SELECT user_id INTO v_user_id
    FROM public.kyc_documents
    WHERE id = p_document_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Document not found.';
    END IF;

    -- 3. Update Document Status
    UPDATE public.kyc_documents
    SET 
        status = p_status,
        rejection_reason = p_reason,
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_document_id;

    -- 4. If Approved, Upgrade User
    IF p_status = 'approved' THEN
        -- Link logic: Standard KYC Document Approval = Level 1
        UPDATE public.user_profiles
        SET kyc_level = 1, updated_at = NOW()
        WHERE id = v_user_id;

        -- Also update legacy kyc_profiles if exists
        UPDATE public.user_kyc_profiles
        SET verification_status = 'verified', verification_tier = 'intermediate', verified_at = NOW(), verified_by = p_admin_id
        WHERE id = v_user_id;
    END IF;

    -- 5. If Rejected, Downgrade User (optional, strict mode)
    IF p_status = 'rejected' THEN
        UPDATE public.user_profiles
        SET kyc_level = 0
        WHERE id = v_user_id;

        UPDATE public.user_kyc_profiles
        SET verification_status = 'rejected', rejection_reason = p_reason
        WHERE id = v_user_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION review_kyc_document TO authenticated;
