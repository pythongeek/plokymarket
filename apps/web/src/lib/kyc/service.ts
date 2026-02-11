// ============================================
// KYC SERVICE LAYER
// ============================================

import { createClient } from '@/lib/supabase/server';

export interface KycProfile {
    id: string;
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    verification_tier: string;
    full_name: string | null;
    date_of_birth: string | null;
    nationality: string | null;
    id_type: string | null;
    id_number: string | null;
    id_expiry: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state_province: string | null;
    postal_code: string | null;
    country: string | null;
    phone_number: string | null;
    phone_verified: boolean;
    id_document_front_url: string | null;
    id_document_back_url: string | null;
    selfie_url: string | null;
    proof_of_address_url: string | null;
    risk_score: number;
    daily_deposit_limit: number;
    daily_withdrawal_limit: number;
    submitted_at: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
}

export interface KycGateResult {
    needs_kyc: boolean;
    reason: string;
    kyc_status: string;
    total_withdrawn: number;
    threshold: number;
    remaining?: number;
    override_type?: string;
}

export interface KycSettings {
    withdrawal_threshold: number;
    required_documents: string[];
    auto_approve_enabled: boolean;
    auto_approve_max_risk_score: number;
    kyc_globally_required: boolean;
    updated_at: string;
}

export interface KycSubmission {
    id: string;
    user_id: string;
    submitted_data: any;
    status: 'pending' | 'approved' | 'rejected';
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
    rejection_reason: string | null;
    created_at: string;
}

export interface KycAdminOverride {
    id: string;
    user_id: string;
    override_type: 'force_kyc' | 'waive_kyc';
    admin_id: string;
    reason: string;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

export interface KycAdminListItem {
    user_id: string;
    email: string;
    full_name: string | null;
    verification_status: string;
    verification_tier: string;
    submitted_at: string | null;
    id_type: string | null;
    has_override: boolean;
    override_type: string | null;
}

export class KycService {

    // ============ USER METHODS ============

    static async getKycProfile(userId: string): Promise<KycProfile | null> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('user_kyc_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    static async submitKyc(userId: string, kycData: {
        full_name: string;
        date_of_birth: string;
        nationality: string;
        id_type: string;
        id_number: string;
        id_expiry?: string;
        address_line1: string;
        address_line2?: string;
        city: string;
        state_province?: string;
        postal_code?: string;
        country: string;
        phone_number: string;
        id_document_front_url?: string;
        id_document_back_url?: string;
        selfie_url?: string;
        proof_of_address_url?: string;
    }): Promise<{ success: boolean; profile: KycProfile | null }> {
        const supabase = await createClient();

        // Upsert KYC profile
        const { data: profile, error: profileError } = await supabase
            .from('user_kyc_profiles')
            .upsert({
                id: userId,
                verification_status: 'pending',
                full_name: kycData.full_name,
                date_of_birth: kycData.date_of_birth,
                nationality: kycData.nationality,
                id_type: kycData.id_type,
                id_number: kycData.id_number,
                id_expiry: kycData.id_expiry || null,
                address_line1: kycData.address_line1,
                address_line2: kycData.address_line2 || null,
                city: kycData.city,
                state_province: kycData.state_province || null,
                postal_code: kycData.postal_code || null,
                country: kycData.country,
                phone_number: kycData.phone_number,
                id_document_front_url: kycData.id_document_front_url || null,
                id_document_back_url: kycData.id_document_back_url || null,
                selfie_url: kycData.selfie_url || null,
                proof_of_address_url: kycData.proof_of_address_url || null,
                submitted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' })
            .select()
            .single();

        if (profileError) throw profileError;

        // Create submission record
        const { error: subError } = await supabase
            .from('kyc_submissions')
            .insert({
                user_id: userId,
                submitted_data: kycData,
                status: 'pending',
            });

        if (subError) throw subError;

        return { success: true, profile };
    }

    static async checkWithdrawalGate(userId: string): Promise<KycGateResult> {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('check_kyc_withdrawal_gate', {
            p_user_id: userId,
        });

        if (error) throw error;
        return data as KycGateResult;
    }

    static async getKycSubmissions(userId: string): Promise<KycSubmission[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('kyc_submissions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    // ============ ADMIN METHODS ============

    static async adminListKyc(params: {
        status?: string;
        search?: string;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ data: any[]; total: number }> {
        const supabase = await createClient();
        const limit = params.limit || 20;
        const offset = params.offset || 0;

        let query = supabase
            .from('user_kyc_profiles')
            .select(`
        id,
        verification_status,
        verification_tier,
        full_name,
        id_type,
        id_number,
        phone_number,
        submitted_at,
        verified_at,
        rejection_reason,
        id_document_front_url,
        id_document_back_url,
        selfie_url,
        proof_of_address_url,
        risk_score,
        daily_withdrawal_limit,
        created_at,
        updated_at
      `, { count: 'exact' });

        if (params.status && params.status !== 'all') {
            query = query.eq('verification_status', params.status);
        }

        if (params.search) {
            query = query.or(`full_name.ilike.%${params.search}%,id_number.ilike.%${params.search}%,phone_number.ilike.%${params.search}%`);
        }

        const { data, error, count } = await query
            .order('submitted_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { data: data || [], total: count || 0 };
    }

    static async adminGetUserKyc(userId: string): Promise<{
        profile: KycProfile | null;
        submissions: KycSubmission[];
        overrides: KycAdminOverride[];
        gate: KycGateResult;
    }> {
        const supabase = await createClient();

        const [profileRes, submissionsRes, overridesRes] = await Promise.all([
            supabase.from('user_kyc_profiles').select('*').eq('id', userId).single(),
            supabase.from('kyc_submissions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('kyc_admin_overrides').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ]);

        let gate: KycGateResult;
        try {
            gate = await this.checkWithdrawalGate(userId);
        } catch {
            gate = {
                needs_kyc: false,
                reason: 'error',
                kyc_status: profileRes.data?.verification_status || 'unverified',
                total_withdrawn: 0,
                threshold: 5000,
            };
        }

        return {
            profile: profileRes.data,
            submissions: submissionsRes.data || [],
            overrides: overridesRes.data || [],
            gate,
        };
    }

    static async adminKycAction(
        adminId: string,
        userId: string,
        action: 'approve' | 'reject' | 'force_kyc' | 'waive_kyc' | 'revoke_override',
        reason?: string,
        rejectionReason?: string
    ): Promise<any> {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('admin_kyc_action', {
            p_admin_id: adminId,
            p_user_id: userId,
            p_action: action,
            p_reason: reason || null,
            p_rejection_reason: rejectionReason || null,
        });

        if (error) throw error;
        return data;
    }

    // ============ SETTINGS ============

    static async getSettings(): Promise<KycSettings> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('kyc_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) throw error;
        return data;
    }

    static async updateSettings(
        adminId: string,
        settings: Partial<Omit<KycSettings, 'updated_at'>>
    ): Promise<KycSettings> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('kyc_settings')
            .update({
                ...settings,
                updated_by: adminId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', 1)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
    /**
     * Trigger AI Verification for a user
     */
    static async verifyWithAi(userId: string): Promise<any> {
        try {
            const response = await fetch('/api/admin/kyc/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'AI verification failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Error triggering AI verification:', error);
            throw error;
        }
    }
}
